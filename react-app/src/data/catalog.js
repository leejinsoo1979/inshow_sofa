export const moduleCatalog = {
  armlessLeft: {
    label: "싱글암(좌)", width: 0.95, depth: 0.9, height: 0.68, seats: 1,
    model: "singleArmLeft1", arms: ["right"], openSides: ["left"],
    price: { fabric: 960000, leather: 1818000 },
    thumbnail: "/assets/thumbnails/singlearm_L_1.png"
  },
  armlessRight: {
    label: "싱글암(우)", width: 0.95, depth: 0.9, height: 0.68, seats: 1,
    model: "singleArmLeft1", mirror: true, arms: ["left"], openSides: ["right"],
    price: { fabric: 960000, leather: 1818000 },
    thumbnail: "/assets/thumbnails/singlearm_R_1.png"
  },
  doubleOne: {
    label: "더블암 1인", width: 1.15, depth: 0.9, height: 0.68, seats: 1,
    model: "doubleArm1", arms: ["left", "right"], openSides: ["left", "right"],
    price: { fabric: 1090000, leather: 2090000 },
    thumbnail: "/assets/thumbnails/doublearm_1.png"
  },
  doubleTwo: {
    label: "더블암 2인", width: 1.9, depth: 0.9, height: 0.68, seats: 2,
    model: "doubleArm2", arms: ["left", "right"], openSides: ["left", "right"],
    price: { fabric: 1500000, leather: 3000000 },
    thumbnail: "/assets/thumbnails/doublearm_2.png"
  },
  singleLeftTwo: {
    label: "싱글암2인(좌)", width: 1.7, depth: 0.9, height: 0.68, seats: 2,
    model: "singleArmLeft2", arms: ["left"], openSides: ["right"],
    price: { fabric: 1410000, leather: 2727000 },
    thumbnail: "/assets/thumbnails/singlearm_L_2.png"
  },
  singleRightTwo: {
    label: "싱글암2인(우)", width: 1.7, depth: 0.9, height: 0.68, seats: 2,
    model: "singleArmLeft2", mirror: true, arms: ["right"], openSides: ["left"],
    price: { fabric: 1410000, leather: 2727000 },
    thumbnail: "/assets/thumbnails/singlearm_R_2.png"
  },
  trayLeftOne: {
    label: "트레이(좌)", width: 1.15, depth: 0.9, height: 0.68, seats: 1,
    model: "trayLeft", arms: [], openSides: ["right"],
    price: { fabric: 818000, leather: 1636000 },
    thumbnail: "/assets/thumbnails/trey_L.png"
  },
  trayRightOne: {
    label: "트레이(우)", width: 1.15, depth: 0.9, height: 0.68, seats: 1,
    model: "trayLeft", mirror: true, arms: [], openSides: ["left"],
    price: { fabric: 818000, leather: 1636000 },
    thumbnail: "/assets/thumbnails/trey_R.png"
  }
};

export const modelSources = {
  singleArmLeft1: "/models/single_arm_left_1.glb?v=1",
  singleArmLeft2: "/models/single_arm_left_2.glb?v=1",
  doubleArm1: "/models/double_arm_1.glb?v=1",
  doubleArm2: "/models/double_arm_2.glb?v=1",
  trayLeft: "/models/tray_left.glb?v=1"
};

export const modelMaterialRoles = {
  singleArmLeft1: {
    upholstery: ["fabric", "가죽1"],
    base: ["base", "가죽1_0", "가죽1_1"],
    metal: ["metal", "__metal*"]
  },
  singleArmLeft2: {
    upholstery: ["fabric", "가죽1"],
    base: ["base", "가죽1_0", "가죽1_1"],
    metal: ["metal", "__metal*"]
  },
  doubleArm1: {
    upholstery: ["fabric", "가죽1"],
    base: ["base", "가죽1_0", "가죽1_1"],
    metal: ["metal", "__metal*"]
  },
  doubleArm2: {
    upholstery: ["fabric", "가죽1"],
    base: ["base", "가죽1_0", "가죽1_1"],
    metal: ["metal", "__metal*"]
  },
  trayLeft: {
    upholstery: ["fabric", "가죽1"],
    base: ["base", "가죽1_0", "가죽1_1"],
    trayWood: ["trayWood", "material_89", "wood"],
    metal: ["metal", "__metal*"]
  }
};
