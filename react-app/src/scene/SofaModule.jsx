import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { clone as cloneSkinned } from "three/examples/jsm/utils/SkeletonUtils.js";
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

  const spec = moduleCatalog[m.type];
  const url = modelSources[spec.model];
  const { scene } = useGLTF(url);
  const groupRef = useRef();

  // 클론은 한 번만 (모듈 인스턴스별로 고유)
  const clone = useMemo(() => cloneSkinned(scene), [scene]);

  // 1) 스케일/위치는 clone/spec 변경 시 한 번만 (vanilla 공식)
  useEffect(() => {
    const initialBounds = new THREE.Box3().setFromObject(clone);
    const initialSize = initialBounds.getSize(new THREE.Vector3());
    const mirror = spec.mirror ? -1 : 1;
    // X/Z는 width/depth로 정규화, Y는 X와 같은 비율로 (가로세로 비례 유지 → 납작 안 됨)
    const scaleX = Number.isFinite(spec.width / initialSize.x) ? spec.width / initialSize.x : 1;
    const scaleZ = Number.isFinite(spec.depth / initialSize.z) ? spec.depth / initialSize.z : 1;
    const scaleY = scaleX; // Y를 X 비율로 묶음 — GLB 원본 비례 유지
    clone.scale.set(scaleX * mirror, scaleY, scaleZ);

    clone.position.set(0, 0, 0);
    clone.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(clone);
    const center = bounds.getCenter(new THREE.Vector3());
    clone.position.x -= center.x;
    clone.position.z -= center.z;
    clone.position.y -= bounds.min.y;
  }, [clone, spec]);

  // 2) 머티리얼만 갱신 (위치/스케일 안 건드림)
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
      child.userData.isModuleMesh = true;
      if (child.geometry?.attributes?.color) child.geometry.deleteAttribute("color");
      child.material = Array.isArray(child.material)
        ? child.material.map(remap)
        : remap(child.material);
    });
  }, [clone, sofaColor, baseColor, trayWood, material, spec]);

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
    </group>
  );
}
