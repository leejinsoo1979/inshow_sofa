import * as THREE from "three";

export function normalizeMaterialName(name) {
  return (name || "").toLowerCase().replace(/\.\d+$/, "");
}

function nameMatches(name, patterns = []) {
  return patterns.some((p) => {
    const m = p.toLowerCase();
    if (m.endsWith("*")) return name.startsWith(m.slice(0, -1));
    return name === m;
  });
}

export function importedMaterialRole(materialName, roles) {
  const name = normalizeMaterialName(materialName);
  if (roles) {
    if (nameMatches(name, roles.metal)) return "metal";
    if (nameMatches(name, roles.trayWood)) return "trayWood";
    if (nameMatches(name, roles.upholstery)) return "upholstery";
    if (nameMatches(name, roles.base)) return "base";
  }
  if (name.includes("metal") || name.includes("__metal")) return "metal";
  if (name.includes("wood")) return "trayWood";
  if (name.includes("base") || name.includes("leather")) return "base";
  return "upholstery";
}

export function createUpholsteryMaterial(sofaColor, isLeather) {
  const c = new THREE.Color(sofaColor.color);
  return new THREE.MeshPhysicalMaterial({
    color: c,
    roughness: isLeather ? 0.42 : 0.88,
    metalness: 0,
    sheen: isLeather ? 0.75 : 0.12,
    sheenRoughness: isLeather ? 0.42 : 0.95,
    sheenColor: isLeather ? new THREE.Color(0xdddddd) : c.clone().multiplyScalar(1.02),
    clearcoat: 0,
    clearcoatRoughness: 0.42,
    envMapIntensity: isLeather ? 0.95 : 0.85
  });
}

export function createBaseMaterial(baseColor, isLeather) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(baseColor.color),
    roughness: isLeather ? 0.45 : 0.6,
    metalness: 0,
    sheen: isLeather ? 0.9 : 0.12,
    sheenColor: isLeather ? new THREE.Color(0xdddddd) : undefined,
    clearcoat: isLeather ? 0 : 0.18,
    clearcoatRoughness: 0.6,
    envMapIntensity: isLeather ? 0.85 : 1.0
  });
}

export function createMetalMaterial() {
  return new THREE.MeshPhongMaterial({
    color: 0xd9d9d9,
    specular: 0xffffff,
    shininess: 140,
    emissive: 0x303030,
    reflectivity: 0.55
  });
}

// walnut texture 한 번만 로드
let _walnutTex = null;
function getWalnutTexture() {
  if (_walnutTex) return _walnutTex;
  const loader = new THREE.TextureLoader();
  _walnutTex = loader.load("/assets/thumbnails/texture/131_Persian%20walnut%20PBR%20texture-seamless.jpg");
  _walnutTex.colorSpace = THREE.SRGBColorSpace;
  _walnutTex.wrapS = THREE.RepeatWrapping;
  _walnutTex.wrapT = THREE.RepeatWrapping;
  _walnutTex.repeat.set(1.5, 1.5);
  return _walnutTex;
}

export function createTrayWoodMaterial(trayWood) {
  const isWalnut = trayWood?.label === "월넛";
  if (isWalnut) {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x6a6258),
      map: getWalnutTexture(),
      roughness: 0.55,
      metalness: 0,
      clearcoat: 0.35,
      clearcoatRoughness: 0.45
    });
  }
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(trayWood?.color || "#000000"),
    roughness: 0.55,
    metalness: 0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.45,
    sheen: 0.1
  });
}
