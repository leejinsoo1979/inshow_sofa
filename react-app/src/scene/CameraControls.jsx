import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function CameraControls({ controlsRef, zoomRef, rotateRef }) {
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    if (zoomRef) {
      zoomRef.current = (dir) => {
        if (!controlsRef?.current) return;
        const target = controlsRef.current.target;
        const offset = camera.position.clone().sub(target);
        const factor = dir > 0 ? 1.15 : 0.87;
        offset.multiplyScalar(factor);
        camera.position.copy(target).add(offset);
        controlsRef.current.update();
      };
    }
    if (rotateRef) {
      rotateRef.current = (dir) => {
        if (!controlsRef?.current) return;
        const target = controlsRef.current.target;
        const offset = camera.position.clone().sub(target);
        const angle = dir * (Math.PI / 12); // 15도
        const axis = new THREE.Vector3(0, 1, 0);
        offset.applyAxisAngle(axis, angle);
        camera.position.copy(target).add(offset);
        controlsRef.current.update();
      };
    }
  }, [camera, controlsRef, zoomRef, rotateRef]);

  return null;
}
