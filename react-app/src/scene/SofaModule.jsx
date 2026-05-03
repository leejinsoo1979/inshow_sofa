import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { moduleCatalog, modelSources, modelMaterialRoles } from "../data/catalog";
import {
  importedMaterialRole,
  createUpholsteryMaterial,
  createBaseMaterial,
  createMetalMaterial,
  createTrayWoodMaterial
} from "./materials";
import { useConfigurator } from "../state/configurator";

// 사전 prefetch (선택)
Object.values(modelSources).forEach((src) => useGLTF.preload(src));

export default function SofaModule({ module: m }) {
  const sofaColor = useConfigurator((s) => s.sofaColor);
  const baseColor = useConfigurator((s) => s.baseColor);
  const trayWood = useConfigurator((s) => s.trayWood);
  const material = useConfigurator((s) => s.material);
  const setSelectedId = useConfigurator((s) => s.setSelectedId);
  const selectedId = useConfigurator((s) => s.selectedId);

  const spec = moduleCatalog[m.type];
  const url = modelSources[spec.model];
  const { scene } = useGLTF(url);
  const groupRef = useRef();

  // 클론은 한 번만 (모듈 인스턴스별로 고유)
  const clone = useMemo(() => scene.clone(true), [scene]);

  // 머티리얼 갱신 (sofaColor/baseColor/trayWood 변경 시마다)
  useEffect(() => {
    const isLeather = material === "naturalLeather";
    const ups = createUpholsteryMaterial(sofaColor, isLeather);
    const bas = createBaseMaterial(baseColor, isLeather);
    const met = createMetalMaterial();
    const tw = createTrayWoodMaterial(trayWood);
    const roles = modelMaterialRoles[spec.model];

    const remap = (mat) => {
      const role = importedMaterialRole(mat?.name, roles);
      if (role === "metal") return met.clone();
      if (role === "trayWood") return tw.clone();
      if (role === "base") return bas.clone();
      return ups.clone();
    };

    clone.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.geometry?.attributes?.color) child.geometry.deleteAttribute("color");
      child.material = Array.isArray(child.material)
        ? child.material.map(remap)
        : remap(child.material);
    });

    // 스케일/센터링: bounds 측정 후 catalog dimensions으로 정규화
    const bounds = new THREE.Box3().setFromObject(clone);
    const size = bounds.getSize(new THREE.Vector3());
    const scaleX = spec.width / Math.max(size.x, 1e-6);
    const scaleY = spec.height / Math.max(size.y, 1e-6);
    const scaleZ = spec.depth / Math.max(size.z, 1e-6);
    const mirrorSign = spec.mirror ? -1 : 1;
    clone.scale.set(scaleX * mirrorSign, scaleY, scaleZ);

    const newBounds = new THREE.Box3().setFromObject(clone);
    const center = newBounds.getCenter(new THREE.Vector3());
    clone.position.x = -center.x;
    clone.position.z = -center.z;
    clone.position.y = -newBounds.min.y;
  }, [clone, sofaColor, baseColor, trayWood, material, spec]);

  const isSelected = selectedId === m.id;

  return (
    <group
      ref={groupRef}
      position={[m.x, 0, m.z]}
      rotation={[0, m.rotation, 0]}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(m.id);
      }}
    >
      <primitive object={clone} />
      {isSelected && (
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.max(spec.width, spec.depth) * 0.42, Math.max(spec.width, spec.depth) * 0.45, 64]} />
          <meshBasicMaterial color={0x2563eb} transparent opacity={0.55} />
        </mesh>
      )}
    </group>
  );
}
