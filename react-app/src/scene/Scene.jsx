import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { EffectComposer, Outline, Selection } from "@react-three/postprocessing";
import { Suspense, useRef } from "react";
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
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[18, 14]} />
      <shadowMaterial color={0x000000} opacity={0.45} transparent />
    </mesh>
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
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.92
      }}
    >
      <Suspense fallback={null}>
        <CanvasBackground />
        <Environment preset="city" environmentIntensity={0.5} background={false} />
        <Lights />
        <Floor />
        <Selection>
          <EffectComposer multisampling={8} autoClear={false}>
            <Outline
              blur
              kernelSize={4}
              visibleEdgeColor={0x3b82f6}
              hiddenEdgeColor={0x3b82f6}
              edgeStrength={10}
              pulseSpeed={0}
              width={1500}
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
