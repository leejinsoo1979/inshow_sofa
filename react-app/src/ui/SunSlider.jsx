import { useConfigurator } from "../state/configurator";

export default function SunSlider() {
  const time = useConfigurator((s) => s.sun.time);
  const setSunTime = useConfigurator((s) => s.setSunTime);
  const hh = Math.floor(time);
  const mm = Math.round((time - hh) * 60);
  const label = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  return (
    <div className="sun-control" aria-label="태양 시간">
      <span className="sun-icon" aria-hidden="true">☀</span>
      <input
        type="range"
        min={0}
        max={24}
        step={0.25}
        value={time}
        onChange={(e) => setSunTime(Number(e.target.value))}
      />
      <span>{label}</span>
    </div>
  );
}
