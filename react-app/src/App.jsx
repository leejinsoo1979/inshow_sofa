import { useMemo, useRef } from "react";
import SidePanel from "./ui/SidePanel";
import Scene from "./scene/Scene";
import ToolRail from "./ui/ToolRail";
import SunSlider from "./ui/SunSlider";
import { useConfigurator } from "./state/configurator";
import { moduleCatalog } from "./data/catalog";
import { useKeyboardShortcuts } from "./ui/useKeyboardShortcuts";
import LoadingScreen from "./ui/LoadingScreen";

function useFootprintCm() {
  const modules = useConfigurator((s) => s.modules);
  return useMemo(() => {
    if (!modules.length) return { w: 0, d: 0 };
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const m of modules) {
      const spec = moduleCatalog[m.type];
      const hw = spec.width / 2, hd = spec.depth / 2;
      minX = Math.min(minX, m.x - hw);
      maxX = Math.max(maxX, m.x + hw);
      minZ = Math.min(minZ, m.z - hd);
      maxZ = Math.max(maxZ, m.z + hd);
    }
    return {
      w: Math.round((maxX - minX) * 1000),
      d: Math.round((maxZ - minZ) * 1000)
    };
  }, [modules]);
}

export default function App() {
  const { w, d } = useFootprintCm();
  const resetCameraRef = useRef(() => {});
  const zoomRef = useRef(() => {});
  const rotateRef = useRef(() => {});
  useKeyboardShortcuts(() => resetCameraRef.current?.());

  return (
    <>
    <LoadingScreen />
    <main className="app-shell">
      <section className="viewer" aria-label="3D sofa viewer">
        <Scene resetCameraRef={resetCameraRef} zoomRef={zoomRef} rotateRef={rotateRef} />
        <div className="brand-bar">
          <div>
            <p className="eyebrow">3D Configurator</p>
            <h1>INSHOW SOFA #1</h1>
          </div>
          <SunSlider />
          <div className="metrics">
            <span>W {w} mm</span>
            <span>D {d} mm</span>
          </div>
        </div>
        <ToolRail
          onResetCamera={() => resetCameraRef.current?.()}
          onZoom={(dir) => zoomRef.current?.(dir)}
          onRotate={(dir) => rotateRef.current?.(dir)}
        />
        <div className="scene-help">드래그 회전 · 휠 줌 · 소파 클릭 선택</div>
      </section>
      <SidePanel />
    </main>
    </>
  );
}
