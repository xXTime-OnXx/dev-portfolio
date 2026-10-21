import { useMemo } from 'react';
import { BufferAttribute, Color, MathUtils, PlaneGeometry } from 'three';
import { FLOOR_Y, WATERFALL, heightAt, seededRandom, valleyCenterX } from './landscape';

const MEADOW = new Color('#6e9a52');
const MEADOW_DRY = new Color('#93a35a');
const VALLEY_FLOOR = new Color('#5c7d43');
const PLATEAU = new Color('#5a7243');
const GRANITE = new Color('#d6d2c8');
const GRANITE_STREAK = new Color('#9a958b');
const GRANITE_SHADE = new Color('#b9b4a9');
const WET_ROCK = new Color('#6a645b');

const EXTENT_X = 240;
const NEAR_Z = 40;
const DEPTH = 500;
const SEGMENTS = 240;

/** Granite gets vertical water streaks, as on the walls of Yosemite Valley. */
export function graniteColor(x: number, z: number, random: () => number, target: Color): Color {
  const streak = 0.5 + 0.5 * Math.sin(x * 0.55 + z * 0.55 + Math.sin(x * 0.13 - z * 0.11) * 4);
  return target
    .copy(GRANITE)
    .lerp(GRANITE_STREAK, streak ** 3 * 0.75)
    .lerp(GRANITE_SHADE, random() * 0.35);
}

function useGroundGeometry() {
  return useMemo(() => {
    // Grid spacing grows with distance: detailed near the trail, coarse far away.
    const geometry = new PlaneGeometry(2, 1, SEGMENTS, SEGMENTS);
    geometry.rotateX(-Math.PI / 2);
    const position = geometry.attributes.position;

    for (let i = 0; i < position.count; i++) {
      const u = position.getX(i);
      const v = 0.5 - position.getZ(i);
      const x = EXTENT_X * Math.sign(u) * Math.abs(u) ** 1.5;
      const z = NEAR_Z - DEPTH * v ** 1.6;
      position.setXYZ(i, x, heightAt(x, z), z);
    }
    geometry.computeVertexNormals();

    const normal = geometry.attributes.normal;
    const colors = new Float32Array(position.count * 3);
    const random = seededRandom(7);
    const ground = new Color();
    const rock = new Color();

    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);

      const onPlateau = MathUtils.smoothstep(y, FLOOR_Y + 10, FLOOR_Y + 22);
      const bareDome = MathUtils.smoothstep(Math.sin(x * 0.09 + 2) * Math.cos(z * 0.07), 0.2, 0.6);
      ground
        .copy(z > -50 ? MEADOW : VALLEY_FLOOR)
        .lerp(MEADOW_DRY, random() * 0.4)
        .lerp(PLATEAU, onPlateau);

      graniteColor(x, z, random, rock);
      // Dark wet rock where the waterfall runs down the wall.
      if ((x - valleyCenterX(z)) * WATERFALL.side > 0) {
        rock.lerp(WET_ROCK, 1 - MathUtils.smoothstep(Math.abs(z - WATERFALL.z), 2, 6));
      }
      const steep = MathUtils.smoothstep(1 - normal.getY(i), 0.22, 0.45);
      ground.lerp(rock, Math.max(steep, onPlateau * bareDome * 0.85));
      colors.set([ground.r, ground.g, ground.b], i * 3);
    }

    geometry.setAttribute('color', new BufferAttribute(colors, 3));
    return geometry;
  }, []);
}

export function Terrain() {
  const ground = useGroundGeometry();

  return (
    <mesh geometry={ground} receiveShadow>
      <meshStandardMaterial vertexColors flatShading roughness={1} />
    </mesh>
  );
}