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
  const raw = (materialName || "").toLowerCase();
  const name = normalizeMaterialName(materialName);
  // 1) 원본(raw, suffix 포함)으로 먼저 정확 매칭 시도
  if (roles) {
    if (nameMatches(raw, roles.metal)) return "metal";
    if (nameMatches(raw, roles.trayWood)) return "trayWood";
    if (nameMatches(raw, roles.upholstery)) return "upholstery";
    if (nameMatches(raw, roles.base)) return "base";
    // 2) normalized로 백업 매칭
    if (nameMatches(name, roles.metal)) return "metal";
    if (nameMatches(name, roles.trayWood)) return "trayWood";
    if (nameMatches(name, roles.upholstery)) return "upholstery";
    if (nameMatches(name, roles.base)) return "base";
  }
  if (raw.includes("metal") || raw.includes("__metal")) return "metal";
  if (raw.includes("wood") || raw.includes("walnut")) return "trayWood";
  if (raw.includes("base") || raw.includes("leather")) return "base";
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

export function createUpholsteryMaterial(sofaColor, isLeather, quality = "medium") {
  const isOilyLeather = isLeather && (sofaColor.id === "leatherBlack" || /black/i.test(sofaColor.id || ""));
  const isHigh = quality === "high";
  const repeat = isOilyLeather ? [0.12, 0.12] : (isLeather ? [1.5, 1.5] : [0.24, 0.24]);
  const map = loadTextureCached(sofaColor.image, repeat);
  const c = map
    ? (isOilyLeather ? new THREE.Color(0x3a3633) : new THREE.Color(0xffffff))
    : new THREE.Color(sofaColor.color);
  // oily leather: 광택 표현
  const oilyRoughness = isHigh ? 0.5 : 0.36;
  const oilySheen = isHigh ? 0.45 : 0.6;
  const oilyClearcoat = isHigh ? 0.22 : 0.45;
  const oilyClearcoatRough = isHigh ? 0.45 : 0.28;
  const oilyEnvMap = isHigh ? 0.7 : 1.5;
  const material = new THREE.MeshPhysicalMaterial({
    color: c,
    map: map || null,
    roughness: isOilyLeather ? oilyRoughness : (isLeather ? 0.78 : 0.88),
    metalness: 0,
    sheen: isOilyLeather ? oilySheen : (isLeather ? 0.18 : 0.12),
    sheenRoughness: isOilyLeather ? (isHigh ? 0.5 : 0.4) : (isLeather ? 0.85 : 0.95),
    sheenColor: isOilyLeather
      ? new THREE.Color(isHigh ? 0x4a4744 : 0x60584f)
      : isLeather
        ? new THREE.Color(0x6b6764)
        : new THREE.Color(sofaColor.swatchColor || sofaColor.color),
    clearcoat: isOilyLeather ? oilyClearcoat : 0,
    clearcoatRoughness: isOilyLeather ? oilyClearcoatRough : 0.7,
    envMapIntensity: isOilyLeather ? oilyEnvMap : (isLeather ? 0.45 : 0.55)
  });
  return material;
}

export function createBaseMaterial(baseColor, isLeather, quality = "medium") {
  const isBlackLeather = /black|블랙/i.test(baseColor.label || "") && /leather_black|natural/i.test(baseColor.image || "");
  const isHigh = quality === "high";
  if (isBlackLeather) {
    const repeat = [0.12, 0.12];
    const map = loadTextureCached(baseColor.image, repeat);
    return new THREE.MeshPhysicalMaterial({
      color: map ? new THREE.Color(0x3a3633) : new THREE.Color(baseColor.color),
      map: map || null,
      roughness: isHigh ? 0.5 : 0.36,
      metalness: 0,
      sheen: isHigh ? 0.45 : 0.6,
      sheenRoughness: isHigh ? 0.5 : 0.32,
      sheenColor: new THREE.Color(isHigh ? 0x4a4744 : 0x6c635a),
      clearcoat: isHigh ? 0.22 : 0.45,
      clearcoatRoughness: isHigh ? 0.45 : 0.28,
      envMapIntensity: isHigh ? 0.7 : 1.5
    });
  }
  // 일반 base
  const map = loadTextureCached(baseColor.image, [3, 3]);
  const color = map ? new THREE.Color(0xffffff) : new THREE.Color(baseColor.color);
  return new THREE.MeshPhysicalMaterial({
    color,
    map: map || null,
    roughness: isLeather ? 0.45 : 0.6,
    metalness: 0,
    sheen: isLeather ? 0.9 : 0.12,
    sheenColor: isLeather ? new THREE.Color(0xdddddd) : new THREE.Color(0xffffff),
    clearcoat: isLeather ? 0 : 0.18,
    clearcoatRoughness: 0.6,
    envMapIntensity: isLeather ? 0.85 : 1.0,
  });
}

export function createMetalMaterial() {
  return new THREE.MeshPhongMaterial({
    color: 0xc4c4c4,
    specular: 0xf0f0f0,
    shininess: 140,
    emissive: 0x282828,
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
      color: new THREE.Color(0x968874),
      map: getWalnutTexture(),
      roughness: 0.85,
      metalness: 0,
      clearcoat: 0.05,
      clearcoatRoughness: 0.85
    });
  }
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(trayWood?.color || "#000000"),
    roughness: 0.85,
    metalness: 0,
    clearcoat: 0.05,
    clearcoatRoughness: 0.85,
    sheen: 0.05
  });
}
