import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const canvas = document.querySelector("#scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f4f1);

const camera = new THREE.PerspectiveCamera(35, 1, 0.05, 200);
camera.position.set(3.8, 2.1, 4.8);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.5, 0);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const hemi = new THREE.HemisphereLight(0xffffff, 0x7d7468, 1.9);
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(3.5, 5, 2.5);
scene.add(hemi, key);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(80, 80),
  new THREE.ShadowMaterial({ color: 0x111111, opacity: 0.12 })
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.01;
floor.receiveShadow = true;
scene.add(floor);

const modelRoot = new THREE.Group();
scene.add(modelRoot);

const loader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const worldPos = new THREE.Vector3();

const state = {
  name: "Untitled Configurator",
  model: null,
  materials: [],
  parts: [],
  hotspots: [],
  selectedPartId: null,
  selectedHotspotId: null,
  hotspotMode: false
};

const els = {
  title: document.querySelector("#projectTitle"),
  projectName: document.querySelector("#projectName"),
  glbInput: document.querySelector("#glbInput"),
  dropHint: document.querySelector("#dropHint"),
  addMaterial: document.querySelector("#addMaterial"),
  materialName: document.querySelector("#materialName"),
  materialColor: document.querySelector("#materialColor"),
  textureInput: document.querySelector("#textureInput"),
  materialList: document.querySelector("#materialList"),
  partsList: document.querySelector("#partsList"),
  partCount: document.querySelector("#partCount"),
  hotspotMode: document.querySelector("#hotspotMode"),
  hotspotLayer: document.querySelector("#hotspotLayer"),
  hotspotEditor: document.querySelector("#hotspotEditor"),
  hotspotList: document.querySelector("#hotspotList"),
  hotspotCount: document.querySelector("#hotspotCount"),
  saveProject: document.querySelector("#saveProject"),
  loadProject: document.querySelector("#loadProject"),
  exportZip: document.querySelector("#exportZip"),
  resetCamera: document.querySelector("#resetCamera")
};

els.projectName.addEventListener("input", () => {
  state.name = els.projectName.value.trim() || "Untitled Configurator";
  els.title.textContent = state.name;
});

els.glbInput.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const dataUrl = await readAsDataURL(file);
  state.model = { name: file.name, dataUrl };
  await loadModel(dataUrl);
  renderAll();
});

els.addMaterial.addEventListener("click", async () => {
  const textureFile = els.textureInput.files?.[0] || null;
  const material = {
    id: crypto.randomUUID(),
    name: els.materialName.value.trim() || "Material",
    color: els.materialColor.value,
    textureDataUrl: textureFile ? await readAsDataURL(textureFile) : null,
    textureName: textureFile?.name || null
  };
  state.materials.push(material);
  els.materialName.value = "New Material";
  els.textureInput.value = "";
  renderMaterials();
  renderParts();
});

els.hotspotMode.addEventListener("click", () => {
  state.hotspotMode = !state.hotspotMode;
  els.hotspotMode.classList.toggle("is-active", state.hotspotMode);
});

els.resetCamera.addEventListener("click", frameModel);
els.saveProject.addEventListener("click", () => downloadJson(makeProjectData(), `${safeName(state.name)}.json`));
els.loadProject.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const data = JSON.parse(await file.text());
  await restoreProject(data);
});
els.exportZip.addEventListener("click", exportZip);

canvas.addEventListener("pointerdown", (event) => {
  if (!state.hotspotMode) return;
  const hit = pick(event);
  if (!hit) return;
  const id = crypto.randomUUID();
  state.hotspots.push({
    id,
    title: `Hotspot ${state.hotspots.length + 1}`,
    body: "설명을 입력하세요.",
    action: "info",
    url: "",
    position: hit.point.toArray(),
    partId: hit.object.userData.partId || null
  });
  state.selectedHotspotId = id;
  state.hotspotMode = false;
  els.hotspotMode.classList.remove("is-active");
  renderHotspots();
});

canvas.addEventListener("click", (event) => {
  if (state.hotspotMode) return;
  const hit = pick(event);
  state.selectedPartId = hit?.object.userData.partId || null;
  renderParts();
});

function pick(event) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const meshes = state.parts.map((part) => part.mesh).filter(Boolean);
  return raycaster.intersectObjects(meshes, false)[0] || null;
}

async function loadModel(dataUrl) {
  clearModel();
  const gltf = await loader.loadAsync(dataUrl);
  modelRoot.add(gltf.scene);
  state.parts = [];

  let index = 1;
  gltf.scene.traverse((object) => {
    if (!object.isMesh) return;
    const id = crypto.randomUUID();
    object.userData.partId = id;
    object.castShadow = true;
    object.receiveShadow = true;
    state.parts.push({
      id,
      originalName: object.name || `Mesh_${index}`,
      name: object.name || `Part ${index}`,
      materialId: null,
      mesh: object
    });
    index += 1;
  });

  els.dropHint.hidden = state.parts.length > 0;
  frameModel();
}

function clearModel() {
  while (modelRoot.children.length) modelRoot.remove(modelRoot.children[0]);
  state.parts = [];
  state.selectedPartId = null;
  state.hotspots = [];
}

function frameModel() {
  const box = new THREE.Box3().setFromObject(modelRoot);
  if (box.isEmpty()) {
    camera.position.set(3.8, 2.1, 4.8);
    controls.target.set(0, 0.5, 0);
    return;
  }
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  controls.target.copy(center);
  camera.position.copy(center).add(new THREE.Vector3(maxDim * 1.25, maxDim * 0.72, maxDim * 1.55));
  camera.near = Math.max(maxDim / 1000, 0.01);
  camera.far = maxDim * 20;
  camera.updateProjectionMatrix();
  controls.update();
}

function renderAll() {
  els.title.textContent = state.name;
  els.projectName.value = state.name;
  renderMaterials();
  renderParts();
  renderHotspots();
}

function renderMaterials() {
  els.materialList.innerHTML = "";
  for (const material of state.materials) {
    const item = document.createElement("div");
    item.className = "material-item";
    item.innerHTML = `
      <span class="swatch" style="${swatchStyle(material)}"></span>
      <strong title="${escapeHtml(material.name)}">${escapeHtml(material.name)}</strong>
      <button data-delete="${material.id}" title="삭제">×</button>
    `;
    item.querySelector("button").addEventListener("click", () => {
      state.materials = state.materials.filter((entry) => entry.id !== material.id);
      for (const part of state.parts) {
        if (part.materialId === material.id) part.materialId = null;
      }
      renderMaterials();
      renderParts();
    });
    els.materialList.append(item);
  }
}

function renderParts() {
  els.partCount.textContent = String(state.parts.length);
  els.partsList.innerHTML = "";
  for (const part of state.parts) {
    const item = document.createElement("div");
    item.className = `part-item${part.id === state.selectedPartId ? " is-selected" : ""}`;
    item.innerHTML = `
      <div class="part-row">
        <input class="part-name" value="${escapeAttr(part.name)}" aria-label="파트 이름" />
        <select aria-label="파트 재질">
          <option value="">원본 재질</option>
          ${state.materials.map((material) => `<option value="${material.id}" ${material.id === part.materialId ? "selected" : ""}>${escapeHtml(material.name)}</option>`).join("")}
        </select>
      </div>
      <p class="part-meta">${escapeHtml(part.originalName)}</p>
    `;
    item.addEventListener("click", () => {
      state.selectedPartId = part.id;
      renderParts();
    });
    item.querySelector("input").addEventListener("input", (event) => {
      part.name = event.target.value;
    });
    item.querySelector("select").addEventListener("change", async (event) => {
      part.materialId = event.target.value || null;
      await applyPartMaterial(part);
    });
    els.partsList.append(item);
  }
}

async function applyPartMaterial(part) {
  if (!part.mesh) return;
  const materialData = state.materials.find((entry) => entry.id === part.materialId);
  if (!materialData) return;
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(materialData.color),
    roughness: 0.78,
    metalness: 0.02
  });
  if (materialData.textureDataUrl) {
    const texture = await textureLoader.loadAsync(materialData.textureDataUrl);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 2);
    material.map = texture;
  }
  part.mesh.material = material;
}

async function applyAllPartMaterials() {
  for (const part of state.parts) await applyPartMaterial(part);
}

function renderHotspots() {
  els.hotspotCount.textContent = String(state.hotspots.length);
  renderHotspotEditor();
  renderHotspotList();
  updateHotspotPositions();
}

function renderHotspotEditor() {
  const hotspot = state.hotspots.find((entry) => entry.id === state.selectedHotspotId);
  if (!hotspot) {
    els.hotspotEditor.innerHTML = `<p class="empty">핫스팟 추가 모드를 켜고 모델 표면을 클릭하세요.</p>`;
    return;
  }
  els.hotspotEditor.innerHTML = `
    <input id="hsTitle" value="${escapeAttr(hotspot.title)}" placeholder="제목" />
    <textarea id="hsBody" placeholder="설명">${escapeHtml(hotspot.body)}</textarea>
    <select id="hsAction">
      <option value="info" ${hotspot.action === "info" ? "selected" : ""}>정보 표시</option>
      <option value="link" ${hotspot.action === "link" ? "selected" : ""}>링크 열기</option>
      <option value="focus" ${hotspot.action === "focus" ? "selected" : ""}>파트 강조</option>
    </select>
    <input id="hsUrl" value="${escapeAttr(hotspot.url || "")}" placeholder="https://..." />
    <button id="deleteHotspot">핫스팟 삭제</button>
  `;
  els.hotspotEditor.querySelector("#hsTitle").addEventListener("input", (event) => {
    hotspot.title = event.target.value;
    renderHotspotList();
    updateHotspotPositions();
  });
  els.hotspotEditor.querySelector("#hsBody").addEventListener("input", (event) => {
    hotspot.body = event.target.value;
  });
  els.hotspotEditor.querySelector("#hsAction").addEventListener("change", (event) => {
    hotspot.action = event.target.value;
  });
  els.hotspotEditor.querySelector("#hsUrl").addEventListener("input", (event) => {
    hotspot.url = event.target.value;
  });
  els.hotspotEditor.querySelector("#deleteHotspot").addEventListener("click", () => {
    state.hotspots = state.hotspots.filter((entry) => entry.id !== hotspot.id);
    state.selectedHotspotId = null;
    renderHotspots();
  });
}

function renderHotspotList() {
  els.hotspotList.innerHTML = "";
  for (const hotspot of state.hotspots) {
    const row = document.createElement("div");
    row.className = "hotspot-row";
    row.innerHTML = `<strong>${escapeHtml(hotspot.title)}</strong><button>편집</button>`;
    row.querySelector("button").addEventListener("click", () => {
      state.selectedHotspotId = hotspot.id;
      renderHotspots();
    });
    els.hotspotList.append(row);
  }
}

function updateHotspotPositions() {
  els.hotspotLayer.innerHTML = "";
  const rect = canvas.getBoundingClientRect();
  for (const [index, hotspot] of state.hotspots.entries()) {
    worldPos.fromArray(hotspot.position).project(camera);
    const x = (worldPos.x * 0.5 + 0.5) * rect.width;
    const y = (-worldPos.y * 0.5 + 0.5) * rect.height;
    const marker = document.createElement("button");
    marker.className = `hotspot${hotspot.id === state.selectedHotspotId ? " is-selected" : ""}`;
    marker.style.left = `${x}px`;
    marker.style.top = `${y}px`;
    marker.textContent = String(index + 1);
    marker.title = hotspot.title;
    marker.addEventListener("click", () => {
      state.selectedHotspotId = hotspot.id;
      if (hotspot.action === "link" && hotspot.url) window.open(hotspot.url, "_blank", "noopener");
      if (hotspot.action === "focus" && hotspot.partId) state.selectedPartId = hotspot.partId;
      renderHotspots();
      renderParts();
    });
    els.hotspotLayer.append(marker);
  }
}

function makeProjectData() {
  return {
    version: 1,
    name: state.name,
    model: state.model,
    materials: state.materials,
    parts: state.parts.map(({ id, originalName, name, materialId }) => ({ id, originalName, name, materialId })),
    hotspots: state.hotspots
  };
}

async function restoreProject(data) {
  state.name = data.name || "Untitled Configurator";
  state.model = data.model || null;
  state.materials = data.materials || [];
  state.hotspots = data.hotspots || [];
  if (state.model?.dataUrl) {
    await loadModel(state.model.dataUrl);
    for (const savedPart of data.parts || []) {
      const part = state.parts.find((entry) => entry.originalName === savedPart.originalName || entry.name === savedPart.originalName);
      if (part) {
        part.name = savedPart.name;
        part.materialId = savedPart.materialId;
      }
    }
    await applyAllPartMaterials();
  }
  renderAll();
}

async function exportZip() {
  const project = makeProjectData();
  if (!project.model?.dataUrl) {
    alert("배포하려면 먼저 GLB 모델을 업로드하세요.");
    return;
  }
  const zip = new window.JSZip();
  zip.file("project.json", JSON.stringify(project, null, 2));
  zip.file("index.html", makeDeployHtml());
  zip.file("README.txt", "Upload these files to any static host. Open index.html to run the configurator.\n");
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, `${safeName(state.name)}-deploy.zip`);
}

function makeDeployHtml() {
  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Configurator</title>
<style>
html,body{margin:0;height:100%;overflow:hidden;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#161616;background:#f4f4f1}#scene{width:100%;height:100%;display:block}.bar{position:fixed;left:24px;top:22px;right:24px;display:flex;justify-content:space-between;gap:16px;pointer-events:none}.bar h1{margin:0;font-size:26px}.card{align-self:flex-start;max-width:360px;padding:14px 16px;border:1px solid #ddd8cf;border-radius:8px;background:rgba(255,255,255,.88);box-shadow:0 12px 30px rgba(0,0,0,.08);pointer-events:auto}.card p{margin:6px 0 0;color:#666;font-size:14px}.hotspot{position:fixed;width:28px;height:28px;transform:translate(-50%,-50%);border:2px solid #fff;border-radius:50%;background:#166c62;color:#fff;font-weight:900;box-shadow:0 8px 22px rgba(0,0,0,.22)}.popup{position:fixed;right:24px;bottom:24px;width:min(360px,calc(100vw - 48px));padding:16px;border:1px solid #ddd8cf;border-radius:8px;background:#fff;box-shadow:0 18px 44px rgba(0,0,0,.18)}.popup h2{margin:0 0 8px;font-size:18px}.popup p{margin:0;color:#555;line-height:1.45}
</style>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/"}}</script>
</head>
<body>
<canvas id="scene"></canvas><div class="bar"><div><h1 id="title">Configurator</h1></div><div class="card"><strong>Drag to rotate · Scroll to zoom</strong><p>Click hotspots to inspect configured parts.</p></div></div><div id="hotspots"></div><div id="popup" class="popup" hidden></div>
<script type="module">
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
const project=await fetch("./project.json").then(r=>r.json());
document.querySelector("#title").textContent=project.name||"Configurator";
const canvas=document.querySelector("#scene"),renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;
const scene=new THREE.Scene();scene.background=new THREE.Color(0xf4f4f1);const camera=new THREE.PerspectiveCamera(35,1,.05,200);camera.position.set(3.8,2.1,4.8);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;scene.environment=new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(),.04).texture;scene.add(new THREE.HemisphereLight(0xffffff,0x7d7468,1.9));const light=new THREE.DirectionalLight(0xffffff,2.2);light.position.set(3.5,5,2.5);scene.add(light);
const root=(await new GLTFLoader().loadAsync(project.model.dataUrl)).scene;scene.add(root);const texLoader=new THREE.TextureLoader();const parts=[];let i=0;root.traverse(o=>{if(o.isMesh){const saved=project.parts?.[i++];o.userData.partId=saved?.id;parts.push(o);const matData=project.materials?.find(m=>m.id===saved?.materialId);if(matData){const mat=new THREE.MeshStandardMaterial({color:new THREE.Color(matData.color),roughness:.78,metalness:.02});if(matData.textureDataUrl)texLoader.load(matData.textureDataUrl,t=>{t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,2);mat.map=t;mat.needsUpdate=true});o.material=mat;}}});
const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),max=Math.max(size.x,size.y,size.z)||1;controls.target.copy(center);camera.position.copy(center).add(new THREE.Vector3(max*1.25,max*.72,max*1.55));camera.near=Math.max(max/1000,.01);camera.far=max*20;camera.updateProjectionMatrix();
const layer=document.querySelector("#hotspots"),popup=document.querySelector("#popup"),v=new THREE.Vector3();function hotspots(){layer.innerHTML="";const rect=canvas.getBoundingClientRect();(project.hotspots||[]).forEach((h,n)=>{v.fromArray(h.position).project(camera);const b=document.createElement("button");b.className="hotspot";b.textContent=n+1;b.style.left=(v.x*.5+.5)*rect.width+"px";b.style.top=(-v.y*.5+.5)*rect.height+"px";b.onclick=()=>{if(h.action==="link"&&h.url)open(h.url,"_blank","noopener");popup.hidden=false;popup.innerHTML=\`<h2>\${h.title||"Hotspot"}</h2><p>\${h.body||""}</p>\`};layer.append(b)})}
function resize(){const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();hotspots()}addEventListener("resize",resize);function tick(){resize();controls.update();renderer.render(scene,camera);requestAnimationFrame(tick)}tick();
</script>
</body>
</html>`;
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function downloadJson(data, filename) {
  downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), filename);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function safeName(value) {
  return (value || "configurator").toLowerCase().replace(/[^a-z0-9가-힣_-]+/gi, "-").replace(/^-|-$/g, "") || "configurator";
}

function swatchStyle(material) {
  const color = `background-color: ${material.color}`;
  return material.textureDataUrl ? `${color}; background-image: url('${material.textureDataUrl}')` : color;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

function escapeAttr(value = "") {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
}

function animate() {
  resize();
  controls.update();
  renderer.render(scene, camera);
  updateHotspotPositions();
  requestAnimationFrame(animate);
}

renderAll();
animate();
