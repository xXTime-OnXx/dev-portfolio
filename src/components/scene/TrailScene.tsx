import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useLayoutEffect, useState } from 'react';
import { MathUtils, PerspectiveCamera, Vector3 } from 'three';
import { CaveEntrance } from './CaveEntrance';
import { Lighting } from './Lighting';
import { Terrain } from './Terrain';
import { Trail } from './Trail';
import { BARRIER_POSITION, CLOSURE_SIGN, TrailBarrier } from './TrailBarrier';
import { Valley } from './Valley';
import { Vegetation } from './Vegetation';

interface Framing {
  fov: number;
  /** Share of the viewport width the closure sign should fill. */
  fill: number;
  /** Screen position of the sign, in normalized device coordinates. */
  signScreenX: number;
  signScreenY: number;
  eyeAboveSign: number;
  /** Sideways eye offset from the sign; the parallax shifts the distant cave on screen. */
  eyeOffsetX: number;
}

const LANDSCAPE: Framing = {
  fov: 40,
  fill: 0.22,
  signScreenX: -0.04,
  signScreenY: -0.28,
  eyeAboveSign: 0.2,
  eyeOffsetX: 0.4,
};
const PORTRAIT: Framing = {
  fov: 52,
  fill: 0.84,
  signScreenX: 0,
  signScreenY: -0.36,
  eyeAboveSign: 1.2,
  eyeOffsetX: -1.1,
};

/**
 * Fixed camera that keeps the closure sign legible: wide screens show more of
 * the valley, portrait screens move closer so the sign fills the width.
 */
function CameraRig() {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const { width, height } = useThree((state) => state.size);
  const invalidate = useThree((state) => state.invalidate);

  useLayoutEffect(() => {
    const aspect = width / height;
    const framing = aspect < 1 ? PORTRAIT : LANDSCAPE;
    const halfTan = Math.tan(MathUtils.degToRad(framing.fov / 2));

    const fitWidth = CLOSURE_SIGN.width / framing.fill / (2 * halfTan * aspect);
    const fitHeight = CLOSURE_SIGN.height / 0.36 / (2 * halfTan);
    const distance = MathUtils.clamp(Math.max(fitWidth, fitHeight), 3.6, 9);

    const sign = new Vector3(
      BARRIER_POSITION.x,
      BARRIER_POSITION.y + CLOSURE_SIGN.centerY,
      BARRIER_POSITION.z + CLOSURE_SIGN.z,
    );
    const eye = new Vector3(sign.x + framing.eyeOffsetX, sign.y + framing.eyeAboveSign, sign.z + distance);

    const signBelow = Math.atan2(eye.y - sign.y, distance);
    const pitch = Math.atan(-framing.signScreenY * halfTan) - signBelow;
    const signAside = Math.atan2(sign.x - eye.x, distance);
    const yaw = signAside - Math.atan(framing.signScreenX * halfTan * aspect);

    camera.fov = framing.fov;
    camera.aspect = aspect;
    camera.position.copy(eye);
    camera.lookAt(eye.x + Math.tan(yaw) * 50, eye.y + Math.tan(pitch) * 50, eye.z - 50);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, width, height, invalidate]);

  return null;
}

export default function TrailScene() {
  // The inline script in BaseLayout flags missing WebGL before hydration.
  const [webglAvailable] = useState(() => !document.documentElement.classList.contains('no-webgl'));
  if (!webglAvailable) return null;

  // No motion yet. Once camera or scroll animation is added, respect prefers-reduced-motion here.
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      shadows="percentage"
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: LANDSCAPE.fov, near: 0.1, far: 1000, position: [0, 1.8, 9] }}
    >
      <CameraRig />
      <Lighting />
      <Suspense fallback={null}>
        <Terrain />
        <Valley />
        <Vegetation />
        <Trail />
        <CaveEntrance />
        <TrailBarrier />
      </Suspense>
    </Canvas>
  );
}
