import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import {
  EffectComposer,
  Outline,
  Selection,
} from "@react-three/postprocessing";
import { Suspense, useRef, useMemo } from "react";
import * as THREE from "three";
import Lights from "./Lights";
import SofaModule from "./SofaModule";
import Hotspots from "./Hotspots";
import ModuleToolbar from "./ModuleToolbar";
import CameraRig from "./CameraRig";
import CameraControls from "./CameraControls";
import DimensionLabels from "./DimensionLabels";
import { useConfigurator } from "../state/configurator";

function CanvasBackground() {
  const bg = useConfigurator((s) => s.backgroundColor);
  return <color attach="background" args={[bg]} />;
}

function Floor() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 14]} />
        <shadowMaterial color={0x000000} opacity={0.18} transparent />
      </mesh>
      {/* 가까운 컨택트 그림자 (가구 바로 아래 진함) */}
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.55}
        scale={8}
        blur={6}
        far={0.6}
        resolution={2048}
        color="#1a160f"
      />
      {/* 외곽 페이드 그림자 (자연스러운 그라데이션) */}
      <ContactShadows
        position={[0, 0.0015, 0]}
        opacity={0.25}
        scale={18}
        blur={30}
        far={3}
        resolution={1024}
        color="#1a160f"
      />
    </>
  );
}

function Modules() {
  const modules = useConfigurator((s) => s.modules);
  return (
    <>
      {modules.map((m) => (
        <SofaModule key={m.id} module={m} />
      ))}
    </>
  );
}

export default function Scene({ resetCameraRef, zoomRef, rotateRef }) {
  const controlsRef = useRef();
  const isMobile = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches,
    []
  );
  const quality = useConfigurator((s) => s.renderQuality);
  const isHigh = quality === "high" && !isMobile;
  return (
    <Canvas
      shadows={{ type: THREE.PCFSoftShadowMap }}
      dpr={[1, 2]}
      camera={{ position: [4.5, 1.4, 5.2], fov: 32, near: 0.1, far: 100 }}
      onPointerMissed={() => useConfigurator.getState().setSelectedId(null)}
      gl={{
        antialias: true,
        alpha: true,
        outputColorSpace: THREE.SRGBColorSpace,
        // 양 모드 모두 Canvas ACES + exposure
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: isHigh ? 0.7 : 0.92
      }}
    >
      <Suspense fallback={null}>
        <CanvasBackground />
        {/* HDRI: high 모드에서만 studio, 그 외 city */}
        <Environment
          preset={isHigh ? "studio" : "city"}
          environmentIntensity={isHigh ? 0.25 : 0.5}
          background={false}
        />
        <Lights />
        <Floor />
        <Selection>
          <EffectComposer multisampling={8} autoClear={false}>
            <Outline
              blur
              kernelSize={3}
              visibleEdgeColor={0x3b82f6}
              hiddenEdgeColor={0x3b82f6}
              edgeStrength={6}
              pulseSpeed={0}
              xRay={true}
              width={1000}
            />
          </EffectComposer>
          <Modules />
        </Selection>
        <Hotspots />
        <ModuleToolbar />
        <DimensionLabels />
        <CameraRig controlsRef={controlsRef} resetCameraRef={resetCameraRef} />
        <CameraControls controlsRef={controlsRef} zoomRef={zoomRef} rotateRef={rotateRef} />
      </Suspense>
      <OrbitControls
        ref={controlsRef}
        enableDamping
        makeDefault
        maxPolarAngle={Math.PI * 0.48}
        minDistance={0.8}
        maxDistance={15}
      />
    </Canvas>
  );
}
