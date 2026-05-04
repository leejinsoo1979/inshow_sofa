export const sofaColors = [
  { id: "fabricIvory", label: "패브릭 아이보리", color: "#e6dcd1", group: "light", image: "/materials/sofa/fabric_ivory.png" },
  { id: "fabricGray", label: "패브릭 그레이", color: "#918d8b", group: "light", image: "/materials/sofa/fabric_gray.png" },
  { id: "fabricCharcoal", label: "패브릭 차콜블랙", color: "#3b3a3a", group: "fabricDark", image: "/materials/sofa/fabric_charcoal.png" },
  { id: "leatherBlack", label: "천연가죽 블랙", color: "#1a1a1a", group: "leatherBlack", image: "/materials/sofa/leather_black.png" }
];

export const baseFrameOptionsByGroup = {
  light: [
    { label: "비건가죽 그레이", color: "#b7aa9e", image: "/materials/frame/vegan_leather_gray.png" },
    { label: "비건가죽 헤이즐", color: "#716253", image: "/materials/frame/vegan_leather_hazel.png" },
    { label: "비건가죽 올리브", color: "#595b45", image: "/materials/frame/vegan_leather_olive.png" },
    { label: "비건가죽 그린", color: "#2c4128", image: "/materials/frame/vegan_leather_green.png" },
    { label: "천연가죽 썬더", color: "#4d4843", image: "/materials/frame/vegan_leather_thunder.png" }
  ],
  fabricDark: [
    sofaColors[2]
  ],
  leatherBlack: [
    sofaColors[3]
  ]
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
