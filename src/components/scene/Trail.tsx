import { useMemo } from 'react';
import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three';
import { TRAIL_WIDTH, heightAt, trailCurve } from './landscape';

export { trailCurve } from './landscape';

const SEGMENTS = 240;
const LIFT = 0.05;

function buildRibbon(): BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const side = new Vector3();

  for (let i = 0; i <= SEGMENTS; i++) {
    const u = i / SEGMENTS;
    const center = trailCurve.getPointAt(u);
    const tangent = trailCurve.getTangentAt(u);
    side.set(-tangent.z, 0, tangent.x).normalize();

    const halfWidth = (TRAIL_WIDTH / 2) * (1 + 0.12 * Math.sin(i * 0.37));
    for (const sign of [1, -1]) {
      const x = center.x + side.x * halfWidth * sign;
      const z = center.z + side.z * halfWidth * sign;
      positions.push(x, heightAt(x, z) + LIFT, z);
    }

    if (i < SEGMENTS) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function Trail() {
  const geometry = useMemo(buildRibbon, []);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial
        color="#b9a47e"
        roughness={1}
        polygonOffset
        polygonOffsetFactor={-2}
        polygonOffsetUnits={-2}
      />
    </mesh>
  );
}
