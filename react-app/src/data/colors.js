export const sofaColors = [
  { id: "fabricIvory", label: "패브릭 아이보리", color: "#e6dcd1", group: "light", textureFolder: "/materials/sofa/fabric_ivory" },
  { id: "fabricGray", label: "패브릭 그레이", color: "#918d8b", group: "light", textureFolder: "/materials/sofa/fabric_gray" },
  { id: "fabricCharcoal", label: "패브릭 차콜블랙", color: "#3b3a3a", group: "fabricDark", textureFolder: "/materials/sofa/fabric_charcoal" },
  { id: "leatherBlack", label: "천연가죽 블랙", color: "#1a1a1a", group: "leatherBlack", image: "/assets/thumbnails/texture/Kashi%209.jpg", textureFolder: "/materials/sofa/leather_black" }
];

export const baseFrameOptionsByGroup = {
  light: [
    { label: "비건가죽 그레이", color: "#b7aa9e", textureFolder: "/materials/frame/default" },
    { label: "비건가죽 헤이즐", color: "#716253", textureFolder: "/materials/frame/default" },
    { label: "비건가죽 올리브", color: "#595b45", textureFolder: "/materials/frame/default" },
    { label: "비건가죽 그린", color: "#2c4128", textureFolder: "/materials/frame/default" },
    { label: "천연가죽 썬더", color: "#4d4843", textureFolder: "/materials/frame/default" }
  ],
  fabricDark: [sofaColors[2]],
  leatherBlack: [sofaColors[3]]
};

export const trayWoodColors = [
  { label: "월넛", color: "#3d2f22", image: "/assets/thumbnails/texture/131_Persian%20walnut%20PBR%20texture-seamless.jpg", textureFolder: "/materials/tray_wood/walnut" },
  { label: "블랙", color: "#000000", textureFolder: "/materials/tray_wood/black" }
];

export const accentCushionColors = [
  { label: "레드", color: "#782b24" },
  { label: "카멜", color: "#945d25" },
  { label: "로즈우드", color: "#9b5d58" },
  { label: "스톤", color: "#5b5558" },
  { label: "그린", color: "#334339" },
  { label: "스카이", color: "#88acb9" },
  { label: "네이비", color: "#212c4a" }
];

export const CUSHION_PRICE = 31818;
