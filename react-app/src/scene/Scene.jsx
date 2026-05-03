import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import Lights from "./Lights";
import SofaModule from "./SofaModule";
import Hotspots from "./Hotspots";
import ModuleToolbar from "./ModuleToolbar";
import CameraRig from "./CameraRig";
import DimensionLabels from "./DimensionLabels";
import { useConfigurator } from "../state/configurator";

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[18, 14]} />
      <shadowMaterial color={0x1a160f} opacity={0.55} />
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

export default function Scene({ resetCameraRef }) {
  const controlsRef = useRef();
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [4.5, 1.4, 5.2], fov: 32, near: 0.1, far: 100 }}
      gl={{
        antialias: true,
        alpha: true,
        outputColorSpace: THREE.SRGBColorSpace,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.92
      }}
      style={{ background: "linear-gradient(180deg, #ffffff 0%, #f4f2ed 100%)" }}
    >
      <Suspense fallback={null}>
        <Environment preset="city" environmentIntensity={0.5} />
        <Lights />
        <Floor />
        <Modules />
        <Hotspots />
        <ModuleToolbar />
        <DimensionLabels />
        <CameraRig controlsRef={controlsRef} resetCameraRef={resetCameraRef} />
      </Suspense>
      <OrbitControls
        ref={controlsRef}
        enableDamping
        target={[0, 0.35, 0]}
        maxPolarAngle={Math.PI * 0.48}
        minDistance={2.1}
        maxDistance={15}
      />
    </Canvas>
  );
}
