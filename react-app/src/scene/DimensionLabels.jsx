import { Html, Line } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useConfigurator } from "../state/configurator";
import { moduleCatalog } from "../data/catalog";

export default function DimensionLabels() {
  const modules = useConfigurator((s) => s.modules);
  const showDimensions = useConfigurator((s) => s.showDimensions);
  const [behind, setBehind] = useState(false);
  const [rightSide, setRightSide] = useState(true);
  const lastBehindRef = useRef(false);
  const lastSideRef = useRef(true);

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
    // 핫스팟 위치 (어느 쪽에 있는지) 계산 — H는 핫스팟 반대쪽
    const sorted = [...modules].sort((a, b) => a.x - b.x);
    const leftSpec = moduleCatalog[sorted[0].type];
    const rightSpec = moduleCatalog[sorted[sorted.length - 1].type];
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
    const leftHasHotspot = worldOpen(sorted[0], leftSpec).has("left");
    const rightHasHotspot = worldOpen(sorted[sorted.length - 1], rightSpec).has("right");
    return {
      minX, maxX, minZ, maxZ, maxH,
      w: Math.round((maxX - minX) * 100),
      d: Math.round((maxZ - minZ) * 100),
      h: Math.round(maxH * 100),
      leftHasHotspot, rightHasHotspot
    };
  }, [modules]);

  useFrame(({ camera }) => {
    if (!bounds) return;
    const cz0 = (bounds.minZ + bounds.maxZ) / 2;
    const cx0 = (bounds.minX + bounds.maxX) / 2;
    const isBehind = camera.position.z < cz0;
    const isRight = camera.position.x >= cx0;
    if (isBehind !== lastBehindRef.current) {
      lastBehindRef.current = isBehind;
      setBehind(isBehind);
    }
    if (isRight !== lastSideRef.current) {
      lastSideRef.current = isRight;
      setRightSide(isRight);
    }
  });

  if (!showDimensions || !bounds) return null;
  const { minX, maxX, minZ, maxZ, maxH, w, d, h, leftHasHotspot, rightHasHotspot } = bounds;
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  const yLine = 0.01;
  const padZ = 0.22;
  const padX = 0.22;

  const dashSize = 0.02;
  const gapSize = 0.018;
  const dotR = 0.018;

  const Dot = ({ position }) => (
    <mesh position={position}>
      <sphereGeometry args={[dotR, 16, 16]} />
      <meshBasicMaterial color="#3d3d3a" />
    </mesh>
  );

  return (
    <group>
      {/* W */}
      <Line points={[[minX, yLine, maxZ + padZ], [maxX, yLine, maxZ + padZ]]} color="#3d3d3a" dashed dashSize={dashSize} gapSize={gapSize} lineWidth={1} />
      <Line points={[[minX, yLine, maxZ], [minX, yLine, maxZ + padZ]]} color="#3d3d3a" dashed dashSize={dashSize} gapSize={gapSize} lineWidth={1} />
      <Line points={[[maxX, yLine, maxZ], [maxX, yLine, maxZ + padZ]]} color="#3d3d3a" dashed dashSize={dashSize} gapSize={gapSize} lineWidth={1} />
      <Dot position={[minX, yLine, maxZ + padZ]} />
      <Dot position={[maxX, yLine, maxZ + padZ]} />

      {/* D */}
      <Line points={[[maxX + padX, yLine, minZ], [maxX + padX, yLine, maxZ]]} color="#3d3d3a" dashed dashSize={dashSize} gapSize={gapSize} lineWidth={1} />
      <Line points={[[maxX, yLine, minZ], [maxX + padX, yLine, minZ]]} color="#3d3d3a" dashed dashSize={dashSize} gapSize={gapSize} lineWidth={1} />
      <Line points={[[maxX, yLine, maxZ], [maxX + padX, yLine, maxZ]]} color="#3d3d3a" dashed dashSize={dashSize} gapSize={gapSize} lineWidth={1} />
      <Dot position={[maxX + padX, yLine, minZ]} />
      <Dot position={[maxX + padX, yLine, maxZ]} />

      <Html position={[cx, yLine, maxZ + padZ]} center zIndexRange={[5, 0]}>
        <div className="dim-label" style={{ position: "static", transform: "none" }}>{w} cm</div>
      </Html>
      <Html position={[maxX + padX, yLine, cz]} center zIndexRange={[5, 0]}>
        <div className="dim-label" style={{ position: "static", transform: "none" }}>{d} cm</div>
      </Html>

      {behind && (() => {
        // H는 핫스팟 반대쪽
        let hx;
        if (leftHasHotspot && !rightHasHotspot) hx = maxX; // 핫스팟 좌측만 → H 우측
        else if (rightHasHotspot && !leftHasHotspot) hx = minX; // 핫스팟 우측만 → H 좌측
        else hx = rightSide ? maxX : minX; // 양쪽 또는 없음 → 카메라 가까운 쪽
        return (
          <>
            <Line points={[[hx, 0, minZ - padZ], [hx, maxH, minZ - padZ]]} color="#3d3d3a" dashed dashSize={dashSize} gapSize={gapSize} lineWidth={1} />
            <Line points={[[hx, 0, minZ], [hx, 0, minZ - padZ]]} color="#3d3d3a" dashed dashSize={dashSize} gapSize={gapSize} lineWidth={1} />
            <Line points={[[hx, maxH, minZ], [hx, maxH, minZ - padZ]]} color="#3d3d3a" dashed dashSize={dashSize} gapSize={gapSize} lineWidth={1} />
            <Dot position={[hx, 0, minZ - padZ]} />
            <Dot position={[hx, maxH, minZ - padZ]} />
            <Html position={[hx, maxH / 2, minZ - padZ]} center zIndexRange={[5, 0]}>
              <div className="dim-label" style={{ position: "static", transform: "none" }}>{h} cm</div>
            </Html>
          </>
        );
      })()}
    </group>
  );
}
