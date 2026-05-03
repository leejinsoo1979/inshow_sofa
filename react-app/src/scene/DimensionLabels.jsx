import { Html, Line } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useConfigurator } from "../state/configurator";
import { moduleCatalog } from "../data/catalog";

export default function DimensionLabels() {
  const modules = useConfigurator((s) => s.modules);
  const showDimensions = useConfigurator((s) => s.showDimensions);
  const [behind, setBehind] = useState(false);
  const lastRef = useRef(false);

  const bounds = useMemo(() => {
    if (!modules.length) return null;
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, maxH = 0;
    for (const m of modules) {
      const spec = moduleCatalog[m.type];
      const hw = spec.width / 2, hd = spec.depth / 2;
      minX = Math.min(minX, m.x - hw);
      maxX = Math.max(maxX, m.x + hw);
      minZ = Math.min(minZ, m.z - hd);
      maxZ = Math.max(maxZ, m.z + hd);
      maxH = Math.max(maxH, spec.height);
    }
    return {
      minX, maxX, minZ, maxZ, maxH,
      w: Math.round((maxX - minX) * 100),
      d: Math.round((maxZ - minZ) * 100),
      h: Math.round(maxH * 100)
    };
  }, [modules]);

  // 카메라가 모듈 뒤(z<minZ)에 있는지 체크 → 뒤쪽 보일 때만 H 표시
  useFrame(({ camera }) => {
    if (!bounds) return;
    const isBehind = camera.position.z < (bounds.minZ + bounds.maxZ) / 2;
    if (isBehind !== lastRef.current) {
      lastRef.current = isBehind;
      setBehind(isBehind);
    }
  });

  if (!showDimensions || !bounds) return null;
  const { minX, maxX, minZ, maxZ, maxH, w, d, h } = bounds;
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  const yLine = 0.01;
  const padZ = 0.22;
  const padX = 0.22;

  const dashSize = 0.02;
  const gapSize = 0.018;
  const tick = 0.05; // 끝점 마크 길이

  return (
    <group>
      {/* W 점선 + 양끝 tick (모듈에 수직) */}
      <Line points={[[minX, yLine, maxZ + padZ], [maxX, yLine, maxZ + padZ]]} color="#3d3d3a" dashed dashSize={dashSize} gapSize={gapSize} lineWidth={1} />
      <Line points={[[minX, yLine, maxZ + padZ - tick], [minX, yLine, maxZ + padZ + tick]]} color="#3d3d3a" lineWidth={1.5} />
      <Line points={[[maxX, yLine, maxZ + padZ - tick], [maxX, yLine, maxZ + padZ + tick]]} color="#3d3d3a" lineWidth={1.5} />
      {/* 모듈 가장자리 → tick 연결선 */}
      <Line points={[[minX, yLine, maxZ], [minX, yLine, maxZ + padZ]]} color="#3d3d3a" dashed dashSize={dashSize} gapSize={gapSize} lineWidth={1} />
      <Line points={[[maxX, yLine, maxZ], [maxX, yLine, maxZ + padZ]]} color="#3d3d3a" dashed dashSize={dashSize} gapSize={gapSize} lineWidth={1} />

      {/* D 점선 + 양끝 tick */}
      <Line points={[[maxX + padX, yLine, minZ], [maxX + padX, yLine, maxZ]]} color="#3d3d3a" dashed dashSize={dashSize} gapSize={gapSize} lineWidth={1} />
      <Line points={[[maxX + padX - tick, yLine, minZ], [maxX + padX + tick, yLine, minZ]]} color="#3d3d3a" lineWidth={1.5} />
      <Line points={[[maxX + padX - tick, yLine, maxZ], [maxX + padX + tick, yLine, maxZ]]} color="#3d3d3a" lineWidth={1.5} />
      <Line points={[[maxX, yLine, minZ], [maxX + padX, yLine, minZ]]} color="#3d3d3a" dashed dashSize={dashSize} gapSize={gapSize} lineWidth={1} />
      <Line points={[[maxX, yLine, maxZ], [maxX + padX, yLine, maxZ]]} color="#3d3d3a" dashed dashSize={dashSize} gapSize={gapSize} lineWidth={1} />

      <Html position={[cx, yLine, maxZ + padZ]} center zIndexRange={[5, 0]}>
        <div className="dim-label" style={{ position: "static", transform: "none" }}>{w} cm</div>
      </Html>
      <Html position={[maxX + padX, yLine, cz]} center zIndexRange={[5, 0]}>
        <div className="dim-label" style={{ position: "static", transform: "none" }}>{d} cm</div>
      </Html>

      {behind && (
        <>
          <Line points={[[minX, 0, minZ - padZ], [minX, maxH, minZ - padZ]]} color="#3d3d3a" dashed dashSize={dashSize} gapSize={gapSize} lineWidth={1} />
          <Line points={[[minX - tick, 0, minZ - padZ], [minX + tick, 0, minZ - padZ]]} color="#3d3d3a" lineWidth={1.5} />
          <Line points={[[minX - tick, maxH, minZ - padZ], [minX + tick, maxH, minZ - padZ]]} color="#3d3d3a" lineWidth={1.5} />
          <Line points={[[minX, 0, minZ], [minX, 0, minZ - padZ]]} color="#3d3d3a" dashed dashSize={dashSize} gapSize={gapSize} lineWidth={1} />
          <Line points={[[minX, maxH, minZ], [minX, maxH, minZ - padZ]]} color="#3d3d3a" dashed dashSize={dashSize} gapSize={gapSize} lineWidth={1} />
          <Html position={[minX, maxH / 2, minZ - padZ]} center zIndexRange={[5, 0]}>
            <div className="dim-label" style={{ position: "static", transform: "none" }}>{h} cm</div>
          </Html>
        </>
      )}
    </group>
  );
}
