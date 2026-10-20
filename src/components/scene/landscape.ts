import { CatmullRomCurve3, MathUtils, Vector3 } from 'three';

export const TRAIL_WIDTH = 1.5;
export const BARRIER_Z = 3;
export const CAVE = { x: 5.4, z: -22.2 } as const;

/** Winding path from the trailhead (near the camera) up to the cave mouth. */
export const trailCurve = new CatmullRomCurve3(
  [
    new Vector3(-0.3, 0, 12),
    new Vector3(0, 0, 6),
    new Vector3(-0.1, 0, BARRIER_Z),
    new Vector3(0.8, 0, -2),
    new Vector3(2.6, 0, -7),
    new Vector3(3.2, 0, -12),
    new Vector3(4.6, 0, -17),
    new Vector3(CAVE.x, 0, CAVE.z + 1.4),
  ],
  false,
  'centripetal',
);

const trailSamples = trailCurve.getSpacedPoints(240);

export function distanceToTrail(x: number, z: number): number {
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

/** The approach climbs gently away from the trailhead. */
function baseRise(z: number): number {
  return z < 2 ? (2 - z) * 0.075 : 0;
}

/** Ground height. Hills grow with distance from the trail, so the path itself stays smooth. */
export function heightAt(x: number, z: number): number {
  const d = distanceToTrail(x, z);
  const hills =
    Math.sin(x * 0.31 + 1.3) * Math.cos(z * 0.27) * 0.9 +
    Math.sin(x * 0.12 + z * 0.17) * 1.6 +
    Math.sin(x * 0.63 - z * 0.48) * 0.3 +
    1.2;
  const away = MathUtils.smoothstep(d, 1.6, 9);
  const valleyWalls = Math.min(d, 40) ** 2 * 0.0035;
  return baseRise(z) + Math.max(0, hills) * away * (1 + Math.max(0, -z) * 0.03) + valleyWalls;
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
