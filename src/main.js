import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const canvas = document.querySelector("#scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf8f7f2);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.5;

const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
camera.position.set(4.5, 1.4, 5.2);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.35, 0);
controls.maxPolarAngle = Math.PI * 0.48;
controls.minDistance = 2.1;
controls.maxDistance = 15;

const sofaRoot = new THREE.Group();
const guideRoot = new THREE.Group();
const expansionRoot = new THREE.Group();
scene.add(sofaRoot, guideRoot, expansionRoot);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const selectable = [];
const hotspotWorldPosition = new THREE.Vector3();
const projectedHotspotPosition = new THREE.Vector3();
const sideWorldPositions = {
  left: new THREE.Vector3(),
  right: new THREE.Vector3()
};
const importedModels = {};
let activeHotspotSide = null;
let toolbarModuleId = null;
const thumbnailCards = {};
const catalogCards = {};
const toolbarWorldPosition = new THREE.Vector3();

const moduleCatalog = {
  armlessLeft: { label: "싱글암(좌)", width: 0.95, depth: 0.9, height: 0.68, seats: 1, model: "singleArmLeftOne", arms: ["right"], openSides: ["left"], price: { fabric: 960000, leather: 1818000 }, thumbnail: "./assets/thumbnails/singlearm_L_1.png" },
  armlessRight: { label: "싱글암(우)", width: 0.95, depth: 0.9, height: 0.68, seats: 1, model: "singleArmLeftOne", mirror: true, arms: ["left"], openSides: ["right"], price: { fabric: 960000, leather: 1818000 }, thumbnail: "./assets/thumbnails/singlearm_R_1.png" },
  doubleOne: { label: "더블암 1인", width: 1.15, depth: 0.9, height: 0.68, seats: 1, model: "doubleArmOne", arms: ["left", "right"], openSides: ["left", "right"], price: { fabric: 1090000, leather: 2090000 }, thumbnail: "./assets/thumbnails/doublearm_1.png" },
  doubleTwo: { label: "더블암 2인", width: 1.9, depth: 0.9, height: 0.68, seats: 2, model: "doubleArmTwo", arms: ["left", "right"], openSides: ["left", "right"], price: { fabric: 1500000, leather: 3000000 }, thumbnail: "./assets/thumbnails/doublearm_2.png" },
  singleLeftTwo: { label: "싱글암2인(좌)", width: 1.7, depth: 0.9, height: 0.68, seats: 2, model: "singleArmRightTwo", arms: ["right"], openSides: ["left"], price: { fabric: 1410000, leather: 2727000 }, thumbnail: "./assets/thumbnails/singlearm_L_2.png" },
  singleRightTwo: { label: "싱글암2인(우)", width: 1.7, depth: 0.9, height: 0.68, seats: 2, model: "singleArmRightTwo", mirror: true, arms: ["left"], openSides: ["right"], price: { fabric: 1410000, leather: 2727000 }, thumbnail: "./assets/thumbnails/singlearm_R_2.png" },
  trayLeftOne: { label: "트레이(좌)", width: 1.15, depth: 0.9, height: 0.68, seats: 1, model: "trayLeftOne", mirror: true, arms: [], openSides: ["right"], price: { fabric: 818000, leather: 1636000 }, thumbnail: "./assets/thumbnails/trey_L.png" },
  trayRightOne: { label: "트레이(우)", width: 1.15, depth: 0.9, height: 0.68, seats: 1, model: "trayLeftOne", arms: [], openSides: ["left"], price: { fabric: 818000, leather: 1636000 }, thumbnail: "./assets/thumbnails/trey_R.png" }
};

const modelSources = {
  singleArmLeftOne: "./models/sofa_module/single_arm(L)1.glb?v=10",
  doubleArmOne: "./models/sofa_module_v2/newdoublearm1.glb?v=28",
  doubleArmTwo: "./models/sofa_module_v2/newdoublearm2.glb?v=12",
  singleArmRightTwo: "./models/sofa_module/__singlearm2_R.glb?v=10",
  trayLeftOne: "./models/sofa_module/single_tray(L).glb?v=10"
};

const modelMaterialRoles = {
  singleArmLeftOne: {
    upholstery: ["fabric", "가죽1"],
    base: ["base", "가죽1_0", "가죽1_1", "가죽1_base_strip"],
    metal: ["metal", "__metal*"]
  },
  singleArmRightTwo: {
    upholstery: ["fabric", "가죽1"],
    base: ["base", "가죽1_0", "가죽1_1", "material_73", "가죽1_base_strip"],
    metal: ["metal", "__metal*"]
  },
  trayLeftOne: {
    upholstery: ["fabric", "가죽1"],
    base: ["base", "가죽1_0", "가죽1_1", "material_73", "가죽1_base_strip"],
    trayWood: ["trayWood", "material_89"],
    metal: ["metal", "__metal*"]
  },
  doubleArmOne: {
    upholstery: ["fabric"],
    base: ["base"],
    metal: ["metal", "__metal*"]
  },
  doubleArmTwo: {
    upholstery: ["fabric"],
    base: ["base"],
    metal: ["metal", "__metal*"]
  }
};

const sofaColors = [
  { id: "fabricIvory", label: "패브릭 아이보리", color: "#e6dcd1", group: "light", textureFolder: "./materials/sofa/fabric_ivory" },
  { id: "fabricGray", label: "패브릭 그레이", color: "#918d8b", group: "light", textureFolder: "./materials/sofa/fabric_gray" },
  { id: "fabricCharcoal", label: "패브릭 차콜블랙", color: "#3b3a3a", group: "fabricDark", textureFolder: "./materials/sofa/fabric_charcoal" },
  { id: "leatherBlack", label: "천연가죽 블랙", color: "#1a1a1a", group: "leatherBlack", image: "./assets/thumbnails/texture/Kashi%209.jpg", textureFolder: "./materials/sofa/leather_black" }
];

const fabricSofaColors = sofaColors;

const baseFrameOptionsByGroup = {
  light: [
    { label: "비건가죽 그레이", color: "#b7aa9e", textureFolder: "./materials/frame/default" },
    { label: "비건가죽 헤이즐", color: "#716253", textureFolder: "./materials/frame/default" },
    { label: "비건가죽 올리브", color: "#595b45", textureFolder: "./materials/frame/default" },
    { label: "비건가죽 그린", color: "#2c4128", textureFolder: "./materials/frame/default" },
    { label: "천연가죽 썬더", color: "#4d4843", textureFolder: "./materials/frame/default" }
  ],
  fabricDark: [
    { label: "비건가죽 그레이", color: "#b7aa9e", textureFolder: "./materials/frame/default" },
    { label: "비건가죽 헤이즐", color: "#716253", textureFolder: "./materials/frame/default" },
    { label: "비건가죽 올리브", color: "#595b45", textureFolder: "./materials/frame/default" },
    { label: "비건가죽 그린", color: "#2c4128", textureFolder: "./materials/frame/default" },
    { label: "천연가죽 썬더", color: "#4d4843", textureFolder: "./materials/frame/default" }
  ],
  leatherBlack: [
    { label: "비건가죽 그레이", color: "#b7aa9e", textureFolder: "./materials/frame/default" },
    { label: "비건가죽 헤이즐", color: "#716253", textureFolder: "./materials/frame/default" },
    { label: "비건가죽 올리브", color: "#595b45", textureFolder: "./materials/frame/default" },
    { label: "비건가죽 그린", color: "#2c4128", textureFolder: "./materials/frame/default" },
    { label: "천연가죽 썬더", color: "#4d4843", textureFolder: "./materials/frame/default" }
  ]
};

const baseFrameColors = baseFrameOptionsByGroup.light;

const trayWoodColors = [
  { label: "월넛", color: "#3d2f22", image: "./assets/thumbnails/texture/131_Persian%20walnut%20PBR%20texture-seamless.jpg", textureFolder: "./materials/tray_wood/walnut" },
  { label: "블랙", color: "#000000", textureFolder: "./materials/tray_wood/black" }
];

const accentCushionColors = [
  { label: "레드", color: "#782b24" },
  { label: "카멜", color: "#945d25" },
  { label: "로즈우드", color: "#9b5d58" },
  { label: "스톤", color: "#5b5558" },
  { label: "그린", color: "#334339" },
  { label: "스카이", color: "#88acb9" },
  { label: "네이비", color: "#212c4a" }
];

const state = {
  layout: "armlessLeft",
  material: "fabric",
  sofaColor: fabricSofaColors[0],
  baseColor: baseFrameColors[0],
  trayWood: trayWoodColors[0],
  accentCushion: null, // visual selection only, not used anymore for cart
  selectedId: "module-1",
  modules: [],
  // Cart-only options: each is a map { label: quantity }
  options: {
    trayWood: {},   // e.g. { "월넛": 1 }
    cushion: {}     // e.g. { "레드": 3 }
  }
};

const TRAY_WOOD_PRICE = 150000;
const CUSHION_PRICE = 31818;

const els = {
  moduleCatalog: document.querySelector("#moduleCatalog"),
  sofaSwatches: document.querySelector("#sofaSwatches"),
  baseSwatches: document.querySelector("#baseSwatches"),
  sofaColorGroup: document.querySelector("#sofaColorGroup"),
  baseColorGroup: document.querySelector("#baseColorGroup"),
  widthMetric: document.querySelector("#widthMetric"),
  depthMetric: document.querySelector("#depthMetric"),
  moduleCount: document.querySelector("#moduleCount"),
  sofaColorLabel: document.querySelector("#sofaColorLabel"),
  baseColorLabel: document.querySelector("#baseColorLabel"),
  selectedLabel: document.querySelector("#selectedLabel"),
  showGuides: document.querySelector("#showGuides"),
  hotspotPopover: document.querySelector("#hotspotPopover"),
  hotspotThumbnails: document.querySelector("#hotspotThumbnails"),
  leftHotspot: document.querySelector("#leftHotspot"),
  rightHotspot: document.querySelector("#rightHotspot"),
  moduleToolbar: document.querySelector("#moduleToolbar"),
  totalPrice: document.querySelector("#totalPrice"),
  cartToggle: document.querySelector("#cartToggle"),
  cartToggleCount: document.querySelector("#cartToggleCount"),
  cartList: document.querySelector("#cartList"),
  trayWoodSwatches: document.querySelector("#trayWoodSwatches"),
  trayWoodLabel: document.querySelector("#trayWoodLabel"),
  accentCushionSwatches: document.querySelector("#accentCushionSwatches"),
  accentCushionLabel: document.querySelector("#accentCushionLabel"),
  dimWidth: document.querySelector("#dimWidth"),
  dimDepth: document.querySelector("#dimDepth"),
  dimHeight: document.querySelector("#dimHeight"),
  dimSvg: document.querySelector("#dimSvg"),
  dimWidthLine: document.querySelector("#dimWidthLine"),
  dimDepthLine: document.querySelector("#dimDepthLine"),
  dimHeightLine: document.querySelector("#dimHeightLine"),
  dimWidthTickA: document.querySelector("#dimWidthTickA"),
  dimWidthTickB: document.querySelector("#dimWidthTickB"),
  dimDepthTickA: document.querySelector("#dimDepthTickA"),
  dimDepthTickB: document.querySelector("#dimDepthTickB"),
  dimHeightTickA: document.querySelector("#dimHeightTickA"),
  dimHeightTickB: document.querySelector("#dimHeightTickB"),
  toggleDimensions: document.querySelector("#toggleDimensions")
};

let showDimensions = true;

const boxGeometry = new RoundedBoxGeometry(1, 1, 1, 10, 0.06);
const cushionGeometry = new RoundedBoxGeometry(1, 1, 1, 14, 0.1);
const legGeometry = new THREE.CylinderGeometry(0.018, 0.014, 0.34, 10);
const fabricTexture = makeFabricTexture();
fabricTexture.colorSpace = THREE.SRGBColorSpace;
fabricTexture.wrapS = THREE.RepeatWrapping;
fabricTexture.wrapT = THREE.RepeatWrapping;
fabricTexture.repeat.set(14, 14);
fabricTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

const shadowMaterial = new THREE.ShadowMaterial({ color: 0x1a160f, opacity: 0.55 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 14), shadowMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
floor.receiveShadow = true;
scene.add(floor);

const contactShadowTexture = makeContactShadowTexture();
const contactShadowMaterial = new THREE.MeshBasicMaterial({
  map: contactShadowTexture,
  transparent: true,
  opacity: 0.55,
  depthWrite: false
});
const contactShadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), contactShadowMaterial);
contactShadow.rotation.x = -Math.PI / 2;
contactShadow.position.y = -0.005;
contactShadow.renderOrder = -1;
contactShadow.visible = false;

function makeContactShadowTexture() {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  // Very soft gaussian-like falloff — strongest in center, melts away
  const cx = size / 2;
  const cy = size / 2;
  const img = ctx.createImageData(size, size);
  const data = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x - cx) / cx;
      const dy = (y - cy) / cy;
      const r = Math.sqrt(dx * dx + dy * dy);
      // Gaussian-ish: sharp peak, very smooth tail
      // Very soft gaussian — gentle and faint
      const alpha = Math.exp(-r * r * 3.5) * 0.22;
      const i = (y * size + x) * 4;
      data[i] = 15;
      data[i + 1] = 12;
      data[i + 2] = 8;
      data[i + 3] = Math.round(alpha * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function updateContactShadow() {
  contactShadow.visible = false;
  return;
  // legacy positioning kept below in case we re-enable later
  // eslint-disable-next-line no-unreachable
  const bounds = new THREE.Box3().setFromObject(sofaRoot);
  if (bounds.isEmpty()) {
    return;
  }
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  // Larger padding so the soft tail has room — gradient itself fades long before the edge
  const padX = size.x * 1.0;
  const padZ = size.z * 1.0;
  contactShadow.scale.set(size.x + padX, size.z + padZ, 1);
  contactShadow.position.set(center.x, -0.005, center.z);
}

scene.add(new THREE.HemisphereLight(0xffffff, 0xf2eee6, 0.55));

const SUN_RADIUS = 0.8;
const SUN_HEIGHT = 10;
const keyLight = new THREE.DirectionalLight(0xfff4e0, 2.0);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(256, 256);
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 18;
keyLight.shadow.camera.left = -8;
keyLight.shadow.camera.right = 8;
keyLight.shadow.camera.top = 8;
keyLight.shadow.camera.bottom = -8;
keyLight.shadow.bias = -0.0004;
keyLight.shadow.normalBias = 0.04;
keyLight.shadow.radius = 80;
scene.add(keyLight);

function setSunAngle(degrees) {
  const rad = THREE.MathUtils.degToRad(degrees);
  keyLight.position.set(Math.cos(rad) * SUN_RADIUS, SUN_HEIGHT, Math.sin(rad) * SUN_RADIUS);
  keyLight.target.position.set(0, 0, 0);
  keyLight.target.updateMatrixWorld();
}
setSunAngle(135);

const fillLight = new THREE.DirectionalLight(0xeaf0ff, 0.45);
fillLight.position.set(5, 3.5, 2);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffe9c8, 0.36);
rimLight.position.set(-3, 4, -5);
scene.add(rimLight);

function currentSofaColor() {
  return state.sofaColor;
}

function currentBaseColor() {
  if (baseFollowsSofaMaterial()) {
    return state.sofaColor;
  }
  return state.baseColor;
}

function baseFollowsSofaMaterial() {
  return false;
}

function createUpholsteryMaterial() {
  const isLeather = state.material === "naturalLeather";
  const sofaColor = new THREE.Color(currentSofaColor().color);
  const mat = new THREE.MeshPhysicalMaterial({
    color: sofaColor,
    roughness: isLeather ? 0.42 : 0.88,
    metalness: 0,
    sheen: isLeather ? 0.75 : 0.12,
    sheenRoughness: isLeather ? 0.42 : 0.95,
    sheenColor: isLeather
      ? new THREE.Color(0xdddddd)
      : sofaColor.clone().multiplyScalar(1.02),
    map: isLeather ? leatherTexture : null,
    clearcoat: 0,
    clearcoatRoughness: 0.42,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0,
    envMapIntensity: isLeather ? 0.95 : 0.85
  });
  // PBR 텍스처 폴더가 지정된 색상이면 자동 적용
  applyPBRToMaterial(mat, currentSofaColor().textureFolder);
  return mat;
}

function createBaseMaterial() {
  const isLeather = state.material === "naturalLeather";
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(currentBaseColor().color),
    roughness: isLeather ? 0.45 : 0.6,
    metalness: 0,
    sheen: isLeather ? 0.9 : 0.12,
    sheenRoughness: isLeather ? 0.4 : undefined,
    sheenColor: isLeather ? new THREE.Color(0xdddddd) : undefined,
    clearcoat: isLeather ? 0 : 0.18,
    clearcoatRoughness: 0.6,
    map: isLeather ? leatherTexture : null,
    envMapIntensity: isLeather ? 0.85 : 1.0
  });
  applyPBRToMaterial(mat, currentBaseColor().textureFolder);
  return mat;
}

function createMetalMaterial() {
  return new THREE.MeshPhongMaterial({
    color: 0xd9d9d9,
    specular: 0xffffff,
    shininess: 140,
    emissive: 0x303030,
    reflectivity: 0.55
  });
}

const _textureLoader = new THREE.TextureLoader();
const walnutTexture = _textureLoader.load(
  "./assets/thumbnails/texture/131_Persian%20walnut%20PBR%20texture-seamless.jpg"
);
walnutTexture.colorSpace = THREE.SRGBColorSpace;
walnutTexture.wrapS = THREE.RepeatWrapping;
walnutTexture.wrapT = THREE.RepeatWrapping;
walnutTexture.repeat.set(1.5, 1.5);
walnutTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

const leatherTexture = _textureLoader.load("./assets/thumbnails/texture/Kashi%209.jpg");
leatherTexture.colorSpace = THREE.SRGBColorSpace;
leatherTexture.wrapS = THREE.RepeatWrapping;
leatherTexture.wrapT = THREE.RepeatWrapping;
leatherTexture.repeat.set(1.5, 1.5);
leatherTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

// PBR 재질 폴더 자동 로드 (manifest.json 기반)
// 사용법: materials/<카테고리>/<이름>/ 안에 manifest.json + 텍스처 파일을 넣으면
//        sofaColors / baseFrameColors / trayWoodColors 의 textureFolder 필드에 경로 지정
// manifest.json 형식:
// {
//   "albedo": "fabric_albedo.jpg",
//   "normal": "fabric_normal.jpg",
//   "roughness": "fabric_roughness.jpg",
//   "metalness": "fabric_metallic.jpg",
//   "ao": "fabric_ao.jpg",
//   "repeat": [4, 4]
// }
const _pbrCache = new Map();
async function loadPBRSet(folderPath) {
  if (_pbrCache.has(folderPath)) return _pbrCache.get(folderPath);
  try {
    const res = await fetch(`${folderPath}/manifest.json`);
    if (!res.ok) {
      _pbrCache.set(folderPath, null);
      return null;
    }
    const manifest = await res.json();
    const repeat = manifest.repeat || [1, 1];
    const loadOne = (filename, sRGB = false) => {
      if (!filename) return null;
      const tex = _textureLoader.load(`${folderPath}/${filename}`);
      if (sRGB) tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(repeat[0], repeat[1]);
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return tex;
    };
    const set = {
      map: loadOne(manifest.albedo, true),
      normalMap: loadOne(manifest.normal),
      roughnessMap: loadOne(manifest.roughness),
      metalnessMap: loadOne(manifest.metalness),
      aoMap: loadOne(manifest.ao),
      displacementMap: loadOne(manifest.displacement),
      emissiveMap: loadOne(manifest.emissive, true)
    };
    _pbrCache.set(folderPath, set);
    return set;
  } catch (e) {
    console.warn(`PBR set load failed for ${folderPath}:`, e);
    _pbrCache.set(folderPath, null);
    return null;
  }
}

// 동기 적용 (이미 캐시된 경우만): 머티리얼에 텍스처 슬롯 적용
function applyPBRToMaterial(material, folderPath) {
  if (!folderPath) return;
  const set = _pbrCache.get(folderPath);
  if (!set) return;
  for (const key of ["map","normalMap","roughnessMap","metalnessMap","aoMap","displacementMap","emissiveMap"]) {
    if (set[key]) material[key] = set[key];
  }
  material.needsUpdate = true;
}

// 모든 sofaColors / baseFrameColors / trayWoodColors의 textureFolder를 미리 캐시
async function preloadAllPBRSets() {
  const folders = new Set();
  const collect = (arr) => {
    if (!arr) return;
    for (const item of arr) {
      if (item.textureFolder) folders.add(item.textureFolder);
    }
  };
  collect(typeof sofaColors !== "undefined" ? sofaColors : []);
  for (const k in (typeof baseFrameOptionsByGroup !== "undefined" ? baseFrameOptionsByGroup : {})) {
    collect(baseFrameOptionsByGroup[k]);
  }
  collect(typeof trayWoodColors !== "undefined" ? trayWoodColors : []);
  await Promise.all([...folders].map(loadPBRSet));
}
// 페이지 로드 시 자동 프리로드
preloadAllPBRSets();

function createTrayWoodMaterial() {
  const isWalnut = state.trayWood?.label === "월넛";
  if (isWalnut) {
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x6a6258),
      map: walnutTexture,
      roughness: 0.55,
      metalness: 0,
      clearcoat: 0.35,
      clearcoatRoughness: 0.45
    });
    applyPBRToMaterial(mat, state.trayWood?.textureFolder);
    return mat;
  }
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(state.trayWood?.color || "#000000"),
    roughness: 0.55,
    metalness: 0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.45,
    sheen: 0.1
  });
  applyPBRToMaterial(mat, state.trayWood?.textureFolder);
  return mat;
}

function createAccentCushionMaterial(colorHex) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(colorHex),
    roughness: 0.9,
    metalness: 0,
    sheen: 0.45,
    sheenRoughness: 0.85,
    sheenColor: new THREE.Color(colorHex).multiplyScalar(1.1)
  });
}


function makeFabricTexture() {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  const img = ctx.getImageData(0, 0, size, size);
  const data = img.data;
  const weave = 4;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      const warp = ((x / weave) | 0) % 2;
      const weft = ((y / weave) | 0) % 2;
      const interlace = warp ^ weft ? 14 : -10;
      const microNoise = (Math.random() - 0.5) * 18;
      const fiber = Math.sin((x + y) * 0.6) * 4 + Math.cos((x - y) * 0.9) * 3;
      const v = 235 + interlace + microNoise + fiber;
      const clamped = Math.max(200, Math.min(255, v));
      data[i] = clamped;
      data[i + 1] = clamped;
      data[i + 2] = clamped;
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return new THREE.CanvasTexture(c);
}

function makeModule(id, type, x, z, rotation = 0) {
  return { id, type, x, z, rotation };
}

function setLayout(layout) {
  state.layout = layout;
  const initialType = moduleCatalog[layout] ? layout : "doubleOne";
  state.modules = [makeModule("module-1", initialType, 0, 0)];
  state.selectedId = state.modules[0]?.id;
  rebuildSofa({ recenterCamera: true });
}

function moduleDimensions(module) {
  const spec = moduleCatalog[module.type] || moduleCatalog.doubleOne;
  return { w: spec.width, d: spec.depth, h: spec.height };
}

function moduleLabel(type) {
  return moduleCatalog[type]?.label || "모듈";
}

function normalizeMaterialName(materialName) {
  return (materialName || "").toLowerCase().replace(/\.\d+$/, "");
}

function materialNameMatches(name, patterns = []) {
  return patterns.some((pattern) => {
    const matcher = pattern.toLowerCase();
    if (matcher.endsWith("*")) return name.startsWith(matcher.slice(0, -1));
    return name === matcher;
  });
}

function importedMaterialRole(materialName, modelKey) {
  const name = normalizeMaterialName(materialName);
  const roles = modelMaterialRoles[modelKey];
  if (roles) {
    if (materialNameMatches(name, roles.metal)) return "metal";
    if (materialNameMatches(name, roles.trayWood)) return "trayWood";
    if (materialNameMatches(name, roles.upholstery)) return "upholstery";
    if (materialNameMatches(name, roles.base)) return "base";
    console.warn(`Unmapped material "${materialName}" in ${modelKey}; using upholstery`);
    return "upholstery";
  }

  if (name.includes("metal") || name.includes("__metal")) return "metal";
  if (name.includes("material_89") || name.includes("wood")) return "trayWood";
  if (name.includes("가죽1_0") || name.includes("가죽1_1")) return "base";
  if (
    name.includes("base") ||
    name.includes("leather") ||
    name.includes("가죽2")
  ) {
    return "base";
  }
  return "upholstery";
}

function materialForImportedRole(role, upholsteryMaterial, baseMaterial, metalMaterial, trayWoodMaterial) {
  if (role === "metal") return metalMaterial.clone();
  if (role === "base") return baseMaterial.clone();
  if (role === "trayWood") return trayWoodMaterial.clone();
  return upholsteryMaterial.clone();
}

function materialForImportedRoleWithSofaFollow(role, upholsteryMaterial, baseMaterial, metalMaterial, trayWoodMaterial) {
  if (role === "metal") return metalMaterial.clone();
  if (role === "trayWood") return trayWoodMaterial.clone();
  if (baseFollowsSofaMaterial()) return upholsteryMaterial.clone();
  if (role === "base") return baseMaterial.clone();
  return upholsteryMaterial.clone();
}

function remapImportedMaterial(sourceMaterial, modelKey, upholsteryMaterial, baseMaterial, metalMaterial, trayWoodMaterial) {
  if (Array.isArray(sourceMaterial)) {
    return sourceMaterial.map((material) =>
      materialForImportedRoleWithSofaFollow(
        importedMaterialRole(material?.name, modelKey),
        upholsteryMaterial,
        baseMaterial,
        metalMaterial,
        trayWoodMaterial
      )
    );
  }
  return materialForImportedRoleWithSofaFollow(
    importedMaterialRole(sourceMaterial?.name, modelKey),
    upholsteryMaterial,
    baseMaterial,
    metalMaterial,
    trayWoodMaterial
  );
}

function isDoubleArmModel(modelKey) {
  return modelKey === "doubleArmOne" || modelKey === "doubleArmTwo";
}

function remapDoubleArmMaterial(sourceMaterial, upholsteryMaterial, metalMaterial) {
  const mapOne = (material) =>
    importedMaterialRole(material?.name, "doubleArmOne") === "metal"
      ? metalMaterial.clone()
      : upholsteryMaterial.clone();
  return Array.isArray(sourceMaterial) ? sourceMaterial.map(mapOne) : mapOne(sourceMaterial);
}

function createImportedModule(module, upholsteryMaterial, baseMaterial, metalMaterial) {
  const group = new THREE.Group();
  group.name = module.id;
  group.userData.moduleId = module.id;
  const { w, d, h } = moduleDimensions(module);
  const spec = moduleCatalog[module.type] || moduleCatalog.doubleOne;
  const sourceModel = importedModels[spec.model];
  if (!sourceModel) {
    console.warn(`Missing model for ${module.type}: ${spec.model}`);
    return createProceduralModule(module, upholsteryMaterial, baseMaterial, metalMaterial);
  }

  const model = sourceModel.clone(true);
  const trayWoodMaterial = createTrayWoodMaterial();

  model.traverse((child) => {
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    if (child.geometry && child.geometry.attributes) {
      if (child.geometry.attributes.color) child.geometry.deleteAttribute("color");
    }
    child.material = remapImportedMaterial(
      child.material,
      spec.model,
      upholsteryMaterial,
      baseMaterial,
      metalMaterial,
      trayWoodMaterial
    );
    // 머티리얼 통일성 보장: vertex color 변조와 GLB 잔여 텍스처 제거
    const enforceUniform = (mat) => {
      if (!mat) return;
      if ("vertexColors" in mat) mat.vertexColors = false;
      if ("map" in mat && mat.map && state.material !== "naturalLeather") mat.map = null;
      mat.needsUpdate = true;
    };
    if (Array.isArray(child.material)) child.material.forEach(enforceUniform);
    else enforceUniform(child.material);
  });

  const initialBounds = new THREE.Box3().setFromObject(model);
  const initialSize = initialBounds.getSize(new THREE.Vector3());
  const mirror = spec.mirror ? -1 : 1;
  const scaleX = Number.isFinite(w / initialSize.x) ? w / initialSize.x : 1;
  const scaleY = Number.isFinite(h / initialSize.y) ? h / initialSize.y : 1;
  const scaleZ = Number.isFinite(d / initialSize.z) ? d / initialSize.z : 1;
  model.scale.set(scaleX * mirror, scaleY, scaleZ);
  group.add(model);

  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  model.position.x -= center.x;
  model.position.z -= center.z;
  model.position.y -= bounds.min.y;

  group.position.set(module.x, 0, module.z);
  group.rotation.y = module.rotation;
  if (module.id === toolbarModuleId) applyGlowHighlight(group);
  registerSelectable(group, module.id);
  return group;
}

function createProceduralModule(module, upholsteryMaterial, baseMaterial, metalMaterial) {
  const group = new THREE.Group();
  group.name = module.id;
  group.userData.moduleId = module.id;
  const { w, d, h } = moduleDimensions(module);

  const platform = new THREE.Mesh(boxGeometry, baseMaterial);
  platform.scale.set(w, 0.1, d);
  platform.position.y = 0.22;
  group.add(platform);

  const seat = new THREE.Mesh(cushionGeometry, upholsteryMaterial);
  seat.scale.set(w * 0.88, 0.22, d * 0.78);
  seat.position.set(0, 0.38, 0.06);
  group.add(seat);

  const back = new THREE.Mesh(cushionGeometry, upholsteryMaterial);
  back.scale.set(w * 0.82, 0.5, 0.14);
  back.position.set(0, h * 0.8, -d * 0.42);
  back.rotation.x = -0.08;
  group.add(back);

  const leftArm = module.type.includes("Left") || module.type.includes("double") || module.type.includes("trayRight");
  const rightArm = module.type.includes("Right") || module.type.includes("double") || module.type.includes("trayLeft");
  if (leftArm) addArm(group, -w * 0.44, d, h, upholsteryMaterial);
  if (rightArm) addArm(group, w * 0.44, d, h, upholsteryMaterial);

  if (module.type.includes("tray")) {
    const tray = new THREE.Mesh(boxGeometry, baseMaterial);
    tray.scale.set(w * 0.34, 0.045, d * 0.72);
    tray.position.set(module.type.includes("Left") ? w * 0.28 : -w * 0.28, 0.5, 0.08);
    group.add(tray);
  }

  [
    [-w * 0.42, d * 0.38],
    [w * 0.42, d * 0.38],
    [-w * 0.42, -d * 0.38],
    [w * 0.42, -d * 0.38]
  ].forEach(([x, z]) => {
    const leg = new THREE.Mesh(legGeometry, metalMaterial);
    leg.position.set(x, 0.02, z);
    group.add(leg);
  });

  group.position.set(module.x, 0, module.z);
  group.rotation.y = module.rotation;
  if (module.id === toolbarModuleId) applyGlowHighlight(group);
  registerSelectable(group, module.id);
  return group;
}

function applyGlowHighlight(group) {
  const glowColor = new THREE.Color(0xff4a3d);
  group.traverse((child) => {
    if (!child.isMesh || !child.material) return;
    const sourceMaterials = Array.isArray(child.material) ? child.material : [child.material];
    const highlighted = sourceMaterials.map((material) => {
      const clone = material.clone();
      if ("emissive" in clone) {
        clone.emissive = glowColor.clone();
        clone.emissiveIntensity = 0.3;
      }
      if ("clearcoat" in clone) clone.clearcoat = Math.max(clone.clearcoat || 0, 0.25);
      if ("envMapIntensity" in clone) clone.envMapIntensity = Math.max(clone.envMapIntensity || 0, 1.15);
      return clone;
    });
    child.material = Array.isArray(child.material) ? highlighted : highlighted[0];
  });
}

function addArm(group, x, depth, height, material) {
  const arm = new THREE.Mesh(boxGeometry, material);
  arm.scale.set(0.16, height * 0.78, depth * 0.9);
  arm.position.set(x, height * 0.49, 0);
  group.add(arm);
}

function createModule(module, upholsteryMaterial, baseMaterial, metalMaterial) {
  if (Object.keys(importedModels).length) return createImportedModule(module, upholsteryMaterial, baseMaterial, metalMaterial);
  return createProceduralModule(module, upholsteryMaterial, baseMaterial, metalMaterial);
}

function registerSelectable(group, moduleId) {
  group.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.userData.moduleId = moduleId;
      selectable.push(child);
    }
  });
}

function registerExpansionSelectable(group, side) {
  group.traverse((child) => {
    if (child.isMesh) {
      child.userData.expansionSide = side;
      selectable.push(child);
    }
  });
}

function createExpansionHotspot(side, x, z, width, depth) {
  const group = new THREE.Group();
  group.name = `expansion-${side}`;
  group.userData.expansionSide = side;
  sideWorldPositions[side].set(x, 0.04, z);

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(width, depth),
    new THREE.MeshBasicMaterial({ color: 0xd8d6d0, transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false })
  );
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = 0.006;
  plane.userData.expansionSide = side;
  group.add(plane);

  group.position.set(x, 0, z);
  registerExpansionSelectable(group, side);
  return group;
}

function rebuildSofa({ recenterCamera = false, animateCamera = false } = {}) {
  while (sofaRoot.children.length) sofaRoot.remove(sofaRoot.children[0]);
  while (expansionRoot.children.length) expansionRoot.remove(expansionRoot.children[0]);
  selectable.length = 0;
  const upholsteryMaterial = createUpholsteryMaterial();
  const baseMaterial = baseFollowsSofaMaterial() ? upholsteryMaterial.clone() : createBaseMaterial();
  const metalMaterial = createMetalMaterial();
  state.modules.forEach((module) => sofaRoot.add(createModule(module, upholsteryMaterial, baseMaterial, metalMaterial)));
  updateGuides();
  updateExpansionHotspots();
  updateContactShadow();
  if (recenterCamera) frameCameraToConfiguration(false, animateCamera);
  updateUi();
}

function updateGuides() {
  while (guideRoot.children.length) guideRoot.remove(guideRoot.children[0]);
  if (!els.showGuides || !els.showGuides.checked) return;

  state.modules.forEach((module) => {
    const { w, d } = moduleDimensions(module);
    const guide = new THREE.Mesh(
      new THREE.PlaneGeometry(w + 0.06, d + 0.06),
      new THREE.MeshBasicMaterial({ color: 0xbdbbb4, transparent: true, opacity: 0.28, side: THREE.DoubleSide })
    );
    guide.rotation.x = -Math.PI / 2;
    guide.rotation.z = module.rotation;
    guide.position.set(module.x, 0.004, module.z);
    guideRoot.add(guide);
  });
}

function updateUi() {
  const footprint = configuredFootprint();
  els.widthMetric.textContent = `W ${Math.round(footprint.width * 1000)} mm`;
  els.depthMetric.textContent = `D ${Math.round(footprint.depth * 1000)} mm`;
  els.moduleCount.textContent = `${state.modules.length}개 모듈`;
  els.sofaColorLabel.textContent = currentSofaColor().label;
  els.baseColorLabel.textContent = currentBaseColor().label;
  const selected = state.modules.find((module) => module.id === state.selectedId);
  if (els.selectedLabel) els.selectedLabel.textContent = selected ? moduleLabel(selected.type) : "없음";

  sofaRoot.children.forEach((group) => {
    group.scale.setScalar(1);
  });

  const selectedType = selected?.type;
  Object.entries(catalogCards).forEach(([type, button]) => {
    button.classList.toggle("is-active", type === selectedType);
  });

  updatePriceSummary();
  updateHotspotPopoverPosition();
  updateModuleToolbarPosition();
}

function sumQty(map) {
  return Object.values(map).reduce((s, q) => s + q, 0);
}

function calculateTotalPrice() {
  const tier = state.material === "naturalLeather" ? "leather" : "fabric";
  const modulesTotal = state.modules.reduce((sum, mod) => {
    const spec = moduleCatalog[mod.type];
    return sum + (spec?.price?.[tier] || 0);
  }, 0);
  const cushionTotal = sumQty(state.options.cushion) * CUSHION_PRICE;
  return modulesTotal + cushionTotal;
}

function formatKrw(value) {
  return value.toLocaleString("ko-KR") + "원";
}

function updatePriceSummary() {
  if (!els.totalPrice) return;
  els.totalPrice.textContent = formatKrw(calculateTotalPrice());
  if (els.cartToggleCount) {
    const total = state.modules.length + sumQty(state.options.cushion);
    els.cartToggleCount.textContent = total;
  }
  renderCartList();
}

function makeCartItem({ name, qty, unitPrice, onMinus, onPlus, onRemove, allowQty = true }) {
  const item = document.createElement("div");
  item.className = "cart-item";
  const totalPrice = qty * unitPrice;
  item.innerHTML = `
    <div class="cart-item-info">
      <p class="cart-item-name">${name}</p>
      ${allowQty
        ? `<div class="cart-qty-control">
             <button class="cart-qty-btn" data-act="minus" type="button" aria-label="수량 감소">−</button>
             <span class="cart-qty-num">${qty}</span>
             <button class="cart-qty-btn" data-act="plus" type="button" aria-label="수량 증가">+</button>
           </div>`
        : `<span class="cart-item-qty">${qty}</span>`}
    </div>
    <div class="cart-item-side">
      <button class="cart-item-remove" type="button" aria-label="삭제">×</button>
      <span class="cart-item-price">${formatKrw(totalPrice)}</span>
    </div>
  `;
  if (allowQty) {
    item.querySelector('[data-act="minus"]').addEventListener("click", onMinus);
    item.querySelector('[data-act="plus"]').addEventListener("click", onPlus);
  }
  item.querySelector(".cart-item-remove").addEventListener("click", onRemove);
  return item;
}

function renderCartList() {
  if (!els.cartList) return;
  const tier = state.material === "naturalLeather" ? "leather" : "fabric";
  const sofaLabel = state.sofaColor.label;
  const baseLabel = state.baseColor.label;
  els.cartList.innerHTML = "";

  // Modules
  state.modules.forEach((mod) => {
    const spec = moduleCatalog[mod.type];
    if (!spec) return;
    const price = spec.price?.[tier] || 0;
    els.cartList.append(makeCartItem({
      name: `${sofaLabel}/${baseLabel}/${spec.label}`,
      qty: 1,
      unitPrice: price,
      allowQty: false,
      onRemove: () => removeModuleById(mod.id)
    }));
  });

  // Cushion options
  Object.entries(state.options.cushion).forEach(([label, qty]) => {
    if (qty <= 0) return;
    els.cartList.append(makeCartItem({
      name: `소파 쿠션 - ${label}`,
      qty,
      unitPrice: CUSHION_PRICE,
      onMinus: () => updateOptionQty("cushion", label, qty - 1),
      onPlus: () => updateOptionQty("cushion", label, qty + 1),
      onRemove: () => updateOptionQty("cushion", label, 0)
    }));
  });
}

function updateOptionQty(group, label, newQty) {
  if (newQty <= 0) {
    delete state.options[group][label];
  } else {
    state.options[group][label] = newQty;
  }
  updatePriceSummary();
}

function addOption(group, label) {
  const current = state.options[group][label] || 0;
  state.options[group][label] = current + 1;
  updatePriceSummary();
}

function compactModulesAlongX() {
  if (state.modules.length <= 1) return;
  const sorted = [...state.modules].sort((a, b) => a.x - b.x);
  let cursor = sorted[0].x - moduleDimensions(sorted[0]).w / 2;
  sorted.forEach((mod) => {
    const { w } = moduleDimensions(mod);
    mod.x = cursor + w / 2;
    mod.z = 0;
    cursor += w;
  });
}

function removeModuleById(id) {
  if (state.modules.length <= 1) return;
  const idx = state.modules.findIndex((m) => m.id === id);
  if (idx < 0) return;
  state.modules.splice(idx, 1);
  if (state.selectedId === id) {
    state.selectedId = state.modules[Math.max(0, idx - 1)]?.id;
  }
  compactModulesAlongX();
  toolbarModuleId = null;
  rebuildSofa({ recenterCamera: true, animateCamera: true });
}

function configuredFootprint() {
  if (!state.modules.length) return { width: 0, depth: 0 };
  const bounds = state.modules.reduce(
    (acc, module) => {
      const { w, d } = moduleDimensions(module);
      const rotated = Math.abs(Math.sin(module.rotation % Math.PI)) > 0.5;
      const width = rotated ? d : w;
      const depth = rotated ? w : d;
      acc.minX = Math.min(acc.minX, module.x - width / 2);
      acc.maxX = Math.max(acc.maxX, module.x + width / 2);
      acc.minZ = Math.min(acc.minZ, module.z - depth / 2);
      acc.maxZ = Math.max(acc.maxZ, module.z + depth / 2);
      return acc;
    },
    { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity }
  );
  return { width: bounds.maxX - bounds.minX, depth: bounds.maxZ - bounds.minZ };
}

function configuredBounds() {
  if (!state.modules.length) return { minX: -0.575, maxX: 0.575, minZ: -0.45, maxZ: 0.45 };
  return state.modules.reduce(
    (acc, module) => {
      const { w, d } = moduleDimensions(module);
      const rotated = Math.abs(Math.sin(module.rotation % Math.PI)) > 0.5;
      const width = rotated ? d : w;
      const depth = rotated ? w : d;
      acc.minX = Math.min(acc.minX, module.x - width / 2);
      acc.maxX = Math.max(acc.maxX, module.x + width / 2);
      acc.minZ = Math.min(acc.minZ, module.z - depth / 2);
      acc.maxZ = Math.max(acc.maxZ, module.z + depth / 2);
      return acc;
    },
    { minX: Infinity, maxX: -Infinity, minZ: Infinity, maxZ: -Infinity }
  );
}

function configuredCenter() {
  const bounds = configuredBounds();
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    z: (bounds.minZ + bounds.maxZ) / 2
  };
}

function centerCameraOnConfiguration() {
  frameCameraToConfiguration(false);
  controls.update();
}

const DEFAULT_CAMERA_DIRECTION = new THREE.Vector3(0.45, 0.42, 0.78).normalize();

function computeCameraTarget(keepAngle) {
  const bounds = new THREE.Box3().setFromObject(sofaRoot);
  if (bounds.isEmpty()) return null;

  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());

  const target = new THREE.Vector3(
    center.x,
    center.y + size.y * 0.05,
    center.z
  );

  const fovV = THREE.MathUtils.degToRad(camera.fov);
  const fovH = 2 * Math.atan(Math.tan(fovV / 2) * camera.aspect);
  const horizontalPad = 2.6;
  const verticalPad = 3.0;
  const distH = (size.x * horizontalPad) / (2 * Math.tan(fovH / 2));
  const distV = (size.y * verticalPad) / (2 * Math.tan(fovV / 2));
  const distZ = (size.z * horizontalPad) / (2 * Math.tan(fovH / 2));
  const distance = THREE.MathUtils.clamp(Math.max(distH, distV, distZ) + 1.8, 6, 20);

  const direction = keepAngle
    ? camera.position.clone().sub(controls.target).normalize()
    : DEFAULT_CAMERA_DIRECTION.clone();

  return { target, direction, distance };
}

let cameraTween = null;

function frameCameraToConfiguration(keepAngle = true, animated = false) {
  const result = computeCameraTarget(keepAngle);
  if (!result) return;
  const { target, direction, distance } = result;
  const newPosition = target.clone().addScaledVector(direction, distance);

  if (cameraTween) cameraTween = null;

  if (!animated) {
    controls.target.copy(target);
    camera.position.copy(newPosition);
    camera.near = 0.05;
    camera.far = 100;
    camera.updateProjectionMatrix();
    controls.update();
    return;
  }

  const startTarget = controls.target.clone();
  const startPosition = camera.position.clone();
  const duration = 600;
  const startTime = performance.now();

  cameraTween = (now) => {
    const t = Math.min(1, (now - startTime) / duration);
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    controls.target.lerpVectors(startTarget, target, ease);
    camera.position.lerpVectors(startPosition, newPosition, ease);
    controls.update();
    if (t >= 1) cameraTween = null;
  };

  camera.near = 0.05;
  camera.far = 100;
  camera.updateProjectionMatrix();
}

const hotspotEnabled = { left: false, right: false };

// Given a module's catalog openSides (in module-local frame: "left"/"right" along local +X/-X),
// return which world-space sides (left/right/front/back) are open after applying its rotation.
function moduleWorldOpenSides(module) {
  const localOpen = moduleCatalog[module.type]?.openSides || [];
  // Local axes: "left" = -X, "right" = +X
  const result = new Set();
  // Normalize rotation to nearest 90° step
  const step = Math.round((module.rotation || 0) / (Math.PI / 2)) % 4;
  // step 0 → no change; step 1 → +90° (CCW around Y in three.js): local +X rotates to -Z (back).
  // Map: for each local side, after rotation, which world side is it?
  // In three.js with rotation.y, +rot rotates +X axis toward -Z.
  const rotMap = {
    0: { left: "left", right: "right" },
    1: { left: "back", right: "front" },
    2: { left: "right", right: "left" },
    3: { left: "front", right: "back" }
  };
  const m = rotMap[((step % 4) + 4) % 4];
  localOpen.forEach((side) => result.add(m[side]));
  return result;
}

function updateExpansionHotspots() {
  hotspotEnabled.left = false;
  hotspotEnabled.right = false;
  if (!state.modules.length) return;
  const bounds = configuredBounds();
  const depth = Math.max(bounds.maxZ - bounds.minZ, 0.9);
  const z = (bounds.minZ + bounds.maxZ) / 2;
  const ghostWidth = 1.15;

  const sorted = [...state.modules].sort((a, b) => a.x - b.x);
  const leftModule = sorted[0];
  const rightModule = sorted[sorted.length - 1];
  const leftWorldOpen = moduleWorldOpenSides(leftModule);
  const rightWorldOpen = moduleWorldOpenSides(rightModule);
  const leftOpens = leftWorldOpen.has("left");
  const rightOpens = rightWorldOpen.has("right");

  if (leftOpens) {
    hotspotEnabled.left = true;
    expansionRoot.add(createExpansionHotspot("left", bounds.minX - ghostWidth / 2, z, ghostWidth, depth));
  }
  if (rightOpens) {
    hotspotEnabled.right = true;
    expansionRoot.add(createExpansionHotspot("right", bounds.maxX + ghostWidth / 2, z, ghostWidth, depth));
  }
}

function addModule(type) {
  const spec = moduleCatalog[type];
  const maxX = state.modules.reduce((max, module) => {
    const { w } = moduleDimensions(module);
    return Math.max(max, module.x + w / 2);
  }, -0.575);
  const id = `module-${Date.now().toString().slice(-5)}`;
  state.modules.push(makeModule(id, type, maxX + spec.width / 2, 0));
  state.selectedId = id;
  toolbarModuleId = null;
  rebuildSofa({ recenterCamera: true, animateCamera: true });
}

function addModuleAtSide(type, side = "right") {
  if (!state.modules.length) {
    addModule(type);
    return;
  }

  const spec = moduleCatalog[type];
  const bounds = configuredBounds();
  const id = `module-${Date.now().toString().slice(-5)}`;
  // Tiny overlap to hide the seam between adjacent modules
  const SEAM = 0.02;
  const x = side === "left"
    ? bounds.minX - spec.width / 2 + SEAM
    : bounds.maxX + spec.width / 2 - SEAM;
  const z = (bounds.minZ + bounds.maxZ) / 2;
  state.modules.push(makeModule(id, type, x, z));
  state.selectedId = id;
  toolbarModuleId = null;
  activeHotspotSide = side;
  rebuildSofa({ recenterCamera: true, animateCamera: true });
}

function duplicateSelected() {
  const selected = state.modules.find((module) => module.id === state.selectedId);
  if (!selected) return;
  addModule(selected.type);
}

function rotateSelected(direction) {
  const module = state.modules.find((item) => item.id === state.selectedId);
  if (!module) return;
  module.rotation += direction * (Math.PI / 2);
  rebuildSofa();
}

function removeSelected() {
  if (state.modules.length <= 1) return;
  const index = state.modules.findIndex((item) => item.id === state.selectedId);
  if (index < 0) return;
  state.modules.splice(index, 1);
  state.selectedId = state.modules[Math.max(0, index - 1)]?.id;
  compactModulesAlongX();
  toolbarModuleId = null;
  rebuildSofa({ recenterCamera: true, animateCamera: true });
}

function resize() {
  const { clientWidth, clientHeight } = canvas.parentElement;
  renderer.setSize(clientWidth, clientHeight, false);
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
}

const _dimVec = new THREE.Vector3();
let _dimRect = null;
function projectToScreen(point) {
  _dimVec.copy(point).project(camera);
  const rect = _dimRect || renderer.domElement.getBoundingClientRect();
  return {
    x: Math.round(((_dimVec.x + 1) / 2) * rect.width),
    y: Math.round(((-_dimVec.y + 1) / 2) * rect.height),
    inFront: _dimVec.z < 1
  };
}

// Cheap occlusion check: edge is visible if camera is on the same side as the outward normal.
// `outward` is a unit vector pointing away from the sofa centroid.
function isFacingCamera(worldPoint, outward) {
  const toCam = camera.position.clone().sub(worldPoint).normalize();
  return toCam.dot(outward) > -0.05;
}

function updateDimensionLabels() {
  if (!els.dimWidth || !els.dimDepth) return;
  _dimRect = renderer.domElement.getBoundingClientRect();
  const hideAll = () => {
    els.dimWidth.style.display = "none";
    els.dimDepth.style.display = "none";
    if (els.dimHeight) els.dimHeight.style.display = "none";
    if (els.dimSvg) els.dimSvg.classList.add("is-hidden");
  };

  if (!showDimensions) return hideAll();
  if (!state.modules.length) return hideAll();
  const bounds = new THREE.Box3().setFromObject(sofaRoot);
  if (bounds.isEmpty()) return hideAll();

  if (els.dimSvg) els.dimSvg.classList.remove("is-hidden");

  const fp = configuredFootprint();
  const widthCm = Math.round(fp.width * 100);
  const depthCm = Math.round(fp.depth * 100);

  // Width: front edge of sofa (max Z), tick at left/right corners, label below center
  const wOffset = 0.22;
  const widthLeft3D = new THREE.Vector3(bounds.min.x, bounds.min.y, bounds.max.z + wOffset);
  const widthRight3D = new THREE.Vector3(bounds.max.x, bounds.min.y, bounds.max.z + wOffset);
  const widthMid3D = new THREE.Vector3((bounds.min.x + bounds.max.x) / 2, bounds.min.y, bounds.max.z + wOffset);
  // Tick anchors at the sofa's actual front corners
  const widthCornerLeft = new THREE.Vector3(bounds.min.x, bounds.min.y, bounds.max.z);
  const widthCornerRight = new THREE.Vector3(bounds.max.x, bounds.min.y, bounds.max.z);

  // Depth: side edge facing the camera (left if camera is on -X side, right if on +X side)
  const dOffset = 0.22;
  const sofaCenterX = (bounds.min.x + bounds.max.x) / 2;
  const depthOnRight = camera.position.x >= sofaCenterX;
  const depthEdgeX = depthOnRight ? bounds.max.x : bounds.min.x;
  const depthAnchorX = depthOnRight ? bounds.max.x + dOffset : bounds.min.x - dOffset;
  const depthFront3D = new THREE.Vector3(depthAnchorX, bounds.min.y, bounds.max.z);
  const depthBack3D = new THREE.Vector3(depthAnchorX, bounds.min.y, bounds.min.z);
  const depthMid3D = new THREE.Vector3(depthAnchorX, bounds.min.y, (bounds.min.z + bounds.max.z) / 2);
  const depthCornerFront = new THREE.Vector3(depthEdgeX, bounds.min.y, bounds.max.z);
  const depthCornerBack = new THREE.Vector3(depthEdgeX, bounds.min.y, bounds.min.z);

  // Height: shown on the BACK edge — uses the catalog backrest height (e.g. 680mm)
  const hOffset = 0.22;
  // Use the tallest module's catalog height as the backrest height
  const backrestHeight = state.modules.reduce((max, m) => {
    const spec = moduleCatalog[m.type];
    return Math.max(max, spec?.height || 0);
  }, 0.68);
  const heightTopY = bounds.min.y + backrestHeight;
  const heightBottom3D = new THREE.Vector3(bounds.min.x, bounds.min.y, bounds.min.z - hOffset);
  const heightTop3D = new THREE.Vector3(bounds.min.x, heightTopY, bounds.min.z - hOffset);
  const heightMid3D = new THREE.Vector3(bounds.min.x, (bounds.min.y + heightTopY) / 2, bounds.min.z - hOffset);
  const heightCornerBottom = new THREE.Vector3(bounds.min.x, bounds.min.y, bounds.min.z);
  const heightCornerTop = new THREE.Vector3(bounds.min.x, heightTopY, bounds.min.z);

  // Project all anchors
  const wL = projectToScreen(widthLeft3D);
  const wR = projectToScreen(widthRight3D);
  const wM = projectToScreen(widthMid3D);
  const wCL = projectToScreen(widthCornerLeft);
  const wCR = projectToScreen(widthCornerRight);
  const dF = projectToScreen(depthFront3D);
  const dB = projectToScreen(depthBack3D);
  const dM = projectToScreen(depthMid3D);
  const dCF = projectToScreen(depthCornerFront);
  const dCB = projectToScreen(depthCornerBack);
  const hBot = projectToScreen(heightBottom3D);
  const hTop = projectToScreen(heightTop3D);
  const hM = projectToScreen(heightMid3D);
  const hCBot = projectToScreen(heightCornerBottom);
  const hCTop = projectToScreen(heightCornerTop);

  // Cheap occlusion via dot product
  const widthOutward = new THREE.Vector3(0, 0, 1);
  const depthOutward = new THREE.Vector3(depthOnRight ? 1 : -1, 0, 0);
  const heightOutward = new THREE.Vector3(0, 0, -1);
  const widthVisible = isFacingCamera(widthCornerLeft, widthOutward);
  const depthVisible = isFacingCamera(depthCornerFront, depthOutward);
  const heightVisible = isFacingCamera(heightCornerBottom, heightOutward);
  const heightCm = Math.round(backrestHeight * 100);

  if (wM.inFront && widthVisible) {
    els.dimWidth.style.display = "inline-flex";
    els.dimWidth.style.left = `${wM.x}px`;
    els.dimWidth.style.top = `${wM.y}px`;
    els.dimWidth.textContent = `${widthCm} cm`;
    els.dimWidthLine.setAttribute("x1", wL.x);
    els.dimWidthLine.setAttribute("y1", wL.y);
    els.dimWidthLine.setAttribute("x2", wR.x);
    els.dimWidthLine.setAttribute("y2", wR.y);
    els.dimWidthLine.style.display = "";
    // Ticks: from corner-on-sofa to extended anchor
    els.dimWidthTickA.setAttribute("x1", wCL.x);
    els.dimWidthTickA.setAttribute("y1", wCL.y);
    els.dimWidthTickA.setAttribute("x2", wL.x);
    els.dimWidthTickA.setAttribute("y2", wL.y);
    els.dimWidthTickA.style.display = "";
    els.dimWidthTickB.setAttribute("x1", wCR.x);
    els.dimWidthTickB.setAttribute("y1", wCR.y);
    els.dimWidthTickB.setAttribute("x2", wR.x);
    els.dimWidthTickB.setAttribute("y2", wR.y);
    els.dimWidthTickB.style.display = "";
  } else {
    els.dimWidth.style.display = "none";
    els.dimWidthLine.style.display = "none";
    els.dimWidthTickA.style.display = "none";
    els.dimWidthTickB.style.display = "none";
  }

  if (dM.inFront && depthVisible) {
    els.dimDepth.style.display = "inline-flex";
    els.dimDepth.style.left = `${dM.x}px`;
    els.dimDepth.style.top = `${dM.y}px`;
    els.dimDepth.textContent = `${depthCm} cm`;
    els.dimDepthLine.setAttribute("x1", dF.x);
    els.dimDepthLine.setAttribute("y1", dF.y);
    els.dimDepthLine.setAttribute("x2", dB.x);
    els.dimDepthLine.setAttribute("y2", dB.y);
    els.dimDepthLine.style.display = "";
    els.dimDepthTickA.setAttribute("x1", dCF.x);
    els.dimDepthTickA.setAttribute("y1", dCF.y);
    els.dimDepthTickA.setAttribute("x2", dF.x);
    els.dimDepthTickA.setAttribute("y2", dF.y);
    els.dimDepthTickA.style.display = "";
    els.dimDepthTickB.setAttribute("x1", dCB.x);
    els.dimDepthTickB.setAttribute("y1", dCB.y);
    els.dimDepthTickB.setAttribute("x2", dB.x);
    els.dimDepthTickB.setAttribute("y2", dB.y);
    els.dimDepthTickB.style.display = "";
  } else {
    els.dimDepth.style.display = "none";
    els.dimDepthLine.style.display = "none";
    els.dimDepthTickA.style.display = "none";
    els.dimDepthTickB.style.display = "none";
  }

  if (hM.inFront && heightVisible) {
    els.dimHeight.style.display = "inline-flex";
    els.dimHeight.style.left = `${hM.x}px`;
    els.dimHeight.style.top = `${hM.y}px`;
    els.dimHeight.textContent = `${heightCm} cm`;
    els.dimHeightLine.setAttribute("x1", hBot.x);
    els.dimHeightLine.setAttribute("y1", hBot.y);
    els.dimHeightLine.setAttribute("x2", hTop.x);
    els.dimHeightLine.setAttribute("y2", hTop.y);
    els.dimHeightLine.style.display = "";
    els.dimHeightTickA.setAttribute("x1", hCBot.x);
    els.dimHeightTickA.setAttribute("y1", hCBot.y);
    els.dimHeightTickA.setAttribute("x2", hBot.x);
    els.dimHeightTickA.setAttribute("y2", hBot.y);
    els.dimHeightTickA.style.display = "";
    els.dimHeightTickB.setAttribute("x1", hCTop.x);
    els.dimHeightTickB.setAttribute("y1", hCTop.y);
    els.dimHeightTickB.setAttribute("x2", hTop.x);
    els.dimHeightTickB.setAttribute("y2", hTop.y);
    els.dimHeightTickB.style.display = "";
  } else {
    els.dimHeight.style.display = "none";
    els.dimHeightLine.style.display = "none";
    els.dimHeightTickA.style.display = "none";
    els.dimHeightTickB.style.display = "none";
  }
}

function animate() {
  if (cameraTween) cameraTween(performance.now());
  controls.update();
  camera.updateMatrixWorld();
  renderer.render(scene, camera);
  updateSideHotspotButtons();
  updateHotspotPopoverPosition();
  updateModuleToolbarPosition();
  updateDimensionLabels();
  requestAnimationFrame(animate);
}

function selectFromPointer(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(selectable, true)[0];
  if (!hit?.object?.userData?.moduleId && !hit?.object?.userData?.expansionSide) {
    toolbarModuleId = null;
    closeHotspotPopover();
    closeModuleToolbar();
    rebuildSofa();
    return;
  }
  if (hit.object.userData.expansionSide) {
    openHotspotPopover(hit.object.userData.expansionSide);
  } else {
    state.selectedId = hit.object.userData.moduleId;
    toolbarModuleId = state.selectedId;
    closeHotspotPopover();
    rebuildSofa();
  }
  updateUi();
}

function resetCamera() {
  frameCameraToConfiguration(false);
}

function rotateScene(direction) {
  const offset = camera.position.clone().sub(controls.target);
  offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), direction * 0.35);
  camera.position.copy(controls.target).add(offset);
  controls.update();
}

function zoom(delta) {
  const direction = camera.position.clone().sub(controls.target).normalize();
  camera.position.addScaledVector(direction, delta);
  controls.update();
}

function replaceSelectedModule(type) {
  state.modules = [makeModule("module-1", type, 0, 0)];
  state.selectedId = "module-1";
  toolbarModuleId = null;
  activeHotspotSide = null;
  closeHotspotPopover();
  rebuildSofa({ recenterCamera: true, animateCamera: true });
}

function initModuleCatalog() {
  Object.entries(moduleCatalog).forEach(([type, spec]) => {
    const button = document.createElement("button");
    button.className = "module-option";
    button.dataset.type = type;
    button.innerHTML = `<img src="${spec.thumbnail}" alt="" /><span>${spec.label}</span>`;
    button.setAttribute("aria-label", spec.label);
    button.title = spec.label;
    button.addEventListener("click", () => replaceSelectedModule(type));
    catalogCards[type] = button;
    els.moduleCatalog.append(button);
  });
}

function initHotspotThumbnails() {
  Object.entries(moduleCatalog).forEach(([type, spec]) => {
    const button = document.createElement("button");
    button.className = "thumbnail-card";
    button.dataset.type = type;
    button.innerHTML = `<img alt="${spec.label}" /><span>${spec.label}</span>`;
    button.addEventListener("click", () => addModuleAtSide(type, activeHotspotSide || "right"));
    thumbnailCards[type] = button;
    els.hotspotThumbnails.append(button);
  });
}

function openHotspotPopover(side) {
  activeHotspotSide = side;
  els.hotspotPopover.classList.add("is-open");
  els.hotspotPopover.setAttribute("aria-hidden", "false");
  updateHotspotPopoverPosition();
}

function closeHotspotPopover() {
  activeHotspotSide = null;
  els.hotspotPopover.classList.remove("is-open");
  els.hotspotPopover.setAttribute("aria-hidden", "true");
}

function updateHotspotPopoverPosition() {
  // Popover is now fixed to the bottom of the viewer via CSS; no per-frame positioning.
}

function updateSideHotspotButtons() {
  positionSideHotspot("left", els.leftHotspot);
  positionSideHotspot("right", els.rightHotspot);
}

function positionSideHotspot(side, button) {
  if (!hotspotEnabled[side]) {
    button.style.display = "none";
    return;
  }
  projectedHotspotPosition.copy(sideWorldPositions[side]).project(camera);
  const rect = renderer.domElement.getBoundingClientRect();
  const x = ((projectedHotspotPosition.x + 1) / 2) * rect.width;
  const y = ((-projectedHotspotPosition.y + 1) / 2) * rect.height;
  const visible = projectedHotspotPosition.z < 1 && x > -40 && x < rect.width + 40 && y > -40 && y < rect.height + 40;
  button.style.display = visible ? "grid" : "none";
  button.style.left = `${x}px`;
  button.style.top = `${y}px`;
  button.classList.toggle("is-active", activeHotspotSide === side);
}

function updateModuleToolbarPosition() {
  const selected = state.modules.find((module) => module.id === toolbarModuleId);
  if (!selected) {
    closeModuleToolbar();
    return;
  }

  const { h } = moduleDimensions(selected);
  toolbarWorldPosition.set(selected.x, h + 0.28, selected.z);
  projectedHotspotPosition.copy(toolbarWorldPosition).project(camera);
  const rect = renderer.domElement.getBoundingClientRect();
  const x = ((projectedHotspotPosition.x + 1) / 2) * rect.width;
  const y = ((-projectedHotspotPosition.y + 1) / 2) * rect.height;
  const visible = projectedHotspotPosition.z < 1 && x > -60 && x < rect.width + 60 && y > -60 && y < rect.height + 60;
  els.moduleToolbar.classList.toggle("is-open", visible);
  els.moduleToolbar.setAttribute("aria-hidden", visible ? "false" : "true");
  els.moduleToolbar.style.left = `${x}px`;
  els.moduleToolbar.style.top = `${y - 12}px`;
}

function closeModuleToolbar() {
  els.moduleToolbar.classList.remove("is-open");
  els.moduleToolbar.setAttribute("aria-hidden", "true");
}

function initSwatches(container, items, activeItem, onSelect) {
  items.forEach((item) => {
    const button = document.createElement("button");
    button.className = `swatch${item === activeItem ? " active" : ""}`;
    button.style.setProperty("--swatch", item.color);
    if (item.image) button.style.setProperty("--swatch-image", `url("${item.image}")`);
    button.dataset.label = item.label;
    button.title = item.label;
    button.ariaLabel = item.label;
    button.addEventListener("click", () => {
      onSelect(item);
      container.querySelectorAll(".swatch").forEach((swatch) => swatch.classList.remove("active"));
      button.classList.add("active");
      rebuildSofa();
    });
    container.append(button);
  });
}

function loadModuleModels(onProgress) {
  const loader = new GLTFLoader();
  const entries = Object.entries(modelSources);
  const total = entries.length;
  let done = 0;
  return Promise.all(
    entries.map(
      ([key, url]) =>
        new Promise((resolve) => {
          loader.load(
            url,
            (gltf) => {
              importedModels[key] = gltf.scene;
              done += 1;
              if (onProgress) onProgress(done / total, done, total);
              resolve();
            },
            undefined,
            (error) => {
              console.warn(`Failed to load ${url}`, error);
              done += 1;
              if (onProgress) onProgress(done / total, done, total);
              resolve();
            }
          );
        })
    )
  );
}

function renderModuleThumbnails() {
  Object.keys(moduleCatalog).forEach((type) => {
    const src = moduleCatalog[type].thumbnail;
    const thumbnailImage = thumbnailCards[type]?.querySelector("img");
    const catalogImage = catalogCards[type]?.querySelector("img");
    if (thumbnailImage) thumbnailImage.src = src;
    if (catalogImage) catalogImage.src = src;
  });
}

document.querySelectorAll(".preset").forEach((button) => {
  button.addEventListener("click", () => setLayout(button.dataset.layout));
});

document.querySelector("#viewHome").addEventListener("click", resetCamera);

window.addEventListener("keydown", (e) => {
  const tag = (e.target?.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || e.target?.isContentEditable) return;
  if (e.code === "Space") {
    e.preventDefault();
    resetCamera();
  } else if (e.code === "Backspace" || e.code === "Delete") {
    if (!state.selectedId) return;
    e.preventDefault();
    removeSelected();
  }
});
document.querySelector("#zoomIn").addEventListener("click", () => zoom(-0.8));
document.querySelector("#zoomOut").addEventListener("click", () => zoom(0.8));
document.querySelector("#rotateLeft").addEventListener("click", () => rotateScene(-1));
document.querySelector("#rotateRight").addEventListener("click", () => rotateScene(1));
els.toggleDimensions?.addEventListener("click", () => {
  showDimensions = !showDimensions;
  els.toggleDimensions.classList.toggle("is-active", showDimensions);
  els.toggleDimensions.setAttribute("aria-pressed", showDimensions ? "true" : "false");
});
document.querySelector("#closeHotspot").addEventListener("click", closeHotspotPopover);
document.querySelector("#toolbarRotateLeft").addEventListener("click", () => rotateSelected(-1));
document.querySelector("#toolbarRotateRight").addEventListener("click", () => rotateSelected(1));
document.querySelector("#toolbarDelete").addEventListener("click", removeSelected);
els.leftHotspot.addEventListener("click", () => openHotspotPopover("left"));
els.rightHotspot.addEventListener("click", () => openHotspotPopover("right"));
els.showGuides?.addEventListener("change", updateGuides);
renderer.domElement.addEventListener("click", selectFromPointer);
window.addEventListener("resize", resize);

const sunAngleInput = document.querySelector("#sunAngle");
const sunAngleValue = document.querySelector("#sunAngleValue");
sunAngleInput.addEventListener("input", () => {
  const deg = Number(sunAngleInput.value);
  setSunAngle(deg);
  sunAngleValue.textContent = `${deg}°`;
});

els.cartToggle.addEventListener("click", () => {
  const expanded = els.cartToggle.getAttribute("aria-expanded") === "true";
  els.cartToggle.setAttribute("aria-expanded", expanded ? "false" : "true");
  els.cartList.hidden = expanded;
});

initModuleCatalog();
initHotspotThumbnails();

function renderBaseSwatches() {
  els.baseSwatches.innerHTML = "";
  const group = state.sofaColor.group || "light";
  const options = baseFrameOptionsByGroup[group] || baseFrameOptionsByGroup.light;
  if (!options.some((opt) => opt.color === state.baseColor.color)) {
    state.baseColor = options[0];
  }
  initSwatches(els.baseSwatches, options, state.baseColor, (item) => {
    state.baseColor = item;
  });
}

initSwatches(els.sofaSwatches, fabricSofaColors, state.sofaColor, (item) => {
  state.sofaColor = item;
  state.material = item.id === "leatherBlack" ? "naturalLeather" : "fabric";
  renderBaseSwatches();
});
renderBaseSwatches();

// Tray wood: clicking a color adds it as a cart line item
function renderTrayWoodSwatches() {
  els.trayWoodSwatches.innerHTML = "";
  trayWoodColors.forEach((item) => {
    const button = document.createElement("button");
    button.className = `swatch${item === state.trayWood ? " active" : ""}`;
    button.style.setProperty("--swatch", item.color);
    if (item.image) button.style.setProperty("--swatch-image", `url("${item.image}")`);
    button.dataset.label = item.label;
    button.title = item.label;
    button.addEventListener("click", () => {
      state.trayWood = item;
      els.trayWoodLabel.textContent = item.label;
      els.trayWoodSwatches.querySelectorAll(".swatch").forEach((s) => s.classList.remove("active"));
      button.classList.add("active");
      rebuildSofa();
    });
    els.trayWoodSwatches.append(button);
  });
}
renderTrayWoodSwatches();

// Cushion: clicking a color adds it as a cart line item
function renderCushionSwatches() {
  els.accentCushionSwatches.innerHTML = "";
  accentCushionColors.forEach((item) => {
    const button = document.createElement("button");
    button.className = "swatch";
    button.style.setProperty("--swatch", item.color);
    button.dataset.label = item.label;
    button.title = item.label;
    button.addEventListener("click", () => {
      addOption("cushion", item.label);
      els.accentCushionLabel.textContent = item.label;
    });
    els.accentCushionSwatches.append(button);
  });
}
renderCushionSwatches();

resize();
state.layout = "armlessLeft";
state.modules = [makeModule("module-1", "armlessLeft", 0, 0)];
state.selectedId = state.modules[0]?.id;

const loadingScreen = document.querySelector("#loadingScreen");
const loadingBarFill = document.querySelector("#loadingBarFill");
const loadingStatus = document.querySelector("#loadingStatus");
const appShell = document.querySelector("#appShell");

loadModuleModels((ratio, done, total) => {
  if (loadingBarFill) loadingBarFill.style.width = `${Math.round(ratio * 100)}%`;
  if (loadingStatus) loadingStatus.textContent = `Loading ${done} / ${total}`;
}).then(() => {
  if (loadingStatus) loadingStatus.textContent = "Ready";
  if (loadingBarFill) loadingBarFill.style.width = "100%";
  // Reveal the app, then start the render loop on the next frame
  appShell.hidden = false;
  // Force a resize so the renderer picks up the now-visible canvas dimensions
  resize();
  rebuildSofa({ recenterCamera: true });
  renderModuleThumbnails();
  animate();
  // Fade out the loading screen
  requestAnimationFrame(() => {
    loadingScreen.classList.add("is-fading");
    setTimeout(() => {
      loadingScreen.hidden = true;
    }, 450);
  });
});

// ----- Mobile bottom-sheet behavior -----
(() => {
  const panel = document.querySelector("#optionsPanel");
  const handle = document.querySelector("#sheetHandle");
  if (!panel || !handle) return;

  const PEEK = 220; // collapsed visible height (px)
  panel.style.setProperty("--sheet-peek", `${PEEK}px`);

  const isMobile = () => window.matchMedia("(max-width: 900px)").matches;

  let dragging = false;
  let startY = 0;
  let startTranslate = 0;
  let currentTranslate = 0;
  let panelHeight = 0;

  const getCollapsedTranslate = () => Math.max(0, panelHeight - PEEK);

  const setTranslate = (px) => {
    currentTranslate = px;
    panel.style.transform = `translateY(${px}px)`;
  };

  const expand = () => {
    panel.classList.add("is-expanded");
    panel.style.transform = "";
  };

  const collapse = () => {
    panel.classList.remove("is-expanded");
    panel.style.transform = "";
  };

  const onPointerDown = (e) => {
    if (!isMobile()) return;
    panelHeight = panel.getBoundingClientRect().height;
    const expanded = panel.classList.contains("is-expanded");
    startTranslate = expanded ? 0 : getCollapsedTranslate();
    startY = e.touches ? e.touches[0].clientY : e.clientY;
    dragging = true;
    panel.classList.add("is-dragging");
    handle.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    const y = e.touches ? e.touches[0].clientY : e.clientY;
    const delta = y - startY;
    const next = Math.max(0, Math.min(getCollapsedTranslate(), startTranslate + delta));
    setTranslate(next);
    e.preventDefault?.();
  };

  const onPointerUp = () => {
    if (!dragging) return;
    dragging = false;
    panel.classList.remove("is-dragging");
    const collapsed = getCollapsedTranslate();
    if (currentTranslate < collapsed * 0.5) expand();
    else collapse();
  };

  // Pointer events cover both mouse and touch on modern browsers
  handle.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  // Tap (no drag) toggles
  let tapStartY = 0;
  handle.addEventListener("pointerdown", (e) => {
    tapStartY = e.clientY;
  });
  handle.addEventListener("pointerup", (e) => {
    if (Math.abs(e.clientY - tapStartY) < 6) {
      panel.classList.toggle("is-expanded");
      panel.style.transform = "";
    }
  });

  // When viewport changes (rotate/resize), reset inline transform
  window.addEventListener("resize", () => {
    if (!isMobile()) {
      panel.style.transform = "";
      panel.classList.remove("is-expanded");
    }
  });
})();
