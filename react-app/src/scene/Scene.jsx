import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import {
  EffectComposer,
  Outline,
  Selection,
  SSAO,
  Bloom,
  ToneMapping,
  BrightnessContrast,
  HueSaturation,
} from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
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
        <shadowMaterial color={0x000000} opacity={0.4} transparent />
      </mesh>
      {/* 컨택트 섀도우: 가구-바닥 만남 부분 자연스럽게 */}
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.55}
        scale={10}
        blur={2.6}
        far={1.5}
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
        toneMapping: THREE.NoToneMapping, /* postprocessing이 처리 */
        toneMappingExposure: 1.0
      }}
    >
      <Suspense fallback={null}>
        <CanvasBackground />
        {/* HDRI: drei built-in studio (모바일은 city 가벼운 버전) */}
        <Environment
          preset={isMobile ? "city" : "studio"}
          environmentIntensity={0.6}
          background={false}
        />
        <Lights />
        <Floor />
        <Selection>
          <EffectComposer multisampling={4} autoClear={false}>
            {/* SSAO: 가구 사이/쿠션 아래 그늘 (데스크탑만) */}
            {!isMobile && (
              <SSAO
                blendFunction={BlendFunction.MULTIPLY}
                samples={20}
                radius={0.06}
                intensity={28}
                bias={0.012}
                worldDistanceThreshold={1}
                worldDistanceFalloff={1}
                worldProximityThreshold={1}
                worldProximityFalloff={1}
              />
            )}
            {/* 약한 bloom: 가죽 specular 살림 */}
            <Bloom
              intensity={0.18}
              luminanceThreshold={0.85}
              luminanceSmoothing={0.2}
              mipmapBlur
            />
            {/* 색감 보정 */}
            <BrightnessContrast brightness={0.0} contrast={0.06} />
            <HueSaturation saturation={0.06} />
            {/* 톤매핑 (ACES Filmic) */}
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
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
