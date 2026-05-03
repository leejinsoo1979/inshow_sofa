import { useConfigurator } from "../state/configurator";

const SUN_RADIUS = 0.8;
const SUN_HEIGHT = 10;

export default function Lights() {
  const sunAngle = useConfigurator((s) => s.sunAngle);
  const rad = (sunAngle * Math.PI) / 180;
  const keyPos = [Math.cos(rad) * SUN_RADIUS, SUN_HEIGHT, Math.sin(rad) * SUN_RADIUS];
  return (
    <>
      <hemisphereLight args={[0xffffff, 0xf2eee6, 0.55]} />
      <directionalLight
        castShadow
        position={keyPos}
        intensity={2.0}
        color={0xfff4e0}
        shadow-mapSize={[256, 256]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-radius={80}
      >
        <orthographicCamera attach="shadow-camera" args={[-8, 8, 8, -8, 1, 18]} />
      </directionalLight>
      <directionalLight position={[5, 3.5, 2]} intensity={0.45} color={0xeaf0ff} />
      <directionalLight position={[-3, 4, -5]} intensity={0.36} color={0xffe9c8} />
    </>
  );
}
