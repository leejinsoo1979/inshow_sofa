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
      child.userData.isModuleMesh = true;
      if (child.geometry?.attributes?.color) child.geometry.deleteAttribute("color");
      child.material = Array.isArray(child.material)
        ? child.material.map(remap)
        : remap(child.material);
    });

    // vanilla 동일: scale 적용 → group에 add는 r3f가 알아서 → bounds → 위치 보정
    const initialBounds = new THREE.Box3().setFromObject(clone);
    const initialSize = initialBounds.getSize(new THREE.Vector3());
    const mirror = spec.mirror ? -1 : 1;
    const scaleX = Number.isFinite(spec.width / initialSize.x) ? spec.width / initialSize.x : 1;
    const scaleY = Number.isFinite(spec.height / initialSize.y) ? spec.height / initialSize.y : 1;
    const scaleZ = Number.isFinite(spec.depth / initialSize.z) ? spec.depth / initialSize.z : 1;
    clone.scale.set(scaleX * mirror, scaleY, scaleZ);

    // 위치 reset 후 다시 측정 (vanilla와 동일하게 -= 사용)
    clone.position.set(0, 0, 0);
    clone.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(clone);
    const center = bounds.getCenter(new THREE.Vector3());
    clone.position.x -= center.x;
    clone.position.z -= center.z;
    clone.position.y -= bounds.min.y;
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
