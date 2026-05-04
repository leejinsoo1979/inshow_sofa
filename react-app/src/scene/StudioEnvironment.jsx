import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { useConfigurator } from "../state/configurator";

export default function StudioEnvironment() {
  const { scene, gl } = useThree();
  const backgroundColor = useConfigurator((s) => s.backgroundColor);
  const hdri = useConfigurator((s) => s.hdri);
  const environmentIntensity = useConfigurator((s) => s.studioLighting.environmentIntensity);
  const envMapRef = useRef(null);
  const pmremRef = useRef(null);

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
  }, [gl]);

  useEffect(() => {
    scene.background = new THREE.Color(backgroundColor);
  }, [backgroundColor, scene]);

  useEffect(() => {
    let cancelled = false;

    if (envMapRef.current) {
      envMapRef.current.dispose?.();
      envMapRef.current = null;
    }
    if (pmremRef.current) {
      pmremRef.current.dispose();
      pmremRef.current = null;
    }

    const pmremGenerator = new THREE.PMREMGenerator(gl);
    pmremGenerator.compileEquirectangularShader();
    pmremRef.current = pmremGenerator;

    const applyEnvironment = (texture, isHDR = false) => {
      if (cancelled) return;
      texture.mapping = THREE.EquirectangularReflectionMapping;
      if (!isHDR) texture.colorSpace = THREE.SRGBColorSpace;
      const envTexture = pmremGenerator.fromEquirectangular(texture).texture;
      if (envMapRef.current) envMapRef.current.dispose?.();
      envMapRef.current = envTexture;
      scene.environment = envTexture;
      scene.environmentIntensity = environmentIntensity;
      scene.background = new THREE.Color(backgroundColor);
      texture.dispose?.();
    };

    const loadFallback = () => {
      if (cancelled) return;
      const room = new RoomEnvironment();
      const fallback = pmremGenerator.fromScene(room, 0.04).texture;
      if (envMapRef.current) envMapRef.current.dispose?.();
      envMapRef.current = fallback;
      scene.environment = fallback;
      scene.environmentIntensity = environmentIntensity;
      scene.background = new THREE.Color(backgroundColor);
    };

    if (!hdri?.url) {
      loadFallback();
      return () => {
        cancelled = true;
        if (envMapRef.current) envMapRef.current.dispose?.();
        pmremGenerator.dispose();
      };
    }

    const isHDR = (hdri.kind || "").toLowerCase() === "hdr";
    const loader = isHDR ? new RGBELoader() : new THREE.TextureLoader();
    loader.load(
      hdri.url,
      (texture) => applyEnvironment(texture, isHDR),
      undefined,
      () => loadFallback()
    );

    return () => {
      cancelled = true;
      if (envMapRef.current) envMapRef.current.dispose?.();
      pmremGenerator.dispose();
    };
  }, [backgroundColor, environmentIntensity, gl, hdri?.kind, hdri?.url, scene]);

  useEffect(() => {
    scene.environmentIntensity = environmentIntensity;
  }, [environmentIntensity, scene]);

  return null;
}
