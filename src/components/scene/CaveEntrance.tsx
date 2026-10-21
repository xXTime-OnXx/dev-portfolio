import { useMemo } from 'react';
import {
  BackSide,
  BufferAttribute,
  CatmullRomCurve3,
  Color,
  DodecahedronGeometry,
  IcosahedronGeometry,
  MathUtils,
  Quaternion,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from 'three';
import { DOME, DOME_CENTER_Y, MOUTH, seededRandom } from './landscape';
import { graniteColor } from './Terrain';

const [SX, SY, SZ] = DOME.scale;
const CAVE_DEPTH = 11;

/** The roof of the arch sweeps higher towards one side, like the Hanshelleren cave. */
function archHeight(x: number): number {
  return MOUTH.height * (1 + 0.22 * MathUtils.clamp((x - MOUTH.x) / MOUTH.halfWidth, -1, 1));
}

/** Elliptical distance from the mouth outline on the unit sphere; below 1 is inside. */
function mouthDistance(x: number, y: number, z: number): number {
  if (z <= 0) return Infinity;
  const below = Math.max(0, MOUTH.bottom - y) * 20;
  return Math.hypot((x - MOUTH.x) / MOUTH.halfWidth, Math.max(0, y - MOUTH.bottom) / archHeight(x)) + below;
}

/** Moves a unit-sphere point inside the mouth onto its outline. */
function snapToMouthOutline(v: Vector3) {
  const a = (v.x - MOUTH.x) / MOUTH.halfWidth;
  const b = (v.y - MOUTH.bottom) / archHeight(v.x);
  const length = Math.hypot(a, b) || 1;
  const x = MOUTH.x + (a / length) * MOUTH.halfWidth;
  const y = MOUTH.bottom + (b / length) * archHeight(x);
  v.set(x, y, Math.sqrt(Math.max(0, 1 - x * x - y * y)));
}

/** Large-scale lumps so the dome reads as a rock formation rather than an ellipsoid. */
function domeShape(v: Vector3): number {
  const lumps = Math.sin(v.x * 2.3 + 0.6) * Math.cos(v.z * 1.9) * 0.09 + Math.sin(v.y * 3.1 - v.x) * 0.04;
  const flatTop = v.y > 0.55 ? -(v.y - 0.55) * 0.28 : 0;
  return 1 + lumps + flatTop + rockNoise(v) * 0.06;
}

/** Maps a unit-sphere point onto the sculpted dome, in the dome's local space. */
function toDomeSurface(v: Vector3): Vector3 {
  const scale = domeShape(v);
  return v.set(v.x * scale * SX, v.y * scale * SY, v.z * scale * SZ);
}

function rockNoise(v: Vector3): number {
  return (
    Math.sin(v.x * 7.1 + v.y * 3.3) * 0.5 +
    Math.sin(v.y * 9.7 - v.z * 5.1) * 0.3 +
    Math.sin(v.z * 11.3 + v.x * 4.7) * 0.2
  );
}

const VEGETATION = new Color('#5f8445');
const WET_STREAK = new Color('#5f5a53');

function useDomeGeometry() {
  return useMemo(() => {
    const geometry = new SphereGeometry(1, 110, 72);
    const position = geometry.attributes.position;
    const index = geometry.index!;
    const v = new Vector3();

    const kept: number[] = [];
    const centroid = new Vector3();
    for (let i = 0; i < index.count; i += 3) {
      centroid.set(0, 0, 0);
      for (let k = 0; k < 3; k++) centroid.add(v.fromBufferAttribute(position, index.getX(i + k)));
      centroid.divideScalar(3);
      if (mouthDistance(centroid.x, centroid.y, centroid.z) >= 1) {
        kept.push(index.getX(i), index.getX(i + 1), index.getX(i + 2));
      }
    }
    geometry.setIndex(kept);

    // Boundary triangles still reach into the mouth; pulling their inner corners
    // onto the outline gives a clean arch instead of a jagged edge.
    for (const i of new Set(kept)) {
      v.fromBufferAttribute(position, i);
      if (v.y >= MOUTH.bottom && mouthDistance(v.x, v.y, v.z) < 1) {
        snapToMouthOutline(v);
        position.setXYZ(i, v.x, v.y, v.z);
      }
    }

    for (let i = 0; i < position.count; i++) {
      toDomeSurface(v.fromBufferAttribute(position, i));
      position.setXYZ(i, v.x, v.y, v.z);
    }
    geometry.computeVertexNormals();

    const normal = geometry.attributes.normal;
    const colors = new Float32Array(position.count * 3);
    const random = seededRandom(17);
    const color = new Color();
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);
      graniteColor(x * 1.6, z * 1.6, random, color);

      // Dark water streaks run down the steep faces.
      const streak = MathUtils.smoothstep(Math.sin(x * 0.9 + Math.sin(x * 0.23) * 3), 0.55, 0.95);
      const steepness = 1 - Math.abs(normal.getY(i));
      color.lerp(WET_STREAK, streak * steepness * 0.7);

      const gentle = MathUtils.smoothstep(normal.getY(i), 0.5, 0.75);
      const low = 1 - MathUtils.smoothstep(y, SY * 0.35, SY * 0.6);
      const patchy = MathUtils.smoothstep(Math.sin(x * 0.7) * Math.cos(z * 0.5) + random() * 0.5, 0, 0.6);
      color.lerp(VEGETATION, gentle * low * patchy);
      colors.set([color.r, color.g, color.b], i * 3);
    }
    geometry.setAttribute('color', new BufferAttribute(colors, 3));
    return geometry;
  }, []);
}

/** Chunky rock lip along the arch: thick at the crown, tapering towards the feet. */
function useArchRimGeometry() {
  return useMemo(() => {
    const points: Vector3[] = [];
    const steps = 48;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI;
      const x = MOUTH.x + Math.cos(t) * MOUTH.halfWidth;
      const y = MOUTH.bottom + Math.sin(t) * archHeight(x);
      points.push(toDomeSurface(new Vector3(x, y, Math.sqrt(Math.max(0, 1 - x * x - y * y)))));
    }
    const curve = new CatmullRomCurve3(points);
    const tubular = 36;
    const radial = 5;
    const geometry = new TubeGeometry(curve, tubular, 1, radial, false);

    const position = geometry.attributes.position;
    const v = new Vector3();
    const center = new Vector3();
    for (let j = 0; j <= tubular; j++) {
      const u = j / tubular;
      curve.getPointAt(u, center);
      const thickness = 0.55 + 0.75 * Math.sin(Math.PI * u);
      for (let k = 0; k <= radial; k++) {
        const i = j * (radial + 1) + k;
        v.fromBufferAttribute(position, i).sub(center);
        const n = 1 + Math.sin(u * 23 + k * 1.3) * 0.15;
        v.multiplyScalar(thickness * n).add(center);
        position.setXYZ(i, v.x, v.y, v.z);
      }
    }
    geometry.computeVertexNormals();
    return geometry;
  }, []);
}

const MOUTH_SURFACE_Z = Math.sqrt(1 - MOUTH.x ** 2 - MOUTH.bottom ** 2) * SZ;

const CAVITY = {
  // Set back far enough that the top of the hollow stays inside the dome.
  center: new Vector3(MOUTH.x * SX, MOUTH.bottom * SY, MOUTH_SURFACE_Z - CAVE_DEPTH * 0.85),
  radius: new Vector3(MOUTH.halfWidth * SX * 1.25, MOUTH.height * SY * 1.4, CAVE_DEPTH),
};

const CAVE_DARK = new Color('#3b3631');
const CAVE_LIGHT = new Color('#7a7368');

/** Inside of the cave: darker towards the back, seen through the mouth. */
function useCavityGeometry() {
  return useMemo(() => {
    const geometry = new SphereGeometry(1, 40, 24);
    const position = geometry.attributes.position;
    const colors = new Float32Array(position.count * 3);
    const color = new Color();
    for (let i = 0; i < position.count; i++) {
      const depth = (1 - position.getZ(i)) / 2;
      color.copy(CAVE_LIGHT).lerp(CAVE_DARK, Math.min(1, depth * 1.3));
      colors.set([color.r, color.g, color.b], i * 3);
    }
    geometry.setAttribute('color', new BufferAttribute(colors, 3));
    return geometry;
  }, []);
}

const ROUTES = [
  { color: '#e2574c', azimuth: -0.7 },
  { color: '#f2c94c', azimuth: -0.35 },
  { color: '#3f8fd9', azimuth: 0 },
  { color: '#5cc26a', azimuth: 0.35 },
  { color: '#a66ad9', azimuth: 0.7 },
];

/** Each route climbs the back wall and continues out along the overhanging roof. */
function useHolds() {
  return useMemo(() => {
    const forward = new Vector3(0, 0, 1);
    const random = seededRandom(61);
    return ROUTES.flatMap((route, r) =>
      Array.from({ length: 5 }, (_, i) => {
        const elevation = 0.12 + i * 0.24 + (random() - 0.5) * 0.12;
        const azimuth = route.azimuth + (random() - 0.5) * 0.16;
        const size = 0.5 + random() * 0.3;
        const dir = new Vector3(
          Math.sin(azimuth) * Math.cos(elevation),
          Math.sin(elevation),
          -Math.cos(azimuth) * Math.cos(elevation),
        );
        const position = new Vector3(
          dir.x * CAVITY.radius.x,
          dir.y * CAVITY.radius.y,
          dir.z * CAVITY.radius.z,
        )
          .multiplyScalar(0.97)
          .add(CAVITY.center);
        const inward = dir.clone().negate();
        return {
          key: `${r}-${i}`,
          color: route.color,
          position,
          quaternion: new Quaternion().setFromUnitVectors(forward, inward),
          scale: [size, size * 0.8, size * 0.45] as [number, number, number],
        };
      }),
    );
  }, []);
}

const TALUS: { position: [number, number, number]; scale: [number, number, number] }[] = [
  { position: [MOUTH.x * SX - 8.5, 0.6, MOUTH_SURFACE_Z - 0.5], scale: [2.2, 1.6, 1.8] },
  { position: [MOUTH.x * SX - 6.8, 0.2, MOUTH_SURFACE_Z + 1.6], scale: [1.1, 0.9, 1] },
  { position: [MOUTH.x * SX + 7.2, 0.5, MOUTH_SURFACE_Z - 1.5], scale: [1.8, 1.4, 1.5] },
  { position: [MOUTH.x * SX + 4.2, 0.1, MOUTH_SURFACE_Z + 1.2], scale: [0.9, 0.7, 0.8] },
];

export function CaveEntrance() {
  const dome = useDomeGeometry();
  const cavity = useCavityGeometry();
  const holds = useHolds();
  const rim = useArchRimGeometry();
  const hold = useMemo(() => new DodecahedronGeometry(0.42, 0), []);
  const boulder = useMemo(() => new IcosahedronGeometry(1, 0), []);
  const floorY = MOUTH.bottom * SY;

  return (
    <group position={[DOME.x, DOME_CENTER_Y, DOME.z]}>
      <mesh geometry={dome} castShadow receiveShadow>
        <meshStandardMaterial vertexColors flatShading roughness={1} />
      </mesh>
      <mesh geometry={rim} castShadow>
        <meshStandardMaterial color="#bfb9ad" flatShading roughness={1} />
      </mesh>

      <mesh geometry={cavity} position={CAVITY.center} scale={CAVITY.radius}>
        <meshStandardMaterial
          vertexColors
          flatShading
          roughness={1}
          side={BackSide}
          emissive="#2a2620"
        />
      </mesh>

      {holds.map((h) => (
        <mesh key={h.key} geometry={hold} position={h.position} quaternion={h.quaternion} scale={h.scale}>
          <meshStandardMaterial color={h.color} emissive={h.color} emissiveIntensity={0.55} flatShading />
        </mesh>
      ))}

      {TALUS.map((t, i) => (
        <mesh
          key={i}
          geometry={boulder}
          position={[t.position[0], floorY + t.position[1], t.position[2]]}
          scale={t.scale}
          rotation={[i, i * 0.7, 0]}
          castShadow
        >
          <meshStandardMaterial color="#c4bfb3" flatShading roughness={1} />
        </mesh>
      ))}
    </group>
  );
}
