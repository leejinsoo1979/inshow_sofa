# Materials Folder

각 재질 폴더에 PBR 텍스처 세트를 넣으면 자동으로 로드됩니다.

## 폴더 구조

```
materials/
├── sofa/          소파 패브릭/가죽 재질
│   ├── fabric_ivory/
│   ├── fabric_gray/
│   ├── fabric_charcoal/
│   └── leather_black/
├── frame/         하부프레임 재질
├── legs/          다리 metal 재질
└── tray_wood/     트레이 월넛 재질
    └── walnut/
```

## 텍스처 파일 명명 규칙

각 재질 폴더 안에 다음 파일들을 넣으세요 (있는 것만 넣어도 됨):

| 파일명 (어떤 이름이든 다음 키워드 포함) | 역할 |
|---|---|
| `*albedo*` 또는 `*basecolor*` 또는 `*diffuse*` 또는 `*color*` | 기본 색상 |
| `*normal*` | 노멀 맵 (Normal Map) |
| `*roughness*` | 거칠기 |
| `*metalness*` 또는 `*metallic*` | 금속성 |
| `*ao*` 또는 `*ambientocclusion*` | 앰비언트 오클루전 |
| `*displacement*` 또는 `*height*` | 변위/높이 맵 |
| `*emissive*` | 자체 발광 |

확장자: `.jpg`, `.jpeg`, `.png`, `.webp` 모두 지원

## 예시

```
materials/sofa/fabric_ivory/
├── fabric_albedo.jpg
├── fabric_normal.jpg
├── fabric_roughness.jpg
└── fabric_ao.jpg
```

## 사용

폴더에 텍스처를 넣은 후 `npm run dev`로 서버 재시작하면 자동 적용됩니다.
