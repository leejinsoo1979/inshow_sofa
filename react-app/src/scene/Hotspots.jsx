import { useState, useMemo } from "react";
import { Html } from "@react-three/drei";
import { useConfigurator } from "../state/configurator";
import { moduleCatalog } from "../data/catalog";

export default function Hotspots() {
  const modules = useConfigurator((s) => s.modules);
  const addModuleAtSide = useConfigurator((s) => s.addModuleAtSide);
  const [openSide, setOpenSide] = useState(null);

  // 가장 좌/우 끝 위치 계산
  const { leftX, rightX } = useMemo(() => {
    if (!modules.length) return { leftX: -0.6, rightX: 0.6 };
    let minX = Infinity, maxX = -Infinity;
    for (const m of modules) {
      const spec = moduleCatalog[m.type];
      const halfW = spec.width / 2;
      const lx = m.x - halfW;
      const rx = m.x + halfW;
      if (lx < minX) minX = lx;
      if (rx > maxX) maxX = rx;
    }
    return { leftX: minX - 0.45, rightX: maxX + 0.45 };
  }, [modules]);

  return (
    <>
      <Html position={[leftX, 0.35, 0]} center zIndexRange={[10, 0]}>
        <button
          className="side-hotspot"
          onClick={() => setOpenSide(openSide === "left" ? null : "left")}
          aria-label="왼쪽에 모듈 추가"
        >
          <svg viewBox="0 0 512 512" aria-hidden="true">
            <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM232 344V280H168c-13.3 0-24-10.7-24-24s10.7-24 24-24h64V168c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H280v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z" />
          </svg>
        </button>
      </Html>
      <Html position={[rightX, 0.35, 0]} center zIndexRange={[10, 0]}>
        <button
          className="side-hotspot"
          onClick={() => setOpenSide(openSide === "right" ? null : "right")}
          aria-label="오른쪽에 모듈 추가"
        >
          <svg viewBox="0 0 512 512" aria-hidden="true">
            <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM232 344V280H168c-13.3 0-24-10.7-24-24s10.7-24 24-24h64V168c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H280v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z" />
          </svg>
        </button>
      </Html>
      {openSide && (
        <Html fullscreen zIndexRange={[20, 0]}>
          <div className="hotspot-popover is-open" style={{ pointerEvents: "auto" }}>
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
