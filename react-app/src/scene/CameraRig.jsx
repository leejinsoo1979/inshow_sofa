import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useConfigurator } from "../state/configurator";
import { moduleCatalog } from "../data/catalog";

const DEFAULT_DIRECTION = new THREE.Vector3(0.45, 0.42, 0.78).normalize();

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
    const sx = maxX - minX;
    const sz = maxZ - minZ;

    // vanilla computeCameraTarget 동일 공식
    const sy = 0.68; // module height
    // portrait 모바일만 yOffset 적용 (가로모드/데스크탑은 0)
    const isPortraitMobile = typeof window !== "undefined"
      && window.matchMedia("(max-width: 900px) and (orientation: portrait)").matches;
    const yOffset = isPortraitMobile ? -0.6 : 0;
    const target = new THREE.Vector3(cx, sy * 0.5 + sy * 0.05 + yOffset, cz);
    // OrbitControls target은 모듈 center에 둔다.
    // 모듈 center를 화면 가운데에 두기 위해 카메라 위치만 보정 (X 약간 좌측에서 보면 화면상 모듈이 중앙에 옴)

    const fovV = (camera.fov * Math.PI) / 180;
    const aspect = camera.aspect || 1.6;
    const fovH = 2 * Math.atan(Math.tan(fovV / 2) * aspect);
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches;
    const isLandscape = typeof window !== "undefined" && window.matchMedia("(orientation: landscape)").matches;
    // 모바일은 더 타이트하게, 가로모드는 가로 여백 더
    const horizontalPad = isMobile ? (isLandscape ? 1.3 : 2.0) : 2.2;
    const verticalPad = isMobile ? (isLandscape ? 1.5 : 2.2) : 2.6;
    const distH = (sx * horizontalPad) / (2 * Math.tan(fovH / 2));
    const distV = (sy * verticalPad) / (2 * Math.tan(fovV / 2));
    const distZ = (sz * horizontalPad) / (2 * Math.tan(fovH / 2));
    const baseExtra = isMobile ? 0.4 : 1.4;
    const minDist = isMobile ? 2.5 : 4;
    const distance = Math.max(minDist, Math.min(20, Math.max(distH, distV, distZ) + baseExtra));

    const newPos = target.clone().addScaledVector(DEFAULT_DIRECTION, distance);

    lastPosRef.current = newPos.clone();
    lastTargetRef.current = target.clone();

    if (!initRef.current) {
      const apply = () => {
        camera.position.copy(newPos);
        if (controlsRef?.current) {
          controlsRef.current.target.copy(target);
          controlsRef.current.update();
        } else {
          requestAnimationFrame(apply);
        }
      };
      apply();
      initRef.current = true;
      return;
    }

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
