import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

/**
 * 주어진 Object3D 리스트(=현재 모듈 그룹들)를 단일 Scene으로 묶어 GLB로 export.
 * 반환: Promise<ArrayBuffer>
 */
export function exportSceneToGlb(rootObjects) {
  // 새 Scene을 만들어 clone들을 add (export용 격리)
  const exportScene = new THREE.Scene();
  for (const obj of rootObjects) {
    if (!obj) continue;
    // clone (deep, materials 재참조)
    exportScene.add(obj.clone(true));
  }

  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      exportScene,
      (result) => {
        if (result instanceof ArrayBuffer) resolve(result);
        else {
          const json = JSON.stringify(result);
          const blob = new TextEncoder().encode(json);
          resolve(blob.buffer);
        }
      },
      (err) => reject(err),
      { binary: true }
    );
  });
}
