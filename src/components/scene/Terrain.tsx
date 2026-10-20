import { useMemo } from 'react';
import {
  BufferAttribute,
  Color,
  ConeGeometry,
  CylinderGeometry,
  IcosahedronGeometry,
  MeshStandardMaterial,
  PlaneGeometry,
} from 'three';
import { BARRIER_Z, CAVE, distanceToTrail, heightAt, seededRandom } from './landscape';

const GRASS = new Color('#6e9a52');
const GRASS_DRY = new Color('#93a35a');
const STONE = new Color('#8a939a');

function useGroundGeometry() {
  return useMemo(() => {
    const geometry = new PlaneGeometry(180, 160, 150, 130);
    geometry.rotateX(-Math.PI / 2);
    geometry.translate(0, 0, -40);

    const position = geometry.attributes.position;
    const colors = new Float32Array(position.count * 3);
    const random = seededRandom(7);
    const color = new Color();

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const z = position.getZ(i);
      const y = heightAt(x, z);
      position.setY(i, y);

      const rockiness = Math.min(1, Math.max(0, (y - 2.5) / 5));
      color
        .copy(GRASS)
        .lerp(GRASS_DRY, random() * 0.45)
        .lerp(STONE, rockiness);
      colors.set([color.r, color.g, color.b], i * 3);
    }

    geometry.setAttribute('color', new BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    return geometry;
  }, []);
}

interface Mountain {
  x: number;
  z: number;
  radius: number;
  height: number;
  rotation: number;
  color: string;
}

const MOUNTAINS: Mountain[] = [
  { x: -64, z: -92, radius: 28, height: 24, rotation: 0.3, color: '#7d878f' },
  { x: -32, z: -84, radius: 22, height: 21, rotation: 1.1, color: '#8a939a' },
  { x: 0, z: -100, radius: 30, height: 31, rotation: 0.7, color: '#78828a' },
  { x: 34, z: -86, radius: 24, height: 23, rotation: 2.1, color: '#858f97' },
  { x: 68, z: -96, radius: 28, height: 27, rotation: 0.2, color: '#7b858d' },
  { x: -14, z: -66, radius: 15, height: 12, rotation: 1.7, color: '#929ba1' },
  { x: 22, z: -62, radius: 13, height: 11, rotation: 0.9, color: '#959ea4' },
];

const SNOW_FRACTION = 0.3;

function Mountains() {
  const geometry = useMemo(() => new ConeGeometry(1, 1, 6, 1), []);
  const snow = useMemo(
    () => new MeshStandardMaterial({ color: '#f4f6f7', flatShading: true, roughness: 0.9 }),
    [],
  );

  return (
    <group>
      {MOUNTAINS.map((m) => {
        const baseY = heightAt(m.x, m.z) - 2;
        const capHeight = m.height * SNOW_FRACTION;
        return (
          <group key={`${m.x}:${m.z}`} position={[m.x, baseY, m.z]} rotation-y={m.rotation}>
            <mesh geometry={geometry} position-y={m.height / 2} scale={[m.radius, m.height, m.radius]}>
              <meshStandardMaterial color={m.color} flatShading roughness={1} />
            </mesh>
            <mesh
              geometry={geometry}
              material={snow}
              position-y={m.height - capHeight / 2 + 0.05}
              scale={[m.radius * SNOW_FRACTION * 1.02, capHeight, m.radius * SNOW_FRACTION * 1.02]}
            />
          </group>
        );
      })}
    </group>
  );
}

interface Placement {
  x: number;
  y: number;
  z: number;
  scale: number;
  rotation: number;
}

function scatter(
  seed: number,
  count: number,
  minTrailDistance: number,
  scaleRange: [number, number],
): Placement[] {
  const random = seededRandom(seed);
  const placements: Placement[] = [];
  let attempts = 0;

  while (placements.length < count && attempts < count * 20) {
    attempts++;
    const x = -20 + random() * 38;
    const z = -26 + random() * 27;
    const nearBarrier = Math.abs(x) < 3.5 && Math.abs(z - BARRIER_Z) < 2.5;
    const nearCave = Math.hypot(x - CAVE.x, z - CAVE.z) < 6;
    if (nearBarrier || nearCave || distanceToTrail(x, z) < minTrailDistance) continue;

    placements.push({
      x,
      y: heightAt(x, z),
      z,
      scale: scaleRange[0] + random() * (scaleRange[1] - scaleRange[0]),
      rotation: random() * Math.PI * 2,
    });
  }
  return placements;
}

function Pines() {
  const trunk = useMemo(() => new CylinderGeometry(0.08, 0.12, 0.6, 5), []);
  const crown = useMemo(() => new ConeGeometry(0.7, 1.4, 6), []);
  const trunkMaterial = useMemo(() => new MeshStandardMaterial({ color: '#6b4a32', flatShading: true }), []);
  const crownMaterial = useMemo(
    () => new MeshStandardMaterial({ color: '#3f6b3a', flatShading: true, roughness: 1 }),
    [],
  );
  const pines = useMemo(() => scatter(11, 46, 2.4, [0.8, 1.7]), []);

  return (
    <group>
      {pines.map((p, i) => (
        <group key={i} position={[p.x, p.y, p.z]} scale={p.scale} rotation-y={p.rotation}>
          <mesh geometry={trunk} material={trunkMaterial} position-y={0.3} castShadow />
          <mesh geometry={crown} material={crownMaterial} position-y={1.1} castShadow />
          <mesh geometry={crown} material={crownMaterial} position-y={1.75} scale={0.72} castShadow />
          <mesh geometry={crown} material={crownMaterial} position-y={2.3} scale={0.45} castShadow />
        </group>
      ))}
    </group>
  );
}

function Boulders() {
  const geometry = useMemo(() => new IcosahedronGeometry(1, 0), []);
  const material = useMemo(
    () => new MeshStandardMaterial({ color: '#9aa1a6', flatShading: true, roughness: 1 }),
    [],
  );
  const boulders = useMemo(() => scatter(23, 22, 1.4, [0.2, 0.9]), []);

  return (
    <group>
      {boulders.map((b, i) => (
        <mesh
          key={i}
          geometry={geometry}
          material={material}
          position={[b.x, b.y + b.scale * 0.25, b.z]}
          rotation={[b.rotation, b.rotation * 0.7, 0]}
          scale={[b.scale * 1.2, b.scale * 0.75, b.scale]}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  );
}

export function Terrain() {
  const ground = useGroundGeometry();

  return (
    <group>
      <mesh geometry={ground} receiveShadow>
        <meshStandardMaterial vertexColors flatShading roughness={1} />
      </mesh>
      <Mountains />
      <Pines />
      <Boulders />
    </group>
  );
}
