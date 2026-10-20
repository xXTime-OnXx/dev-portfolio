import { useMemo } from 'react';
import { DodecahedronGeometry, IcosahedronGeometry, Shape, ShapeGeometry, Vector3 } from 'three';
import { CAVE, heightAt } from './landscape';

/** Displaces vertices by position (not index) so shared corners stay welded. */
function useCraggyRock(detail: number, strength: number) {
  return useMemo(() => {
    const geometry = new IcosahedronGeometry(1, detail);
    const position = geometry.attributes.position;
    const v = new Vector3();
    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i);
      const n =
        Math.sin(v.x * 4.1 + v.y * 2.3) * 0.5 +
        Math.sin(v.y * 5.7 - v.z * 3.1) * 0.3 +
        Math.sin(v.z * 6.3 + v.x * 1.7) * 0.2;
      v.multiplyScalar(1 + n * strength);
      position.setXYZ(i, v.x, v.y, v.z);
    }
    geometry.computeVertexNormals();
    return geometry;
  }, [detail, strength]);
}

const MOUTH_WIDTH = 3.2;
const MOUTH_HEIGHT = 3.4;

function useMouthGeometry() {
  return useMemo(() => {
    const half = MOUTH_WIDTH / 2;
    const shoulder = MOUTH_HEIGHT - half;
    const shape = new Shape();
    shape.moveTo(-half - 0.15, 0);
    shape.lineTo(-half, shoulder * 0.6);
    const steps = 9;
    for (let i = 0; i <= steps; i++) {
      const angle = Math.PI - (i / steps) * Math.PI;
      const wobble = 1 + Math.sin(i * 2.7) * 0.07;
      shape.lineTo(Math.cos(angle) * half * wobble, shoulder + Math.sin(angle) * half * wobble);
    }
    shape.lineTo(half, shoulder * 0.55);
    shape.lineTo(half + 0.2, 0);
    shape.closePath();
    return new ShapeGeometry(shape);
  }, []);
}

const HOLDS: { x: number; y: number; color: string }[] = [
  { x: -0.95, y: 0.55, color: '#e2574c' },
  { x: -0.45, y: 1.35, color: '#f2c94c' },
  { x: 0.25, y: 0.85, color: '#3f8fd9' },
  { x: 0.7, y: 1.85, color: '#5cc26a' },
  { x: -0.15, y: 2.45, color: '#a66ad9' },
  { x: 0.95, y: 0.5, color: '#f08a3c' },
];

export function CaveEntrance() {
  const rock = useCraggyRock(1, 0.12);
  const boulder = useCraggyRock(0, 0.1);
  const mouth = useMouthGeometry();
  const hold = useMemo(() => new DodecahedronGeometry(0.17, 0), []);
  const groundY = heightAt(CAVE.x, CAVE.z);

  return (
    <group position={[CAVE.x, groundY, CAVE.z]}>
      <mesh geometry={rock} position={[0.5, 2.4, -3.6]} scale={[7.5, 5.6, 4]} castShadow receiveShadow>
        <meshStandardMaterial color="#7f878d" flatShading roughness={1} />
      </mesh>

      <mesh geometry={mouth} position={[0, -0.05, 0.35]}>
        <meshBasicMaterial color="#1b1613" />
      </mesh>

      {HOLDS.map((h) => (
        <group key={h.color} position={[h.x, h.y, 0.42]}>
          <mesh geometry={hold} scale={[1, 0.8, 0.45]}>
            <meshStandardMaterial
              color={h.color}
              emissive={h.color}
              emissiveIntensity={0.45}
              flatShading
              roughness={0.8}
            />
          </mesh>
          <mesh position={[0.12, 0.16, -0.02]}>
            <circleGeometry args={[0.11, 8]} />
            <meshBasicMaterial color="#f4f1ea" transparent opacity={0.22} />
          </mesh>
        </group>
      ))}

      <mesh geometry={boulder} position={[-2.4, 0.5, 0.6]} scale={[1.1, 1.2, 0.9]} castShadow>
        <meshStandardMaterial color="#868e94" flatShading roughness={1} />
      </mesh>
      <mesh geometry={boulder} position={[2.9, 0.6, 0.5]} scale={[1.2, 1.4, 1]} castShadow>
        <meshStandardMaterial color="#7c848a" flatShading roughness={1} />
      </mesh>
    </group>
  );
}
