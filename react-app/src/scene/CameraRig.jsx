import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useConfigurator } from "../state/configurator";
import { moduleCatalog } from "../data/catalog";

export default function CameraRig({ controlsRef, resetCameraRef }) {
  const camera = useThree((s) => s.camera);
  const modules = useConfigurator((s) => s.modules);
  const initRef = useRef(false);
  const lastTargetRef = useRef(null);
  const lastPosRef = useRef(null);

  useEffect(() => {
    if (resetCameraRef) {
      resetCameraRef.current = () => {
        if (lastPosRef.current && lastTargetRef.current) {
          camera.position.copy(lastPosRef.current);
          if (controlsRef?.current) {
            controlsRef.current.target.copy(lastTargetRef.current);
            controlsRef.current.update();
          }
        }
      };
    }
  }, [resetCameraRef, camera, controlsRef]);

  useEffect(() => {
    if (!modules.length) return;
    // 전체 footprint 계산
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const m of modules) {
      const spec = moduleCatalog[m.type];
      const hw = spec.width / 2, hd = spec.depth / 2;
      minX = Math.min(minX, m.x - hw);
      maxX = Math.max(maxX, m.x + hw);
      minZ = Math.min(minZ, m.z - hd);
      maxZ = Math.max(maxZ, m.z + hd);
    }
    const cx = (minX + maxX) / 2;
    const cz = (minZ + maxZ) / 2;
    const w = maxX - minX;
    // 가구 너비에 따라 부드럽게 비례하는 거리 (최소 보장)
    const radius = Math.max(3.5, w * 1.15 + 2.5);

    const target = new THREE.Vector3(cx, 0.35, cz);

    const newPos = new THREE.Vector3(
      cx + radius * 0.55,
      Math.max(1.6, radius * 0.4),
      cz + radius * 0.9
    );

    lastPosRef.current = newPos.clone();
    lastTargetRef.current = target.clone();

    if (!initRef.current) {
      camera.position.copy(newPos);
      if (controlsRef?.current) controlsRef.current.target.copy(target);
      initRef.current = true;
      return;
    }

    // tween
    const startPos = camera.position.clone();
    const startTarget = controlsRef?.current?.target.clone() || new THREE.Vector3();
    const start = performance.now();
    const dur = 600;
    let raf;
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - t, 3);
      camera.position.lerpVectors(startPos, newPos, e);
      if (controlsRef?.current) {
        controlsRef.current.target.lerpVectors(startTarget, target, e);
        controlsRef.current.update();
      }
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modules]);

  return null;
}
