import { moduleCatalog } from "../data/catalog";
import { useConfigurator } from "../state/configurator";

const fmtKRW = (n) => (n || 0).toLocaleString("ko-KR");

export default function ModuleCatalog() {
  const replaceSelectedModule = useConfigurator((s) => s.replaceSelectedModule);
  const modules = useConfigurator((s) => s.modules);
  const selectedId = useConfigurator((s) => s.selectedId);
  const material = useConfigurator((s) => s.material);
  const selected = modules.find((m) => m.id === selectedId) || modules[0];
  const activeType = selected?.type;
  const priceKey = material === "naturalLeather" ? "leather" : "fabric";

  return (
    <section className="control-group">
      <div className="group-title">
        <h3>소파 모듈</h3>
        <span>{modules.length}개 모듈</span>
      </div>
      <div className="module-grid">
        {Object.entries(moduleCatalog).map(([type, spec]) => {
          const price = spec.price?.[priceKey];
          return (
            <button
              key={type}
              className={`module-option${activeType === type ? " is-active" : ""}`}
              title={spec.label}
              aria-label={spec.label}
              onClick={() => replaceSelectedModule(type)}
            >
              <img src={spec.thumbnail} alt="" />
              <span className="module-label">{spec.label}</span>
              {price ? <span className="module-price">{fmtKRW(price)}원</span> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
