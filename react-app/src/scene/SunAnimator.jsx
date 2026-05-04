import { useFrame } from "@react-three/fiber";
import { useConfigurator } from "../state/configurator";

export default function SunAnimator() {
  const playing = useConfigurator((s) => s.sun.playing);
  const stepSunTime = useConfigurator((s) => s.stepSunTime);

  useFrame((_, delta) => {
    if (!playing) return;
    stepSunTime(delta * 0.05);
  });

  return null;
}
