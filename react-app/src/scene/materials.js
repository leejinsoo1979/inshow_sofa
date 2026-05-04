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

let _fabricWeaveTex = null;
function getFabricWeaveTexture() {
  if (_fabricWeaveTex) return _fabricWeaveTex;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const img = ctx.createImageData(canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      const warp = (x % 6 < 3 ? 6 : -2) + (y % 8 < 4 ? 3 : -1);
      const weft = (y % 6 < 3 ? 6 : -2) + (x % 8 < 4 ? 3 : -1);
      const grain = Math.sin((x + y) * 0.35) * 4 + Math.random() * 10 - 5;
      const value = 132 + warp + weft + grain;
      img.data[i] = value;
      img.data[i + 1] = value;
      img.data[i + 2] = value;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(24, 24);
  tex.needsUpdate = true;
  tex._intentional = true;
  _fabricWeaveTex = tex;
  return tex;
}

export function createUpholsteryMaterial(sofaColor, isLeather) {
  const c = new THREE.Color(sofaColor.color);
  const map = loadTextureCached(sofaColor.image, [2, 2]);
  const material = new THREE.MeshPhysicalMaterial({
    color: c,
    map: map || null,
    roughness: isLeather ? 0.42 : 0.98,
    metalness: 0,
    sheen: isLeather ? 0.75 : 0.04,
    sheenRoughness: isLeather ? 0.42 : 1.0,
    sheenColor: isLeather ? new THREE.Color(0xdddddd) : c.clone().multiplyScalar(1.02),
    clearcoat: 0,
    clearcoatRoughness: 0.42,
    envMapIntensity: isLeather ? 0.95 : 0.28
  });
  if (!isLeather) {
    const fabricWeave = getFabricWeaveTexture();
    if (fabricWeave) {
      material.bumpMap = fabricWeave;
      material.bumpScale = 0.018;
      material.roughnessMap = fabricWeave;
    }
  }
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
