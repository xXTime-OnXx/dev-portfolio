export const FOG_COLOR = '#dce9ee';

export function Lighting() {
  return (
    <>
      <hemisphereLight args={['#e3f1ff', '#5d7a45', 1.15]} />
      <directionalLight
        castShadow
        position={[9, 12, 10]}
        intensity={2.4}
        color="#ffe4bd"
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={1}
        shadow-camera-far={60}
      />
      <fog attach="fog" args={[FOG_COLOR, 28, 135]} />
    </>
  );
}
