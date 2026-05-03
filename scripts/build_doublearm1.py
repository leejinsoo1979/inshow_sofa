"""
더블암 1인 GLB 만들기:
- 더블암 원본의 본체 메쉬(쿠션/등받이/팔걸이) 제거
- 싱글암(L) 부품을 그대로 복제해서 같은 위치에 배치 (mirror 없이)
- 좌측 팔걸이는 우측 팔걸이를 mesh-X 미러로 만들고 정확한 위치 보정
- 결과를 newdoublearm1.glb로 export

Blender Text Editor에서 실행:
1. Blender 메뉴 > Window > Toggle System Console (Mac은 터미널)
2. Text Editor (Scripting workspace)
3. Open Text > 이 파일 선택
4. Run Script (Alt+P 또는 Run 버튼)
"""

import bpy
import mathutils

DA_PATH = "/Users/jinsoolee/Documents/New project/models/sofa_module_v2/_pre_smooth/newdoublearm1.glb"
SA_PATH = "/Users/jinsoolee/Documents/New project/models/sofa_module/single_arm(L)1.glb"
OUT_PATH = "/Users/jinsoolee/Documents/New project/models/sofa_module_v2/newdoublearm1.glb"


def bbox_world(obj):
    bb = [obj.matrix_world @ mathutils.Vector(c) for c in obj.bound_box]
    xs = [v.x for v in bb]; ys = [v.y for v in bb]; zs = [v.z for v in bb]
    return (min(xs), max(xs), min(ys), max(ys), min(zs), max(zs))


def main():
    # 1. 빈 씬으로 시작
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # 2. 더블암 원본 import
    bpy.ops.import_scene.gltf(filepath=DA_PATH)
    for o in list(bpy.context.scene.objects):
        if o.type in ('MESH', 'EMPTY'):
            o.name = 'DA_' + o.name

    # 3. 싱글암 import
    bpy.ops.import_scene.gltf(filepath=SA_PATH)
    for o in list(bpy.context.scene.objects):
        if o.type in ('MESH', 'EMPTY') and not o.name.startswith('DA_'):
            o.name = 'SA_' + o.name

    print(f"After import: {sum(1 for o in bpy.context.scene.objects if o.type=='MESH')} meshes")

    # 4. DA의 본체 메쉬 식별 + 제거
    # 본체 = group_* (instance_* 는 다리/평면/하부 - 유지)
    da_body_to_remove = [o for o in list(bpy.context.scene.objects)
                         if o.type == 'MESH' and o.name.startswith('DA_group_')]
    print(f"Removing {len(da_body_to_remove)} DA body meshes")
    for o in da_body_to_remove:
        bpy.data.objects.remove(o, do_unlink=True)

    # 5. SA 본체 메쉬 식별 (group_*만 본체. instance_*는 다리/평면)
    sa_body = [o for o in bpy.context.scene.objects
               if o.type == 'MESH' and o.name.startswith('SA_group_')]
    print(f"SA body parts: {len(sa_body)}")
    for o in sa_body:
        b = bbox_world(o)
        print(f"  {o.name}: X=[{b[0]:.2f},{b[1]:.2f}] Y=[{b[2]:.2f},{b[3]:.2f}] Z=[{b[4]:.2f},{b[5]:.2f}]")

    # 6. SA 본체를 그대로 복제해서 DA 위치로 (X+0 그대로, mirror 없음)
    # SA와 DA 모두 SketchUp empty 부모를 가지므로 world transform이 동일하게 적용됨
    # SA 메쉬들을 DA 자리로 가져오려면 부모를 DA의 SketchUp으로 변경
    da_sketchup = bpy.data.objects.get('DA_SketchUp')

    sa_to_keep = []  # 복제 후 유지할 새 메쉬
    for sa in sa_body:
        # 복제
        bpy.ops.object.select_all(action='DESELECT')
        sa.select_set(True)
        bpy.context.view_layer.objects.active = sa
        bpy.ops.object.duplicate()
        new = bpy.context.active_object
        new.name = sa.name.replace('SA_', 'NEW_R_')  # 우측용
        sa_to_keep.append(new)

    # 7. SA 본체 + SA 부속 모두 제거 (원본 SA 정리)
    for o in list(bpy.context.scene.objects):
        if o.type in ('MESH', 'EMPTY') and o.name.startswith('SA_'):
            bpy.data.objects.remove(o, do_unlink=True)

    # 8. NEW_R_ 메쉬가 우측 자리에 있도록 — DA의 우측 팔걸이가 있던 X 위치 사용
    # SA 팔걸이는 X=0.728~0.95 (cx=0.84). 더블암 1인의 우측 팔걸이 위치는 X=원본대로 두고
    # 좌측 팔걸이만 추가 생성 (X 미러)

    # 우측 팔걸이를 미러해서 좌측 팔걸이 만들기
    new_arm_R = next((o for o in sa_to_keep if 'group_4' in o.name), None)
    if new_arm_R:
        bpy.ops.object.select_all(action='DESELECT')
        new_arm_R.select_set(True)
        bpy.context.view_layer.objects.active = new_arm_R
        bpy.ops.object.duplicate()
        new_arm_L = bpy.context.active_object
        new_arm_L.name = 'NEW_L_arm'

        # mesh data X 미러 + face flip
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
        me = new_arm_L.data
        xs = [v.co.x for v in me.vertices]
        mid = (min(xs) + max(xs)) / 2
        for v in me.vertices:
            v.co.x = 2 * mid - v.co.x
        # face winding 뒤집기
        bpy.ops.object.mode_set(mode='EDIT')
        bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.mesh.flip_normals()
        bpy.ops.object.mode_set(mode='OBJECT')

        # 위치: 우측 팔걸이는 SA 위치(cx≈0.84) → 좌측은 본체 중심 기준 미러
        # SA seat의 cx = 0.37 (싱글암 본체 중심)
        # 더블암 1인의 본체 중심도 SA와 같으므로 cx_seat을 기준으로 미러
        seat = next((o for o in sa_to_keep if 'group_3' in o.name), None)
        if seat:
            sb = bbox_world(seat)
            seat_cx = (sb[0] + sb[1]) / 2
            ab = bbox_world(new_arm_R)
            arm_R_cx = (ab[0] + ab[1]) / 2
            target_L_cx = 2 * seat_cx - arm_R_cx

            lb = bbox_world(new_arm_L)
            cur_L_cx = (lb[0] + lb[1]) / 2
            new_arm_L.location.x += (target_L_cx - cur_L_cx)
            print(f"arm_R cx={arm_R_cx:.3f}, seat cx={seat_cx:.3f}, arm_L target={target_L_cx:.3f}")

    # 9. 모든 새 메쉬에 노멀 정리 + smooth
    for o in [o for o in bpy.context.scene.objects if o.type == 'MESH' and (o.name.startswith('NEW_') or o.name.startswith('DA_'))]:
        bpy.ops.object.select_all(action='DESELECT')
        bpy.context.view_layer.objects.active = o
        o.select_set(True)
        try:
            bpy.ops.object.mode_set(mode='EDIT')
            bpy.ops.mesh.select_all(action='SELECT')
            bpy.ops.mesh.remove_doubles(threshold=0.0001)
            bpy.ops.mesh.normals_make_consistent(inside=False)
            bpy.ops.object.mode_set(mode='OBJECT')
            bpy.ops.object.shade_smooth()
        except Exception as e:
            print(f"err {o.name}: {e}")

    # 10. Export
    bpy.ops.export_scene.gltf(
        filepath=OUT_PATH,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_yup=True
    )
    print(f"\n=== DONE ===")
    print(f"saved: {OUT_PATH}")


if __name__ == '__main__':
    main()
