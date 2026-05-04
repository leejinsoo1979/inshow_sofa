import { useMemo, useRef, useState } from "react";
import SidePanel from "./ui/SidePanel";
import Scene from "./scene/Scene";
import ToolRail from "./ui/ToolRail";
import SunSlider from "./ui/SunSlider";
import { useConfigurator } from "./state/configurator";
import { moduleCatalog } from "./data/catalog";
import { useKeyboardShortcuts } from "./ui/useKeyboardShortcuts";
import LoadingScreen from "./ui/LoadingScreen";
import HotspotPopover from "./ui/HotspotPopover";
import StudioLightingPopover from "./ui/StudioLightingPopover";

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

const SOFA_URL = "https://inshowstore.com/products/sofa/";

export default function App() {
  const { w, d } = useFootprintCm();
  const resetCameraRef = useRef(() => {});
  const zoomRef = useRef(() => {});
  const rotateRef = useRef(() => {});
  useKeyboardShortcuts(() => resetCameraRef.current?.());
  const [showSofaModal, setShowSofaModal] = useState(false);

  const onTitleClick = () => {
    const isMobile = typeof window !== "undefined"
      && window.matchMedia("(max-width: 900px)").matches;
    if (isMobile) {
      window.location.href = SOFA_URL;
    } else {
      setShowSofaModal(true);
    }
  };

  return (
    <>
    <LoadingScreen />
    <main className="app-shell">
      <section className="viewer" aria-label="3D sofa viewer">
        <Scene resetCameraRef={resetCameraRef} zoomRef={zoomRef} rotateRef={rotateRef} />
        <div className="brand-bar">
          <div>
            <h1
              className="brand-title"
              onClick={onTitleClick}
              style={{ cursor: "pointer" }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onTitleClick(); }}
            >
              INSHOW SOFA #1
            </h1>
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
        <HotspotPopover />
        <StudioLightingPopover />
      </section>
      <SidePanel />
    </main>
    {showSofaModal && (
      <div
        className="sofa-modal-backdrop"
        role="dialog"
        aria-modal="true"
        onClick={() => setShowSofaModal(false)}
      >
        <div className="sofa-modal" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="sofa-modal-close"
            onClick={() => setShowSofaModal(false)}
            aria-label="닫기"
          >×</button>
          <iframe
            src={SOFA_URL}
            title="INSHOW SOFA"
            className="sofa-modal-iframe"
          />
        </div>
      </div>
    )}
    </>
  );
}
