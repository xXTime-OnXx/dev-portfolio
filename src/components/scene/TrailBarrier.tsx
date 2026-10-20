import { Text } from '@react-three/drei';
import { useMemo } from 'react';
import { BoxGeometry, ExtrudeGeometry, Shape, ShapeGeometry } from 'three';
import { site } from '../../config/site';
import { BARRIER_Z, trailPointAtZ } from './landscape';

const FONT_BOLD = '/fonts/roboto-slab-700.woff';
const FONT_REGULAR = '/fonts/roboto-slab-400.woff';

export const BARRIER_POSITION = trailPointAtZ(BARRIER_Z);

/** Closure board size and placement relative to the barrier origin; used for camera framing. */
export const CLOSURE_SIGN = { width: 2.0, height: 1.0, centerY: 1.55, z: 0.1 } as const;

const RED = '#d2382f';
const WHITE = '#f4f2ec';
const WOOD = '#8b5e3c';
const WOOD_LIGHT = '#ead7ae';
const INK = '#1d2a33';

function StripedRail({ y, length = 2.9, segments = 10 }: { y: number; length?: number; segments?: number }) {
  const segment = length / segments;
  const geometry = useMemo(() => new BoxGeometry(segment, 0.2, 0.05), [segment]);

  return (
    <group position={[0, y, 0.06]}>
      {Array.from({ length: segments }, (_, i) => (
        <mesh key={i} geometry={geometry} position-x={-length / 2 + segment * (i + 0.5)} castShadow>
          <meshStandardMaterial color={i % 2 === 0 ? RED : WHITE} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function AFrame({ x }: { x: number }) {
  return (
    <group position-x={x}>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0, 0.52, side * 0.12]} rotation-x={side * 0.22} castShadow>
          <boxGeometry args={[0.07, 1.1, 0.07]} />
          <meshStandardMaterial color={WOOD} flatShading roughness={1} />
        </mesh>
      ))}
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.06, 0.06, 0.5]} />
        <meshStandardMaterial color={WOOD} roughness={1} />
      </mesh>
    </group>
  );
}

function ClosureSign() {
  const { heading, body, note } = site.closureSign;
  const { width, height, centerY, z } = CLOSURE_SIGN;

  return (
    <group position={[0, centerY, z]}>
      <mesh castShadow>
        <boxGeometry args={[width, height, 0.04]} />
        <meshStandardMaterial color={WOOD} flatShading roughness={1} />
      </mesh>
      <mesh position-z={0.01}>
        <boxGeometry args={[width - 0.1, height - 0.1, 0.045]} />
        <meshStandardMaterial color={WOOD_LIGHT} roughness={1} />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sy) => (
          <mesh key={`${sx}${sy}`} position={[sx * (width / 2 - 0.12), sy * (height / 2 - 0.12), 0.04]}>
            <cylinderGeometry args={[0.022, 0.022, 0.02, 6]} />
            <meshStandardMaterial color="#4a3a2e" />
          </mesh>
        )),
      )}

      <group position-z={0.036}>
        <Text
          font={FONT_BOLD}
          fontSize={0.21}
          letterSpacing={0.04}
          color={RED}
          anchorX="center"
          anchorY="middle"
          position-y={0.25}
        >
          {heading.toUpperCase()}
        </Text>
        <Text
          font={FONT_REGULAR}
          fontSize={0.09}
          lineHeight={1.35}
          color={INK}
          anchorX="center"
          anchorY="middle"
          textAlign="center"
          position-y={-0.04}
        >
          {body.join('\n')}
        </Text>
        <Text
          font={FONT_REGULAR}
          fontSize={0.06}
          color="#5a4a3a"
          anchorX="center"
          anchorY="middle"
          position-y={-0.3}
        >
          {note}
        </Text>
      </group>
    </group>
  );
}

const ARROW = { length: 1.05, height: 0.2, tip: 0.16, depth: 0.03 } as const;

function useArrowGeometries() {
  return useMemo(() => {
    const { length, height, tip, depth } = ARROW;
    const half = height / 2;

    const board = new Shape();
    board.moveTo(0, -half);
    board.lineTo(length - tip, -half);
    board.lineTo(length, 0);
    board.lineTo(length - tip, half);
    board.lineTo(0, half);
    board.closePath();

    const tipShape = (scaleY: number) => {
      const s = new Shape();
      s.moveTo(length - tip, -half * scaleY);
      s.lineTo(length, 0);
      s.lineTo(length - tip, half * scaleY);
      s.closePath();
      return new ShapeGeometry(s);
    };

    return {
      board: new ExtrudeGeometry(board, { depth, bevelEnabled: false }),
      tipWhite: tipShape(1),
      tipRed: tipShape(0.4),
    };
  }, []);
}

/** Yellow hiking-trail arrow with the white-red-white tip of a mountain trail. */
function TrailArrow({ y, destination, time }: { y: number; destination: string; time: string }) {
  const { board, tipWhite, tipRed } = useArrowGeometries();
  const front = ARROW.depth + 0.002;

  return (
    <group position={[0.05, y, 0.05]}>
      <mesh geometry={board} castShadow>
        <meshStandardMaterial color="#f2c230" roughness={0.6} />
      </mesh>
      <mesh geometry={tipWhite} position-z={front}>
        <meshStandardMaterial color={WHITE} roughness={0.6} />
      </mesh>
      <mesh geometry={tipRed} position-z={front + 0.001}>
        <meshStandardMaterial color={RED} roughness={0.6} />
      </mesh>
      <Text font={FONT_BOLD} fontSize={0.075} color="#1a1a1a" anchorX="left" anchorY="middle" position={[0.07, 0, front]}>
        {destination}
      </Text>
      <Text
        font={FONT_REGULAR}
        fontSize={0.06}
        color="#1a1a1a"
        anchorX="right"
        anchorY="middle"
        position={[ARROW.length - ARROW.tip - 0.04, 0, front]}
      >
        {time}
      </Text>
    </group>
  );
}

function Signpost({ x }: { x: number }) {
  const { location, signs } = site.signpost;

  return (
    <group position={[x, 0, 0.1]}>
      <mesh position-y={1.2} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 2.4, 10]} />
        <meshStandardMaterial color="#9aa0a5" metalness={0.4} roughness={0.5} />
      </mesh>
      <group position={[0.05, 2.25, 0.05]}>
        <mesh position-x={0.45} castShadow>
          <boxGeometry args={[0.9, 0.17, 0.03]} />
          <meshStandardMaterial color={WHITE} roughness={0.6} />
        </mesh>
        <Text font={FONT_BOLD} fontSize={0.075} color="#1a1a1a" anchorX="center" anchorY="middle" position={[0.45, 0, 0.017]}>
          {location}
        </Text>
      </group>
      {signs.map((sign, i) => (
        <TrailArrow key={sign.destination} y={2.0 - i * 0.25} destination={sign.destination} time={sign.time} />
      ))}
    </group>
  );
}

function TrafficCone({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position-y={0.02} castShadow>
        <boxGeometry args={[0.38, 0.04, 0.38]} />
        <meshStandardMaterial color="#e8692a" roughness={0.7} />
      </mesh>
      <mesh position-y={0.28} castShadow>
        <coneGeometry args={[0.16, 0.5, 12]} />
        <meshStandardMaterial color="#f07a2a" roughness={0.6} />
      </mesh>
      <mesh position-y={0.3}>
        <cylinderGeometry args={[0.083, 0.106, 0.08, 12]} />
        <meshStandardMaterial color={WHITE} roughness={0.6} />
      </mesh>
    </group>
  );
}

export function TrailBarrier() {
  return (
    <group position={BARRIER_POSITION}>
      <AFrame x={-1.3} />
      <AFrame x={1.3} />
      {[-0.75, 0.75].map((x) => (
        <mesh key={x} position={[x, 1.05, 0]} castShadow>
          <boxGeometry args={[0.07, 2.1, 0.07]} />
          <meshStandardMaterial color={WOOD} flatShading roughness={1} />
        </mesh>
      ))}
      <StripedRail y={0.95} />
      <StripedRail y={0.5} />
      <ClosureSign />
      <Signpost x={-2.35} />
      <TrafficCone position={[1.8, 0, 0.35]} />
    </group>
  );
}
