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
        <shadowMaterial color={0x000000} opacity={0.22} transparent />
      </mesh>
      {/* 컨택트 섀도우: 가구-바닥 만남 부분 자연스럽게 */}
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.4}
        scale={12}
        blur={5.5}
        far={2.0}
        resolution={1024}
        color="#1a160f"
        smooth
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
        // medium: 기존 ACES + exposure 0.92, high: NoToneMapping (postprocessing이 처리)
        toneMapping: isHigh ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping,
        toneMappingExposure: isHigh ? 1.0 : 0.92
      }}
    >
      <Suspense fallback={null}>
        <CanvasBackground />
        {/* HDRI: high 모드에서만 studio, 그 외 city */}
        <Environment
          preset={isHigh ? "studio" : "city"}
          environmentIntensity={isHigh ? 0.6 : 0.5}
          background={false}
        />
        <Lights />
        <Floor />
        <Selection>
          <EffectComposer multisampling={isHigh ? 4 : 8} autoClear={false}>
            {/* SSAO: high 모드에서만 */}
            {isHigh && (
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
            {/* Bloom: high만 */}
            {isHigh && (
              <Bloom
                intensity={0.08}
                luminanceThreshold={0.95}
                luminanceSmoothing={0.2}
                mipmapBlur
              />
            )}
            {/* 색감 보정: high만 */}
            {isHigh && <BrightnessContrast brightness={0.0} contrast={0.06} />}
            {isHigh && <HueSaturation saturation={0.06} />}
            {/* 톤매핑: high만 post에서 (medium은 Canvas 자체 톤매핑 사용) */}
            {isHigh && <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />}
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
