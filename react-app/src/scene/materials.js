import * as THREE from "three";

export function normalizeMaterialName(name) {
  // .001/.002 같은 Blender duplicate suffix만 제거 (.01 / .02 는 의미있는 이름이라 보존)
  return (name || "").toLowerCase().replace(/\.\d{3,}$/, "");
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

// 단일 PNG 텍스처 캐시 + intentional 마크
const _texCache = new Map();
function loadTextureCached(url, repeat = [1, 1]) {
  if (!url) return null;
  if (_texCache.has(url)) return _texCache.get(url);
  const loader = new THREE.TextureLoader();
  const t = loader.load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t._intentional = true;
  _texCache.set(url, t);
  return t;
}

export function cloneTextureWithRepeat(texture, repeat = [1, 1]) {
  if (!texture) return null;
  const cloned = texture.clone();
  cloned.wrapS = texture.wrapS;
  cloned.wrapT = texture.wrapT;
  cloned.colorSpace = texture.colorSpace;
  cloned.center.copy(texture.center);
  cloned.rotation = texture.rotation;
  cloned.repeat.set(repeat[0], repeat[1]);
  cloned.needsUpdate = true;
  cloned._intentional = true;
  return cloned;
}

export function createUpholsteryMaterial(sofaColor, isLeather) {
  const c = new THREE.Color(sofaColor.color);
  const map = loadTextureCached(sofaColor.image, isLeather ? [1.5, 1.5] : [0.24, 0.24]);
  const material = new THREE.MeshPhysicalMaterial({
    color: c,
    map: map || null,
    roughness: isLeather ? 0.78 : 0.88,
    metalness: 0,
    sheen: isLeather ? 0.18 : 0.12,
    sheenRoughness: isLeather ? 0.85 : 0.95,
    sheenColor: isLeather ? new THREE.Color(0x6b6764) : c.clone().multiplyScalar(1.02),
    clearcoat: 0,
    clearcoatRoughness: 0.7,
    envMapIntensity: isLeather ? 0.45 : 0.85
  });
  return material;
}

export function createBaseMaterial(baseColor, isLeather) {
  const map = loadTextureCached(baseColor.image, [3, 3]);
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(baseColor.color),
    map: map || null,
    roughness: isLeather ? 0.45 : 0.6,
    metalness: 0,
    sheen: isLeather ? 0.9 : 0.12,
    sheenColor: isLeather ? new THREE.Color(0xdddddd) : undefined,
    clearcoat: isLeather ? 0 : 0.18,
    clearcoatRoughness: 0.6,
    envMapIntensity: isLeather ? 0.85 : 1.0,
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
  _walnutTex.center.set(0.5, 0.5);
  _walnutTex.rotation = Math.PI / 2;
  _walnutTex._intentional = true;
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
