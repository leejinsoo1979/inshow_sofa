import { Html, Line } from "@react-three/drei";
import { useMemo } from "react";
import { useConfigurator } from "../state/configurator";
import { moduleCatalog } from "../data/catalog";

export default function DimensionLabels() {
  const modules = useConfigurator((s) => s.modules);
  const showDimensions = useConfigurator((s) => s.showDimensions);

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
      h: Math.round(maxH * 1000)
    };
  }, [modules]);

  if (!showDimensions || !bounds) return null;
  const { minX, maxX, minZ, maxZ, w, d } = bounds;
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;
  const yLine = 0.01;
  const padZ = 0.18;
  const padX = 0.18;

  return (
    <group>
      <Line points={[[minX, yLine, maxZ + padZ], [maxX, yLine, maxZ + padZ]]} color="#3d3d3a" dashed dashSize={0.05} gapSize={0.04} lineWidth={1} />
      <Line points={[[maxX + padX, yLine, minZ], [maxX + padX, yLine, maxZ]]} color="#3d3d3a" dashed dashSize={0.05} gapSize={0.04} lineWidth={1} />
      <Html position={[cx, yLine, maxZ + padZ]} center zIndexRange={[5, 0]}>
        <div className="dim-label" style={{ position: "static", transform: "translate(-50%, -50%)" }}>{w} cm</div>
      </Html>
      <Html position={[maxX + padX, yLine, cz]} center zIndexRange={[5, 0]}>
        <div className="dim-label" style={{ position: "static", transform: "translate(-50%, -50%)" }}>{d} cm</div>
      </Html>
    </group>
  );
}
