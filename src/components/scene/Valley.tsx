import { useMemo } from 'react';
import {
  BufferGeometry,
  DoubleSide,
  Float32BufferAttribute,
  IcosahedronGeometry,
  LatheGeometry,
  Shape,
  ShapeGeometry,
  Vector2,
  Vector3,
} from 'three';
import { WATERFALL, cliffSpan, heightAt, seededRandom } from './landscape';

/** Turned almost side-on, so the sheer face shows as the famous vertical drop. */
const HALF_DOME = { x: -92, z: -370, radius: 62, height: 60, stretch: 1.3, pedestal: 14, facing: 0.22 } as const;

/** Rounded dome sheared off on one side into a sheer flat face. */
function useHalfDomeGeometry() {
  return useMemo(() => {
    const { radius, height } = HALF_DOME;
    const profile: Vector2[] = [new Vector2(radius * 1.35, -30)];
    const steps = 14;
    for (let i = 0; i <= steps; i++) {
      const a = (i / steps) * (Math.PI / 2);
      profile.push(new Vector2(Math.max(0.01, radius * Math.cos(a) ** 0.6), height * Math.sin(a) ** 1.15));
    }

    const dome = new LatheGeometry(profile, 28, 0, Math.PI);
    const position = dome.attributes.position;
    const v = new Vector3();
    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i);
      // Fade the noise out towards the cut so the dome stays flush with its face.
      const towardsBack = Math.min(1, Math.abs(v.x) / radius);
      const n = Math.sin(v.y * 0.21 + v.z * 0.13) * Math.cos(v.z * 0.17) * 2.2 * towardsBack;
      position.setXYZ(i, v.x + n, v.y, v.z);
    }
    dome.computeVertexNormals();

    const faceShape = new Shape();
    profile.forEach((p, i) => (i === 0 ? faceShape.moveTo(p.x, p.y) : faceShape.lineTo(p.x, p.y)));
    [...profile].reverse().forEach((p) => faceShape.lineTo(-p.x, p.y));
    faceShape.closePath();
    const face = new ShapeGeometry(faceShape).rotateY(-Math.PI / 2);

    return { dome, face };
  }, []);
}

function HalfDome() {
  const { dome, face } = useHalfDomeGeometry();
  const baseY = heightAt(HALF_DOME.x, HALF_DOME.z) + HALF_DOME.pedestal;

  return (
    <group position={[HALF_DOME.x, baseY, HALF_DOME.z]} rotation-y={HALF_DOME.facing}>
      <mesh geometry={dome} scale-x={HALF_DOME.stretch}>
        <meshStandardMaterial color="#bdb8ae" flatShading roughness={1} />
      </mesh>
      <mesh geometry={face}>
        <meshStandardMaterial color="#9a9488" flatShading roughness={1} side={DoubleSide} />
      </mesh>
    </group>
  );
}

/** Ribbon following the cliff face, turned to face the viewer. */
function useCliffRibbon(z: number, side: -1 | 1, viewer: Vector3) {
  return useMemo(() => {
    const { footX, lipX } = cliffSpan(z, side);
    const topY = heightAt(lipX, z);
    const bottomY = heightAt(footX, z);

    const xAtHeight = (y: number) => {
      let lo = footX;
      let hi = lipX;
      for (let i = 0; i < 24; i++) {
        const mid = (lo + hi) / 2;
        if (heightAt(mid, z) < y) lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    };

    const toViewer = new Vector3(viewer.x - footX, 0, viewer.z - z).normalize();
    const across = new Vector3(-toViewer.z, 0, toViewer.x);

    const positions: number[] = [];
    const indices: number[] = [];
    const steps = 28;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = topY - 0.6 - t * (topY - bottomY);
      const width = 1.8 + t * 3.2;
      const x = xAtHeight(y) - side * (width * Math.abs(across.x) * 0.5 + 0.8);
      positions.push(x - across.x * width * 0.5, y, z - across.z * width * 0.5);
      positions.push(x + across.x * width * 0.5, y, z + across.z * width * 0.5);
      if (i < steps) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return { geometry, foot: new Vector3(footX - side * 2.5, bottomY, z) };
  }, [z, side, viewer]);
}

const VIEWER = new Vector3(0, 2, 8);

function Waterfall({ z, side }: { z: number; side: -1 | 1 }) {
  const { geometry, foot } = useCliffRibbon(z, side, VIEWER);

  return (
    <group>
      <mesh geometry={geometry}>
        <meshBasicMaterial color="#f7fbfd" transparent opacity={0.85} side={DoubleSide} />
      </mesh>
      <mesh position={foot} scale={[5, 2, 5]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#f2f7f9" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function Clouds() {
  const puff = useMemo(() => new IcosahedronGeometry(1, 1), []);
  const clouds = useMemo(() => {
    const random = seededRandom(53);
    return Array.from({ length: 7 }, (_, c) => {
      const center = new Vector3(-300 + c * 100 + random() * 50, 170 + random() * 70, -400 - random() * 80);
      const puffs = Array.from({ length: 5 + Math.floor(random() * 3) }, (_, i) => ({
        position: new Vector3((i - 3) * 14 + random() * 8, random() * 6, random() * 10),
        scale: 12 + random() * 12,
      }));
      return { center, puffs };
    });
  }, []);

  return (
    <group>
      {clouds.map((cloud, c) => (
        <group key={c} position={cloud.center} scale={[1, 0.45, 0.7]}>
          {cloud.puffs.map((p, i) => (
            <mesh key={i} geometry={puff} position={p.position} scale={p.scale}>
              <meshStandardMaterial
                color="#ffffff"
                emissive="#ffffff"
                emissiveIntensity={0.35}
                flatShading
                roughness={1}
                fog={false}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export function Valley() {
  return (
    <>
      <HalfDome />
      <Waterfall z={WATERFALL.z} side={WATERFALL.side} />
      <Clouds />
    </>
  );
}