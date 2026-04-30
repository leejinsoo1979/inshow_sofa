import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "thumbnails"
OUT.mkdir(parents=True, exist_ok=True)

MODULES = {
    "double_arm_1.png": ("models/double_arm_1.glb", False),
    "double_arm_2.png": ("models/sa1.glb", False),
    "single_arm_r_1.png": ("models/double_arm_1.glb", False),
    "single_arm_l_1.png": ("models/double_arm_1.glb", True),
    "single_arm_r_2.png": ("models/single_arm_2_R.glb", False),
    "single_arm_l_2.png": ("models/single_arm_2_R.glb", True),
    "tray_r_1.png": ("models/single_arm_t1_R.glb", False),
    "tray_l_1.png": ("models/single_arm_t1_R.glb", True),
}


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def import_model(path, mirror):
    bpy.ops.import_scene.gltf(filepath=str(ROOT / path))
    imported = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    root = bpy.data.objects.new("thumb_root", None)
    bpy.context.collection.objects.link(root)
    for obj in imported:
        obj.parent = root
        obj.select_set(False)
    if mirror:
        root.scale.x = -1
    return root


def bounds_for(objects):
    points = []
    for obj in objects:
        if obj.type != "MESH":
            continue
        points.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
    min_v = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    max_v = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    return min_v, max_v


def center_model(root):
    bpy.context.view_layer.update()
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    min_v, max_v = bounds_for(meshes)
    center = (min_v + max_v) * 0.5
    root.location.x -= center.x
    root.location.y -= center.y
    root.location.z -= min_v.z
    bpy.context.view_layer.update()
    min_v, max_v = bounds_for(meshes)
    return max_v - min_v


def style_materials():
    for mat in bpy.data.materials:
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if not bsdf:
            continue
        name = mat.name.lower()
        if "metal" in name:
            bsdf.inputs["Base Color"].default_value = (0.18, 0.16, 0.13, 1)
            bsdf.inputs["Roughness"].default_value = 0.48
            bsdf.inputs["Metallic"].default_value = 0.5
        elif "가죽" in name or "leather" in name:
            bsdf.inputs["Base Color"].default_value = (0.55, 0.49, 0.39, 1)
            bsdf.inputs["Roughness"].default_value = 0.56
        else:
            bsdf.inputs["Base Color"].default_value = (0.72, 0.68, 0.6, 1)
            bsdf.inputs["Roughness"].default_value = 0.74


def setup_scene(size):
    world = bpy.context.scene.world or bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.color = (1, 1, 1)

    area = bpy.data.lights.new("softbox", "AREA")
    area.energy = 450
    area.size = 5
    light = bpy.data.objects.new("softbox", area)
    light.location = (2.6, -3.8, 5)
    bpy.context.collection.objects.link(light)

    fill_data = bpy.data.lights.new("fill", "POINT")
    fill_data.energy = 90
    fill = bpy.data.objects.new("fill", fill_data)
    fill.location = (-3, 3, 3)
    bpy.context.collection.objects.link(fill)

    camera_data = bpy.data.cameras.new("thumb_camera")
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = max(size.x, size.y) * 1.45
    camera = bpy.data.objects.new("thumb_camera", camera_data)
    camera.location = (2.8, -3.0, 1.9)
    camera.rotation_euler = (math.radians(62), 0, math.radians(42))
    bpy.context.collection.objects.link(camera)
    bpy.context.scene.camera = camera

    bpy.context.scene.render.engine = "BLENDER_EEVEE_NEXT"
    bpy.context.scene.eevee.taa_render_samples = 64
    bpy.context.scene.render.resolution_x = 520
    bpy.context.scene.render.resolution_y = 300
    bpy.context.scene.render.film_transparent = False
    bpy.context.scene.view_settings.view_transform = "Filmic"
    bpy.context.scene.view_settings.look = "Medium High Contrast"
    bpy.context.scene.view_settings.exposure = 0
    bpy.context.scene.view_settings.gamma = 1


def render_one(filename, model_path, mirror):
    clear_scene()
    root = import_model(model_path, mirror)
    style_materials()
    size = center_model(root)
    setup_scene(size)
    bpy.context.scene.render.filepath = str(OUT / filename)
    bpy.ops.render.render(write_still=True)


def main():
    for filename, (model_path, mirror) in MODULES.items():
        print(f"Rendering {filename}")
        render_one(filename, model_path, mirror)


if __name__ == "__main__":
    sys.exit(main())
