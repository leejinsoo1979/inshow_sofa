"""
더블암 GLB의 normal을 일관되게 재계산.
- 모든 mesh의 face normal을 outside로 일관화
- shade smooth 적용
- 다시 export

원본은 .normals.bak으로 백업.
"""
import bpy
import bmesh
from pathlib import Path
import shutil

TARGETS = [
    "/Users/jinsoolee/Documents/New project/models/sofa_module_v2/Double_Arm_1.glb",
    "/Users/jinsoolee/Documents/New project/models/sofa_module_v2/Double_Arm_2.glb",
]


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

    mesh_objs = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    print(f"  meshes: {len(mesh_objs)}")

    for obj in mesh_objs:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        # Edit mode → all faces → recalc normals outside
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.mesh.normals_make_consistent(inside=False)
        bpy.ops.object.mode_set(mode="OBJECT")
        # shade smooth
        bpy.ops.object.shade_smooth()
        obj.select_set(False)

    # backup + export
    bak = path + ".normals.bak"
    if not Path(bak).exists():
        shutil.copy(path, bak)
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=False)
    print(f"  saved {path}")


for p in TARGETS:
    process(p)

print("\nAll done.")
