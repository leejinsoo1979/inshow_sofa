export default function RangeControl({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
  suffix = "",
  className = ""
}) {
  const progress = ((value - min) / (max - min)) * 100;
  const display = formatValue ? formatValue(value) : value;

  return (
    <label className={`range-field ${className}`.trim()} style={{ "--range-progress": `${progress}%` }}>
      <div className="range-head">
        <span>{label}</span>
        <strong>{display}{suffix}</strong>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
