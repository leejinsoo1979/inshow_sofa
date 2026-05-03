"""
더블암 GLB의 단일 'fabric' 머티리얼을 face별로 'fabric' / 'base'로 분리.

기준:
- 각 face의 평균 Y(높이)가 모듈 전체 높이의 하위 12% 이하 → 'fabric'(하부 띠)
- 그 외 모든 face → 'base'(본체 외피)

이렇게 하면 다른 싱글암 모듈들과 동일하게 base/fabric 두 슬롯으로 나뉘어
React 코드의 모드별 색상 매핑이 정상 작동함.

원본은 .bak으로 백업.
"""
from pygltflib import GLTF2, Material, PbrMetallicRoughness, Primitive, Attributes
import struct, json, copy, shutil
from pathlib import Path

TARGETS = [
    "/Users/jinsoolee/Documents/New project/models/sofa_module_v2/newdoublearm1.glb",
    "/Users/jinsoolee/Documents/New project/models/sofa_module_v2/newdoublearm2.glb",
]
BASE_RATIO = 0.12  # 하위 12%만 fabric, 나머지 base


def get_buffer_bytes(g):
    if g._glb_data:
        return bytearray(g._glb_data)
    return bytearray()


def read_accessor_floats(g, idx, components):
    acc = g.accessors[idx]
    bv = g.bufferViews[acc.bufferView]
    blob = g.binary_blob()
    offset = (bv.byteOffset or 0) + (acc.byteOffset or 0)
    out = []
    for i in range(acc.count):
        out.append(struct.unpack_from("<" + "f"*components, blob, offset + i*components*4))
    return out


def read_accessor_indices(g, idx):
    acc = g.accessors[idx]
    bv = g.bufferViews[acc.bufferView]
    blob = g.binary_blob()
    offset = (bv.byteOffset or 0) + (acc.byteOffset or 0)
    out = []
    if acc.componentType == 5123:
        for i in range(acc.count):
            out.append(struct.unpack_from("<H", blob, offset + i*2)[0])
    elif acc.componentType == 5125:
        for i in range(acc.count):
            out.append(struct.unpack_from("<I", blob, offset + i*4)[0])
    elif acc.componentType == 5121:
        for i in range(acc.count):
            out.append(blob[offset + i])
    return out


def append_indices(g, indices):
    """새 indices buffer를 추가하고 accessor index를 반환."""
    blob = bytearray(g.binary_blob())
    align = (4 - len(blob) % 4) % 4
    blob.extend(b"\0" * align)
    start = len(blob)
    use_uint = max(indices) > 65535 if indices else False
    if use_uint:
        for i in indices:
            blob.extend(struct.pack("<I", i))
        comp_type = 5125
        byte_size = 4
    else:
        for i in indices:
            blob.extend(struct.pack("<H", i))
        comp_type = 5123
        byte_size = 2
    bv_idx = len(g.bufferViews)
    from pygltflib import BufferView, Accessor
    bv = BufferView(buffer=0, byteOffset=start, byteLength=len(indices)*byte_size, target=34963)
    g.bufferViews.append(bv)
    acc = Accessor(bufferView=bv_idx, byteOffset=0, componentType=comp_type, count=len(indices), type="SCALAR")
    g.accessors.append(acc)
    g.buffers[0].byteLength = len(blob)
    g.set_binary_blob(bytes(blob))
    return len(g.accessors) - 1


def find_material_index(g, name):
    for i, m in enumerate(g.materials):
        if m.name == name:
            return i
    return None


def add_base_material_like_fabric(g, fabric_idx):
    """fabric 머티리얼을 복제해서 'base' 이름으로 추가."""
    base_existing = find_material_index(g, "base")
    if base_existing is not None:
        return base_existing
    new_pbr = PbrMetallicRoughness(
        baseColorFactor=[0.6, 0.55, 0.5, 1.0],  # 약간 다른 값으로 별개 머티리얼임을 보장
        metallicFactor=0,
        roughnessFactor=0.6
    )
    new_mat = Material(name="base", pbrMetallicRoughness=new_pbr)
    g.materials.append(new_mat)
    return len(g.materials) - 1


def process(path):
    g = GLTF2().load(path)
    fabric_idx = find_material_index(g, "fabric")
    if fabric_idx is None:
        print(f"  no fabric in {path}, skip")
        return
    # 모듈 전체 Y 범위 측정
    all_ys = []
    for mesh in g.meshes:
        for prim in mesh.primitives:
            if prim.material != fabric_idx:
                continue
            positions = read_accessor_floats(g, prim.attributes.POSITION, 3)
            indices = read_accessor_indices(g, prim.indices)
            for i in range(0, len(indices), 3):
                ys = [positions[indices[i+j]][1] for j in range(3)]
                all_ys.append(sum(ys)/3)
    if not all_ys:
        print(f"  no fabric faces, skip")
        return
    y_min, y_max = min(all_ys), max(all_ys)
    threshold = y_min + (y_max - y_min) * BASE_RATIO
    print(f"  Y range [{y_min:.2f}..{y_max:.2f}], threshold={threshold:.2f}")

    base_idx = add_base_material_like_fabric(g, fabric_idx)

    # 각 mesh의 fabric primitive를 둘로 split
    new_meshes = []
    for mesh in g.meshes:
        new_prims = []
        for prim in mesh.primitives:
            if prim.material != fabric_idx:
                new_prims.append(prim)
                continue
            positions = read_accessor_floats(g, prim.attributes.POSITION, 3)
            indices = read_accessor_indices(g, prim.indices)
            fabric_idxs = []
            base_idxs = []
            for i in range(0, len(indices), 3):
                ys = [positions[indices[i+j]][1] for j in range(3)]
                avg = sum(ys)/3
                # 하위 BASE_RATIO = 하부 프레임 = base 슬롯, 그 외 = 본체 = fabric
                if avg <= threshold:
                    base_idxs.extend([indices[i], indices[i+1], indices[i+2]])
                else:
                    fabric_idxs.extend([indices[i], indices[i+1], indices[i+2]])
            if fabric_idxs:
                new_acc_f = append_indices(g, fabric_idxs)
                p_f = Primitive(attributes=prim.attributes, indices=new_acc_f, material=fabric_idx, mode=prim.mode)
                new_prims.append(p_f)
            if base_idxs:
                new_acc_b = append_indices(g, base_idxs)
                p_b = Primitive(attributes=prim.attributes, indices=new_acc_b, material=base_idx, mode=prim.mode)
                new_prims.append(p_b)
        mesh.primitives = new_prims

    # Backup + save
    bak = path + ".bak"
    if not Path(bak).exists():
        shutil.copy(path, bak)
    g.save(path)
    print(f"  saved {path}")


for p in TARGETS:
    print(f"\nProcessing {Path(p).name}")
    process(p)
