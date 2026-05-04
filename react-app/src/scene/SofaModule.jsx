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
  createTrayWoodMaterial,
  cloneTextureWithRepeat
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

  // GLB scene 첫 로드 시 원본 머티리얼 이름을 mesh userData에 영구 마크
  // (useGLTF는 같은 scene 반환 + cloneSkinned는 자식 머티리얼 reference 공유 → 클론 후 첫 모듈에서
  //  머티리얼 갈아엎으면 두 번째 모듈 clone에서 .name이 빈 문자열이 됨)
  useMemo(() => {
    scene.traverse((child) => {
      if (child.isMesh && !child.userData._origMatMarked) {
        child.userData._origMatNames = Array.isArray(child.material)
          ? child.material.map(mt => mt?.name || "")
          : (child.material?.name || "");
        child.userData._origMatMarked = true;
      }
    });
    return null;
  }, [scene]);

  // 클론은 한 번만 (모듈 인스턴스별로 고유)
  // cloneSkinned 후 원본 scene → clone mesh 매핑으로 _origMatNames를 clone에 박음
  const clone = useMemo(() => {
    const c = cloneSkinned(scene);
    // scene + clone을 동시 traverse — Three.js는 clone 시 자식 순서 유지
    const sceneNodes = [];
    scene.traverse(n => sceneNodes.push(n));
    const cloneNodes = [];
    c.traverse(n => cloneNodes.push(n));
    for (let i = 0; i < cloneNodes.length && i < sceneNodes.length; i++) {
      const cn = cloneNodes[i];
      const sn = sceneNodes[i];
      if (cn.isMesh && sn.userData?._origMatNames !== undefined) {
        cn.userData._origMatNames = sn.userData._origMatNames;
        cn.userData._origMatMarked = true;
      }
    }
    return c;
  }, [scene, m.id]);

  const upholsteryRepeatForMesh = (mesh) => {
    if (material === "naturalLeather") return [1.5, 1.5];
    const name = (mesh?.name || "").toLowerCase();
    if (name.includes("pillow")) {
      const bounds = new THREE.Box3().setFromObject(mesh);
      const size = bounds.getSize(new THREE.Vector3());
      if (size.x < 0.58 || size.y < 0.3) return [0.28, 0.28];
      return [0.4, 0.4];
    }
    if (name.includes("seating cushion")) return [0.4, 0.4];
    return [0.24, 0.24];
  };

  // 1) 스케일/위치는 clone/spec 변경 시 한 번만 (vanilla 공식)
  useEffect(() => {
    const initialBounds = new THREE.Box3().setFromObject(clone);
    const initialSize = initialBounds.getSize(new THREE.Vector3());
    const mirror = spec.mirror ? -1 : 1;
    // vanilla 공식: 각 축을 spec dimensions로 정규화
    const scaleX = Number.isFinite(spec.width / initialSize.x) ? spec.width / initialSize.x : 1;
    const scaleY = scaleX;
    const scaleZ = scaleX; // Z도 X 비율로 (모듈 간 depth 비율 동일 → z 정렬 일관)
    clone.scale.set(scaleX * mirror, scaleY, scaleZ);

    clone.position.set(0, 0, 0);
    clone.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(clone);

    // base mesh(가죽.02 / 가죽.006) 중심을 X/Z 0에 정렬
    // userData._origMatNames 우선 사용 (cloneSkinned 시 mat reference 공유로 인한 빈 이름 회피)
    const baseBounds = new THREE.Box3();
    baseBounds.makeEmpty();
    clone.traverse((c) => {
      if (!c.isMesh) return;
      const orig = c.userData._origMatNames;
      const namesArr = Array.isArray(orig)
        ? orig
        : (typeof orig === "string" ? [orig] : (Array.isArray(c.material) ? c.material.map(m => m?.name || "") : [c.material?.name || ""]));
      const matchesBase = namesArr.some(nm => {
        const n = (nm || "").toLowerCase();
        return n.startsWith("가죽.02") || n.startsWith("가죽.006") || n === "base";
      });
      if (matchesBase) {
        const b = new THREE.Box3().setFromObject(c);
        baseBounds.union(b);
      }
    });

    if (!baseBounds.isEmpty()) {
      const bcx = (baseBounds.min.x + baseBounds.max.x) / 2;
      const bcz = (baseBounds.min.z + baseBounds.max.z) / 2;
      clone.position.x = -bcx;
      clone.position.z = -bcz;
    } else {
      clone.position.x = -(bounds.min.x + bounds.max.x) / 2;
      clone.position.z = -(bounds.min.z + spec.depth / 2);
    }
    clone.position.y = -bounds.min.y;
  }, [clone, spec]);

  // 2) 머티리얼만 갱신 (위치/스케일 안 건드림)
  useEffect(() => {
    const isLeather = material === "naturalLeather";
    const ups = createUpholsteryMaterial(sofaColor, isLeather);
    const bas = createBaseMaterial(baseColor, isLeather);
    const met = createMetalMaterial();
    const tw = createTrayWoodMaterial(trayWood);
    const roles = modelMaterialRoles[spec.model];

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

      // 원본 머티리얼 이름 (영구 마크 우선, 없으면 현재 mat name)
      const origNames = child.userData._origMatNames !== undefined
        ? child.userData._origMatNames
        : (Array.isArray(child.material)
            ? child.material.map(mt => mt?.name || "")
            : (child.material?.name || ""));

      const matForRole = (role) => {
        if (role === "metal") return met.clone();
        if (role === "trayWood") return tw.clone();
        if (role === "base") return bas.clone();
        return ups.clone();
      };

      let newMat;
      if (Array.isArray(origNames)) {
        const roleCache = {};
        newMat = origNames.map((nm) => {
          const role = importedMaterialRole(nm, roles);
          if (!roleCache[role]) {
            const created = matForRole(role);
            if (role === "upholstery" && created.map) {
              created.map = cloneTextureWithRepeat(created.map, upholsteryRepeatForMesh(child));
            }
            roleCache[role] = created;
          }
          return roleCache[role];
        });
      } else {
        const role = importedMaterialRole(origNames, roles);
        newMat = matForRole(role);
        if (role === "upholstery" && newMat.map) {
          newMat.map = cloneTextureWithRepeat(newMat.map, upholsteryRepeatForMesh(child));
        }
      }

      const stripMap = (mat) => {
        if (!mat) return;
        // trayWood/base 머티리얼이 의도적으로 가지는 텍스처는 보존
        if (mat.name?.toLowerCase().includes("metal")) return;
        mat.side = THREE.DoubleSide;
        mat.transparent = false;
        mat.opacity = 1;
        mat.needsUpdate = true;
      };
      if (Array.isArray(newMat)) newMat.forEach(stripMap);
      else stripMap(newMat);
      // vertexColors off, GLB 잔여 텍스처 제거 (단 walnut은 mat.map 유지)
      const enforceUniform = (mat) => {
        if (!mat) return;
        if ("vertexColors" in mat) mat.vertexColors = false;
        // map이 우리가 만든 walnut/leather 텍스처가 아니라면 제거 (GLB baked texture)
        if (mat.map && !mat.map._intentional) mat.map = null;
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
