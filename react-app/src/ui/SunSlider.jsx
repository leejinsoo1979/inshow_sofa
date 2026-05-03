import { useConfigurator } from "../state/configurator";

export default function SunSlider() {
  const sunAngle = useConfigurator((s) => s.sunAngle);
  const setSunAngle = useConfigurator((s) => s.setSunAngle);
  return (
    <div className="sun-control" aria-label="햇빛 각도">
      <span className="sun-icon" aria-hidden="true">☀</span>
      <input
        type="range"
        min={0}
        max={360}
        step={1}
        value={sunAngle}
        onChange={(e) => setSunAngle(Number(e.target.value))}
      />
      <span>{sunAngle}°</span>
    </div>
  );
}
