import * as THREE from "three";
import { services, stackGroups } from "@/data/portfolio";
import { optimisedImage, places, placeById, projectImages, projectIslets, SEA_RADIUS, START } from "./islands";
import {
  buildBoard,
  buildBoat,
  buildBuoy,
  buildCabinet,
  buildCommitPosts,
  buildCrate,
  buildHut,
  buildIsland,
  buildLetters,
  buildLighthouse,
  buildMarker,
  buildRaft,
  buildSign,
  buildStall,
  Kit,
  palette,
  palmGeometries,
} from "./models";
import { labelTexture, type Fonts } from "./textures";
import { WAVE_GLSL, waveHeight } from "./waves";

export type Day = { week: number; weekday: number; level: number };

export type EngineOptions = {
  canvas: HTMLCanvasElement;
  fonts: Fonts;
  days: Day[];
  onProgress?: (value: number) => void;
  onZone?: (id: string | null) => void;
  onBoat?: (x: number, z: number, heading: number) => void;
};

export type Engine = {
  /** Resolves once textures are in (or after a timeout — never blocks forever). */
  ready: Promise<void>;
  /** Leave the opening fly-around and hand the helm to the visitor. */
  start: () => void;
  sailTo: (id: string) => void;
  zoom: (factor: number) => void;
  setPaused: (paused: boolean) => void;
  dispose: () => void;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const wrapAngle = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));

const BOAT_RADIUS = 2.1;
const MAX_SPEED = 13;
const CAMERA_OFFSET = new THREE.Vector3(0, 27, 23);

export function createArchipelago(options: EngineOptions): Engine {
  const { canvas, fonts } = options;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  /* ------------------------------------------------------------ renderer */

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  let dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  // A warm sea haze rather than a sky: the camera looks down, and the far water
  // simply dissolves into it.
  const haze = new THREE.Color("#d9d3c1");
  scene.background = haze;
  scene.fog = new THREE.Fog(haze, 72, 170);

  const camera = new THREE.PerspectiveCamera(38, 1, 1, 420);
  const hemisphere = new THREE.HemisphereLight("#fff4e0", "#3f6c6e", 1.25);
  const sun = new THREE.DirectionalLight("#fff0d6", 2.3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(coarse ? 1024 : 2048, coarse ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -36, right: 36, top: 36, bottom: -36, near: 1, far: 130 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.05;
  scene.add(hemisphere, sun, sun.target);

  const kit = new Kit(fonts);
  const manager = new THREE.LoadingManager();
  const textureLoader = new THREE.TextureLoader(manager);
  let pending = 0;
  manager.onStart = () => { pending++; };
  manager.onProgress = (_url, loaded, total) => options.onProgress?.(total ? loaded / total : 1);

  /** Loads an image as a texture, cropped to cover a board of the given aspect. */
  const coverTexture = (src: string, aspect: number, width = 640) => {
    const loaded = kit.keep(
      textureLoader.load(optimisedImage(src, width), (texture) => {
        const image = texture.image as { width: number; height: number };
        const imageAspect = image.width / image.height;
        if (imageAspect > aspect) {
          texture.repeat.set(aspect / imageAspect, 1);
          texture.offset.set((1 - texture.repeat.x) / 2, 0);
        } else {
          // Tall screenshots show their top: that is where the interface starts.
          texture.repeat.set(1, imageAspect / aspect);
          texture.offset.set(0, 1 - texture.repeat.y);
        }
        texture.needsUpdate = true;
      }),
    );
    // Photos are sRGB; without this every screenshot renders washed out.
    loaded.colorSpace = THREE.SRGBColorSpace;
    loaded.anisotropy = 4;
    return loaded;
  };
  const texture = (canvasTexture: THREE.Texture) => {
    canvasTexture.colorSpace = THREE.SRGBColorSpace;
    return kit.keep(canvasTexture);
  };

  /* ----------------------------------------------------------------- sea */

  const time = { value: 0 };
  const seaGeometry = kit.keep(new THREE.PlaneGeometry(290, 290, 145, 145));
  seaGeometry.rotateX(-Math.PI / 2);
  const seaMaterial = kit.keep(
    // Lambert, not Standard: no specular at all, so no white sun smear on the water.
    new THREE.MeshLambertMaterial({ color: palette.sea, flatShading: true, transparent: true, opacity: 0.86 }),
  );
  // Waves only: the facets catch the light on their own. (Tinting by wave height
  // was tried and dropped — the long swell turned it into drifting pale blotches.)
  seaMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = time;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\nuniform float uTime;\n${WAVE_GLSL}`)
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vec2 seaXZ = (modelMatrix * vec4(transformed, 1.0)).xz;
        transformed.y += waveHeight(seaXZ, uTime);`,
      );
  };
  const sea = new THREE.Mesh(seaGeometry, seaMaterial);
  sea.receiveShadow = true;
  const seabedGeometry = kit.keep(new THREE.PlaneGeometry(290, 290));
  seabedGeometry.rotateX(-Math.PI / 2);
  const seabed = new THREE.Mesh(seabedGeometry, kit.matte(palette.seabed));
  seabed.position.y = -2.6;
  scene.add(sea, seabed);
  // The sea follows the boat in whole grid steps, so its vertices stay locked to
  // the wave field and nothing appears to swim.
  const SEA_STEP = 290 / 145;

  /* --------------------------------------------------------------- world */

  const pickables: THREE.Object3D[] = [];
  const pickable = (object: THREE.Object3D, placeId: string) => {
    object.userData.place = placeId;
    pickables.push(object);
    return object;
  };
  const colliders: [number, number, number][] = places.flatMap((place) => place.colliders);
  const palms: THREE.Matrix4[] = [];
  const addPalm = (x: number, y: number, z: number, scale = 1, yaw = 0) => {
    palms.push(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), new THREE.Vector3(scale, scale, scale)));
  };
  const floaters: { object: THREE.Object3D; x: number; z: number; lift: number; sway: number }[] = [];
  /** A signpost on a beach (`y` given) or, in open water, on its own little sand spit. */
  const signAt = (text: string, kicker: string, x: number, z: number, placeId: string, y?: number) => {
    let base = y;
    if (base === undefined) {
      const spit = buildIsland(kit, { radius: 1.9, grass: false, seed: Math.round(x * 3 + z) });
      spit.group.position.set(x, 0, z);
      scene.add(spit.group);
      colliders.push([x, z, 2]);
      base = spit.top;
    }
    const sign = pickable(buildSign(kit, text, kicker), placeId);
    sign.position.set(x, base, z);
    scene.add(sign);
  };
  const buoyAt = (x: number, z: number) => {
    const buoy = buildBuoy(kit);
    buoy.position.set(x, 0, z);
    scene.add(buoy);
    floaters.push({ object: buoy, x, z, lift: 0, sway: 1 });
    colliders.push([x, z, 0.8]);
  };
  const islandAt = (x: number, z: number, settings: Parameters<typeof buildIsland>[1]) => {
    const island = buildIsland(kit, settings);
    island.group.position.set(x, 0, z);
    scene.add(island.group);
    return island.top;
  };

  // Home: the name on a sandbar, where every voyage starts.
  const home = placeById.get("home")!;
  islandAt(home.x, home.z, { radius: 4.3, grass: false, seed: 2, stretch: 3.3 });
  const name = buildLetters(kit, "ZHYRONNE", 3.3);
  name.group.position.set(home.x, 0.4, home.z - 0.6);
  scene.add(name.group);
  const letterState = name.letters.map((letter) => ({ letter, lift: 0, velocity: 0, cooldown: 0 }));
  addPalm(home.x - 13.2, 0.4, home.z - 0.8, 0.9, 2.1);
  addPalm(home.x + 13.4, 0.4, home.z - 1.2, 1, 0.4);
  buoyAt(home.dock[0] + 3.4, home.dock[1] - 1.5);

  // About: the bahay kubo, a portrait board and palms.
  const about = placeById.get("about")!;
  const aboutTop = islandAt(about.x, about.z, { radius: 9, seed: 5 });
  const hut = buildHut(kit);
  hut.position.set(about.x - 2.4, aboutTop, about.z - 2.2);
  hut.rotation.y = 0.18;
  scene.add(pickable(hut, "about"));
  const portraitBoard = pickable(
    buildBoard(kit, { width: 2.5, height: 3.1, map: coverTexture("/images/me.jpg", 2.5 / 3.1, 384), postHeight: 0.6, frame: palette.wood }),
    "about",
  );
  portraitBoard.position.set(about.x + 3.6, aboutTop, about.z + 2.8);
  portraitBoard.rotation.y = -0.22;
  scene.add(portraitBoard);
  signAt("About", "THE BAHAY KUBO", about.x + 5.6, about.z + 5.4, "about", 0.45);
  addPalm(about.x - 6.4, aboutTop, about.z + 1.5, 1.05, 0.5);
  addPalm(about.x + 5.5, aboutTop, about.z - 4.5, 0.95, 2.4);
  addPalm(about.x - 3.5, aboutTop, about.z + 5, 0.8, 4.1);
  buoyAt(about.dock[0] + 3.2, about.dock[1] + 1);

  // Projects: one islet per project, each with its own billboard.
  for (const { project, index, x, z } of projectIslets) {
    const top = islandAt(x, z, { radius: 3.5, height: 0.6, seed: 20 + index });
    const board = buildBoard(kit, { width: 4.4, height: 2.75, map: coverTexture(projectImages[project.visual], 4.4 / 2.75), postHeight: 0.8 });
    const caption = new THREE.Mesh(
      kit.keep(new THREE.PlaneGeometry(4.4, 0.78)),
      kit.keep(
        new THREE.MeshBasicMaterial({
          map: texture(
            labelTexture(project.title, { width: 640, height: 112, background: palette.cream, color: palette.ink, family: fonts.display, weight: 600, kicker: `PROJECT ${project.number}`, kickerFamily: fonts.mono }),
          ),
        }),
      ),
    );
    caption.position.set(0, 0.42, 0.1);
    board.add(caption);
    board.position.set(x, top, z + 0.4);
    scene.add(pickable(board, `project-${index}`));
    addPalm(x + (index % 2 ? -2.4 : 2.4), top, z - 1.2, 0.7, index);
  }
  const firstProject = projectIslets[0];
  signAt("Projects", "TEN ISLETS", firstProject.x + 6.5, firstProject.z + 18.5, "project-0");

  // Services: a palengke with one stall per service.
  const market = placeById.get("services")!;
  const marketTop = islandAt(market.x, market.z, { radius: 10.5, height: 0.9, seed: 9 });
  const awnings = [palette.terracotta, palette.mustard, palette.sage, palette.blue, palette.red, palette.thatch];
  services.forEach((service, index) => {
    const stall = buildStall(kit, awnings[index], service.previewTitle);
    const column = index % 3;
    const row = Math.floor(index / 3);
    stall.position.set(market.x + (column - 1) * 4.3, marketTop, market.z - 3.6 + row * 4.6);
    scene.add(pickable(stall, "services"));
  });
  signAt("Services", "THE PALENGKE", market.x + 6.8, market.z + 7.6, "services", 0.45);
  addPalm(market.x - 7.2, marketTop, market.z - 3, 1, 1.2);
  addPalm(market.x + 7.4, marketTop, market.z + 2.5, 0.9, 3.3);
  buoyAt(market.dock[0] - 3.4, market.dock[1] - 0.5);

  // Stack: a lagoon of floating tool crates, ringed by rocks. Bump them around.
  const lagoon = placeById.get("stack")!;
  const crateTints = ["#efe2c6", "#e0cfa3", "#cbd6bf", "#ecd29a", "#c9d5dc"];
  const crates = stackGroups.flatMap((group, groupIndex) => group.items.map((item) => ({ item, tint: crateTints[groupIndex % crateTints.length] })));
  const crateBodies = crates.map(({ item, tint }, index) => {
    const mesh = buildCrate(kit, item, tint);
    const radius = 2.2 + Math.sqrt(index / crates.length) * 7.2;
    const angle = index * 2.399963229728653;
    const x = lagoon.x + Math.cos(angle) * radius;
    const z = lagoon.z + Math.sin(angle) * radius;
    mesh.position.set(x, 0, z);
    mesh.rotation.y = angle;
    scene.add(mesh);
    return { mesh, x, z, vx: 0, vz: 0, yaw: angle, spin: 0, homeX: x, homeZ: z };
  });
  // A loose cluster of rocks on the far side of the lagoon, facing away from the
  // start. Loose on purpose: a closed ring is a wall the autopilot cannot thread.
  const lagoonMouth = Math.atan2(START.z - lagoon.z, START.x - lagoon.x);
  const rockGeometry = kit.keep(new THREE.DodecahedronGeometry(1, 0));
  const rocks = new THREE.InstancedMesh(rockGeometry, kit.matte(palette.rock), 6);
  {
    const matrix = new THREE.Matrix4();
    let count = 0;
    for (let i = 0; i < 6; i++) {
      const angle = lagoonMouth + Math.PI + (i - 2.5) * 0.42;
      const x = lagoon.x + Math.cos(angle) * (14 + (i % 2) * 2.5);
      const z = lagoon.z + Math.sin(angle) * (14 + (i % 2) * 2.5);
      const size = 1.1 + ((i * 37) % 7) / 9;
      matrix.compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(i, i * 2, 0)), new THREE.Vector3(size * 1.3, size, size * 1.2));
      rocks.setMatrixAt(count++, matrix);
      colliders.push([x, z, size * 1.2]);
    }
    rocks.count = count;
  }
  rocks.castShadow = true;
  rocks.receiveShadow = true;
  scene.add(rocks);
  signAt("Stack", "THE LAGOON", lagoon.x + Math.cos(lagoonMouth) * 17 - Math.sin(lagoonMouth) * 6, lagoon.z + Math.sin(lagoonMouth) * 17 + Math.cos(lagoonMouth) * 6, "stack");

  // Commits: a year of GitHub days as stilts rising from the water.
  const signal = placeById.get("signal")!;
  const posts = buildCommitPosts(kit, options.days);
  posts.position.set(signal.x, 0, signal.z);
  scene.add(posts);
  const raft = buildRaft(kit, 3.6, 3);
  raft.position.set(signal.x - 9, 0, signal.z - 8.5);
  scene.add(raft);
  floaters.push({ object: raft, x: signal.x - 9, z: signal.z - 8.5, lift: 0.1, sway: 0.6 });
  colliders.push([signal.x - 9, signal.z - 8.5, 2]);
  const commitSign = pickable(buildSign(kit, "A year of commits", "GITHUB · ENZIZY"), "signal");
  commitSign.position.set(signal.x - 9, 0.25, signal.z - 8.7);
  scene.add(commitSign);
  floaters.push({ object: commitSign, x: signal.x - 9, z: signal.z - 8.7, lift: 0.25, sway: 0.6 });

  // Contact: the lighthouse.
  const contact = placeById.get("contact")!;
  const contactTop = islandAt(contact.x, contact.z, { radius: 6.5, height: 1, seed: 13 });
  const lighthouse = buildLighthouse(kit);
  lighthouse.group.position.set(contact.x, contactTop, contact.z - 0.5);
  scene.add(pickable(lighthouse.group, "contact"));
  const mailbox = new THREE.Group();
  const mailPost = new THREE.Mesh(kit.keep(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6)), kit.matte(palette.wood));
  mailPost.position.y = 0.6;
  const mailBox = new THREE.Mesh(kit.keep(new THREE.BoxGeometry(0.7, 0.5, 0.9)), kit.matte(palette.red));
  mailBox.position.y = 1.4;
  mailbox.add(mailPost, mailBox);
  mailbox.position.set(contact.x - 2.4, contactTop, contact.z + 2.2);
  scene.add(pickable(mailbox, "contact"));
  signAt("Contact", "THE LIGHTHOUSE", contact.x - 5.4, contact.z + 3, "contact", 0.45);
  addPalm(contact.x + 3.8, contactTop, contact.z + 2.6, 0.85, 1);

  // Detours: an outdoor cinema island and an arcade raft.
  const cinema = placeById.get("cinema")!;
  const cinemaTop = islandAt(cinema.x, cinema.z, { radius: 6, height: 0.7, seed: 17 });
  const screen = buildBoard(kit, {
    width: 6,
    height: 3.2,
    postHeight: 1,
    map: texture(labelTexture("Screen Room", { width: 768, height: 410, background: "#232a33", color: palette.cream, family: fonts.display, weight: 600, kicker: "NOW SHOWING", kickerFamily: fonts.mono })),
  });
  screen.position.set(cinema.x, cinemaTop, cinema.z - 1.5);
  scene.add(pickable(screen, "cinema"));
  addPalm(cinema.x - 4.2, cinemaTop, cinema.z + 1.5, 0.85, 2);
  addPalm(cinema.x + 4.4, cinemaTop, cinema.z - 0.5, 0.95, 5);

  const arcade = placeById.get("arcade")!;
  const arcadeRaft = new THREE.Group();
  arcadeRaft.add(buildRaft(kit, 5.4, 5.4));
  const cabinet = buildCabinet(
    kit,
    texture(labelTexture("Mini Arcade", { width: 384, height: 300, background: "#1f2630", color: palette.mustard, family: fonts.display, weight: 700, kicker: "INSERT COIN", kickerFamily: fonts.mono })),
  );
  cabinet.position.y = 0.15;
  arcadeRaft.add(cabinet);
  arcadeRaft.position.set(arcade.x, 0, arcade.z);
  scene.add(pickable(arcadeRaft, "arcade"));
  floaters.push({ object: arcadeRaft, x: arcade.x, z: arcade.z, lift: 0.12, sway: 0.5 });

  const palmParts = palmGeometries(kit);
  const trunks = new THREE.InstancedMesh(palmParts.trunk, kit.matte(palette.trunk), palms.length);
  const fronds = new THREE.InstancedMesh(palmParts.fronds, kit.matte(palette.frond), palms.length);
  palms.forEach((matrix, index) => {
    trunks.setMatrixAt(index, matrix);
    fronds.setMatrixAt(index, matrix);
  });
  for (const mesh of [trunks, fronds]) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  /* ---------------------------------------------------------------- boat */

  const boatModel = buildBoat(kit);
  scene.add(boatModel.group);
  const boat = { x: START.x, z: START.z, heading: START.heading, speed: 0, turn: 0, pitch: 0, roll: 0 };

  const marker = buildMarker(kit);
  marker.group.visible = false;
  scene.add(marker.group);
  let destination: { x: number; z: number } | null = null;
  /** A committed side-step around an obstacle; re-planning every frame makes boats dither. */
  let detour: { x: number; z: number } | null = null;

  // Wake: a pool of foam discs that spread and sink back into the sea colour.
  const WAKE = 180;
  const wakeGeometry = kit.keep(new THREE.CircleGeometry(0.5, 9));
  wakeGeometry.rotateX(-Math.PI / 2);
  const wake = new THREE.InstancedMesh(wakeGeometry, kit.keep(new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.6, depthWrite: false })), WAKE);
  wake.frustumCulled = false;
  const wakeParticles = Array.from({ length: WAKE }, () => ({ x: 0, z: 0, age: 1, life: 1, size: 1 }));
  const foamColor = new THREE.Color(palette.foam);
  const seaColor = new THREE.Color(palette.sea).lerp(new THREE.Color(palette.seabed), 0.25);
  let wakeCursor = 0;
  let wakeClock = 0;
  scene.add(wake);

  /* --------------------------------------------------------------- input */

  const keys = new Set<string>();
  let started = false;
  let zoomLevel = coarse ? 1.15 : 1;
  let zoomTarget = zoomLevel;

  const onKeyDown = (event: KeyboardEvent) => {
    if (!started || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    if (target instanceof Element && target.closest("input, textarea, select, [contenteditable='true']")) return;
    const key = event.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
      keys.add(key);
      destination = null;
      detour = null;
      event.preventDefault();
    }
  };
  const onKeyUp = (event: KeyboardEvent) => keys.delete(event.key.toLowerCase());
  const onBlur = () => keys.clear();

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const waterPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();
  const touches = new Map<number, { x: number; y: number }>();
  let press: { id: number; x: number; y: number; at: number } | null = null;
  let pinchDistance = 0;

  const pick = (clientX: number, clientY: number) => {
    const box = canvas.getBoundingClientRect();
    ndc.set(((clientX - box.left) / box.width) * 2 - 1, -((clientY - box.top) / box.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const found = raycaster.intersectObjects(pickables, true)[0];
    if (found) {
      let object: THREE.Object3D | null = found.object;
      while (object && !object.userData.place) object = object.parent;
      if (object?.userData.place) {
        sailTo(object.userData.place as string);
        return;
      }
    }
    if (raycaster.ray.intersectPlane(waterPlane, hit)) {
      const distance = Math.hypot(hit.x, hit.z);
      const scale = distance > SEA_RADIUS - 4 ? (SEA_RADIUS - 4) / distance : 1;
      destination = { x: hit.x * scale, z: hit.z * scale };
      detour = null;
    }
  };

  const onPointerDown = (event: PointerEvent) => {
    touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (touches.size === 1) press = { id: event.pointerId, x: event.clientX, y: event.clientY, at: performance.now() };
    if (touches.size === 2) {
      const [a, b] = [...touches.values()];
      pinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
      press = null;
    }
  };
  const onPointerMove = (event: PointerEvent) => {
    if (!touches.has(event.pointerId)) return;
    touches.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (touches.size === 2 && pinchDistance) {
      const [a, b] = [...touches.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      zoomTarget = clamp(zoomTarget * (pinchDistance / distance), 0.6, 1.7);
      pinchDistance = distance;
    }
  };
  const onPointerUp = (event: PointerEvent) => {
    touches.delete(event.pointerId);
    if (touches.size < 2) pinchDistance = 0;
    if (!press || press.id !== event.pointerId) return;
    const moved = Math.hypot(event.clientX - press.x, event.clientY - press.y);
    const quick = performance.now() - press.at < 650;
    press = null;
    if (moved < 10 && quick) {
      if (!started) return;
      pick(event.clientX, event.clientY);
    }
  };
  const onWheel = (event: WheelEvent) => {
    if (!started) return;
    event.preventDefault();
    zoomTarget = clamp(zoomTarget * Math.exp(event.deltaY * 0.0012), 0.6, 1.7);
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  function sailTo(id: string) {
    const place = placeById.get(id);
    if (!place) return;
    if (!started) start();
    keys.clear();
    destination = { x: place.dock[0], z: place.dock[1] };
    detour = null;
  }

  /* ------------------------------------------------------------ sailing */

  /** If an island sits between the boat and where it is going, aim past its side. */
  const steerAround = (tx: number, tz: number) => {
    const dx = tx - boat.x;
    const dz = tz - boat.z;
    const length = Math.hypot(dx, dz) || 1;
    const ux = dx / length;
    const uz = dz / length;
    let closest: { along: number; x: number; z: number; px: number; pz: number } | null = null;
    for (const [cx, cz, r] of colliders) {
      const along = (cx - boat.x) * ux + (cz - boat.z) * uz;
      if (along <= 0 || along >= length) continue;
      const side = (cx - boat.x) * -uz + (cz - boat.z) * ux;
      const clearance = r + BOAT_RADIUS + 1.2;
      if (Math.abs(side) >= clearance) continue;
      if (closest && along >= closest.along) continue;
      // Pass on whichever side is nearer, with room to spare.
      const direction = side > 0 ? -1 : 1;
      const px = -uz * direction;
      const pz = ux * direction;
      closest = { along, x: cx + px * clearance * 1.15, z: cz + pz * clearance * 1.15, px, pz };
    }
    if (!closest) return { x: tx, z: tz };
    // A row of obstacles (the commit stilts, a reef) would put that side-step inside
    // the next one along: keep sliding the waypoint sideways until it is clear.
    let { x, z } = closest;
    for (let step = 0; step < 14; step++) {
      const blocking = colliders.find(([cx, cz, r]) => Math.hypot(x - cx, z - cz) < r + BOAT_RADIUS + 0.6);
      if (!blocking) break;
      x += closest.px * (blocking[2] + BOAT_RADIUS + 1);
      z += closest.pz * (blocking[2] + BOAT_RADIUS + 1);
    }
    return { x, z };
  };

  const sailing = (dt: number) => {
    let throttle = 0;
    let steer = 0;
    const forward = keys.has("arrowup") || keys.has("w");
    const back = keys.has("arrowdown") || keys.has("s");
    const left = keys.has("arrowleft") || keys.has("a");
    const right = keys.has("arrowright") || keys.has("d");
    if (forward || back || left || right) {
      throttle = (forward ? 1 : 0) - (back ? 0.6 : 0);
      steer = (right ? 1 : 0) - (left ? 1 : 0);
    } else if (destination) {
      const distance = Math.hypot(destination.x - boat.x, destination.z - boat.z);
      if (distance < 2.2) {
        destination = null;
        detour = null;
      } else {
        if (detour && Math.hypot(detour.x - boat.x, detour.z - boat.z) < 3.5) detour = null;
        if (!detour) {
          const around = steerAround(destination.x, destination.z);
          if (around.x !== destination.x || around.z !== destination.z) detour = around;
        }
        const aim = detour ?? destination;
        const desired = Math.atan2(aim.x - boat.x, -(aim.z - boat.z));
        const error = wrapAngle(desired - boat.heading);
        steer = clamp(error * 2.4, -1, 1);
        // Ease off as the bow swings away from the target and as it gets close:
        // at full speed the turning circle is wider than the mooring, and a boat
        // that never slows just orbits its destination.
        // Never reverse: a boat backing toward its mooring looks broken. Keep a little
        // way on so the rudder bites, and coast through tight turns at speed.
        throttle = clamp(distance / 14, 0.35, 1) * clamp(Math.cos(error), 0.3, 1);
        if (Math.abs(error) > 1.1 && boat.speed > 5) throttle = 0;
      }
    }

    boat.speed += throttle * (throttle > 0 ? 7.2 : 9) * dt;
    boat.speed -= boat.speed * 0.56 * dt;
    boat.speed = clamp(boat.speed, -5, MAX_SPEED);
    const grip = clamp(Math.abs(boat.speed) / 4, 0.45, 1);
    const turnGoal = steer * 1.75 * grip * (boat.speed < -0.2 ? -1 : 1);
    boat.turn += (turnGoal - boat.turn) * (1 - Math.exp(-dt * 6));
    boat.heading = wrapAngle(boat.heading + boat.turn * dt);
    boat.x += Math.sin(boat.heading) * boat.speed * dt;
    boat.z += -Math.cos(boat.heading) * boat.speed * dt;

    // Islands, rocks and buoys: slide along them rather than stopping dead.
    for (const [cx, cz, r] of colliders) {
      const dx = boat.x - cx;
      const dz = boat.z - cz;
      const distance = Math.hypot(dx, dz);
      const minimum = r + BOAT_RADIUS;
      if (distance >= minimum || distance === 0) continue;
      const nx = dx / distance;
      const nz = dz / distance;
      boat.x = cx + nx * minimum;
      boat.z = cz + nz * minimum;
      const into = Math.sin(boat.heading) * nx + -Math.cos(boat.heading) * nz;
      // Lose speed in proportion to how head-on the hit is: a glancing scrape
      // slides along, a straight hit stops.
      if (into * boat.speed < 0) boat.speed *= Math.max(0, 1 - Math.abs(into) * 9 * dt);
    }
    const fromCentre = Math.hypot(boat.x, boat.z);
    if (fromCentre > SEA_RADIUS) {
      boat.x *= SEA_RADIUS / fromCentre;
      boat.z *= SEA_RADIUS / fromCentre;
      boat.speed *= 0.9;
    }
  };

  const floatCrates = (dt: number, t: number) => {
    const boatVX = Math.sin(boat.heading) * boat.speed;
    const boatVZ = -Math.cos(boat.heading) * boat.speed;
    for (const crate of crateBodies) {
      const dx = crate.x - boat.x;
      const dz = crate.z - boat.z;
      const distance = Math.hypot(dx, dz);
      const minimum = BOAT_RADIUS + 1.05;
      if (distance < minimum && distance > 0) {
        const nx = dx / distance;
        const nz = dz / distance;
        crate.x = boat.x + nx * minimum;
        crate.z = boat.z + nz * minimum;
        const shove = Math.max(1.5, Math.abs(boat.speed) * 0.85);
        crate.vx += nx * shove + boatVX * 0.25;
        crate.vz += nz * shove + boatVZ * 0.25;
        crate.spin += (nx * boatVZ - nz * boatVX) * 0.12;
        boat.speed *= 0.985;
      }
    }
    for (let i = 0; i < crateBodies.length; i++) {
      const a = crateBodies[i];
      for (let j = i + 1; j < crateBodies.length; j++) {
        const b = crateBodies[j];
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const distance = Math.hypot(dx, dz);
        if (distance >= 1.7 || distance === 0) continue;
        const push = (1.7 - distance) / 2;
        const nx = dx / distance;
        const nz = dz / distance;
        a.x -= nx * push;
        a.z -= nz * push;
        b.x += nx * push;
        b.z += nz * push;
        const relative = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
        if (relative < 0) {
          a.vx += nx * relative * 0.5;
          a.vz += nz * relative * 0.5;
          b.vx -= nx * relative * 0.5;
          b.vz -= nz * relative * 0.5;
        }
      }
    }
    const drag = Math.exp(-dt * 1.1);
    for (const crate of crateBodies) {
      // A slow tether home, so the lagoon tidies itself up after you leave.
      crate.vx = (crate.vx + (crate.homeX - crate.x) * 0.06 * dt) * drag;
      crate.vz = (crate.vz + (crate.homeZ - crate.z) * 0.06 * dt) * drag;
      crate.x += crate.vx * dt;
      crate.z += crate.vz * dt;
      crate.spin *= Math.exp(-dt * 1.4);
      crate.yaw += crate.spin * dt;
      const height = waveHeight(crate.x, crate.z, t);
      crate.mesh.position.set(crate.x, height + 0.05, crate.z);
      crate.mesh.rotation.set(
        (waveHeight(crate.x, crate.z + 0.7, t) - waveHeight(crate.x, crate.z - 0.7, t)) * 0.5,
        crate.yaw,
        (waveHeight(crate.x - 0.7, crate.z, t) - waveHeight(crate.x + 0.7, crate.z, t)) * 0.5,
      );
    }
  };

  const spawnWake = (x: number, z: number, size: number) => {
    const particle = wakeParticles[wakeCursor];
    wakeCursor = (wakeCursor + 1) % WAKE;
    particle.x = x;
    particle.z = z;
    particle.age = 0;
    particle.life = 0.9 + Math.random() * 0.5;
    particle.size = size;
  };

  const matrix = new THREE.Matrix4();
  const scaleVector = new THREE.Vector3();
  const positionVector = new THREE.Vector3();
  const identity = new THREE.Quaternion();
  const mixedColor = new THREE.Color();
  const updateWake = (dt: number, t: number) => {
    const speed = Math.abs(boat.speed);
    wakeClock += dt;
    if (speed > 1.4 && wakeClock > 0.06) {
      wakeClock = 0;
      const sin = Math.sin(boat.heading);
      const cos = -Math.cos(boat.heading);
      const back = boat.speed > 0 ? -1 : 1;
      const size = 0.38 + (speed / MAX_SPEED) * 0.32;
      // Off the stern, and off the tail of each outrigger float.
      for (const lateral of [-0.55, 0.55, -2.15, 2.15]) {
        const lx = cos * -lateral;
        const lz = sin * lateral;
        spawnWake(boat.x + sin * 2.2 * back + lx, boat.z + cos * 2.2 * back + lz, Math.abs(lateral) > 1 ? size * 0.6 : size);
      }
    }
    wakeParticles.forEach((particle, index) => {
      particle.age += dt;
      const life = particle.age / particle.life;
      if (life >= 1) {
        matrix.makeScale(0, 0, 0);
        wake.setMatrixAt(index, matrix);
        return;
      }
      const grow = particle.size * (0.7 + life * 1.3);
      positionVector.set(particle.x, waveHeight(particle.x, particle.z, t) + 0.07, particle.z);
      scaleVector.set(grow, 1, grow);
      matrix.compose(positionVector, identity, scaleVector);
      wake.setMatrixAt(index, matrix);
      wake.setColorAt(index, mixedColor.copy(foamColor).lerp(seaColor, Math.sqrt(life)));
    });
    wake.instanceMatrix.needsUpdate = true;
    if (wake.instanceColor) wake.instanceColor.needsUpdate = true;
  };

  /* -------------------------------------------------------------- frame */

  let zone: string | null = null;
  const updateZone = () => {
    let next: string | null = null;
    let best = Infinity;
    for (const place of places) {
      const distance = Math.hypot(boat.x - place.dock[0], boat.z - place.dock[1]);
      if (distance < place.reach && distance < best) {
        best = distance;
        next = place.id;
      }
    }
    if (next !== zone) {
      zone = next;
      options.onZone?.(zone);
    }
  };

  const lookTarget = new THREE.Vector3();
  const cameraGoal = new THREE.Vector3();
  const cameraLook = new THREE.Vector3(home.x, 0, home.z + 6);
  let attractAngle = 0;
  /** Fly-around distance: far enough that the whole name fits, even in portrait. */
  let attractRadius = 30;
  let portrait = false;
  // Start where the fly-around begins, not at the origin under the sea.
  camera.position.set(home.x, 24, home.z + 36);
  camera.lookAt(cameraLook);

  const resize = () => {
    const parent = canvas.parentElement;
    const width = parent?.clientWidth || window.innerWidth;
    const height = parent?.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / Math.max(1, height);
    // Narrow screens pull the camera back so the islands still fit.
    portrait = camera.aspect < 0.8;
    camera.fov = portrait ? 50 : 38;
    attractRadius = Math.max(30, 15 / (Math.tan((camera.fov * Math.PI) / 360) * camera.aspect));
    camera.updateProjectionMatrix();
  };
  resize();
  const resizeObserver = new ResizeObserver(resize);
  if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);

  let raf = 0;
  let paused = false;
  let last = performance.now();
  let clock = 0;
  let boatClock = 0;
  let slowFrames = 0;
  let frames = 0;

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    const dt = clamp((now - last) / 1000, 0, 0.05);
    last = now;
    clock += reduced ? dt * 0.4 : dt;
    const t = clock;
    time.value = t;

    if (started) sailing(dt);
    updateZone();

    // The boat rides the swell: height from the waves under it, pitch and roll from
    // the slope between bow and stern, port and starboard, plus a lean into turns.
    const sin = Math.sin(boat.heading);
    const cos = -Math.cos(boat.heading);
    const bow = waveHeight(boat.x + sin * 2, boat.z + cos * 2, t);
    const stern = waveHeight(boat.x - sin * 2, boat.z - cos * 2, t);
    const port = waveHeight(boat.x - cos * 1.6, boat.z + sin * 1.6, t);
    const starboard = waveHeight(boat.x + cos * 1.6, boat.z - sin * 1.6, t);
    boat.pitch += (Math.atan2(bow - stern, 4) - boat.pitch) * (1 - Math.exp(-dt * 5));
    boat.roll += (Math.atan2(port - starboard, 3.2) - boat.turn * boat.speed * 0.012 - boat.roll) * (1 - Math.exp(-dt * 5));
    boatModel.group.position.set(boat.x, (bow + stern + port + starboard) / 4 - 0.05, boat.z);
    boatModel.group.rotation.set(boat.pitch, -boat.heading, boat.roll, "YXZ");
    boatModel.sail.scale.x = 1 + Math.sin(t * 2.2) * 0.04;

    floatCrates(dt, t);
    updateWake(dt, t);

    for (const floater of floaters) {
      floater.object.position.y = waveHeight(floater.x, floater.z, t) * floater.sway + floater.lift;
      floater.object.rotation.z = Math.sin(t * 1.1 + floater.x) * 0.06 * floater.sway;
    }

    // Sail close to a letter of the name and it hops.
    for (const state of letterState) {
      const world = state.letter.position.x + name.group.position.x;
      const near = Math.abs(world - boat.x) < 2.4 && Math.abs(name.group.position.z - boat.z) < 7.5;
      state.cooldown -= dt;
      if (near && state.cooldown <= 0 && Math.abs(boat.speed) > 1) {
        state.velocity = 5.5;
        state.cooldown = 1.1;
      }
      state.velocity -= 18 * dt;
      state.lift = Math.max(0, state.lift + state.velocity * dt);
      if (state.lift === 0 && state.velocity < 0) state.velocity = 0;
      state.letter.position.y = state.lift;
      state.letter.rotation.z = state.lift * 0.05;
    }

    if (!reduced) lighthouse.beam.rotation.y = t * 0.6;
    if (destination) {
      marker.group.visible = true;
      marker.group.position.set(destination.x, waveHeight(destination.x, destination.z, t) + 0.05, destination.z);
      const pulse = 1 + Math.sin(t * 4) * 0.12;
      marker.ring.scale.set(pulse, pulse, pulse);
    } else {
      marker.group.visible = false;
    }

    // Camera: a slow circle over the name before you start, then a follow cam that
    // always looks north and leads the boat a little in the direction it is going.
    zoomLevel += (zoomTarget - zoomLevel) * (1 - Math.exp(-dt * 6));
    if (!started) {
      attractAngle += reduced ? 0 : dt * 0.07;
      // In portrait the intro card covers the lower half: aim lower so the name rides high.
      lookTarget.set(home.x, 0, home.z + 6 + (portrait ? attractRadius * 0.32 : 0));
      cameraGoal.set(lookTarget.x + Math.sin(attractAngle) * attractRadius, attractRadius * 0.8, lookTarget.z + Math.cos(attractAngle) * attractRadius);
    } else {
      lookTarget.set(boat.x + sin * boat.speed * 0.35, 0, boat.z + cos * boat.speed * 0.35);
      cameraGoal.copy(lookTarget).addScaledVector(CAMERA_OFFSET, zoomLevel);
    }
    const follow = reduced ? 1 : 1 - Math.exp(-dt * (started ? 3 : 1.5));
    camera.position.lerp(cameraGoal, follow);
    cameraLook.lerp(lookTarget, follow);
    camera.lookAt(cameraLook);

    // Shadows and the sea travel with the view.
    sun.position.set(cameraLook.x - 16, 40, cameraLook.z + 28);
    sun.target.position.copy(cameraLook);
    sea.position.set(Math.round(cameraLook.x / SEA_STEP) * SEA_STEP, 0, Math.round(cameraLook.z / SEA_STEP) * SEA_STEP);
    seabed.position.x = sea.position.x;
    seabed.position.z = sea.position.z;

    renderer.render(scene, camera);

    boatClock += dt;
    if (boatClock > 0.1) {
      boatClock = 0;
      options.onBoat?.(boat.x, boat.z, boat.heading);
    }

    // Adaptive resolution: a weak GPU sheds pixels instead of frames.
    frames++;
    if (dt > 1 / 38) slowFrames++;
    if (frames % 150 === 0) {
      if (slowFrames > 70 && dpr > 1) {
        dpr = Math.max(1, dpr - 0.25);
        renderer.setPixelRatio(dpr);
        resize();
      }
      slowFrames = 0;
    }
  };

  function start() {
    started = true;
  }

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

  const ready = new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, 8000);
    const finish = () => {
      window.clearTimeout(timeout);
      options.onProgress?.(1);
      resolve();
    };
    manager.onLoad = finish;
    // Nothing queued (all textures cached or none needed): ready on the next tick.
    window.setTimeout(() => { if (!pending) finish(); }, 0);
  });

  return {
    ready,
    start,
    sailTo,
    zoom: (factor) => { zoomTarget = clamp(zoomTarget * factor, 0.6, 1.7); },
    setPaused: (value) => {
      paused = value;
      if (paused) halt();
      else run();
    },
    dispose: () => {
      halt();
      document.removeEventListener("visibilitychange", onVisibility);
      resizeObserver.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("wheel", onWheel);
      rocks.dispose();
      trunks.dispose();
      fronds.dispose();
      wake.dispose();
      posts.dispose();
      kit.dispose();
      renderer.dispose();
    },
  };
}
