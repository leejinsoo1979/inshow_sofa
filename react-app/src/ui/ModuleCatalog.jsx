import { moduleCatalog } from "../data/catalog";
import { useConfigurator } from "../state/configurator";

export default function ModuleCatalog() {
  const replaceSelectedModule = useConfigurator((s) => s.replaceSelectedModule);
  const modules = useConfigurator((s) => s.modules);
  const selectedId = useConfigurator((s) => s.selectedId);
  const selected = modules.find((m) => m.id === selectedId);
  const activeType = selected?.type;

  return (
    <section className="control-group">
      <div className="group-title">
        <h3>소파 모듈</h3>
        <span>{modules.length}개 모듈</span>
      </div>
      <div className="module-grid">
        {Object.entries(moduleCatalog).map(([type, spec]) => (
          <button
            key={type}
            className={`module-option${activeType === type ? " is-active" : ""}`}
            title={spec.label}
            aria-label={spec.label}
            onClick={() => replaceSelectedModule(type)}
          >
            <img src={spec.thumbnail} alt="" />
            <span>{spec.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
