import { useConfigurator } from "../state/configurator";

export default function QualityToggle() {
  const renderQuality = useConfigurator((s) => s.renderQuality);
  const setRenderQuality = useConfigurator((s) => s.setRenderQuality);
  return (
    <div className="quality-toggle-floating" role="group" aria-label="렌더링 퀄리티">
      <button
        type="button"
        className={`quality-btn-fl${renderQuality === "high" ? " is-active" : ""}`}
        onClick={() => setRenderQuality("high")}
      >
        High
      </button>
      <button
        type="button"
        className={`quality-btn-fl${renderQuality === "medium" ? " is-active" : ""}`}
        onClick={() => setRenderQuality("medium")}
      >
        Medium
      </button>
    </div>
  );
}
