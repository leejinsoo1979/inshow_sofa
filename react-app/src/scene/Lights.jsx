import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { useConfigurator } from "../state/configurator";
import { getSolarState } from "./lighting";
import { isLowEndDevice } from "./deviceTier";

RectAreaLightUniformsLib.init();

function LowEndLights() {
  // 저사양 전용: 단일 평행광(그림자 1개) + 반구광. 그림자맵 512.
  const sun = useConfigurator((s) => s.sun);
  const solar = useMemo(
    () => getSolarState({ hour: sun.time, month: sun.month, latitude: sun.latitude }),
    [sun.time, sun.month, sun.latitude]
  );
  const keyRef = useRef();
  useEffect(() => {
    const key = keyRef.current;
    if (!key) return;
    const radius = 11;
    const sunPos = solar.sunVector.clone().multiplyScalar(-radius);
    key.position.copy(sunPos);
    key.color.copy(solar.color);
    key.intensity = 1.4 + solar.daylight * 0.6;
  }, [solar]);
  return (
    <>
      <hemisphereLight args={[0xffffff, 0xe8ded4, 0.6]} />
      <directionalLight
        ref={keyRef}
        castShadow
        intensity={1.6}
        color={0xffffff}
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.04}
      >
        <orthographicCamera attach="shadow-camera" args={[-8, 8, 8, -8, 1, 22]} />
      </directionalLight>
    </>
  );
}

export default function Lights() {
  if (isLowEndDevice()) return <LowEndLights />;
  return <FullLights />;
}

function FullLights() {
  const { gl } = useThree();
  const lighting = useConfigurator((s) => s.studioLighting);
  const sun = useConfigurator((s) => s.sun);
  const keyRef = useRef();
  const fillRef = useRef();
  const rimRef = useRef();
  const topRef = useRef();
  const spotRef = useRef();
  const pointRef = useRef();
  const hemiRef = useRef();

  const solar = useMemo(
    () => getSolarState({ hour: sun.time, month: sun.month, latitude: sun.latitude }),
    [sun.time, sun.month, sun.latitude]
  );

  const daylight = solar.daylight;
  const keyStrength = lighting.keyLight * (0.18 + daylight * 1.45);
  const fillStrength = lighting.fillLight * (0.25 + (1 - daylight) * 0.2 + daylight * 0.75);
  const rimStrength = lighting.rimLight * (0.5 + (1 - daylight) * 0.65);
  const topStrength = lighting.topSoftbox * (0.22 + daylight * 0.95);
  const spotStrength = lighting.spotLight * (0.18 + daylight * 1.1 + (1 - daylight) * 0.15);
  const pointStrength = lighting.pointLight * (0.12 + daylight * 0.55 + (1 - daylight) * 0.45);

  useEffect(() => {
    gl.toneMappingExposure = lighting.exposure;
  }, [gl, lighting.exposure]);

  useEffect(() => {
    const key = keyRef.current;
    if (!key) return;
    const radius = 11;
    const sunPos = solar.sunVector.clone().multiplyScalar(-radius);
    key.position.copy(sunPos);
    key.color.copy(solar.color);
    key.intensity = keyStrength;
    key.castShadow = true;
  }, [solar, keyStrength]);

  useEffect(() => {
    const fill = fillRef.current;
    if (!fill) return;
    fill.position.set(-5.4, 3.8, 3.6);
    fill.color.set(daylight > 0.35 ? 0xeaf0ff : 0xf4e1c8);
    fill.intensity = fillStrength;
  }, [daylight, fillStrength]);

  useEffect(() => {
    const rim = rimRef.current;
    if (!rim) return;
    rim.position.set(5.0, 3.4, -4.8);
    rim.color.set(daylight > 0.35 ? 0xfff1dc : 0xffc78a);
    rim.intensity = rimStrength;
  }, [daylight, rimStrength]);

  useEffect(() => {
    const top = topRef.current;
    if (!top) return;
    top.position.set(0, 4.8, 0.2);
    top.lookAt(0, 0.6, 0);
    top.color.set(daylight > 0.35 ? 0xffffff : 0xffddbf);
    top.intensity = topStrength;
  }, [daylight, topStrength]);

  useEffect(() => {
    const spot = spotRef.current;
    if (!spot) return;
    const sunPos = solar.sunVector.clone();
    spot.position.set(-sunPos.x * 8.2, 4.5, -sunPos.z * 8.2);
    spot.color.set(daylight > 0.35 ? 0xffffff : 0xffd7aa);
    spot.intensity = spotStrength;
    spot.castShadow = true;
    spot.angle = THREE.MathUtils.degToRad(26);
    spot.penumbra = 0.45;
    spot.decay = 2;
  }, [solar, daylight, spotStrength]);

  useEffect(() => {
    const point = pointRef.current;
    if (!point) return;
    point.position.set(0, 1.6, 0.7);
    point.color.set(daylight > 0.35 ? 0xf0f4ff : 0xffd9b0);
    point.intensity = pointStrength;
  }, [daylight, pointStrength]);

  useEffect(() => {
    const hemi = hemiRef.current;
    if (!hemi) return;
    hemi.color.set(daylight > 0.35 ? 0xffffff : 0xfff1dd);
    hemi.groundColor.set(0xe4d2c2);
    hemi.intensity = 0.42 + daylight * 0.38;
  }, [daylight]);

  return (
    <>
      <hemisphereLight ref={hemiRef} args={[0xffffff, 0xe8ded4, 0.55]} />
      <directionalLight
        ref={keyRef}
        castShadow
        intensity={2}
        color={0xffffff}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.04}
        shadow-radius={6}
        shadow-blurSamples={16}
      >
        <orthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10, 1, 24]} />
      </directionalLight>
      <directionalLight ref={fillRef} intensity={0.8} color={0xeaf0ff} position={[-5.4, 3.8, 3.6]} />
      <directionalLight ref={rimRef} intensity={0.5} color={0xfff1dc} position={[5.0, 3.4, -4.8]} />
      <rectAreaLight ref={topRef} args={[0xffffff, 1.2, 7.5, 5.2]} position={[0, 4.8, 0.2]} />
      <spotLight
        ref={spotRef}
        castShadow
        intensity={0.8}
        angle={THREE.MathUtils.degToRad(26)}
        penumbra={0.85}
        decay={2}
        distance={24}
        shadow-mapSize={[512, 512]}
        shadow-bias={-0.0003}
        shadow-radius={24}
        shadow-blurSamples={32}
      />
      <pointLight ref={pointRef} intensity={0.35} distance={10} decay={2} />
    </>
  );
}
