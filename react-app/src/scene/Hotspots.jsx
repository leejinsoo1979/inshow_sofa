import { useState, useMemo } from "react";
import { Html } from "@react-three/drei";
import { useConfigurator } from "../state/configurator";
import { moduleCatalog } from "../data/catalog";

export default function Hotspots() {
  const modules = useConfigurator((s) => s.modules);
  const addModuleAtSide = useConfigurator((s) => s.addModuleAtSide);
  const [openSide, setOpenSide] = useState(null);

  const { leftX, rightX, z, leftEnabled, rightEnabled } = useMemo(() => {
    if (!modules.length) return { leftX: -0.6, rightX: 0.6, z: 0, leftEnabled: false, rightEnabled: false };
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const m of modules) {
      const spec = moduleCatalog[m.type];
      const halfW = spec.width / 2, halfD = spec.depth / 2;
      minX = Math.min(minX, m.x - halfW);
      maxX = Math.max(maxX, m.x + halfW);
      minZ = Math.min(minZ, m.z - halfD);
      maxZ = Math.max(maxZ, m.z + halfD);
    }
    const sorted = [...modules].sort((a, b) => a.x - b.x);
    const leftMod = sorted[0];
    const rightMod = sorted[sorted.length - 1];
    const leftSpec = moduleCatalog[leftMod.type];
    const rightSpec = moduleCatalog[rightMod.type];
    // 회전 고려한 world openSides
    const worldOpen = (mod, spec) => {
      const step = ((Math.round((mod.rotation || 0) / (Math.PI / 2)) % 4) + 4) % 4;
      const map = {
        0: { left: "left", right: "right" },
        1: { left: "back", right: "front" },
        2: { left: "right", right: "left" },
        3: { left: "front", right: "back" }
      }[step];
      const set = new Set();
      (spec.openSides || []).forEach((s) => set.add(map[s]));
      return set;
    };
    const leftOpens = worldOpen(leftMod, leftSpec).has("left");
    const rightOpens = worldOpen(rightMod, rightSpec).has("right");
    const ghost = 1.15;
    return {
      leftX: minX - ghost / 2,
      rightX: maxX + ghost / 2,
      z: (minZ + maxZ) / 2,
      leftEnabled: leftOpens,
      rightEnabled: rightOpens
    };
  }, [modules]);

  const SvgPlus = () => (
    <svg viewBox="0 0 512 512" aria-hidden="true">
      <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM232 344V280H168c-13.3 0-24-10.7-24-24s10.7-24 24-24h64V168c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H280v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z" />
    </svg>
  );

  return (
    <>
      {leftEnabled && (
        <Html position={[leftX, 0.04, z]} center zIndexRange={[10, 0]}>
          <button
            className="side-hotspot"
            style={{ position: "static", animation: "hotspot-breathe 2.2s ease-in-out infinite" }}
            onClick={() => setOpenSide(openSide === "left" ? null : "left")}
            aria-label="왼쪽에 모듈 추가"
          >
            <SvgPlus />
          </button>
        </Html>
      )}
      {rightEnabled && (
        <Html position={[rightX, 0.04, z]} center zIndexRange={[10, 0]}>
          <button
            className="side-hotspot"
            style={{ position: "static", animation: "hotspot-breathe 2.2s ease-in-out infinite" }}
            onClick={() => setOpenSide(openSide === "right" ? null : "right")}
            aria-label="오른쪽에 모듈 추가"
          >
            <SvgPlus />
          </button>
        </Html>
      )}
      {openSide && (
        <Html fullscreen zIndexRange={[20, 0]}>
          <div
            className="hotspot-popover is-open"
            style={{
              pointerEvents: "auto",
              position: "fixed",
              left: 0,
              right: 420,
              bottom: 0,
              top: "auto",
              transform: "none"
            }}
          >
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
        </Html>
      )}
    </>
  );
}
