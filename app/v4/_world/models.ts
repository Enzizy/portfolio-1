import * as THREE from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { Font, type FontData } from "three/examples/jsm/loaders/FontLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import archivoBlack from "./fonts/archivo-black.typeface.json";
import { labelTexture, type Fonts } from "./textures";

// Everything in the archipelago is modelled here from primitives — no downloaded
// meshes — so the world stays small, consistent and on-palette. Low-poly and
// flat-shaded on purpose: it reads like a hand-made diorama, not a render.

export const palette = {
  sea: "#3b7b80",
  seabed: "#1e4a52",
  shelf: "#cdb98c",
  sand: "#e4cf9f",
  grass: "#6f9358",
  grassDeep: "#5a7c49",
  trunk: "#8f6a46",
  frond: "#4c7a44",
  rock: "#8b877c",
  wood: "#8a5d3b",
  plank: "#b48858",
  bamboo: "#cdb07a",
  thatch: "#b3864a",
  cream: "#f4ecdf",
  ink: "#26303a",
  terracotta: "#c4613a",
  mustard: "#d9a23c",
  blue: "#35587a",
  red: "#b5453a",
  sage: "#88a07f",
  foam: "#f3eee2",
  letters: "#f4ecde",
} as const;

/** Per-world cache and disposal list for materials, geometries and textures. */
export class Kit {
  private materials = new Map<string, THREE.MeshStandardMaterial>();
  private disposables: { dispose(): void }[] = [];

  constructor(public fonts: Fonts) {}

  matte(color: string) {
    let material = this.materials.get(color);
    if (!material) {
      material = new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, flatShading: true });
      this.materials.set(color, material);
    }
    return material;
  }

  keep<T extends { dispose(): void }>(item: T) {
    this.disposables.push(item);
    return item;
  }

  dispose() {
    this.materials.forEach((material) => material.dispose());
    this.disposables.forEach((item) => item.dispose());
    this.materials.clear();
    this.disposables = [];
  }
}

function hash(x: number, y: number, z: number, seed: number) {
  let h = Math.imul(Math.round(x * 53) | 0, 374761393) ^ Math.imul(Math.round(y * 53) | 0, 668265263);
  h ^= Math.imul(Math.round(z * 53) | 0, 2246822519) ^ Math.imul(seed | 0, 3266489917);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Nudges every vertex by a noise keyed on its own position, so duplicated seam
 * vertices move together and the mesh never cracks open.
 */
function roughen(geometry: THREE.BufferGeometry, amount: number, seed: number, vertical = 0.35) {
  const position = geometry.getAttribute("position");
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    position.setXYZ(
      i,
      x + (hash(x, y, z, seed) - 0.5) * amount,
      y + (hash(x, y, z, seed + 7) - 0.5) * amount * vertical,
      z + (hash(x, y, z, seed + 13) - 0.5) * amount,
    );
  }
  geometry.computeVertexNormals();
  return geometry;
}

function shadowed<T extends THREE.Object3D>(object: T, cast = true, receive = true) {
  object.traverse((child) => {
    child.castShadow = cast;
    child.receiveShadow = receive;
  });
  return object;
}

/* ----------------------------------------------------------------- terrain */

export type Island = { group: THREE.Group; top: number };

/** A low-poly island: a pale shelf under the water, a beach, a grassy crown, foam. */
export function buildIsland(kit: Kit, options: { radius: number; height?: number; seed?: number; grass?: boolean; stretch?: number }): Island {
  const { radius, height = 1.3, seed = 1, grass = true, stretch = 1 } = options;
  const group = new THREE.Group();

  const shelf = new THREE.Mesh(kit.keep(new THREE.CylinderGeometry(radius * 1.55, radius * 1.85, 0.5, 22)), kit.matte(palette.shelf));
  shelf.position.y = -1.25;
  shelf.receiveShadow = true;

  const beach = new THREE.Mesh(
    kit.keep(roughen(new THREE.CylinderGeometry(radius, radius * 1.18, 1.9, 15, 2), radius * 0.12, seed)),
    kit.matte(palette.sand),
  );
  beach.position.y = -0.5;
  group.add(shelf, shadowed(beach));

  let top = 0.45;
  if (grass) {
    const crown = new THREE.Mesh(
      kit.keep(roughen(new THREE.CylinderGeometry(radius * 0.68, radius * 0.84, height, 12, 2), radius * 0.1, seed + 3)),
      kit.matte(palette.grass),
    );
    crown.position.y = 0.4 + height / 2;
    group.add(shadowed(crown));
    top = 0.4 + height;
  }

  const foam = new THREE.Mesh(
    kit.keep(new THREE.RingGeometry(radius * 1.04, radius * 1.24, 30)),
    kit.keep(new THREE.MeshBasicMaterial({ color: palette.foam, transparent: true, opacity: 0.5, depthWrite: false })),
  );
  foam.rotation.x = -Math.PI / 2;
  foam.position.y = 0.1;
  group.add(foam);

  group.scale.set(stretch, 1, 1);
  return { group, top };
}

/* ------------------------------------------------------------------- palms */

export function palmGeometries(kit: Kit) {
  const trunkParts: THREE.BufferGeometry[] = [];
  let x = 0;
  for (let i = 0; i < 6; i++) {
    const segment = new THREE.CylinderGeometry(0.15, 0.2, 0.95, 6);
    segment.rotateZ(-0.05 - i * 0.045);
    segment.translate(x, 0.45 + i * 0.85, 0);
    x += 0.08 + i * 0.05;
    trunkParts.push(segment);
  }
  const crownX = x;
  const crownY = 0.45 + 6 * 0.85 - 0.2;
  for (let i = 0; i < 3; i++) {
    const nut = new THREE.SphereGeometry(0.2, 6, 4);
    nut.translate(crownX + Math.cos(i * 2.1) * 0.24, crownY - 0.2, Math.sin(i * 2.1) * 0.24);
    trunkParts.push(nut);
  }
  const trunk = kit.keep(mergeGeometries(trunkParts)!);
  trunkParts.forEach((part) => part.dispose());

  const leaves: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.ConeGeometry(0.55, 3.1, 4);
    leaf.scale(0.2, 1, 1);
    leaf.translate(0, 1.55, 0);
    leaf.rotateZ(-1.55 - (i % 2) * 0.35);
    leaf.rotateY((i / 7) * Math.PI * 2 + 0.3);
    leaf.translate(crownX, crownY, 0);
    leaves.push(leaf);
  }
  const fronds = kit.keep(mergeGeometries(leaves)!);
  leaves.forEach((part) => part.dispose());
  return { trunk, fronds };
}

/* ------------------------------------------------------------------- props */

/** The bahay kubo: a nipa hut on stilts, the "home" of the about island. */
export function buildHut(kit: Kit) {
  const group = new THREE.Group();
  const stilt = kit.keep(new THREE.CylinderGeometry(0.12, 0.14, 1.5, 6));
  for (const [x, z] of [[-1.4, -1.2], [1.4, -1.2], [-1.4, 1.2], [1.4, 1.2]]) {
    const post = new THREE.Mesh(stilt, kit.matte(palette.wood));
    post.position.set(x, 0.75, z);
    group.add(post);
  }
  const floor = new THREE.Mesh(kit.keep(new THREE.BoxGeometry(3.6, 0.22, 3.1)), kit.matte(palette.plank));
  floor.position.y = 1.55;
  const walls = new THREE.Mesh(kit.keep(new THREE.BoxGeometry(3.1, 1.6, 2.6)), kit.matte(palette.bamboo));
  walls.position.y = 2.45;
  const door = new THREE.Mesh(kit.keep(new THREE.BoxGeometry(0.8, 1.15, 0.06)), kit.matte(palette.wood));
  door.position.set(-0.6, 2.25, 1.31);
  const window1 = new THREE.Mesh(kit.keep(new THREE.BoxGeometry(0.75, 0.55, 0.06)), kit.matte(palette.ink));
  window1.position.set(0.75, 2.6, 1.31);
  const roof = new THREE.Mesh(kit.keep(new THREE.ConeGeometry(2.75, 2.3, 4)), kit.matte(palette.thatch));
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.12, 1, 1);
  roof.position.y = 4.35;
  const ridge = new THREE.Mesh(kit.keep(new THREE.ConeGeometry(0.35, 0.5, 4)), kit.matte(palette.wood));
  ridge.position.y = 5.6;
  // A ladder to the door, because every bahay kubo has one.
  const rail = kit.keep(new THREE.BoxGeometry(0.08, 1.8, 0.08));
  const rung = kit.keep(new THREE.BoxGeometry(0.7, 0.07, 0.07));
  const ladder = new THREE.Group();
  for (const x of [-0.32, 0.32]) {
    const side = new THREE.Mesh(rail, kit.matte(palette.wood));
    side.position.x = x;
    ladder.add(side);
  }
  for (let i = 0; i < 4; i++) {
    const step = new THREE.Mesh(rung, kit.matte(palette.wood));
    step.position.y = -0.6 + i * 0.42;
    ladder.add(step);
  }
  ladder.position.set(-0.6, 0.85, 1.95);
  ladder.rotation.x = -0.45;
  group.add(floor, walls, door, window1, roof, ridge, ladder);
  return shadowed(group);
}

/** A framed board on two posts, facing the camera (south). */
export function buildBoard(kit: Kit, options: { width: number; height: number; map: THREE.Texture; postHeight?: number; frame?: string }) {
  const { width, height, map, postHeight = 1.4, frame = palette.ink } = options;
  const group = new THREE.Group();
  const post = kit.keep(new THREE.CylinderGeometry(0.12, 0.14, postHeight + height, 6));
  for (const x of [-width * 0.42, width * 0.42]) {
    const leg = new THREE.Mesh(post, kit.matte(palette.wood));
    leg.position.set(x, (postHeight + height) / 2, -0.12);
    group.add(leg);
  }
  const back = new THREE.Mesh(kit.keep(new THREE.BoxGeometry(width + 0.3, height + 0.3, 0.16)), kit.matte(frame));
  back.position.y = postHeight + height / 2;
  const face = new THREE.Mesh(kit.keep(new THREE.PlaneGeometry(width, height)), kit.keep(new THREE.MeshBasicMaterial({ map })));
  face.position.set(0, postHeight + height / 2, 0.085);
  group.add(back, face);
  return shadowed(group, true, false);
}

/** A wooden signpost with a hand-lettered plank. */
export function buildSign(kit: Kit, text: string, kicker?: string) {
  const map = kit.keep(
    labelTexture(text, {
      width: 512,
      height: 224,
      background: "#c49a68",
      color: palette.ink,
      family: kit.fonts.display,
      weight: 600,
      kicker,
      kickerFamily: kit.fonts.mono,
      planks: 3,
    }),
  );
  return buildBoard(kit, { width: 3.2, height: 1.4, map, postHeight: 0.9, frame: palette.wood });
}

/** Lighthouse for the contact island, with a slow, soft sweeping beam. */
export function buildLighthouse(kit: Kit) {
  const group = new THREE.Group();
  const bands = [palette.cream, palette.terracotta, palette.cream, palette.terracotta, palette.cream];
  bands.forEach((color, index) => {
    const bottom = 1.55 - index * 0.13;
    const band = new THREE.Mesh(kit.keep(new THREE.CylinderGeometry(bottom - 0.13, bottom, 1.6, 12)), kit.matte(color));
    band.position.y = 0.8 + index * 1.6;
    group.add(band);
  });
  const gallery = new THREE.Mesh(kit.keep(new THREE.CylinderGeometry(1.35, 1.35, 0.18, 12)), kit.matte(palette.ink));
  gallery.position.y = 8.1;
  const lantern = new THREE.Mesh(
    kit.keep(new THREE.CylinderGeometry(0.75, 0.75, 1.1, 10)),
    kit.keep(new THREE.MeshStandardMaterial({ color: "#f3e3b5", emissive: "#f0cf86", emissiveIntensity: 0.7, roughness: 0.4 })),
  );
  lantern.position.y = 8.75;
  const cap = new THREE.Mesh(kit.keep(new THREE.ConeGeometry(1.05, 1.1, 10)), kit.matte(palette.terracotta));
  cap.position.y = 9.85;
  group.add(gallery, lantern, cap);
  shadowed(group);

  const beamGeometry = kit.keep(new THREE.ConeGeometry(3.2, 26, 20, 1, true));
  beamGeometry.translate(0, -13, 0);
  beamGeometry.rotateZ(Math.PI / 2);
  const beamMaterial = kit.keep(
    new THREE.MeshBasicMaterial({ color: "#fff1cf", transparent: true, opacity: 0.11, depthWrite: false, side: THREE.DoubleSide }),
  );
  const beam = new THREE.Group();
  const ray = new THREE.Mesh(beamGeometry, beamMaterial);
  const back = new THREE.Mesh(beamGeometry, beamMaterial);
  back.rotation.y = Math.PI;
  beam.add(ray, back);
  beam.position.y = 8.75;
  group.add(beam);
  return { group, beam };
}

/** One market stall (palengke) per service: posts, counter, striped awning, banner. */
export function buildStall(kit: Kit, color: string, label: string) {
  const group = new THREE.Group();
  const post = kit.keep(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 6));
  for (const [x, z] of [[-1.2, -0.9], [1.2, -0.9], [-1.2, 0.9], [1.2, 0.9]]) {
    const leg = new THREE.Mesh(post, kit.matte(palette.wood));
    leg.position.set(x, 1.2, z);
    group.add(leg);
  }
  const counter = new THREE.Mesh(kit.keep(new THREE.BoxGeometry(2.6, 0.9, 0.7)), kit.matte(palette.plank));
  counter.position.set(0, 0.45, 0.7);
  const awning = new THREE.Mesh(kit.keep(new THREE.BoxGeometry(2.9, 0.1, 2.4)), kit.matte(color));
  awning.position.set(0, 2.45, 0.1);
  awning.rotation.x = 0.22;
  const valance = new THREE.Mesh(kit.keep(new THREE.BoxGeometry(2.9, 0.32, 0.06)), kit.matte(palette.cream));
  valance.position.set(0, 2.08, 1.3);
  const map = kit.keep(
    labelTexture(label, { width: 512, height: 160, background: palette.cream, color: palette.ink, family: kit.fonts.display, weight: 600 }),
  );
  const banner = new THREE.Mesh(kit.keep(new THREE.PlaneGeometry(2.6, 0.82)), kit.keep(new THREE.MeshBasicMaterial({ map })));
  banner.position.set(0, 3.05, 0.9);
  banner.rotation.x = -0.12;
  group.add(counter, awning, valance, banner);
  return shadowed(group, true, true);
}

/** A floating tool crate with its name stencilled on every side. */
export function buildCrate(kit: Kit, label: string, tint: string) {
  const map = kit.keep(
    labelTexture(label, { width: 256, height: 256, background: tint, color: palette.ink, family: kit.fonts.mono, weight: 500, border: "rgba(38,48,58,.55)" }),
  );
  const material = kit.keep(new THREE.MeshStandardMaterial({ map, roughness: 0.95, flatShading: true }));
  const mesh = new THREE.Mesh(kit.keep(new THREE.BoxGeometry(1.5, 1.5, 1.5)), material);
  return shadowed(mesh);
}

/** The bangka: a slim canoe hull with bamboo outriggers (katig) and a small sail. */
export function buildBoat(kit: Kit) {
  const group = new THREE.Group();

  // Lower half of a stretched sphere makes a clean canoe hull.
  const hullGeometry = kit.keep(new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2));
  hullGeometry.scale(0.62, 0.62, 2.5);
  const hull = new THREE.Mesh(hullGeometry, kit.matte(palette.cream));
  hull.position.y = 0.45;
  const stripe = new THREE.Mesh(kit.keep(new THREE.CylinderGeometry(0.64, 0.64, 0.12, 14, 1, true)), kit.matte(palette.blue));
  stripe.scale.set(1, 1, 3.9);
  stripe.position.y = 0.38;
  const deck = new THREE.Mesh(kit.keep(new THREE.CylinderGeometry(0.6, 0.6, 0.06, 14)), kit.matte(palette.plank));
  deck.scale.set(1, 1, 3.9);
  deck.position.y = 0.46;
  const bow = new THREE.Mesh(kit.keep(new THREE.ConeGeometry(0.16, 0.9, 6)), kit.matte(palette.red));
  bow.rotation.x = -1.2;
  bow.position.set(0, 0.62, -2.5);

  // Outrigger floats and the cross-beams that hold them.
  const floatGeometry = kit.keep(new THREE.CylinderGeometry(0.13, 0.13, 4.4, 6));
  floatGeometry.rotateX(Math.PI / 2);
  for (const x of [-2.15, 2.15]) {
    const float = new THREE.Mesh(floatGeometry, kit.matte(palette.bamboo));
    float.position.set(x, 0.22, 0);
    group.add(float);
  }
  const beamGeometry = kit.keep(new THREE.CylinderGeometry(0.06, 0.06, 4.5, 5));
  beamGeometry.rotateZ(Math.PI / 2);
  for (const z of [-1.1, 1.0]) {
    const beam = new THREE.Mesh(beamGeometry, kit.matte(palette.bamboo));
    beam.position.set(0, 0.74, z);
    group.add(beam);
  }

  // Mast and a triangular sail in cream with a terracotta band.
  const mast = new THREE.Mesh(kit.keep(new THREE.CylinderGeometry(0.05, 0.06, 3.2, 5)), kit.matte(palette.wood));
  mast.position.set(0, 2.05, -0.3);
  const sailShape = new THREE.Shape();
  sailShape.moveTo(0, 0);
  sailShape.lineTo(0, 2.6);
  sailShape.lineTo(1.7, 0.15);
  sailShape.closePath();
  const sailGeometry = kit.keep(new THREE.ShapeGeometry(sailShape));
  sailGeometry.rotateY(-Math.PI / 2);
  const sail = new THREE.Mesh(sailGeometry, kit.keep(new THREE.MeshStandardMaterial({ color: palette.cream, roughness: 0.9, side: THREE.DoubleSide })));
  sail.position.set(0.02, 0.75, -0.25);
  // A terracotta pennant at the masthead, streaming aft.
  const pennantShape = new THREE.Shape();
  pennantShape.moveTo(0, 0);
  pennantShape.lineTo(0.8, -0.16);
  pennantShape.lineTo(0, -0.34);
  pennantShape.closePath();
  const pennantGeometry = kit.keep(new THREE.ShapeGeometry(pennantShape));
  pennantGeometry.rotateY(-Math.PI / 2);
  const pennant = new THREE.Mesh(
    pennantGeometry,
    kit.keep(new THREE.MeshStandardMaterial({ color: palette.terracotta, roughness: 0.9, side: THREE.DoubleSide })),
  );
  pennant.position.set(0, 3.62, -0.3);

  group.add(hull, stripe, deck, bow, mast, sail, pennant);
  shadowed(group, true, false);
  return { group, sail };
}

/** A year of GitHub commits as stilts rising out of the water: one post per day. */
export function buildCommitPosts(kit: Kit, days: { week: number; weekday: number; level: number }[]) {
  const colors = ["#6b5d4f", "#8f6a46", "#b8834a", "#d9a23c", "#e8c26a"].map((hex) => new THREE.Color(hex));
  const geometry = kit.keep(new THREE.BoxGeometry(0.62, 1, 0.62));
  geometry.translate(0, 0.5, 0);
  const mesh = new THREE.InstancedMesh(geometry, kit.matte("#ffffff"), Math.max(1, days.length));
  const weeks = Math.max(1, ...days.map((day) => day.week));
  const matrix = new THREE.Matrix4();
  days.forEach((day, index) => {
    const height = 0.9 + day.level * 1.15;
    matrix.compose(
      new THREE.Vector3((day.week - (weeks + 1) / 2) * 0.9, -1.2, (day.weekday - 4) * 0.9),
      new THREE.Quaternion(),
      new THREE.Vector3(1, height + 1.2, 1),
    );
    mesh.setMatrixAt(index, matrix);
    mesh.setColorAt(index, colors[day.level] ?? colors[0]);
  });
  mesh.count = days.length;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Extruded letters for the name on the sandbar. Each one can hop on its own. */
export function buildLetters(kit: Kit, text: string, size: number) {
  const font = new Font(archivoBlack as unknown as FontData);
  const material = kit.matte(palette.letters);
  const group = new THREE.Group();
  const letters: THREE.Mesh[] = [];
  const scale = size / 1000;
  const advances = [...text].map((char) => {
    const glyph = (archivoBlack as { glyphs: Record<string, { ha: number }> }).glyphs[char];
    return (glyph?.ha ?? 600) * scale * 1.04;
  });
  const total = advances.reduce((sum, advance) => sum + advance, 0);
  let cursor = -total / 2;
  [...text].forEach((char, index) => {
    if (char !== " ") {
      const geometry = kit.keep(
        new TextGeometry(char, { font, size, depth: size * 0.3, curveSegments: 5, bevelEnabled: true, bevelThickness: size * 0.03, bevelSize: size * 0.02, bevelSegments: 2 }),
      );
      geometry.computeBoundingBox();
      const box = geometry.boundingBox!;
      geometry.translate(-(box.min.x + box.max.x) / 2, 0, -(box.min.z + box.max.z) / 2);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = cursor + advances[index] / 2;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
      letters.push(mesh);
    }
    cursor += advances[index];
  });
  return { group, letters };
}

/** A floating buoy: the "you can stop here" marker beside each dock. */
export function buildBuoy(kit: Kit) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(kit.keep(new THREE.CylinderGeometry(0.45, 0.55, 0.9, 10)), kit.matte(palette.terracotta));
  body.position.y = 0.2;
  const band = new THREE.Mesh(kit.keep(new THREE.CylinderGeometry(0.47, 0.47, 0.22, 10)), kit.matte(palette.cream));
  band.position.y = 0.42;
  const top = new THREE.Mesh(kit.keep(new THREE.ConeGeometry(0.32, 0.7, 8)), kit.matte(palette.terracotta));
  top.position.y = 1;
  group.add(body, band, top);
  return shadowed(group, true, false);
}

/** Where a tap on the water sends the boat: a small ring and pennant. */
export function buildMarker(kit: Kit) {
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    kit.keep(new THREE.RingGeometry(0.9, 1.15, 28)),
    kit.keep(new THREE.MeshBasicMaterial({ color: palette.cream, transparent: true, opacity: 0.85, depthWrite: false })),
  );
  ring.rotation.x = -Math.PI / 2;
  const pole = new THREE.Mesh(kit.keep(new THREE.CylinderGeometry(0.04, 0.04, 1.6, 5)), kit.matte(palette.ink));
  pole.position.y = 0.8;
  const flagShape = new THREE.Shape();
  flagShape.moveTo(0, 0);
  flagShape.lineTo(0.75, -0.22);
  flagShape.lineTo(0, -0.44);
  flagShape.closePath();
  const flag = new THREE.Mesh(
    kit.keep(new THREE.ShapeGeometry(flagShape)),
    kit.keep(new THREE.MeshStandardMaterial({ color: palette.terracotta, side: THREE.DoubleSide, roughness: 0.9 })),
  );
  flag.position.y = 1.6;
  group.add(ring, pole, flag);
  return { group, ring };
}

/** A raft: lashed planks that float on their own. */
export function buildRaft(kit: Kit, width: number, depth: number) {
  const group = new THREE.Group();
  const plank = kit.keep(new THREE.BoxGeometry(width, 0.3, 0.55));
  const count = Math.round(depth / 0.6);
  for (let i = 0; i < count; i++) {
    const log = new THREE.Mesh(plank, kit.matte(i % 2 ? palette.plank : palette.bamboo));
    log.position.set(0, 0, -depth / 2 + 0.3 + i * 0.6);
    group.add(log);
  }
  return shadowed(group);
}

/** A cabinet for the arcade raft: body, screen, marquee and a little control deck. */
export function buildCabinet(kit: Kit, screen: THREE.Texture) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(kit.keep(new THREE.BoxGeometry(1.4, 2.6, 1.1)), kit.matte(palette.blue));
  body.position.y = 1.3;
  const deck = new THREE.Mesh(kit.keep(new THREE.BoxGeometry(1.4, 0.18, 0.7)), kit.matte(palette.ink));
  deck.position.set(0, 1.2, 0.75);
  deck.rotation.x = 0.35;
  const face = new THREE.Mesh(kit.keep(new THREE.PlaneGeometry(1.15, 0.9)), kit.keep(new THREE.MeshBasicMaterial({ map: screen })));
  face.position.set(0, 1.85, 0.56);
  const marquee = new THREE.Mesh(kit.keep(new THREE.BoxGeometry(1.4, 0.42, 1.2)), kit.matte(palette.mustard));
  marquee.position.y = 2.75;
  group.add(body, deck, face, marquee);
  return shadowed(group, true, false);
}
