import { Html } from "@react-three/drei";
import { useConfigurator } from "../state/configurator";
import { moduleCatalog } from "../data/catalog";

export default function ModuleToolbar() {
  const modules = useConfigurator((s) => s.modules);
  const selectedId = useConfigurator((s) => s.selectedId);
  const rotateSelected = useConfigurator((s) => s.rotateSelected);
  const removeSelected = useConfigurator((s) => s.removeSelected);

  const sel = modules.find((m) => m.id === selectedId);
  if (!sel) return null;
  const spec = moduleCatalog[sel.type];

  return (
    <Html position={[sel.x, spec.height + 0.25, sel.z]} center>
      <div className="module-toolbar is-open" style={{ position: "static", display: "flex" }}>
        <button onClick={() => rotateSelected(-1)} aria-label="왼쪽으로 회전">↺</button>
        <button onClick={() => rotateSelected(1)} aria-label="오른쪽으로 회전">↻</button>
        <button onClick={() => removeSelected()} aria-label="삭제">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </button>
      </div>
    </Html>
  );
}
