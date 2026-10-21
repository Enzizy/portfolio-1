import * as THREE from "three";
import { optimised, PAGE_RATIO, type BookPage } from "./content";
import { PaperSound } from "./paper-sound";

// A book on a desk under a single lamp: a rigid front board and the paper leaves.
//
// Pages fold the way paper does. Grab a page and drag: the paper folds along the
// line that keeps the point you grabbed under your finger, rolls over a soft
// cylinder at that line, and lies flat (back side up) beyond it. The paper never
// stretches past the spine, the leaf underneath shows through as you go, and on
// release it either flops over or settles back depending on how far and how fast
// you swiped. Everything renders on demand: the GPU sleeps when nothing moves.

export type BookSceneOptions = {
  canvas: HTMLCanvasElement;
  pages: BookPage[];
  covers: { front: HTMLCanvasElement; insideFront: HTMLCanvasElement; insideBack: HTMLCanvasElement };
  /** Spread 0 is the closed book; spread n shows page 2n-2 on the left and 2n-1 on the right. */
  onSpread?: (spread: number, total: number, label: string) => void;
  onNavigate?: (href: string) => void;
};

export type BookScene = {
  next: () => void;
  prev: () => void;
  goTo: (spread: number) => void;
  close: () => void;
  setMuted: (muted: boolean) => void;
  setPaused: (paused: boolean) => void;
  dispose: () => void;
};

const W = 1;
const H = W * PAGE_RATIO;
/** Dense in both directions: the fold line can run at any angle across the page. */
const GRID_X = 34;
const GRID_Z = 48;
const LEAF_GAP = 0.0045;
const BOARD = 0.022;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const smooth = (t: number) => t * t * (3 - 2 * t);

type V2 = { x: number; z: number };

export function createBookScene(options: BookSceneOptions): BookScene {
  const { canvas, pages, covers } = options;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const disposables: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(item: T) => {
    disposables.push(item);
    return item;
  };
  const sound = new PaperSound();

  /* ------------------------------------------------------------ renderer */

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.75 : 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  // Shadows are re-rendered only when the paper or the cover moves (see frame()).
  renderer.shadowMap.autoUpdate = false;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#060505");
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);

  // One warm lamp overhead does all the work; the rest of the room stays dark.
  const lamp = new THREE.SpotLight("#fff1e0", 4.2, 0, 0.5, 0.78, 0);
  lamp.position.set(0.3, 7, 1.6);
  lamp.target.position.set(0, 0, 0.1);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(2048, 2048);
  lamp.shadow.bias = -0.0004;
  lamp.shadow.normalBias = 0.015;
  lamp.shadow.radius = 4;
  const fill = new THREE.HemisphereLight("#cdd6e8", "#1a120b", 0.16);
  const rim = new THREE.DirectionalLight("#9fb4d8", 0.22);
  rim.position.set(-4, 3, -5);
  scene.add(lamp, lamp.target, fill, rim);

  /** `flip`: "x" mirrors (a leaf's back face); "xy" rotates 180° (a box's underside). */
  const texture = (source: HTMLCanvasElement, flip: "x" | "xy" | null = null) => {
    const map = keep(new THREE.CanvasTexture(source));
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = anisotropy;
    if (flip) {
      map.wrapS = THREE.RepeatWrapping;
      map.repeat.x = -1;
      map.offset.x = 1;
    }
    if (flip === "xy") {
      map.wrapT = THREE.RepeatWrapping;
      map.repeat.y = -1;
      map.offset.y = 1;
    }
    return map;
  };
  const matte = (parameters: THREE.MeshStandardMaterialParameters) => keep(new THREE.MeshStandardMaterial(parameters));
  /**
   * Printed paper. Half of its brightness comes from the lamp (so folds and curls
   * still shade) and half is self-lit, and it skips tone mapping: ink stays black
   * and paper stays paper instead of both collapsing to grey.
   */
  const paper = (map: THREE.Texture | null, parameters: THREE.MeshStandardMaterialParameters = {}) =>
    keep(
      new THREE.MeshStandardMaterial({
        map,
        color: "#8c8c8c",
        emissive: map ? "#ffffff" : "#f3efe7",
        emissiveMap: map,
        emissiveIntensity: map ? 0.5 : 0.42,
        roughness: 0.9,
        toneMapped: false,
        ...parameters,
      }),
    );

  /* ---------------------------------------------------------------- desk */

  const wood = document.createElement("canvas");
  wood.width = 1024;
  wood.height = 512;
  {
    const ctx = wood.getContext("2d")!;
    ctx.fillStyle = "#2b231d";
    ctx.fillRect(0, 0, 1024, 512);
    let seed = 11;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 520; i++) {
      const y = random() * 512;
      const light = random() > 0.55;
      ctx.strokeStyle = light ? `rgba(120, 96, 76, ${0.04 + random() * 0.08})` : `rgba(8, 5, 3, ${0.1 + random() * 0.22})`;
      ctx.lineWidth = 0.6 + random() * 2.4;
      const amplitude = 1 + random() * 5;
      // A whole number of waves across the width, so the tile joins without a seam.
      const frequency = ((1 + Math.floor(random() * 4)) * Math.PI * 2) / 1024;
      const phase = random() * 6.28;
      // Drawn again one tile up and down, so grain crossing an edge wraps too.
      for (const offset of [-512, 0, 512]) {
        ctx.beginPath();
        for (let x = 0; x <= 1024; x += 16) {
          const yy = y + offset + Math.sin(x * frequency + phase) * amplitude;
          if (x === 0) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
    }
  }
  const woodMap = texture(wood);
  woodMap.wrapS = woodMap.wrapT = THREE.RepeatWrapping;
  woodMap.repeat.set(2.2, 2.2);
  const desk = new THREE.Mesh(keep(new THREE.PlaneGeometry(16, 11)), matte({ map: woodMap, roughness: 0.62, metalness: 0 }));
  desk.rotation.x = -Math.PI / 2;
  desk.receiveShadow = true;
  scene.add(desk);

  /* --------------------------------------------------------------- props */

  const ceramic = matte({ color: "#f1ede6", roughness: 0.32 });
  const lathe = (profile: [number, number][], segments = 40) => keep(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segments));
  const shadowed = (object: THREE.Object3D) => {
    object.traverse((child) => {
      child.castShadow = true;
      child.receiveShadow = true;
    });
    return object;
  };

  // A flat white with a heart poured in the crema.
  const coffee = new THREE.Group();
  {
    const saucer = new THREE.Mesh(lathe([[0, 0.005], [0.32, 0.005], [0.36, 0.03], [0.37, 0.045], [0.355, 0.05], [0.31, 0.028], [0.12, 0.022], [0, 0.022]]), ceramic);
    const cup = new THREE.Mesh(lathe([[0, 0.02], [0.13, 0.02], [0.17, 0.06], [0.2, 0.18], [0.205, 0.24], [0.19, 0.24], [0.185, 0.19], [0.15, 0.07], [0, 0.06]]), ceramic);
    const latte = document.createElement("canvas");
    latte.width = latte.height = 256;
    {
      const ctx = latte.getContext("2d")!;
      const crema = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
      crema.addColorStop(0, "#b77a45");
      crema.addColorStop(1, "#5e3417");
      ctx.fillStyle = crema;
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = "#f2e2c8";
      ctx.beginPath();
      ctx.moveTo(128, 196);
      ctx.bezierCurveTo(52, 140, 66, 70, 112, 80);
      ctx.bezierCurveTo(124, 82, 128, 96, 128, 104);
      ctx.bezierCurveTo(128, 96, 132, 82, 144, 80);
      ctx.bezierCurveTo(190, 70, 204, 140, 128, 196);
      ctx.fill();
    }
    const surface = new THREE.Mesh(keep(new THREE.CircleGeometry(0.188, 40)), matte({ map: texture(latte), roughness: 0.25 }));
    surface.rotation.x = -Math.PI / 2;
    surface.position.y = 0.205;
    const handle = new THREE.Mesh(keep(new THREE.TorusGeometry(0.065, 0.018, 10, 20, Math.PI * 1.25)), ceramic);
    handle.position.set(0.215, 0.14, 0);
    handle.rotation.z = -Math.PI * 0.62;
    cup.add(surface, handle);
    cup.position.y = 0.03;
    coffee.add(saucer, cup);
  }
  coffee.position.set(2.45, 0, -1.05);
  coffee.rotation.y = 0.5;
  scene.add(shadowed(coffee));

  /* ------------------------------------------------------------ atmosphere */

  const ambient = { value: 0 };

  // Dust motes drifting through the lamp's cone: only the ones inside the beam glow.
  const DUST = coarse ? 160 : 320;
  const dustPositions = new Float32Array(DUST * 3);
  const dustSeeds = new Float32Array(DUST * 3);
  {
    let seed = 29;
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < DUST; i++) {
      dustPositions.set([(random() - 0.5) * 5, random() * 3, (random() - 0.5) * 3.4], i * 3);
      dustSeeds.set([random(), random(), random()], i * 3);
    }
  }
  const dustGeometry = keep(new THREE.BufferGeometry());
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  dustGeometry.setAttribute("aSeed", new THREE.BufferAttribute(dustSeeds, 3));
  const dustMaterial = keep(
    new THREE.ShaderMaterial({
      uniforms: { uTime: ambient, uScale: { value: 9 * renderer.getPixelRatio() } },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform float uScale;
        attribute vec3 aSeed;
        varying float vAlpha;
        void main() {
          vec3 p = position;
          p.x += sin(uTime * 0.11 * (0.5 + aSeed.x) + aSeed.y * 6.2831) * 0.28;
          p.z += cos(uTime * 0.09 * (0.5 + aSeed.z) + aSeed.x * 6.2831) * 0.28;
          p.y = mod(position.y + uTime * 0.035 * (0.4 + aSeed.z), 3.0) + 0.12;
          // Inside the lamp's cone? (lamp at (0.3, 7, 1.6), aimed at the book)
          vec3 origin = vec3(0.3, 7.0, 1.6);
          vec3 axis = normalize(vec3(-0.3, -7.0, -1.5));
          vec3 rel = p - origin;
          float along = dot(rel, axis);
          float off = length(rel - axis * along);
          float radius = along * 0.55;
          float lit = 1.0 - smoothstep(radius * 0.35, radius, off);
          float edges = smoothstep(0.12, 0.5, p.y) * (1.0 - smoothstep(2.5, 3.1, p.y));
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = uScale * (0.5 + aSeed.y) / -mv.z;
          float twinkle = 0.55 + 0.45 * sin(uTime * (0.6 + aSeed.x) + aSeed.z * 10.0);
          vAlpha = lit * edges * twinkle * (0.35 + 0.65 * aSeed.z);
        }
      `,
      fragmentShader: /* glsl */ `
        varying float vAlpha;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          if (d > 0.5) discard;
          gl_FragColor = vec4(1.0, 0.86, 0.66, vAlpha * smoothstep(0.5, 0.0, d) * 0.3);
        }
      `,
    }),
  );
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  dust.frustumCulled = false;
  scene.add(dust);

  // Steam curling off the coffee: noise-carved wisps on two camera-facing sheets.
  const steamGeometry = keep(new THREE.PlaneGeometry(0.42, 1.0));
  const steams = [0, 1].map((index) => {
    const material = keep(
      new THREE.ShaderMaterial({
        uniforms: { uTime: ambient, uSeed: { value: index * 17.3 + 3.1 } },
        transparent: true,
        depthWrite: false,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform float uSeed;
          varying vec2 vUv;
          float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float noise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
          }
          void main() {
            float t = uTime * 0.32 + uSeed;
            float sway = (noise(vec2(vUv.y * 2.2 - t, uSeed)) - 0.5) * 0.55 * vUv.y;
            float x = vUv.x - 0.5 - sway;
            float n = noise(vec2(x * 5.0, vUv.y * 3.2 - t * 1.5)) * 0.6 + noise(vec2(x * 11.0 + uSeed, vUv.y * 6.0 - t * 2.1)) * 0.4;
            float column = exp(-x * x * 26.0);
            float fade = smoothstep(0.0, 0.16, vUv.y) * (1.0 - smoothstep(0.5, 1.0, vUv.y));
            float a = smoothstep(0.38, 0.86, n) * column * fade * 0.24;
            gl_FragColor = vec4(0.97, 0.95, 0.91, a);
          }
        `,
      }),
    );
    const sheet = new THREE.Mesh(steamGeometry, material);
    sheet.position.set(coffee.position.x + (index ? 0.05 : -0.04), 0.78, coffee.position.z + (index ? 0.03 : -0.02));
    sheet.renderOrder = 5;
    scene.add(sheet);
    return sheet;
  });
  if (reduced) {
    dust.visible = false;
    steams.forEach((sheet) => (sheet.visible = false));
  }

  // A small succulent in a concrete pot.
  const plant = new THREE.Group();
  {
    const pot = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.2, 0.17, 0.24, 28)), matte({ color: "#8a8780", roughness: 0.95 }));
    pot.position.y = 0.12;
    const soil = new THREE.Mesh(keep(new THREE.CircleGeometry(0.185, 28)), matte({ color: "#2a211b", roughness: 1 }));
    soil.rotation.x = -Math.PI / 2;
    soil.position.y = 0.235;
    plant.add(pot, soil);
    const leafGeometry = keep(new THREE.SphereGeometry(0.06, 10, 8));
    leafGeometry.scale(0.55, 0.32, 1.25);
    const leafMaterial = matte({ color: "#7f9c8c", roughness: 0.7 });
    for (let ring = 0; ring < 3; ring++) {
      const count = 6 + ring * 2;
      for (let i = 0; i < count; i++) {
        const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
        const angle = (i / count) * Math.PI * 2 + ring * 0.4;
        const radius = 0.04 + ring * 0.05;
        leaf.position.set(Math.cos(angle) * radius, 0.27 + (2 - ring) * 0.02, Math.sin(angle) * radius);
        leaf.rotation.set(-0.5 + ring * 0.25, -angle + Math.PI / 2, 0);
        leaf.scale.setScalar(1 - ring * 0.12);
        plant.add(leaf);
      }
    }
  }
  plant.position.set(-2.35, 0, -1.15);
  scene.add(shadowed(plant));

  // A pen lying at an angle.
  const pen = new THREE.Group();
  {
    const barrel = new THREE.Mesh(keep(new THREE.CylinderGeometry(0.022, 0.022, 1.05, 18)), matte({ color: "#1c1c1e", roughness: 0.35, metalness: 0.4 }));
    const tip = new THREE.Mesh(keep(new THREE.ConeGeometry(0.022, 0.08, 18)), matte({ color: "#c9c6c0", roughness: 0.25, metalness: 0.9 }));
    tip.position.y = 0.565;
    const clip = new THREE.Mesh(keep(new THREE.BoxGeometry(0.012, 0.32, 0.01)), matte({ color: "#c9c6c0", roughness: 0.25, metalness: 0.9 }));
    clip.position.set(0, -0.32, 0.025);
    pen.add(barrel, tip, clip);
    pen.rotation.set(Math.PI / 2, 0, 0.55);
  }
  pen.position.set(-2.05, 0.024, 0.75);
  scene.add(shadowed(pen));

  // A couple of business cards.
  const card = document.createElement("canvas");
  card.width = 512;
  card.height = 296;
  {
    const ctx = card.getContext("2d")!;
    ctx.fillStyle = "#f2efe9";
    ctx.fillRect(0, 0, 512, 296);
    ctx.fillStyle = "#1c1a17";
    ctx.font = `400 64px ${getComputedStyle(document.body).fontFamily}`;
    ctx.fillText("ZB.", 34, 96);
    ctx.font = `500 22px ${getComputedStyle(document.body).fontFamily}`;
    ctx.fillText("Zhyronne Batican", 34, 220);
    ctx.fillStyle = "#8c8378";
    ctx.font = `400 18px ${getComputedStyle(document.body).fontFamily}`;
    ctx.fillText("zhyronnebatican@gmail.com", 34, 254);
  }
  const cardMaterial = matte({ map: texture(card), roughness: 0.6 });
  const cardEdge = matte({ color: "#e8e4dc", roughness: 0.8 });
  for (let i = 0; i < 2; i++) {
    const businessCard = new THREE.Mesh(keep(new THREE.BoxGeometry(0.85, 0.006, 0.49)), [cardEdge, cardEdge, cardMaterial, cardEdge, cardEdge, cardEdge]);
    businessCard.position.set(2.3 + i * 0.05, 0.003 + i * 0.006, 1.0 - i * 0.04);
    businessCard.rotation.y = -0.35 + i * 0.22;
    scene.add(shadowed(businessCard));
  }

  /* ---------------------------------------------------------------- book */

  const book = new THREE.Group();
  scene.add(book);

  const boardWidth = W + 0.03;
  const boardDepth = H + 0.05;
  const cloth = matte({ color: "#121110", roughness: 0.72 });
  const pageEdge = matte({ color: "#e7e0d2", roughness: 0.9 });

  // Back board: lies flat on the right, endpaper up.
  const backBoard = new THREE.Mesh(keep(new THREE.BoxGeometry(boardWidth, BOARD, boardDepth)), [
    cloth,
    cloth,
    paper(texture(covers.insideBack)),
    cloth,
    cloth,
    cloth,
  ]);
  backBoard.geometry.translate(boardWidth / 2, BOARD / 2, 0);
  backBoard.receiveShadow = true;
  backBoard.castShadow = true;
  book.add(backBoard);

  // Front board: hinged at the spine; the cloth cover on top, the endpaper under.
  const frontPivot = new THREE.Group();
  const insideFrontMap = texture(covers.insideFront, "xy");
  const frontBoard = new THREE.Mesh(keep(new THREE.BoxGeometry(boardWidth, BOARD, boardDepth)), [
    cloth,
    cloth,
    matte({ map: texture(covers.front), roughness: 0.68 }),
    paper(insideFrontMap),
    cloth,
    cloth,
  ]);
  frontBoard.geometry.translate(boardWidth / 2, 0, 0);
  frontBoard.castShadow = true;
  frontBoard.receiveShadow = true;
  frontPivot.add(frontBoard);
  book.add(frontPivot);

  // The block of paper under the top leaf on each side, so the book has depth.
  const blockGeometry = keep(new THREE.BoxGeometry(W - 0.004, 1, H - 0.004));
  blockGeometry.translate(0, 0.5, 0);
  const rightBlock = new THREE.Mesh(blockGeometry, pageEdge);
  const leftBlock = new THREE.Mesh(blockGeometry, pageEdge);
  rightBlock.position.x = W / 2;
  leftBlock.position.x = -W / 2;
  rightBlock.receiveShadow = leftBlock.receiveShadow = true;
  book.add(rightBlock, leftBlock);

  /* ------------------------------------------------------------ paper leaves */

  const leafCount = Math.ceil(pages.length / 2);
  const vertexCount = (GRID_X + 1) * (GRID_Z + 1);
  // Rest coordinates of every vertex on a right-hand page: x from the spine (0) to
  // the fore-edge (W), z from the head (-H/2) to the foot (+H/2).
  const restXZ = new Float32Array(vertexCount * 2);
  const uv = new Float32Array(vertexCount * 2);
  const index: number[] = [];
  for (let j = 0; j <= GRID_Z; j++) {
    for (let i = 0; i <= GRID_X; i++) {
      const n = j * (GRID_X + 1) + i;
      restXZ[n * 2] = (i / GRID_X) * W;
      restXZ[n * 2 + 1] = (j / GRID_Z - 0.5) * H;
      uv[n * 2] = i / GRID_X;
      uv[n * 2 + 1] = 1 - j / GRID_Z;
      if (i < GRID_X && j < GRID_Z) {
        const a = n;
        const b = n + 1;
        const c = n + GRID_X + 1;
        const d = c + 1;
        index.push(a, c, b, b, c, d);
      }
    }
  }
  const uvAttribute = new THREE.BufferAttribute(uv, 2);

  type Mode = "rest" | "drag" | "settle" | "auto";
  type LeafState = {
    /** Which stack it belongs to: 0 = right (unturned), 1 = left (turned). */
    side: 0 | 1;
    /** The frame it is being folded in: the side it started from. Left-hand leaves
        fold in a mirrored frame, so their outer corner leads just as a right page's does. */
    frame: 0 | 1;
    mode: Mode;
    /** The grabbed point, in right-page rest coordinates. */
    g: V2;
    /** Where that point is now (the fold follows from g and d). */
    d: V2;
    goal: V2;
    r: number;
    peel: number;
    target: 0 | 1;
    autoStart: number;
    autoDuration: number;
    /** A release eases from here to its resting place in a fixed, short time. */
    settleFrom: V2;
    settleStart: number;
    settleDuration: number;
    key: string;
  };

  /** Each page's texture, so a page can be redrawn (developing ink, hovered links). */
  const pageMaps: THREE.Texture[] = [];
  const leaves = Array.from({ length: leafCount }, (_, i) => {
    const geometry = keep(new THREE.BufferGeometry());
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(vertexCount * 3), 3));
    geometry.setAttribute("uv", uvAttribute);
    geometry.setIndex(index);
    const frontPage = pages[i * 2];
    const backPage = pages[i * 2 + 1];
    const frontMap = texture(frontPage.canvas);
    pageMaps[i * 2] = frontMap;
    const backMap = backPage ? texture(backPage.canvas, "x") : null;
    if (backMap) pageMaps[i * 2 + 1] = backMap;
    const front = new THREE.Mesh(geometry, paper(frontMap, { side: THREE.FrontSide }));
    const back = new THREE.Mesh(
      geometry,
      paper(backMap, { side: THREE.BackSide }),
    );
    front.receiveShadow = back.receiveShadow = true;
    front.userData = { leaf: i + 1, page: i * 2 };
    back.userData = { leaf: i + 1, page: i * 2 + 1 };
    book.add(front, back);
    const state: LeafState = {
      side: 0,
      frame: 0,
      mode: "rest",
      g: { x: W, z: H * 0.2 },
      d: { x: W, z: H * 0.2 },
      goal: { x: W, z: H * 0.2 },
      r: 0,
      peel: 0,
      target: 0,
      autoStart: 0,
      autoDuration: 1,
      settleFrom: { x: W, z: H * 0.2 },
      settleStart: 0,
      settleDuration: 1,
      key: "",
    };
    return { geometry, front, back, state };
  });

  const rightY = (k: number) => BOARD + (leafCount - k + 1) * LEAF_GAP;
  const leftY = (k: number) => BOARD + k * LEAF_GAP;
  const mirror = (g: V2): V2 => ({ x: -g.x, z: g.z });
  /** 0 = flat on the right, 1 = flat on the left. */
  const progressOf = (state: LeafState) => clamp((state.g.x - state.d.x) / (2 * state.g.x), 0, 1);
  const curlFor = (q: number) => 0.028 + 0.14 * Math.sin(Math.PI * q);

  /**
   * Paper does not stretch: the grabbed point can never be further from the spine
   * than it was when flat. Clamp against the spine point on its own row and both
   * spine corners.
   */
  const constrain = (g: V2, d: V2) => {
    const anchors = [
      { x: 0, z: g.z, max: g.x },
      { x: 0, z: -H / 2, max: Math.hypot(g.x, g.z + H / 2) },
      { x: 0, z: H / 2, max: Math.hypot(g.x, g.z - H / 2) },
    ];
    for (let pass = 0; pass < 3; pass++) {
      for (const anchor of anchors) {
        const ox = d.x - anchor.x;
        const oz = d.z - anchor.z;
        const length = Math.hypot(ox, oz);
        if (length > anchor.max) {
          d.x = anchor.x + (ox / length) * anchor.max;
          d.z = anchor.z + (oz / length) * anchor.max;
        }
      }
    }
    return d;
  };

  /** Distance from g to the fold line such that g, rolled over a cylinder of radius r, lands on d. */
  const foldOffset = (length: number, r: number) => {
    if (r < 1e-5 || length >= Math.PI * r) return (length + Math.PI * r) / 2;
    let low = 0;
    let high = Math.PI * r;
    for (let i = 0; i < 20; i++) {
      const mid = (low + high) / 2;
      if (mid - r * Math.sin(mid / r) < length) low = mid;
      else high = mid;
    }
    return (low + high) / 2;
  };

  /**
   * The fold. Points on g's side of the fold line roll over a cylinder of radius r
   * and, past half a turn, lie flat again face-down. `yFlat` is the height of the
   * unfolded part (its own stack), `yOver` of the part that has gone over.
   */
  const fold = (geometry: THREE.BufferGeometry, g: V2, d: V2, r: number, yFlat: number, yOver: number, mirrorX: boolean) => {
    const sx = mirrorX ? -1 : 1;
    const position = geometry.getAttribute("position") as THREE.BufferAttribute;
    const array = position.array as Float32Array;
    const dx = g.x - d.x;
    const dz = g.z - d.z;
    const length = Math.hypot(dx, dz);
    if (length < 1e-6) {
      for (let n = 0; n < vertexCount; n++) {
        array[n * 3] = sx * restXZ[n * 2];
        array[n * 3 + 1] = yFlat;
        array[n * 3 + 2] = restXZ[n * 2 + 1];
      }
    } else {
      const nx = dx / length;
      const nz = dz / length;
      const offset = foldOffset(length, r);
      const fx = g.x - nx * offset;
      const fz = g.z - nz * offset;
      const half = Math.PI * r;
      for (let n = 0; n < vertexCount; n++) {
        const px = restXZ[n * 2];
        const pz = restXZ[n * 2 + 1];
        const distance = (px - fx) * nx + (pz - fz) * nz;
        if (distance <= 0) {
          array[n * 3] = sx * px;
          array[n * 3 + 1] = yFlat;
          array[n * 3 + 2] = pz;
          continue;
        }
        const bx = px - nx * distance;
        const bz = pz - nz * distance;
        if (distance < half) {
          const angle = distance / r;
          const s = Math.sin(angle);
          array[n * 3] = sx * (bx + nx * r * s);
          array[n * 3 + 1] = yFlat + (yOver - yFlat) * (angle / Math.PI) + r * (1 - Math.cos(angle));
          array[n * 3 + 2] = bz + nz * r * s;
        } else {
          const over = distance - half;
          array[n * 3] = sx * (bx - nx * over);
          array[n * 3 + 1] = yOver + 2 * r;
          array[n * 3 + 2] = bz - nz * over;
        }
      }
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
  };

  /* --------------------------------------------------------- developing ink */

  // Pages a turn uncovers develop with it: their reveal follows the turning leaf's
  // progress (the first 35%), falls back if the leaf is dropped, and finishes on the
  // clock once the page lies open. Everything else stays fully printed.
  const DEVELOP_SECONDS = 2.2;
  const reveal = pages.map(() => 1);
  reveal[0] = 0; // the title page develops as the cover opens
  const rendered = pages.map(() => 1);
  const renderedAt = pages.map(() => 0);
  const hoverHrefs: (string | null)[] = pages.map(() => null);
  const hoverDrawn: (string | null)[] = pages.map(() => null);
  /** Which turning leaf (0 = the cover) is uncovering each page right now. */
  const owners = new Map<number, number>();
  const markIncoming = (leaf: number, frame: 0 | 1) => {
    if (reduced) return;
    const ids = leaf === 0 ? (frame === 0 ? [0] : []) : frame === 0 ? [leaf * 2 - 1, leaf * 2] : [leaf * 2 - 2, leaf * 2 - 3];
    for (const id of ids) {
      if (id < 0 || id >= pages.length) continue;
      reveal[id] = 0;
      owners.set(id, leaf);
    }
  };

  /* --------------------------------------------------------------- the cover */

  const cover = { q: 0, goal: 0, mode: "rest" as Mode, side: 0 as 0 | 1, peel: 0, autoStart: 0, autoDuration: 1, from: 0 };

  /* ------------------------------------------------------------------ spreads */

  const totalSpreads = leafCount + 2;
  let spread = 0;
  let focus: "left" | "right" = "right";
  let portrait = false;
  let dirty = true;

  const label = (index: number) => {
    if (index === 0) return "Closed";
    const right = pages[index * 2 - 2]?.label;
    const left = pages[index * 2 - 3]?.label;
    if (portrait) return (focus === "left" ? left : right) ?? left ?? right ?? "The end";
    if (left && right && left !== right) return `${left} · ${right}`;
    return right ?? left ?? "The end";
  };
  const announce = () => options.onSpread?.(spread, totalSpreads - 1, label(spread));

  const isBusy = () => cover.mode === "drag" || leaves.some(({ state }) => state.mode === "drag");

  /** Turn (or un-turn) leaves by themselves until `target` spreads are turned. */
  const goTo = (target: number) => {
    const next = clamp(Math.round(target), 0, totalSpreads - 1);
    if (isBusy() || next === spread) return;
    const now = performance.now();
    const forward = next > spread;
    const order: number[] = [];
    if (forward) for (let k = spread; k < next; k++) order.push(k);
    else for (let k = spread - 1; k >= next; k--) order.push(k);
    order.forEach((k, step) => {
      const delay = step * (reduced ? 40 : 140);
      const duration = reduced ? 260 : k === 0 ? 1050 : 820;
      if (k === 0) {
        if (forward) markIncoming(0, 0);
        cover.mode = "auto";
        cover.from = cover.q;
        cover.goal = forward ? 1 : 0;
        cover.autoStart = now + delay;
        cover.autoDuration = duration;
      } else {
        const state = leaves[k - 1].state;
        state.mode = "auto";
        // Always "go over" in the frame of the side it leaves from.
        state.frame = forward ? 0 : 1;
        markIncoming(k, state.frame);
        state.target = 1;
        state.peel = 0;
        state.g = { x: W, z: H * 0.18 };
        state.autoStart = now + delay;
        state.autoDuration = duration;
      }
      if (step < 4) sound.swish(delay / 1000);
    });
    spread = next;
    focus = portrait && spread > 1 ? (forward ? "left" : "right") : "right";
    dirty = true;
    announce();
  };

  // In portrait only one page fits: "next" first walks the camera across the
  // spread, and only then turns the leaf.
  const next = () => {
    if (portrait && spread > 1 && focus === "left") {
      focus = "right";
      dirty = true;
      announce();
      return;
    }
    goTo(spread + 1);
  };
  const prev = () => {
    if (portrait && spread > 1 && focus === "right") {
      focus = "left";
      dirty = true;
      announce();
      return;
    }
    goTo(spread - 1);
  };

  /* ------------------------------------------------------------------ camera */

  const look = new THREE.Vector3();
  const lookGoal = new THREE.Vector3();
  const eye = new THREE.Vector3();
  const eyeGoal = new THREE.Vector3();
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let intro = reduced ? 1 : 0;

  const pose = (open: number, target: THREE.Vector3, position: THREE.Vector3) => {
    const aspect = camera.aspect;
    const tangent = Math.tan((camera.fov * Math.PI) / 360);
    const closedSpan = portrait ? 3.4 : 5.6;
    const openSpan = portrait ? W * 1.12 : W * 2.24;
    const closedDistance = Math.max(closedSpan / 2 / (tangent * aspect), 4.6);
    const openDistance = Math.max(openSpan / 2 / (tangent * aspect), (H * 0.62) / tangent);
    const distance = closedDistance + (openDistance - closedDistance) * open;
    const elevation = (58 + open * 14) * (Math.PI / 180);
    const focusX = portrait && open > 0.5 ? (focus === "left" ? -W / 2 : W / 2) * smooth(clamp((open - 0.5) * 2, 0, 1)) : 0;
    target.set(focusX + pointer.x * 0.05, 0, 0.12 - pointer.y * 0.04);
    const pull = 1 + (1 - intro) * 0.5;
    position.set(target.x, Math.sin(elevation) * distance * pull, target.z + Math.cos(elevation) * distance * pull);
  };

  const resize = () => {
    const parent = canvas.parentElement;
    const width = parent?.clientWidth || window.innerWidth;
    const height = parent?.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(1, height);
    portrait = camera.aspect < 0.85;
    camera.updateProjectionMatrix();
    dirty = true;
  };
  resize();
  const resizeObserver = new ResizeObserver(resize);
  if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);
  pose(0, look, eye);

  /* ------------------------------------------------- hover-in-motion screenshots */

  type Overlay = { mesh: THREE.Mesh; material: THREE.MeshStandardMaterial; map: THREE.Texture; axis: "x" | "y"; range: number; base: number; t: number; opacity: number };
  const overlays = new Map<number, Overlay>();
  const imageCache = new Map<string, Promise<HTMLImageElement>>();
  const loadImage = (src: string) => {
    let promise = imageCache.get(src);
    if (!promise) {
      promise = new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = optimised(src, 828);
      });
      imageCache.set(src, promise);
    }
    return promise;
  };

  const overlayFor = (pageIndex: number): Overlay | null => {
    const existing = overlays.get(pageIndex);
    if (existing) return existing;
    const motion = pages[pageIndex]?.motion;
    if (!motion) return null;
    const map = keep(new THREE.Texture());
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = anisotropy;
    const material = paper(map, { transparent: true, opacity: 0 });
    const mesh = new THREE.Mesh(keep(new THREE.PlaneGeometry(motion.w * W, motion.h * H)), material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.visible = false;
    book.add(mesh);
    const overlay: Overlay = { mesh, material, map, axis: "y", range: 0, base: 0, t: 0, opacity: 0 };
    overlays.set(pageIndex, overlay);
    loadImage(motion.src)
      .then((image) => {
        map.image = image;
        const target = (motion.w * W) / (motion.h * H);
        const source = image.naturalWidth / image.naturalHeight;
        if (source > target) {
          map.repeat.set(target / source, 1);
          overlay.axis = "x";
          overlay.range = 1 - map.repeat.x;
          overlay.base = overlay.range / 2;
          map.offset.set(overlay.base, 0);
        } else {
          map.repeat.set(1, source / target);
          overlay.axis = "y";
          overlay.range = 1 - map.repeat.y;
          overlay.base = overlay.range;
          map.offset.set(0, overlay.base);
        }
        map.needsUpdate = true;
        dirty = true;
      })
      .catch(() => undefined);
    return overlay;
  };

  /* -------------------------------------------------------------- interaction */

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const deskPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hitPoint = new THREE.Vector3();

  /** The leaf lying on top of each stack (only those can be grabbed). */
  const topRight = () => leaves.findIndex(({ state }) => state.side === 0 && state.mode === "rest") + 1 || 0;
  const topLeft = () => {
    for (let i = leaves.length - 1; i >= 0; i--) if (leaves[i].state.side === 1 && leaves[i].state.mode === "rest") return i + 1;
    return 0;
  };

  type Hit = { side: "left" | "right"; leaf: number; page: number | null; link: string | null; local: THREE.Vector3; cover: boolean };

  const setRay = (clientX: number, clientY: number) => {
    const box = canvas.getBoundingClientRect();
    ndc.set(((clientX - box.left) / box.width) * 2 - 1, -((clientY - box.top) / box.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
  };

  const hitTest = (clientX: number, clientY: number): Hit | null => {
    setRay(clientX, clientY);
    const targets: THREE.Object3D[] = [frontBoard, backBoard];
    leaves.forEach(({ front, back }) => {
      if (front.visible) targets.push(front, back);
    });
    const found = raycaster.intersectObjects(targets, false)[0];
    if (!found) return null;
    const local = book.worldToLocal(found.point.clone());
    const side: "left" | "right" = local.x >= 0 ? "right" : "left";
    if (found.object === frontBoard || found.object === backBoard) {
      return { side, leaf: 0, page: null, link: null, local, cover: cover.side === 0 || (side === "left" && topLeft() === 0) };
    }
    const { leaf, page } = found.object.userData as { leaf: number; page: number };
    const resting = side === "right" ? topRight() : topLeft();
    let link: string | null = null;
    if (resting === leaf && found.uv) {
      const isBack = found.object === leaves[leaf - 1].back;
      const u = isBack ? 1 - found.uv.x : found.uv.x;
      const v = 1 - found.uv.y;
      link = pages[page]?.links.find((rect) => u >= rect.x && u <= rect.x + rect.w && v >= rect.y && v <= rect.y + rect.h)?.href ?? null;
    }
    return { side, leaf, page: resting === leaf ? page : null, link, local, cover: false };
  };

  /** Where the pointer meets the paper's plane, in book coordinates. */
  const project = (clientX: number, clientY: number) => {
    setRay(clientX, clientY);
    deskPlane.constant = -(BOARD + (leafCount + 1) * LEAF_GAP);
    if (!raycaster.ray.intersectPlane(deskPlane, hitPoint)) return null;
    return book.worldToLocal(hitPoint.clone());
  };

  type Drag = {
    id: number;
    kind: "leaf" | "cover" | "pan" | "pending";
    leaf: number;
    startClient: { x: number; y: number };
    startLocal: THREE.Vector3;
    restD: V2;
    from: 0 | 1;
    moved: number;
    lastX: number;
    lastT: number;
    velocity: number;
    hit: Hit | null;
  };
  let drag: Drag | null = null;
  let hover: Hit | null = null;

  const beginDrag = (current: Drag, dx: number) => {
    const hit = current.hit;
    if (!hit) {
      current.kind = "pan";
      return;
    }
    // Portrait swipes toward the page you can't see just walk the camera there.
    if (portrait && spread > 1 && ((focus === "right" && dx > 0) || (focus === "left" && dx < 0))) {
      current.kind = "pan";
      return;
    }
    if (hit.leaf === 0 || hit.cover) {
      const canOpen = cover.side === 0 && spread === 0;
      const canClose = cover.side === 1 && spread === 1 && hit.side === "left";
      if (!canOpen && !canClose) {
        current.kind = "pan";
        return;
      }
      current.kind = "cover";
      if (cover.side === 0) markIncoming(0, 0);
      current.from = cover.side;
      cover.mode = "drag";
      sound.startRustle();
      return;
    }
    const leafNumber = hit.side === "right" ? topRight() : topLeft();
    if (!leafNumber) {
      current.kind = "pan";
      return;
    }
    const state = leaves[leafNumber - 1].state;
    // Grab the fore-edge at the height you pressed: the page folds from there.
    state.frame = state.side;
    markIncoming(leafNumber, state.frame);
    state.g = { x: W, z: clamp(hit.local.z, -H / 2 + 0.03, H / 2 - 0.03) };
    current.restD = { ...state.g };
    state.d = { ...state.g };
    state.goal = { ...state.g };
    state.mode = "drag";
    state.peel = 0;
    current.kind = "leaf";
    current.leaf = leafNumber;
    current.from = state.side;
    sound.startRustle();
  };

  const snapMoving = () => {
    leaves.forEach(({ state }) => {
      if (state.mode === "settle" || state.mode === "auto") {
        if (state.mode === "auto" || state.target === 1) state.side = state.frame === 0 ? 1 : 0;
        state.mode = "rest";
        state.r = 0;
      }
    });
    if (cover.mode === "auto" || cover.mode === "settle") {
      cover.q = cover.goal;
      cover.side = cover.goal >= 0.5 ? 1 : 0;
      cover.mode = "rest";
    }
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || drag) return;
    sound.wake();
    // Grabbing the book mid-animation: let anything still moving land first, so
    // the hand always takes hold of whichever page is really on top.
    snapMoving();
    const startLocal = project(event.clientX, event.clientY);
    if (!startLocal) return;
    canvas.setPointerCapture(event.pointerId);
    drag = {
      id: event.pointerId,
      kind: "pending",
      leaf: 0,
      startClient: { x: event.clientX, y: event.clientY },
      startLocal,
      restD: { x: W, z: 0 },
      from: 0,
      moved: 0,
      lastX: startLocal.x,
      lastT: event.timeStamp,
      velocity: 0,
      hit: hitTest(event.clientX, event.clientY),
    };
  };

  const onPointerMove = (event: PointerEvent) => {
    pointer.tx = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (event.clientY / window.innerHeight) * 2 - 1;
    if (!drag || drag.id !== event.pointerId) {
      if (event.pointerType === "mouse" && !drag) {
        hover = hitTest(event.clientX, event.clientY);
        canvas.classList.toggle("cursor-target", Boolean(hover));
      }
      dirty = true;
      return;
    }
    const dx = event.clientX - drag.startClient.x;
    drag.moved = Math.max(drag.moved, Math.hypot(dx, event.clientY - drag.startClient.y));
    if (drag.kind === "pending" && drag.moved > 5) beginDrag(drag, dx);
    const local = project(event.clientX, event.clientY);
    if (!local) return;
    // Input time, not handler time: on a busy frame the two can be far apart.
    const now = event.timeStamp;
    const elapsed = Math.max(1, now - drag.lastT) / 1000;
    drag.velocity = drag.velocity * 0.6 + ((local.x - drag.lastX) / elapsed) * 0.4;
    drag.lastX = local.x;
    drag.lastT = now;
    sound.setRustle(Math.abs(drag.velocity));

    if (drag.kind === "leaf") {
      const state = leaves[drag.leaf - 1].state;
      // In the leaf's own frame: left-hand leaves see x mirrored.
      const sx = state.frame === 1 ? -1 : 1;
      // In portrait only one page fits on screen, so a finger crossing it must be
      // able to carry the paper all the way over: the drag is geared up.
      const gain = portrait ? 1.7 : 1;
      state.goal = constrain(state.g, {
        x: drag.restD.x + sx * gain * (local.x - drag.startLocal.x),
        z: drag.restD.z + gain * (local.z - drag.startLocal.z),
      });
    } else if (drag.kind === "cover") {
      const delta = (local.x - drag.startLocal.x) / (2 * W);
      cover.goal = clamp((drag.from === 0 ? 0 : 1) - delta, 0, 1);
    }
    dirty = true;
  };

  const finishDrag = (event: PointerEvent) => {
    if (!drag || drag.id !== event.pointerId) return;
    const current = drag;
    drag = null;
    sound.stopRustle();
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);

    if (current.kind === "pending") {
      // A click: links first, then turn toward the side that was clicked.
      const hit = current.hit;
      if (event.type !== "pointerup" || !hit) return;
      if (spread === 0) {
        goTo(1);
        return;
      }
      if (hit.link) {
        options.onNavigate?.(hit.link);
        return;
      }
      if (portrait) next();
      else if (hit.side === "right") goTo(spread + 1);
      else goTo(spread - 1);
      return;
    }

    if (current.kind === "pan") {
      const dx = event.clientX - current.startClient.x;
      if (portrait && Math.abs(dx) > 40) {
        if (dx < 0) next();
        else prev();
      }
      return;
    }

    // A flick carries further than its distance alone.
    const flick = current.velocity;
    if (current.kind === "cover") {
      const opening = current.from === 0;
      const done = opening ? cover.goal > 0.42 || (flick < -1.2 && cover.goal > 0.05) : cover.goal < 0.58 || (flick > 1.2 && cover.goal < 0.95);
      // The board swings the rest of the way (or back) on a short timed ease.
      cover.mode = "auto";
      cover.from = cover.q;
      cover.goal = done ? (opening ? 1 : 0) : opening ? 0 : 1;
      cover.autoStart = performance.now();
      cover.autoDuration = 280 + 520 * Math.abs(cover.goal - cover.q);
      if (done) {
        spread = opening ? 1 : 0;
        focus = "right";
        announce();
      }
      return;
    }

    const state = leaves[current.leaf - 1].state;
    // Progress and flick in the leaf's frame: 1 / negative = going over. Judged from
    // where the finger is, not where the (slightly lagging) paper has got to.
    const q = progressOf({ ...state, d: state.goal });
    const forward = current.from === 0;
    const flickOver = forward ? flick : -flick;
    const done = q > (portrait ? 0.32 : 0.5) || (flickOver < -0.9 && q > 0.04);
    state.mode = "settle";
    state.target = done ? 1 : 0;
    // A fixed, short ease to wherever it is going — the further, the longer, but
    // always finished well before the next hand reaches for the book.
    const settleGoal = done ? mirror(state.g) : state.g;
    state.settleFrom = { ...state.d };
    state.settleStart = performance.now();
    state.settleDuration = 260 + 460 * clamp(Math.hypot(settleGoal.x - state.d.x, settleGoal.z - state.d.z) / (2 * W), 0, 1);
    if (done) {
      spread += forward ? 1 : -1;
      focus = portrait && spread > 1 ? (forward ? "left" : "right") : "right";
      announce();
    }
  };

  const onPointerLeave = () => {
    hover = null;
    canvas.classList.remove("cursor-target");
    dirty = true;
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const target = event.target;
    if (target instanceof Element && target.closest("input, textarea, select, button, a")) return;
    if (event.key === "ArrowRight") next();
    else if (event.key === "ArrowLeft") prev();
    else if (event.key === "Escape") goTo(0);
    else return;
    event.preventDefault();
  };

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", finishDrag);
  canvas.addEventListener("pointercancel", finishDrag);
  canvas.addEventListener("pointerleave", onPointerLeave);
  window.addEventListener("keydown", onKeyDown);

  /* ------------------------------------------------------------------- frame */

  let raf = 0;
  let paused = false;
  let last = performance.now();
  const blocks = { right: -1, left: -1 };
  let shadowsDirty = true;
  let lastCoverQ = -1;

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;
    let active = false;
    const follow = (rate: number) => 1 - Math.exp(-dt * rate);

    if (intro < 1) {
      intro = Math.min(1, intro + dt / 1.8);
      active = true;
    }
    pointer.x += (pointer.tx - pointer.x) * follow(3);
    pointer.y += (pointer.ty - pointer.y) * follow(3);
    if (!reduced && (Math.abs(pointer.tx - pointer.x) > 0.002 || Math.abs(pointer.ty - pointer.y) > 0.002)) active = true;

    /* -- the front board -- */
    if (cover.mode === "drag") {
      cover.q += (cover.goal - cover.q) * follow(20);
      active = true;
    } else if (cover.mode === "settle") {
      cover.q += (cover.goal - cover.q) * follow(7);
      active = true;
      if (Math.abs(cover.goal - cover.q) < 0.002) {
        cover.q = cover.goal;
        cover.side = cover.goal >= 0.5 ? 1 : 0;
        cover.mode = "rest";
        sound.land(0, 1.3);
      }
    } else if (cover.mode === "auto") {
      active = true;
      if (now >= cover.autoStart) {
        const t = clamp((now - cover.autoStart) / cover.autoDuration, 0, 1);
        cover.q = cover.from + (cover.goal - cover.from) * ease(t);
        if (t >= 1) {
          cover.side = cover.goal >= 0.5 ? 1 : 0;
          cover.mode = "rest";
          sound.land(0, 1.3);
        }
      }
    }
    const coverHovered = hover?.cover && spread === 0 && cover.mode === "rest" && !reduced;
    cover.peel += ((coverHovered ? 1 : 0) - cover.peel) * follow(10);
    if (Math.abs((coverHovered ? 1 : 0) - cover.peel) > 0.002) active = true;
    const coverQ = clamp(cover.q + cover.peel * 0.03, 0, 1);
    if (coverQ !== lastCoverQ) {
      lastCoverQ = coverQ;
      shadowsDirty = true;
    }
    const openness = smooth(clamp(cover.q * 1.2, 0, 1));
    book.position.x = (-W / 2) * (1 - openness);
    frontPivot.position.y = BOARD / 2 + rightY(0) * (1 - smooth(coverQ));
    frontPivot.rotation.z = coverQ * Math.PI;

    /* -- paper -- */
    const rightTop = topRight();
    const leftTop = topLeft();
    leaves.forEach(({ geometry, front, back, state }, i) => {
      const k = i + 1;
      // Everything below is in the leaf's own frame: d === g is "flat where it
      // started", d === mirror(g) is "gone over to the other side".
      if (state.mode === "drag") {
        state.d.x += (state.goal.x - state.d.x) * follow(24);
        state.d.z += (state.goal.z - state.d.z) * follow(24);
        state.r = curlFor(progressOf(state));
        active = true;
      } else if (state.mode === "settle") {
        const goal = state.target === 1 ? mirror(state.g) : state.g;
        const t = clamp((now - state.settleStart) / state.settleDuration, 0, 1);
        // Ease out: the paper is let go fast and slows as it lies down.
        const e = 1 - (1 - t) ** 3;
        state.d.x = state.settleFrom.x + (goal.x - state.settleFrom.x) * e;
        state.d.z = state.settleFrom.z + (goal.z - state.settleFrom.z) * e;
        constrain(state.g, state.d);
        state.r = curlFor(progressOf(state)) * (1 - e);
        active = true;
        if (t >= 1) {
          if (state.target === 1) {
            state.side = state.frame === 0 ? 1 : 0;
            sound.land();
          }
          state.mode = "rest";
          state.r = 0;
        }
      } else if (state.mode === "auto") {
        active = true;
        if (now >= state.autoStart) {
          const t = clamp((now - state.autoStart) / state.autoDuration, 0, 1);
          const angle = Math.PI * ease(t);
          // The corner sweeps over in an arc, drifting up the page as it goes.
          state.d = constrain(state.g, { x: W * Math.cos(angle), z: state.g.z - H * 0.12 * Math.sin(angle) });
          state.r = 0.17 * Math.pow(Math.sin(angle), 0.85);
          if (t >= 1) {
            state.side = state.frame === 0 ? 1 : 0;
            state.mode = "rest";
            state.r = 0;
          }
        } else {
          state.d = { ...state.g };
          state.r = 0;
        }
      }

      if (state.mode === "rest") {
        state.frame = state.side;
        // Hovering the top page dog-ears its outer bottom corner: grab me.
        const hovered =
          !drag && hover && !hover.link && !hover.cover && spread > 0 && !reduced &&
          ((hover.side === "right" && state.side === 0 && k === rightTop) || (hover.side === "left" && state.side === 1 && k === leftTop));
        const goalPeel = hovered ? 1 : 0;
        state.peel += (goalPeel - state.peel) * follow(11);
        if (Math.abs(goalPeel - state.peel) > 0.002) active = true;
        else state.peel = goalPeel;
        state.g = { x: W, z: H / 2 - 0.001 };
        state.d = { x: W - 0.13 * state.peel, z: H / 2 - 0.001 - 0.09 * state.peel };
        state.r = 0.035 * state.peel;
      }

      const moving = state.mode !== "rest" || state.peel > 0.002;
      // The part still lying on its starting stack, and the part gone over, each
      // sit just above their own stack; a moving leaf rides a hair higher.
      const lift = moving ? 0.0016 : 0;
      const home = state.frame === 0 ? rightY(k) : leftY(k);
      const away = state.frame === 0 ? leftY(k) : rightY(k);
      const key = `${state.frame}${state.d.x.toFixed(5)},${state.d.z.toFixed(5)},${state.r.toFixed(5)},${state.g.z.toFixed(4)},${lift}`;
      if (key !== state.key) {
        fold(geometry, state.g, state.d, state.r, home + lift, away + lift, state.frame === 1);
        shadowsDirty = true;
        state.key = key;
      }
      front.castShadow = back.castShadow = moving;
      const visible = moving || k === rightTop || k === rightTop + 1 || k === leftTop || k === leftTop - 1;
      front.visible = back.visible = visible;
    });

    const restingRight = leaves.filter(({ state }) => state.side === 0 && state.mode === "rest").length;
    const restingLeft = leaves.filter(({ state }) => state.side === 1 && state.mode === "rest").length;
    if (blocks.right !== restingRight || blocks.left !== restingLeft) {
      blocks.right = restingRight;
      blocks.left = restingLeft;
      rightBlock.position.y = BOARD;
      rightBlock.scale.y = Math.max(0.0005, (restingRight - 0.5) * LEAF_GAP);
      rightBlock.visible = restingRight > 1;
      leftBlock.position.y = BOARD;
      leftBlock.scale.y = Math.max(0.0005, (restingLeft - 0.5) * LEAF_GAP);
      leftBlock.visible = restingLeft > 1;
    }

    /* -- developing ink -- */
    const isShowing = (id: number) => {
      const k = Math.floor(id / 2) + 1;
      const state = leaves[k - 1]?.state;
      if (!state || state.mode !== "rest") return false;
      if (id % 2 === 0) return state.side === 0 && k === rightTop && (k > 1 || (cover.side === 1 && cover.mode === "rest"));
      return state.side === 1 && k === leftTop;
    };
    pages.forEach((page, id) => {
      const owner = owners.get(id);
      if (owner !== undefined) {
        const leafState = owner === 0 ? null : leaves[owner - 1].state;
        const moving = owner === 0 ? cover.mode !== "rest" : leafState!.mode !== "rest";
        if (moving) {
          const q = owner === 0 ? cover.q : progressOf(leafState!);
          reveal[id] = 0.35 * smooth(clamp((q - 0.08) / 0.8, 0, 1));
        } else {
          owners.delete(id);
        }
      }
      if (!owners.has(id) && reveal[id] < 1 && isShowing(id)) {
        reveal[id] = Math.min(1, reveal[id] + dt / DEVELOP_SECONDS);
      }
      hoverHrefs[id] = hover && hover.page === id ? hover.link : null;
      const hoverChanged = hoverHrefs[id] !== hoverDrawn[id];
      if (Math.abs(reveal[id] - rendered[id]) > 0.002 || hoverChanged) {
        active = true;
        // ~30fps redraws while developing; the final frame and hover changes go out at once.
        if (reveal[id] >= 1 || hoverChanged || now - renderedAt[id] > 33) {
          page.render(reveal[id], hoverHrefs[id]);
          if (pageMaps[id]) pageMaps[id].needsUpdate = true;
          rendered[id] = reveal[id];
          renderedAt[id] = now;
          hoverDrawn[id] = hoverHrefs[id];
        }
      }
    });

    /* -- screenshots in motion -- */
    pages.forEach((page, pageIndex) => {
      if (!page.motion) return;
      const k = Math.floor(pageIndex / 2) + 1;
      const isFront = pageIndex % 2 === 0;
      const state = leaves[k - 1].state;
      const showing = reveal[pageIndex] >= 1 && state.mode === "rest" && state.peel < 0.01 && (isFront ? state.side === 0 && k === rightTop : state.side === 1 && k === leftTop);
      const wanted = showing && (coarse || hover?.page === pageIndex) && !reduced && !drag;
      const overlay = wanted ? overlayFor(pageIndex) : overlays.get(pageIndex);
      if (!overlay) return;
      overlay.opacity += ((wanted && overlay.map.image ? 1 : 0) - overlay.opacity) * follow(8);
      if (overlay.opacity < 0.005 && !wanted) {
        overlay.opacity = 0;
        overlay.mesh.visible = false;
        overlay.t = 0;
        overlay.map.offset[overlay.axis] = overlay.base;
        return;
      }
      if (!showing) {
        // The page has started moving: the live image must not float off it.
        overlay.opacity = 0;
        overlay.mesh.visible = false;
        return;
      }
      active = true;
      overlay.mesh.visible = true;
      overlay.material.opacity = overlay.opacity;
      if (wanted && overlay.range > 0) {
        overlay.t += dt;
        // A slow browse through the page and back, from exactly what the print shows.
        const wave = (overlay.t / 9) * Math.PI * 2;
        overlay.map.offset[overlay.axis] =
          overlay.axis === "y" ? overlay.range * (1 - (Math.sin(wave - Math.PI / 2) + 1) / 2) : overlay.base + (overlay.range / 2) * Math.sin(wave);
      }
      const motion = page.motion;
      const pageX = isFront ? 0 : -W;
      overlay.mesh.position.set(
        pageX + motion.x * W + (motion.w * W) / 2,
        (isFront ? rightY(k) : leftY(k)) + 0.0012,
        -H / 2 + motion.y * H + (motion.h * H) / 2,
      );
    });

    /* -- camera -- */
    pose(smooth(cover.q), lookGoal, eyeGoal);
    const lag = reduced ? 1 : follow(3.2);
    if (eye.distanceToSquared(eyeGoal) > 1e-7 || look.distanceToSquared(lookGoal) > 1e-7) active = true;
    eye.lerp(eyeGoal, lag);
    look.lerp(lookGoal, lag);
    camera.position.copy(eye);
    camera.lookAt(look);

    // Ambient life: dust and steam move every frame; shadows only when solids move.
    if (!reduced) {
      ambient.value += dt;
      steams.forEach((sheet) => sheet.quaternion.copy(camera.quaternion));
      active = true;
    }
    if (shadowsDirty) {
      renderer.shadowMap.needsUpdate = true;
      shadowsDirty = false;
    }
    if (active || dirty) {
      renderer.render(scene, camera);
      dirty = false;
    }
  };

  const run = () => {
    if (raf || paused) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const halt = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };
  const onVisibility = () => (document.hidden ? halt() : run());
  document.addEventListener("visibilitychange", onVisibility);
  run();
  announce();

  return {
    next,
    prev,
    goTo,
    close: () => goTo(0),
    setMuted: (muted) => {
      sound.muted = muted;
      if (muted) sound.stopRustle();
    },
    setPaused: (value) => {
      paused = value;
      if (paused) halt();
      else {
        dirty = true;
        run();
      }
    },
    dispose: () => {
      halt();
      document.removeEventListener("visibilitychange", onVisibility);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", finishDrag);
      canvas.removeEventListener("pointercancel", finishDrag);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("keydown", onKeyDown);
      sound.dispose();
      disposables.forEach((item) => item.dispose());
      renderer.dispose();
    },
  };
}
