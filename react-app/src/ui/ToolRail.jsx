import { useConfigurator } from "../state/configurator";

export default function ToolRail({ onResetCamera }) {
  const showDimensions = useConfigurator((s) => s.showDimensions);
  const toggleDimensions = useConfigurator((s) => s.toggleDimensions);
  return (
    <div className="tool-rail" aria-label="View controls">
      <button className="icon-btn" onClick={onResetCamera} title="Reset view" aria-label="Reset view">⌂</button>
      <button className={`icon-btn${showDimensions ? " is-active" : ""}`} onClick={toggleDimensions} title="치수 표시">
        <svg viewBox="0 0 15 15" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M0.5 10.5L0.5 4.5L14.5 4.5L14.5 10.5L0.5 10.5Z" />
          <path d="M2.5 4.5L2.5 7" />
          <path d="M4.5 4.5L4.5 8" />
          <path d="M6.5 4.5L6.5 7" />
          <path d="M8.5 4.5L8.5 8" />
          <path d="M10.5 4.5L10.5 7" />
          <path d="M12.5 4.5L12.5 8" />
        </svg>
      </button>
    </div>
  );
}
