import { useConfigurator } from "../state/configurator";
import { moduleCatalog } from "../data/catalog";

export default function HotspotPopover() {
  const openSide = useConfigurator((s) => s.openHotspotSide);
  const setOpenSide = useConfigurator((s) => s.setOpenHotspotSide);
  const addModuleAtSide = useConfigurator((s) => s.addModuleAtSide);
  if (!openSide) return null;

  return (
    <div className="hotspot-popover is-open">
      <div className="popover-head">
        <span>추가할 모듈</span>
        <button onClick={() => setOpenSide(null)} aria-label="닫기">×</button>
      </div>
      <div className="thumbnail-grid">
        {Object.entries(moduleCatalog).map(([type, spec]) => (
          <button
            key={type}
            className="thumbnail-card"
            title={spec.label}
            onClick={() => {
              addModuleAtSide(type, openSide);
              setOpenSide(null);
            }}
          >
            <img src={spec.thumbnail} alt={spec.label} />
            <span>{spec.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
