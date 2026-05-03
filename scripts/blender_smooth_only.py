"""
GLB의 mesh를 shade smooth만 적용 + auto smooth angle 30도.
normal 재계산은 안 함 (mesh shape 변형 위험).
"""
import bpy
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

    for obj in [o for o in bpy.context.scene.objects if o.type == "MESH"]:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.shade_smooth()
        # auto smooth: 30 degrees (sharp edges 보존)
        if hasattr(obj.data, "use_auto_smooth"):
            obj.data.use_auto_smooth = True
            obj.data.auto_smooth_angle = 0.523599  # 30 deg in radians
        obj.select_set(False)

    bak = path + ".smooth.bak"
    if not Path(bak).exists():
        shutil.copy(path, bak)
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", use_selection=False)
    print(f"  saved")


for p in TARGETS:
    process(p)

print("All done.")
