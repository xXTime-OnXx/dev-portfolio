import { useLayoutEffect, useMemo, useRef } from 'react';
import {
  BufferGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  BARRIER_Z,
  FLOOR_Y,
  distanceToTrail,
  heightAt,
  isUnderDome,
  seededRandom,
  slopeAt,
  valleyCenterX,
} from './landscape';

interface Placement {
  position: Vector3;
  scale: Vector3;
  rotation: number;
  tint: Color;
}

interface ScatterOptions {
  seed: number;
  count: number;
  sample: (random: () => number) => [number, number];
  scale: [number, number];
  minTrailDistance?: number;
  maxSlope?: number;
  minHeight?: number;
  maxHeight?: number;
  squash?: number;
  reject?: (x: number, z: number) => boolean;
}

function scatter(options: ScatterOptions): Placement[] {
  const { seed, count, sample, scale, minTrailDistance = 2.2, maxSlope = 0.5 } = options;
  const { minHeight = -Infinity, maxHeight = Infinity, squash = 0, reject } = options;
  const random = seededRandom(seed);
  const placements: Placement[] = [];

  for (let attempts = 0; placements.length < count && attempts < count * 30; attempts++) {
    const [x, z] = sample(random);
    const nearBarrier = Math.abs(x) < 3.5 && Math.abs(z - BARRIER_Z) < 2.5;
    if (nearBarrier || isUnderDome(x, z) || distanceToTrail(x, z) < minTrailDistance) continue;
    if (reject?.(x, z)) continue;
    const y = heightAt(x, z);
    if (y < minHeight || y > maxHeight || slopeAt(x, z) > maxSlope) continue;

    const s = scale[0] + random() * (scale[1] - scale[0]);
    const shade = 0.82 + random() * 0.3;
    placements.push({
      position: new Vector3(x, y, z),
      scale: new Vector3(s, s * (1 - squash * random()), s),
      rotation: random() * Math.PI * 2,
      tint: new Color(shade, shade * (0.96 + random() * 0.08), shade),
    });
  }
  return placements;
}

const UP = new Vector3(0, 1, 0);

function Instances({
  placements,
  geometry,
  material,
  castShadow = false,
}: {
  placements: Placement[];
  geometry: BufferGeometry;
  material: MeshStandardMaterial;
  castShadow?: boolean;
}) {
  const ref = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const matrix = new Matrix4();
    const rotation = new Quaternion();
    placements.forEach((p, i) => {
      rotation.setFromAxisAngle(UP, p.rotation);
      mesh.setMatrixAt(i, matrix.compose(p.position, rotation, p.scale));
      mesh.setColorAt(i, p.tint);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [placements]);

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, placements.length]}
      castShadow={castShadow}
      receiveShadow
    />
  );
}

function usePineGeometry() {
  return useMemo(() => {
    const tiers = [
      { radius: 0.7, height: 1.4, y: 1.1 },
      { radius: 0.5, height: 1.0, y: 1.75 },
      { radius: 0.32, height: 0.7, y: 2.3 },
    ].map(({ radius, height, y }) => new ConeGeometry(radius, height, 6).translate(0, y, 0));
    return {
      crown: mergeGeometries(tiers),
      trunk: new CylinderGeometry(0.08, 0.12, 0.6, 5).translate(0, 0.3, 0),
    };
  }, []);
}

function useBroadleafGeometry() {
  return useMemo(
    () => ({
      crown: new IcosahedronGeometry(0.7, 0).scale(1, 1.3, 1).translate(0, 1.7, 0),
      trunk: new CylinderGeometry(0.05, 0.07, 1.3, 5).translate(0, 0.65, 0),
    }),
    [],
  );
}

function material(color: string, roughness = 1) {
  return new MeshStandardMaterial({ color, flatShading: true, roughness });
}

/** Pines and birches along the approach, as on the slopes below Flatanger. */
function Meadow() {
  const pine = usePineGeometry();
  const birch = useBroadleafGeometry();
  const materials = useMemo(
    () => ({
      pineCrown: material('#3f6b3a'),
      pineTrunk: material('#6b4a32'),
      birchCrown: material('#7fa64a'),
      birchTrunk: material('#ece8df', 0.8),
    }),
    [],
  );

  const area = (random: () => number): [number, number] => [-28 + random() * 56, -50 + random() * 51];
  // Keep the view up the trail open: no trees right beside it close to the viewer.
  const keepViewOpen = (x: number, z: number) => z > -16 && distanceToTrail(x, z) < 6;
  const pines = useMemo(
    () => scatter({ seed: 11, count: 80, sample: area, scale: [0.8, 1.8], maxSlope: 0.7, reject: keepViewOpen }),
    [],
  );
  const birches = useMemo(
    () =>
      scatter({ seed: 5, count: 36, sample: area, scale: [0.8, 1.4], maxSlope: 0.6, squash: 0.2, reject: keepViewOpen }),
    [],
  );

  return (
    <>
      <Instances placements={pines} geometry={pine.crown} material={materials.pineCrown} castShadow />
      <Instances placements={pines} geometry={pine.trunk} material={materials.pineTrunk} castShadow />
      <Instances placements={birches} geometry={birch.crown} material={materials.birchCrown} castShadow />
      <Instances placements={birches} geometry={birch.trunk} material={materials.birchTrunk} castShadow />
    </>
  );
}

/** Dense forest on the valley floor and along the rims above the walls. */
function ValleyForest() {
  const pine = usePineGeometry();
  const broadleaf = useBroadleafGeometry();
  const materials = useMemo(
    () => ({ conifer: material('#3a6136'), broadleaf: material('#5f8a3e'), rim: material('#45663b') }),
    [],
  );

  const floor = (random: () => number): [number, number] => {
    const z = -330 + random() * 280;
    return [valleyCenterX(z) + (random() * 2 - 1) * 52, z];
  };
  const rim = (random: () => number): [number, number] => {
    const z = -300 + random() * 240;
    const side = random() < 0.5 ? -1 : 1;
    return [valleyCenterX(z) + side * (55 + random() * 60), z];
  };

  const conifers = useMemo(
    () => scatter({ seed: 31, count: 1100, sample: floor, scale: [1.6, 3.2], maxSlope: 0.35, maxHeight: FLOOR_Y + 6 }),
    [],
  );
  const broadleaves = useMemo(
    () => scatter({ seed: 37, count: 260, sample: floor, scale: [1.4, 2.6], maxSlope: 0.3, maxHeight: FLOOR_Y + 4 }),
    [],
  );
  const rimTrees = useMemo(
    () => scatter({ seed: 41, count: 420, sample: rim, scale: [2.2, 3.6], maxSlope: 0.3, minHeight: FLOOR_Y + 28 }),
    [],
  );

  return (
    <>
      <Instances placements={conifers} geometry={pine.crown} material={materials.conifer} />
      <Instances placements={broadleaves} geometry={broadleaf.crown} material={materials.broadleaf} />
      <Instances placements={rimTrees} geometry={pine.crown} material={materials.rim} />
    </>
  );
}

function Boulders() {
  const geometry = useMemo(() => new IcosahedronGeometry(1, 0).scale(1.2, 0.7, 1), []);
  const granite = useMemo(() => material('#c9c4b9'), []);

  const meadow = (random: () => number): [number, number] => [-26 + random() * 52, -48 + random() * 49];
  const valley = (random: () => number): [number, number] => {
    const z = -200 + random() * 140;
    return [valleyCenterX(z) + (random() * 2 - 1) * 48, z];
  };

  const small = useMemo(
    () => scatter({ seed: 23, count: 34, sample: meadow, scale: [0.2, 0.9], minTrailDistance: 1.4, maxSlope: 0.8 }),
    [],
  );
  const erratics = useMemo(
    () => scatter({ seed: 29, count: 8, sample: meadow, scale: [1.4, 2.6], minTrailDistance: 4, maxSlope: 0.5 }),
    [],
  );
  const talus = useMemo(
    () => scatter({ seed: 43, count: 60, sample: valley, scale: [1, 2.4], maxSlope: 1.2, minHeight: FLOOR_Y + 1 }),
    [],
  );

  return (
    <>
      <Instances placements={small} geometry={geometry} material={granite} castShadow />
      <Instances placements={erratics} geometry={geometry} material={granite} castShadow />
      <Instances placements={talus} geometry={geometry} material={granite} />
    </>
  );
}

export function Vegetation() {
  return (
    <>
      <Meadow />
      <ValleyForest />
      <Boulders />
    </>
  );
}
