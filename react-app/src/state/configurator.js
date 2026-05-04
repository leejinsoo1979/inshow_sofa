import { create } from "zustand";
import { moduleCatalog } from "../data/catalog";
import { sofaColors, baseFrameOptionsByGroup, trayWoodColors } from "../data/colors";

const initialModule = { id: "module-1", type: "armlessLeft", x: 0, z: 0, rotation: 0 };

export const useConfigurator = create((set, get) => ({
  layout: "armlessLeft",
  material: "fabric",
  sofaColor: sofaColors[0],
  baseColor: baseFrameOptionsByGroup.light[0],
  trayWood: trayWoodColors[0],
  accentCushion: null,
  selectedId: null,
  modules: [initialModule],
  options: { trayWood: {}, cushion: {} },
  showDimensions: true,
  sunAngle: 135,

  setSofaColor: (item) => {
    const material = item.id === "leatherBlack" ? "naturalLeather" : "fabric";
    set({ sofaColor: item, material });
    const group = item.group || "light";
    const opts = baseFrameOptionsByGroup[group] || baseFrameOptionsByGroup.light;
    const cur = get().baseColor;
    if (group === "fabricDark" || group === "leatherBlack") {
      set({ baseColor: item });
      return;
    }
    if (!opts.some((o) => o.color === cur.color)) {
      set({ baseColor: opts[0] });
    }
  },
  setBaseColor: (item) => set({ baseColor: item }),
  setTrayWood: (item) => set({ trayWood: item }),
  setAccentCushion: (item) => set({ accentCushion: item }),
  setSelectedId: (id) => set({ selectedId: id }),
  setSunAngle: (deg) => set({ sunAngle: deg }),
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
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      for (const m of modules) {
        const ms = moduleCatalog[m.type];
        const hw = ms.width / 2, hd = ms.depth / 2;
        minX = Math.min(minX, m.x - hw);
        maxX = Math.max(maxX, m.x + hw);
        minZ = Math.min(minZ, m.z - hd);
        maxZ = Math.max(maxZ, m.z + hd);
      }
      // 트레이 모듈은 SEAM 없이 정확히 인접 (본체-선반 일체형이라 겹치면 박힘)
      const isTray = type.startsWith("tray");
      const adjType = side === "left"
        ? [...modules].sort((a, b) => a.x - b.x)[0].type
        : [...modules].sort((a, b) => b.x - a.x)[0].type;
      const isAdjTray = adjType.startsWith("tray");
      const SEAM = (isTray || isAdjTray) ? 0 : 0.02;
      x = side === "left"
        ? minX - spec.width / 2 + SEAM
        : maxX + spec.width / 2 - SEAM;
      z = (minZ + maxZ) / 2;
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
