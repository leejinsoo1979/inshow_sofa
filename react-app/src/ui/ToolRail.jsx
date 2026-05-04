import { useConfigurator } from "../state/configurator";

export default function ToolRail({ onResetCamera, onZoom, onRotate }) {
  const showDimensions = useConfigurator((s) => s.showDimensions);
  const toggleDimensions = useConfigurator((s) => s.toggleDimensions);
  const openLightingPanel = useConfigurator((s) => s.openLightingPanel);
  const setOpenLightingPanel = useConfigurator((s) => s.setOpenLightingPanel);
  return (
    <div className="tool-rail" aria-label="View controls">
      <button className="icon-btn" onClick={onResetCamera} title="Reset view" aria-label="Reset view">⌂</button>
      <button className="icon-btn" onClick={() => onZoom?.(-1)} title="Zoom in" aria-label="Zoom in">+</button>
      <button className="icon-btn" onClick={() => onZoom?.(1)} title="Zoom out" aria-label="Zoom out">−</button>
      <button className="icon-btn" onClick={() => onRotate?.(-1)} title="Rotate left" aria-label="Rotate left">↺</button>
      <button className="icon-btn" onClick={() => onRotate?.(1)} title="Rotate right" aria-label="Rotate right">↻</button>
      <button
        className={`icon-btn${openLightingPanel ? " is-active" : ""}`}
        onClick={() => setOpenLightingPanel(!openLightingPanel)}
        title="스튜디오 조명"
        aria-pressed={openLightingPanel}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18h6" />
          <path d="M10 21h4" />
          <path d="M6 8a6 6 0 1 1 12 0c0 2.4-1.2 3.6-2.6 5.1-.7.7-1.4 1.5-1.7 2.4H10.3c-.3-.9-1-1.7-1.7-2.4C7.2 11.6 6 10.4 6 8Z" />
        </svg>
      </button>
      <button
        className={`icon-btn${showDimensions ? " is-active" : ""}`}
        onClick={toggleDimensions}
        title="치수 표시"
        aria-pressed={showDimensions}
      >
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
