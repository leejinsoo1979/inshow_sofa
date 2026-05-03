"""
더블암 1인 GLB에서 본체(쿠션/등받이/팔걸이) 메쉬 모두 제거.
하부프레임(instance_0.005)과 다리(metal-only instance) + 평면 받침대만 유지.

Blender Text Editor에서 실행 (Alt+P)
"""

import bpy

DA_PATH = "/Users/jinsoolee/Documents/New project/models/sofa_module_v2/_pre_smooth/newdoublearm1.glb"
OUT_PATH = "/Users/jinsoolee/Documents/New project/models/sofa_module_v2/newdoublearm1.glb"


def main():
    # 1. 빈 씬
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # 2. 더블암 백업 import
    bpy.ops.import_scene.gltf(filepath=DA_PATH)

    # 3. 본체(group_*) 제거. 다리/하부/평면(instance_*)은 유지
    removed = 0
    for o in list(bpy.context.scene.objects):
        if o.type == 'MESH' and o.name.startswith('group_'):
            bpy.data.objects.remove(o, do_unlink=True)
            removed += 1

    print(f"removed {removed} body meshes")

    # 4. 남은 메쉬 확인
    print("\n=== 남은 메쉬 ===")
    for o in bpy.context.scene.objects:
        if o.type == 'MESH':
            mats = [s.material.name if s.material else "" for s in o.material_slots]
            print(f"  {o.name}: mats={mats}")

    # 5. Export
    bpy.ops.export_scene.gltf(
        filepath=OUT_PATH,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_yup=True
    )
    print(f"\nsaved: {OUT_PATH}")


if __name__ == '__main__':
    main()
