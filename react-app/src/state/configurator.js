import { create } from "zustand";
import { moduleCatalog } from "../data/catalog";
import { sofaColors, baseFrameOptionsByGroup, trayWoodColors } from "../data/colors";
import { STUDIO_LIGHT_PRESETS } from "../scene/lighting";

const initialModule = { id: "module-1", type: "armlessLeft", x: 0, z: 0, rotation: 0 };

const createStudioLightingState = (presetId = "softbox") => {
  const preset = STUDIO_LIGHT_PRESETS[presetId] || STUDIO_LIGHT_PRESETS.softbox;
  return {
    presetId,
    exposure: preset.exposure,
    environmentIntensity: preset.environmentIntensity,
    keyLight: preset.keyLight,
    fillLight: preset.fillLight,
    rimLight: preset.rimLight,
    topSoftbox: preset.topSoftbox,
    spotLight: preset.spotLight,
    pointLight: preset.pointLight
  };
};

export const useConfigurator = create((set, get) => ({
  layout: "armlessLeft",
  material: "fabric",
  sofaColor: sofaColors[0],
  baseColor: baseFrameOptionsByGroup.light[0],
  trayWood: trayWoodColors[0],
  accentCushion: null,
  lightingPreset: "softbox",
  studioLighting: createStudioLightingState("softbox"),
  backgroundColor: "#f4f2ed",
  hdri: { name: null, url: null, kind: null },
  sun: { playing: false, time: 12, month: 6, latitude: 37.5 },
  selectedId: null,
  modules: [initialModule],
  options: { trayWood: {}, cushion: {} },
  showDimensions: true,
  openHotspotSide: null,
  setOpenHotspotSide: (side) => set({ openHotspotSide: side }),

  setLightingPreset: (presetId) => set({ lightingPreset: presetId, studioLighting: createStudioLightingState(presetId) }),
  setStudioLightingValue: (key, value) => set((s) => ({ studioLighting: { ...s.studioLighting, [key]: value } })),
  setBackgroundColor: (backgroundColor) => set({ backgroundColor }),
  setHdri: (hdri) => set({ hdri }),
  clearHdri: () => set({ hdri: { name: null, url: null, kind: null } }),

  setSunPlaying: (playing) => set((s) => ({ sun: { ...s.sun, playing } })),
  setSunTime: (time) => set((s) => ({ sun: { ...s.sun, time: ((time % 24) + 24) % 24 } })),
  stepSunTime: (deltaHours) => set((s) => ({
    sun: { ...s.sun, time: ((s.sun.time + deltaHours) % 24 + 24) % 24 }
  })),
  setSunMonth: (month) => set((s) => ({ sun: { ...s.sun, month: Math.min(12, Math.max(1, Math.round(month))) } })),
  setSunLatitude: (latitude) => set((s) => ({ sun: { ...s.sun, latitude: Math.min(66, Math.max(-66, latitude)) } })),

  setSofaColor: (item) => {
    const material = item.id === "leatherBlack" ? "naturalLeather" : "fabric";
    set({ sofaColor: item, material });
    const group = item.group || "light";
    const opts = baseFrameOptionsByGroup[group] || baseFrameOptionsByGroup.light;
    const cur = get().baseColor;
    if ((group === "fabricDark" || group === "leatherBlack")) return;
    if (!opts.some((o) => o.color === cur.color)) {
      set({ baseColor: opts[0] });
    }
  },
  setBaseColor: (item) => set({ baseColor: item }),
  setTrayWood: (item) => set({ trayWood: item }),
  setAccentCushion: (item) => set({ accentCushion: item }),
  setSelectedId: (id) => set({ selectedId: id }),
  toggleDimensions: () => set((s) => ({ showDimensions: !s.showDimensions })),

  setLayout: (layout) => {
    const initialType = moduleCatalog[layout] ? layout : "armlessLeft";
    const m = { id: "module-1", type: initialType, x: 0, z: 0, rotation: 0 };
    set({ layout, modules: [m], selectedId: m.id });
  },

  addModuleAtSide: (type, side = "right") => {
    const { modules } = get();
    const spec = moduleCatalog[type];
    if (!spec) return;
    const newId = `module-${Date.now().toString().slice(-5)}`;
    let x = 0, z = 0;
    if (modules.length > 0) {
      // 인접 모듈 = 가장 왼쪽 또는 오른쪽
      const sorted = [...modules].sort((a, b) => a.x - b.x);
      const ref = side === "left" ? sorted[0] : sorted[sorted.length - 1];
      const refSpec = moduleCatalog[ref.type];
      // base끼리 맞닿게: 두 모듈 base 가장자리 거리만큼 X 이동
      const newBaseW = spec.baseWidth || spec.width;
      const refBaseW = refSpec.baseWidth || refSpec.width;
      const offset = (refBaseW + newBaseW) / 2;
      x = side === "left" ? ref.x - offset : ref.x + offset;
      z = ref.z;
    }
    const m = { id: newId, type, x, z, rotation: 0 };
    set({ modules: [...modules, m], selectedId: newId });
  },

  replaceSelectedModule: (type) => {
    const { modules, selectedId } = get();
    const targetId = selectedId || modules[0]?.id;
    set({
      modules: modules.map((m) => (m.id === targetId ? { ...m, type } : m))
    });
  },

  rotateSelected: (dir = 1) => {
    const { modules, selectedId } = get();
    set({
      modules: modules.map((m) =>
        m.id === selectedId ? { ...m, rotation: m.rotation + (dir * Math.PI) / 2 } : m
      )
    });
  },

  removeSelected: () => {
    const { modules, selectedId } = get();
    if (modules.length <= 1) return;
    const filtered = modules.filter((m) => m.id !== selectedId);
    set({ modules: filtered, selectedId: filtered[0]?.id || null });
  },

  setOptionQty: (group, label, qty) => {
    const opts = { ...get().options };
    opts[group] = { ...opts[group] };
    if (qty <= 0) delete opts[group][label];
    else opts[group][label] = qty;
    set({ options: opts });
  },

  addOption: (group, label) => {
    const cur = get().options[group][label] || 0;
    get().setOptionQty(group, label, cur + 1);
  }
}));

export const baseOptionsForCurrent = (sofaColor) => {
  const group = sofaColor?.group || "light";
  return baseFrameOptionsByGroup[group] || baseFrameOptionsByGroup.light;
};
