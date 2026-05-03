import { useEffect, useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { Select } from "@react-three/postprocessing";
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
  const selectedId = useConfigurator((s) => s.selectedId);

  const spec = moduleCatalog[m.type];
  const url = modelSources[spec.model];
  const { scene } = useGLTF(url);
  const groupRef = useRef();

  // 클론은 한 번만 (모듈 인스턴스별로 고유)
  // 매번 deep clone — useGLTF가 모든 인스턴스에 같은 scene 반환하므로 인스턴스마다 독립 복사 필요
  const clone = useMemo(() => cloneSkinned(scene), [scene, m.id]);

  // 1) 스케일/위치는 clone/spec 변경 시 한 번만 (vanilla 공식)
  useEffect(() => {
    const initialBounds = new THREE.Box3().setFromObject(clone);
    const initialSize = initialBounds.getSize(new THREE.Vector3());
    const mirror = spec.mirror ? -1 : 1;
    // vanilla 공식: 각 축을 spec dimensions로 정규화
    const scaleX = Number.isFinite(spec.width / initialSize.x) ? spec.width / initialSize.x : 1;
    const scaleY = Number.isFinite(spec.height / initialSize.y) ? spec.height / initialSize.y : 1;
    const scaleZ = Number.isFinite(spec.depth / initialSize.z) ? spec.depth / initialSize.z : 1;
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

    const isSelected = selectedId === m.id;
    const glowColor = new THREE.Color(0x3b82f6);
    const applyGlow = (mat) => {
      if ("emissive" in mat) {
        mat.emissive = glowColor.clone();
        mat.emissiveIntensity = 0.18;
      }
    };

    // 기존 outline 제거
    const oldOutlines = [];
    clone.traverse((child) => {
      if (child.userData.isOutline) oldOutlines.push(child);
    });
    oldOutlines.forEach((o) => {
      o.parent?.remove(o);
      o.geometry?.dispose?.();
      o.material?.dispose?.();
    });

    clone.traverse((child) => {
      if (!child.isMesh || child.userData.isOutline) return;
      child.castShadow = true;
      child.receiveShadow = true;
      child.userData.isModuleMesh = true;
      if (child.geometry?.attributes?.color) child.geometry.deleteAttribute("color");
      const newMat = Array.isArray(child.material)
        ? child.material.map(remap)
        : remap(child.material);
      // 강제 통일: vertexColors off, map(GLB 잔여 텍스처) 제거
      const enforceUniform = (mat) => {
        if (!mat) return;
        if ("vertexColors" in mat) mat.vertexColors = false;
        if ("map" in mat && mat.map && material !== "naturalLeather") mat.map = null;
        mat.needsUpdate = true;
      };
      if (Array.isArray(newMat)) newMat.forEach(enforceUniform);
      else enforceUniform(newMat);
      if (isSelected) {
        if (Array.isArray(newMat)) newMat.forEach(applyGlow);
        else applyGlow(newMat);
      }
      child.material = newMat;
    });

  }, [clone, sofaColor, baseColor, trayWood, material, spec, selectedId, m.id]);

  // group에 clone 직접 add (vanilla 방식, r3f reconciler 우회)
  useEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    g.add(clone);
    return () => {
      g.remove(clone);
    };
  }, [clone]);

  const isSelected = selectedId === m.id;
  return (
    <Select enabled={isSelected}>
      <group
        ref={groupRef}
        position={[m.x, 0, m.z]}
        rotation={[0, m.rotation, 0]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedId(m.id);
        }}
      />
    </Select>
  );
}
