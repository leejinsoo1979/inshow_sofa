export default function Swatches({ items, active, onSelect, columns = 2 }) {
  return (
    <div className={`swatches ${columns === 2 ? "two-col" : "accent-grid"}`}>
      {items.map((item) => {
        const isActive = item.color === active?.color && item.label === active?.label;
        const style = { "--swatch": item.color };
        if (item.image) style["--swatch-image"] = `url("${item.image}")`;
        return (
          <button
            key={item.label + item.color}
            type="button"
            className={`swatch${isActive ? " active" : ""}`}
            style={style}
            data-label={item.label}
            title={item.label}
            aria-label={item.label}
            onClick={() => onSelect(item)}
          />
        );
      })}
    </div>
  );
}
