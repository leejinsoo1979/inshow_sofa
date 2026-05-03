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
    } else if (!opts.some((o) => o.color === cur.color)) {
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
    const initialType = moduleCatalog[layout] ? layout : "doubleOne";
    const m = { id: "module-1", type: initialType, x: 0, z: 0, rotation: 0 };
    set({ layout, modules: [m], selectedId: m.id });
  },

  addModuleAtSide: (type, side = "right") => {
    const { modules } = get();
    const newId = `module-${Date.now()}`;
    const baseSpec = moduleCatalog[type];
    if (!baseSpec) return;
    // 단순 배치: 가장 우측/좌측 모듈 옆에 인접
    let x = 0;
    if (modules.length > 0) {
      const sorted = [...modules].sort((a, b) => a.x - b.x);
      const ref = side === "right" ? sorted[sorted.length - 1] : sorted[0];
      const refSpec = moduleCatalog[ref.type];
      const offset = (refSpec.width + baseSpec.width) / 2;
      x = side === "right" ? ref.x + offset : ref.x - offset;
    }
    const m = { id: newId, type, x, z: 0, rotation: 0 };
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
