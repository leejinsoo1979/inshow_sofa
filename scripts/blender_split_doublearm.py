"""
Blender로 더블암 GLB의 fabric mesh를 base/fabric으로 분리.

방식:
1. GLB 임포트
2. fabric 머티리얼이 적용된 모든 mesh를 합침 (Join)
3. Edit Mode에서 face의 평균 Y가 하위 22%(threshold) 이하인 face들 선택
4. 새 'base' 머티리얼 슬롯 추가 후 선택된 face에만 base 할당
5. GLB로 다시 export

원본은 .blender.bak으로 백업.
"""
import bpy
import bmesh
from pathlib import Path
import shutil

TARGETS = [
    "/Users/jinsoolee/Documents/New project/models/sofa_module_v2/newdoublearm1.glb",
    "/Users/jinsoolee/Documents/New project/models/sofa_module_v2/newdoublearm2.glb",
]
BASE_RATIO = 0.22


def reset():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for c in [bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.objects]:
        for it in list(c):
            try: c.remove(it)
            except: pass


def process(path):
    print(f"\n=== {Path(path).name} ===")
    reset()
    bpy.ops.import_scene.gltf(filepath=path)

    # fabric mesh 모으기
    fabric_objs = []
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        for slot in obj.material_slots:
            if slot.material and slot.material.name.lower().startswith("fabric"):
                fabric_objs.append(obj)
                break

    if not fabric_objs:
        print("  no fabric mesh, skip")
        return

    # 모든 fabric mesh를 첫 번째 객체에 join
    bpy.ops.object.select_all(action="DESELECT")
    primary = fabric_objs[0]
    for o in fabric_objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = primary
    if len(fabric_objs) > 1:
        bpy.ops.object.join()
    merged = bpy.context.view_layer.objects.active

    # Y range 측정 (local Y)
    bpy.context.view_layer.update()
    me = merged.data
    poly_y = []
    for poly in me.polygons:
        vy = sum(me.vertices[v].co.y for v in poly.vertices) / len(poly.vertices)
        poly_y.append(vy)
    y_min = min(poly_y)
    y_max = max(poly_y)
    threshold = y_min + (y_max - y_min) * BASE_RATIO
    print(f"  Y range [{y_min:.2f}..{y_max:.2f}], threshold={threshold:.2f}")

    # 'base' 머티리얼 추가
    base_mat = bpy.data.materials.new(name="base")
    base_mat.use_nodes = True
    bsdf = base_mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (0.6, 0.55, 0.5, 1.0)
        bsdf.inputs["Roughness"].default_value = 0.6
    merged.data.materials.append(base_mat)
    base_idx = len(merged.material_slots) - 1

    # 하위 face들에 base 머티리얼 할당
    for poly, vy in zip(me.polygons, poly_y):
        if vy <= threshold:
            poly.material_index = base_idx

    # mesh 업데이트
    me.update()

    # export
    bak = path + ".blender.bak"
    if not Path(bak).exists():
        shutil.copy(path, bak)
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=False)
    print(f"  saved {path}")


for p in TARGETS:
    process(p)

print("\nAll done.")
