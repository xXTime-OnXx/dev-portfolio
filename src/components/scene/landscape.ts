import { CatmullRomCurve3, MathUtils, Vector3 } from 'three';

const { smoothstep } = MathUtils;

export const TRAIL_WIDTH = 1.5;
export const BARRIER_Z = 3;

/** Height of the valley floor once the approach has climbed up from the trailhead. */
export const FLOOR_Y = 4.5;

/** Flatanger-style granite dome. The cave opens on its trail-facing side. */
export const DOME = { x: 15, z: -62, scale: [20, 24, 15] as const, sink: 6 };
export const DOME_CENTER_Y = FLOOR_Y - DOME.sink;

/** Cave mouth on the unit sphere of the dome: a flat-bottomed half ellipse. */
export const MOUTH = { x: -0.14, bottom: 0.27, halfWidth: 0.32, height: 0.42 } as const;

export const CAVE = {
  x: DOME.x + MOUTH.x * DOME.scale[0],
  y: DOME_CENTER_Y + MOUTH.bottom * DOME.scale[1],
  z: DOME.z + DOME.scale[2] * Math.sqrt(1 - MOUTH.x ** 2 - MOUTH.bottom ** 2),
} as const;

/** Winding path from the trailhead (near the camera) up to the cave mouth. */
export const trailCurve = new CatmullRomCurve3(
  [
    new Vector3(-0.3, 0, 12),
    new Vector3(0, 0, 6),
    new Vector3(-0.1, 0, BARRIER_Z),
    new Vector3(0.9, 0, -3),
    new Vector3(3, 0, -9),
    new Vector3(3.8, 0, -16),
    new Vector3(2.4, 0, -23),
    new Vector3(3.6, 0, -30),
    new Vector3(6.6, 0, -36),
    new Vector3(10.2, 0, -41.5),
    new Vector3(CAVE.x, 0, CAVE.z + 1.2),
  ],
  false,
  'centripetal',
);

const trailSamples = trailCurve.getSpacedPoints(300);

export function distanceToTrail(x: number, z: number): number {
  if (x < -30 || x > 40 || z < -60 || z > 25) return 100;
  let min = Infinity;
  for (const p of trailSamples) {
    const dx = p.x - x;
    const dz = p.z - z;
    const d = dx * dx + dz * dz;
    if (d < min) min = d;
  }
  return Math.sqrt(min);
}

export function trailPointAtZ(z: number): Vector3 {
  let best = trailSamples[0];
  for (const p of trailSamples) {
    if (Math.abs(p.z - z) < Math.abs(best.z - z)) best = p;
  }
  return new Vector3(best.x, heightAt(best.x, best.z), best.z);
}

const EL_CAPITAN_Z = -140;

/** Waterfall dropping down the left valley wall. */
export const WATERFALL = { z: -112, side: -1 } as const;

/** The glacial valley bends gently to the left as it recedes. */
export function valleyCenterX(z: number): number {
  return 2 + Math.min(0, z + 40) * 0.1;
}

/** Distance from the valley center to the foot of the granite wall on one side. */
function wallEdge(z: number, side: -1 | 1): number {
  // The valley opens up around the trailhead and narrows into the distance.
  const opening = Math.max(0, z + 120) * 0.35;
  const base = 42 + Math.sin(z * 0.031 + side) * 3 + opening;
  // Buttresses and gullies break up the foot of the wall.
  const buttresses = Math.sin(z * 0.37 + side * 4) * 2.2 + Math.sin(z * 0.93 + side) * 1.1;
  // The El Capitan-like prow juts into the valley on the left.
  const prow = side < 0 ? 8 * Math.exp(-(((z - EL_CAPITAN_Z) / 16) ** 2)) : 0;
  return base + buttresses - prow;
}

function wallHeight(z: number, side: -1 | 1): number {
  const base = side < 0 ? 30 : 26;
  const variation = Math.sin(z * 0.023 + side * 2) * 6 + Math.sin(z * 0.061) * 2.5;
  const prow = side < 0 ? 14 * Math.exp(-(((z - EL_CAPITAN_Z) / 18) ** 2)) : 0;
  return base + variation + prow;
}

/** The approach climbs gently away from the trailhead onto the valley floor. */
function baseRise(z: number): number {
  return z < 2 ? Math.min((2 - z) * 0.096, FLOOR_Y) : 0;
}

/** Rolling meadow hills near the trail; they fade out on the valley floor. */
function meadowHills(x: number, z: number): number {
  if (z < -75) return 0;
  const d = distanceToTrail(x, z);
  const hills =
    Math.sin(x * 0.31 + 1.3) * Math.cos(z * 0.27) * 0.9 +
    Math.sin(x * 0.12 + z * 0.17) * 1.6 +
    Math.sin(x * 0.63 - z * 0.48) * 0.3 +
    1.2;
  return Math.max(0, hills) * smoothstep(d, 1.6, 9) * smoothstep(z, -75, -45);
}

/** Sheer granite walls with talus at their foot and domed plateaus above. */
function valleyWalls(x: number, z: number): number {
  const dx = x - valleyCenterX(z);
  const side: -1 | 1 = dx < 0 ? -1 : 1;
  const d = Math.abs(dx);
  const edge = wallEdge(z, side);
  const height = wallHeight(z, side);

  const talus = smoothstep(d, edge - 10, edge) * 4;
  // Horizontal ledges and a stepped profile keep the faces from looking smooth.
  const rise = smoothstep(d, edge, edge + 7);
  const ledges = Math.sin(rise * 9 + z * 0.05) * 0.04 * rise * (1 - rise) * 4;
  const cliff = Math.min(1, rise + ledges) * height;
  const domes = (Math.sin(x * 0.08) * Math.cos(z * 0.06) * 6 + 7) * smoothstep(d, edge + 7, edge + 32);
  const valleyHead = (1 - smoothstep(z, -440, -340)) * 60;
  return talus + cliff + domes + valleyHead;
}

/** World x of the foot and the lip of the cliff on one side of the valley. */
export function cliffSpan(z: number, side: -1 | 1): { footX: number; lipX: number } {
  const center = valleyCenterX(z);
  const edge = wallEdge(z, side);
  return { footX: center + side * edge, lipX: center + side * (edge + 7) };
}

export function heightAt(x: number, z: number): number {
  return baseRise(z) + meadowHills(x, z) + valleyWalls(x, z);
}

/** Ground steepness as the gradient magnitude (rise over run). */
export function slopeAt(x: number, z: number): number {
  const e = 0.8;
  const dx = heightAt(x + e, z) - heightAt(x - e, z);
  const dz = heightAt(x, z + e) - heightAt(x, z - e);
  return Math.hypot(dx, dz) / (2 * e);
}

export function isUnderDome(x: number, z: number, margin = 2): boolean {
  const [sx, , sz] = DOME.scale;
  return ((x - DOME.x) / (sx + margin)) ** 2 + ((z - DOME.z) / (sz + margin)) ** 2 < 1;
}

/** Deterministic pseudo-random generator, so the scenery is identical on every load. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
