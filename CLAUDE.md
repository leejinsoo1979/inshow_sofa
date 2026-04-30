# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

INSHOW SOFA #1 — a browser-based 3D modular sofa configurator. Pure static site (no build step) using Three.js loaded from CDN via `<script type="importmap">`. UI strings are Korean.

## Commands

- **Run dev server**: `npm run dev` (serves on `http://localhost:4173` via `python3 -m http.server`). Must use a server, not `file://`, because GLB models are fetched relatively.
- **Re-render module thumbnails**: `blender --background --python scripts/render_module_thumbnails.py`. Outputs PNGs to `assets/thumbnails/` from the GLB files in `models/`. Requires Blender 4.x (uses `BLENDER_EEVEE_NEXT`).

There is no lint, test, typecheck, or build pipeline.

## Architecture

Single-page app, single source file: `src/main.js` (~840 lines) drives everything. `index.html` defines the static DOM (canvas, side panel, hotspots, popovers, toolbar) and `styles.css` styles a two-column shell (3D viewer + control panel).

### Core data flow

1. **`state`** (in `main.js`) is the single source of truth: `{ layout, material, sofaColor, baseColor, selectedId, modules[] }`. Each module is `{ id, type, x, z, rotation }`.
2. **`moduleCatalog`** maps module type keys (e.g. `doubleOne`, `singleRightTwo`, `trayLeftOne`) to spec `{ label, width, depth, height, seats, model, mirror?, thumbnail }`. The `model` field references a key in **`modelSources`**, which maps to a GLB path under `models/`. Multiple module types can share one GLB; `mirror: true` flips it on X.
3. **`rebuildSofa()`** is the central re-render: clears `sofaRoot`/`expansionRoot`, recreates materials (`createUpholsteryMaterial`, `createBaseMaterial`, `createMetalMaterial`) from current `state.material`, then rebuilds each module via `createModule()`. Called after every state change. `updateUi()` syncs DOM labels/metrics; called inside `rebuildSofa()` and per-frame indirectly via `animate()`.
4. **Module construction**: `createImportedModule()` clones the loaded GLB, traverses meshes and reassigns materials based on the original material name (`metal` → metal, `가죽`/`leather`/`base` → base/frame, else → upholstery). Then it scales the model so its bounds match the catalog `width`/`depth` and recenters it to origin with `y = 0` on the floor. **Material name matching is the contract with the GLB files** — preserve names like `metal`, `가죽`, `base` when editing models. If GLBs haven't loaded yet, falls back to `createProceduralModule()` (boxes + cylinders).

### 3D scene structure

- `sofaRoot` — the configured modules
- `guideRoot` — floor guides under each module (toggle: `#showGuides`)
- `expansionRoot` — invisible-ish click planes left/right of the configuration that open the "add module" popover
- `selectable[]` — flat list of meshes the raycaster tests; rebuilt on every `rebuildSofa()`. Each mesh has `userData.moduleId` or `userData.expansionSide` to disambiguate hits.

### UI ↔ 3D coupling

Three DOM elements are positioned by projecting 3D coordinates to screen space each frame in `animate()`:
- `#leftHotspot`/`#rightHotspot` — the "+" buttons hovering at the sides (`positionSideHotspot`)
- `#hotspotPopover` — the thumbnail picker (`updateHotspotPopoverPosition`)
- `#moduleToolbar` — the rotate/delete toolbar above the selected module (`updateModuleToolbarPosition`)

`sideWorldPositions.{left,right}` are recomputed inside `createExpansionHotspot()` during `rebuildSofa()` so the floating UI tracks the current configuration bounds.

### Mutating actions (always end in `rebuildSofa()`)

`setLayout`, `addModule`, `addModuleAtSide`, `duplicateSelected`, `rotateSelected`, `removeSelected`, swatch handlers, material handlers, `#showGuides` change.

### Camera

`OrbitControls` with damping; `frameCameraToConfiguration()` reframes based on combined `sofaRoot` + `expansionRoot` bounds — call after any change that affects footprint. `keepAngle=false` resets to the default isometric view.

## Adding a new module type

1. Add a GLB to `models/` (preserve material names: `metal`, `가죽`/`leather`/`base`, others become upholstery).
2. Add an entry to `modelSources` in `main.js`.
3. Add an entry to `moduleCatalog` referencing that `model` key. Set `mirror: true` if it's the L-variant of an existing R model.
4. Add a thumbnail entry in `scripts/render_module_thumbnails.py`'s `MODULES` dict and re-run the renderer, or drop a PNG into `assets/thumbnails/` matching the `thumbnail` path.
5. If it should appear in a layout preset, update `setLayout()`.
