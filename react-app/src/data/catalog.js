export const moduleCatalog = {
  // baseWidth = 하부 프레임(base mesh) X range — 인접 시 base끼리 맞닿게 하는 기준
  armlessLeft: {
    label: "싱글암(좌)", width: 0.986, baseWidth: 0.923, depth: 0.9, height: 0.68, seats: 1,
    model: "singleArmLeft1", arms: ["right"], openSides: ["left"],
    price: { fabric: 960000, leather: 1818000 },
    thumbnail: "/assets/thumbnails/singlearm_L_1.png"
  },
  armlessRight: {
    label: "싱글암(우)", width: 0.986, baseWidth: 0.923, depth: 0.9, height: 0.68, seats: 1,
    model: "singleArmLeft1", mirror: true, arms: ["left"], openSides: ["right"],
    price: { fabric: 960000, leather: 1818000 },
    thumbnail: "/assets/thumbnails/singlearm_R_1.png"
  },
  doubleOne: {
    label: "더블암 1인", width: 1.222, baseWidth: 1.133, depth: 0.9, height: 0.68, seats: 1,
    model: "doubleArm1", arms: ["left", "right"], openSides: ["left", "right"],
    price: { fabric: 1090000, leather: 2090000 },
    thumbnail: "/assets/thumbnails/doublearm_1.png"
  },
  doubleTwo: {
    label: "더블암 2인", width: 1.957, baseWidth: 1.873, depth: 0.9, height: 0.68, seats: 2,
    model: "doubleArm2", arms: ["left", "right"], openSides: ["left", "right"],
    price: { fabric: 1500000, leather: 3000000 },
    thumbnail: "/assets/thumbnails/doublearm_2.png"
  },
  singleLeftTwo: {
    label: "싱글암2인(좌)", width: 1.722, baseWidth: 1.673, depth: 0.9, height: 0.68, seats: 2,
    model: "singleArmLeft2", arms: ["left"], openSides: ["right"],
    price: { fabric: 1410000, leather: 2727000 },
    thumbnail: "/assets/thumbnails/singlearm_L_2.png"
  },
  singleRightTwo: {
    label: "싱글암2인(우)", width: 1.722, baseWidth: 1.673, depth: 0.9, height: 0.68, seats: 2,
    model: "singleArmLeft2", mirror: true, arms: ["right"], openSides: ["left"],
    price: { fabric: 1410000, leather: 2727000 },
    thumbnail: "/assets/thumbnails/singlearm_R_2.png"
  },
  trayLeftOne: {
    label: "트레이(좌)", width: 1.134, baseWidth: 1.133, depth: 0.9, height: 0.68, seats: 1,
    model: "trayLeft", arms: [], openSides: ["right"],
    price: { fabric: 818000, leather: 1636000 },
    thumbnail: "/assets/thumbnails/trey_L.png"
  },
  trayRightOne: {
    label: "트레이(우)", width: 1.134, baseWidth: 1.133, depth: 0.9, height: 0.68, seats: 1,
    model: "trayLeft", mirror: true, arms: [], openSides: ["left"],
    price: { fabric: 818000, leather: 1636000 },
    thumbnail: "/assets/thumbnails/trey_R.png"
  }
};

export const modelSources = {
  singleArmLeft1: "/models/single_arm_left_1.glb?v=2",
  singleArmLeft2: "/models/single_arm_left_2.glb?v=2",
  doubleArm1: "/models/double_arm_1.glb?v=2",
  doubleArm2: "/models/double_arm_2.glb?v=2",
  trayLeft: "/models/tray_left.glb?v=2"
};

// 새 GLB 머티리얼 명명: 가죽.01 = 본체(upholstery), 가죽.02 = 하부(base), Metal.01 = 다리
const COMMON_ROLES = {
  upholstery: ["가죽.01", "fabric"],
  base: ["가죽.02", "base"],
  metal: ["metal.01", "__metal*", "metal"]
};

export const modelMaterialRoles = {
  singleArmLeft1: COMMON_ROLES,
  singleArmLeft2: COMMON_ROLES,
  doubleArm1: COMMON_ROLES,
  doubleArm2: COMMON_ROLES,
  trayLeft: {
    upholstery: ["가죽.005", "가죽.01", "fabric"],
    base: ["가죽.006", "가죽.02", "base"],
    trayWood: ["walnut wood", "trayWood", "material_89", "wood"],
    metal: ["metal.003", "metal.01", "__metal*", "metal"]
  }
};
