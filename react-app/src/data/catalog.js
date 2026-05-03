export const moduleCatalog = {
  armlessLeft: { label: "싱글암(좌)", width: 0.95, depth: 0.9, height: 0.68, seats: 1, model: "singleArmLeftOne", arms: ["right"], openSides: ["left"], price: { fabric: 960000, leather: 1818000 }, thumbnail: "/assets/thumbnails/singlearm_L_1.png" },
  armlessRight: { label: "싱글암(우)", width: 0.95, depth: 0.9, height: 0.68, seats: 1, model: "singleArmLeftOne", mirror: true, arms: ["left"], openSides: ["right"], price: { fabric: 960000, leather: 1818000 }, thumbnail: "/assets/thumbnails/singlearm_R_1.png" },
  doubleOne: { label: "더블암 1인", width: 1.15, depth: 0.9, height: 0.68, seats: 1, model: "doubleArmOne", arms: ["left", "right"], openSides: ["left", "right"], price: { fabric: 1090000, leather: 2090000 }, thumbnail: "/assets/thumbnails/doublearm_1.png" },
  doubleTwo: { label: "더블암 2인", width: 1.9, depth: 0.9, height: 0.68, seats: 2, model: "doubleArmTwo", arms: ["left", "right"], openSides: ["left", "right"], price: { fabric: 1500000, leather: 3000000 }, thumbnail: "/assets/thumbnails/doublearm_2.png" },
  singleLeftTwo: { label: "싱글암2인(좌)", width: 1.7, depth: 0.9, height: 0.68, seats: 2, model: "singleArmRightTwo", arms: ["right"], openSides: ["left"], price: { fabric: 1410000, leather: 2727000 }, thumbnail: "/assets/thumbnails/singlearm_L_2.png" },
  singleRightTwo: { label: "싱글암2인(우)", width: 1.7, depth: 0.9, height: 0.68, seats: 2, model: "singleArmRightTwo", mirror: true, arms: ["left"], openSides: ["right"], price: { fabric: 1410000, leather: 2727000 }, thumbnail: "/assets/thumbnails/singlearm_R_2.png" },
  trayLeftOne: { label: "트레이(좌)", width: 1.15, depth: 0.9, height: 0.68, seats: 1, model: "trayLeftOne", mirror: true, arms: [], openSides: ["right"], price: { fabric: 818000, leather: 1636000 }, thumbnail: "/assets/thumbnails/trey_L.png" },
  trayRightOne: { label: "트레이(우)", width: 1.15, depth: 0.9, height: 0.68, seats: 1, model: "trayLeftOne", arms: [], openSides: ["left"], price: { fabric: 818000, leather: 1636000 }, thumbnail: "/assets/thumbnails/trey_R.png" }
};

export const modelSources = {
  singleArmLeftOne: "/models/sofa_module/single_arm(L)1.glb?v=10",
  doubleArmOne: "/models/sofa_module_v2/Double_Arm_1.glb?v=presmooth1",
  doubleArmTwo: "/models/sofa_module_v2/Double_Arm_2.glb?v=presmooth1",
  singleArmRightTwo: "/models/sofa_module/__singlearm2_R.glb?v=10",
  trayLeftOne: "/models/sofa_module/single_tray(L).glb?v=10"
};

export const modelMaterialRoles = {
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
    upholstery: ["fabric", "가죽1", "가죽1_0", "가죽1_1", "material_1", "material_73"],
    base: ["base"],
    metal: ["metal", "__metal*"]
  },
  doubleArmTwo: {
    upholstery: ["fabric", "가죽1", "가죽1_0", "가죽1_1", "material_73"],
    base: ["base"],
    metal: ["metal", "__metal*"]
  }
};
