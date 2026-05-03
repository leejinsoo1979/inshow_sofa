"""
더블암 GLB의 mesh 수가 많아서 (35/71개) 외곽선 후처리에서 안쪽 라인이 많이 보임.
같은 머티리얼끼리 mesh 통합하여 mesh 수를 줄임.

원본은 .merge.bak으로 백업.
"""
from pygltflib import GLTF2, Mesh, Primitive
import shutil, struct
from pathlib import Path

TARGETS = [
    "/Users/jinsoolee/Documents/New project/models/sofa_module_v2/newdoublearm1.glb",
    "/Users/jinsoolee/Documents/New project/models/sofa_module_v2/newdoublearm2.glb",
]


def get_blob(g):
    return bytearray(g.binary_blob() or b"")


def read_indices(g, idx):
    acc = g.accessors[idx]
    bv = g.bufferViews[acc.bufferView]
    blob = g.binary_blob()
    offset = (bv.byteOffset or 0) + (acc.byteOffset or 0)
    out = []
    if acc.componentType == 5123:
        for i in range(acc.count):
            out.append(struct.unpack_from("<H", blob, offset + i * 2)[0])
    elif acc.componentType == 5125:
        for i in range(acc.count):
            out.append(struct.unpack_from("<I", blob, offset + i * 4)[0])
    return out


def read_positions(g, idx):
    acc = g.accessors[idx]
    bv = g.bufferViews[acc.bufferView]
    blob = g.binary_blob()
    offset = (bv.byteOffset or 0) + (acc.byteOffset or 0)
    out = []
    for i in range(acc.count):
        out.append(struct.unpack_from("<fff", blob, offset + i * 12))
    return out, acc.count


def append_buffer(g, blob_data, target=34962):
    """blob bytes를 buffer 끝에 추가하고 bufferView idx 반환."""
    blob = bytearray(g.binary_blob())
    align = (4 - len(blob) % 4) % 4
    blob.extend(b"\0" * align)
    start = len(blob)
    blob.extend(blob_data)
    from pygltflib import BufferView
    bv = BufferView(buffer=0, byteOffset=start, byteLength=len(blob_data), target=target)
    g.bufferViews.append(bv)
    g.buffers[0].byteLength = len(blob)
    g.set_binary_blob(bytes(blob))
    return len(g.bufferViews) - 1


def merge_by_material(path):
    g = GLTF2().load(path)
    print(f"\nProcessing {Path(path).name}")
    print(f"  before: {len(g.meshes)} meshes, {sum(len(m.primitives) for m in g.meshes)} primitives")

    # 머티리얼별로 모든 primitive 수집 (positions + indices만 통합)
    by_mat = {}  # mat_idx -> {positions: [], indices: []}
    for mesh in g.meshes:
        for prim in mesh.primitives:
            if prim.material is None or prim.indices is None:
                continue
            mi = prim.material
            if mi not in by_mat:
                by_mat[mi] = {"positions": [], "indices": [], "normals": []}
            positions, vcount = read_positions(g, prim.attributes.POSITION)
            indices = read_indices(g, prim.indices)
            # 추가 시 vertex 인덱스 offset
            voff = len(by_mat[mi]["positions"])
            by_mat[mi]["positions"].extend(positions)
            by_mat[mi]["indices"].extend([i + voff for i in indices])
            # normals
            if hasattr(prim.attributes, "NORMAL") and prim.attributes.NORMAL is not None:
                normals, _ = read_positions(g, prim.attributes.NORMAL)
                by_mat[mi]["normals"].extend(normals)
            else:
                by_mat[mi]["normals"].extend([(0, 1, 0)] * vcount)

    # 새 mesh 하나 만들고 머티리얼별 primitive 추가
    new_primitives = []
    from pygltflib import Accessor, Attributes
    for mi, data in by_mat.items():
        positions = data["positions"]
        normals = data["normals"]
        indices = data["indices"]

        # positions buffer
        pos_bytes = bytearray()
        for p in positions:
            pos_bytes.extend(struct.pack("<fff", *p))
        pos_bv = append_buffer(g, pos_bytes)
        pos_acc = Accessor(
            bufferView=pos_bv,
            componentType=5126,  # FLOAT
            count=len(positions),
            type="VEC3",
            min=[min(p[i] for p in positions) for i in range(3)],
            max=[max(p[i] for p in positions) for i in range(3)],
        )
        g.accessors.append(pos_acc)
        pos_idx = len(g.accessors) - 1

        # normals buffer
        nor_bytes = bytearray()
        for n in normals:
            nor_bytes.extend(struct.pack("<fff", *n))
        nor_bv = append_buffer(g, nor_bytes)
        nor_acc = Accessor(bufferView=nor_bv, componentType=5126, count=len(normals), type="VEC3")
        g.accessors.append(nor_acc)
        nor_idx = len(g.accessors) - 1

        # indices buffer
        idx_bytes = bytearray()
        use_uint = max(indices) > 65535 if indices else False
        if use_uint:
            for i in indices:
                idx_bytes.extend(struct.pack("<I", i))
            comp = 5125
        else:
            for i in indices:
                idx_bytes.extend(struct.pack("<H", i))
            comp = 5123
        idx_bv = append_buffer(g, idx_bytes, target=34963)
        idx_acc = Accessor(bufferView=idx_bv, componentType=comp, count=len(indices), type="SCALAR")
        g.accessors.append(idx_acc)
        ind_idx = len(g.accessors) - 1

        attr = Attributes(POSITION=pos_idx, NORMAL=nor_idx)
        new_primitives.append(Primitive(attributes=attr, indices=ind_idx, material=mi, mode=4))

    # 기존 mesh 다 제거하고 단일 mesh 1개로
    new_mesh = Mesh(name="merged", primitives=new_primitives)
    g.meshes = [new_mesh]

    # nodes 정리: 첫 번째 mesh-노드 하나만 남김, 나머지 mesh ref 끊기
    kept_node = None
    for ni, node in enumerate(g.nodes):
        if node.mesh is not None and kept_node is None:
            node.mesh = 0
            kept_node = ni
        elif node.mesh is not None:
            node.mesh = None

    # backup + save
    bak = path + ".merge.bak"
    if not Path(bak).exists():
        shutil.copy(path, bak)
    g.save(path)
    print(f"  after: {len(g.meshes)} meshes, {sum(len(m.primitives) for m in g.meshes)} primitives")


for p in TARGETS:
    merge_by_material(p)
