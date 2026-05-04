// 현재 렌더된 SofaModule clone들의 reference를 저장 (AR export용)
const moduleClones = new Set();

export function registerModuleClone(obj) {
  if (obj) moduleClones.add(obj);
  return () => moduleClones.delete(obj);
}

export function getAllModuleClones() {
  return Array.from(moduleClones);
}
