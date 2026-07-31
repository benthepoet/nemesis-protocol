# Nemesis Protocol — p1-ship-blender-viz deck03 builder (exploration, not shipped)
# Versions: charter v1.13 · design doc v1.19 · visual direction v1.10 · p1-deck-polish pack v3
# Data truth: src/deck/data/deck03.json (room/wall/door rects, px) · src/config.ts scale 120px=25m
# Run in Blender 5.2 via: exec(compile(open(<this file>).read(), 'build', 'exec'))

import bpy
import math
from mathutils import Vector

# ---------------------------------------------------------------- SECTION 0: constants + deck data
M = 25.0 / 120.0            # meters per SVG px (src/config.ts M_PER_PX)
H = 3.0                     # ROOM_HEIGHT_M
FLOOR_TOP = 0.05            # ROOM_FLOOR_TOP_Y (R-DP17)
SLAB_TOP = 0.04             # interstitial maintenance deck top (R-DP16)
RING_TOP = H + 0.24         # envelope top band
CX, CY = 614.5, 400.0       # outline AABB center (px) -> model origin

def X(px): return (px - CX) * M
def Y(py): return (py - CY) * M
def L(px): return px * M

ROOMS = [
    ("port-engine",   "aft", "engineering", (140, 288, 200, 52)),
    ("stbd-engine",   "aft", "engineering", (140, 460, 200, 52)),
    ("engineering",   "aft", "engineering", (140, 348, 200, 104)),
    ("main-spine",    "mid", "corridor",    (340, 385, 460, 30)),
    ("port-airlock",  "mid", "safe",        (372, 288, 58, 94)),
    ("cargo-hold",    "mid", "ops",         (438, 288, 118, 94)),
    ("armory",        "mid", "armory",      (564, 288, 118, 94)),
    ("med-bay",       "mid", "medical",     (690, 288, 98, 94)),
    ("life-support",  "mid", "lifeSupport", (372, 418, 98, 94)),
    ("barracks",      "mid", "crew",        (478, 418, 98, 94)),
    ("stbd-airlock",  "mid", "safe",        (584, 418, 58, 94)),
    ("hydroponics",   "mid", "hydro",       (650, 418, 72, 94)),
    ("mess",          "mid", "mess",        (730, 418, 62, 94)),
    ("fore-connector","fore","corridor",    (800, 388, 22, 24)),
    ("officer-qtrs",  "fore","crew",        (822, 292, 103, 35)),
    ("cic",           "fore","command",     (822, 335, 103, 130)),
    ("comms-nav",     "fore","comms",       (822, 473, 103, 35)),
]
BRIDGE_POLY = [(933,352),(1044,374),(1104,395),(1112,400),(1104,405),(1044,426),(933,448)]

ACCENT = {
    "engineering": (0.937, 0.325, 0.314, 1),  # ef5350
    "command":     (0.475, 0.525, 0.796, 1),  # 7986cb
    "ops":         (1.000, 0.718, 0.302, 1),  # ffb74d
    "lifeSupport": (0.302, 0.816, 0.882, 1),  # 4dd0e1
    "crew":        (0.808, 0.576, 0.847, 1),  # ce93d8
    "hydro":       (0.506, 0.780, 0.518, 1),  # 81c784
    "armory":      (1.000, 0.541, 0.396, 1),  # ff8a65
    "medical":     (0.502, 0.796, 0.769, 1),  # 80cbc4
    "comms":       (0.361, 0.486, 0.980, 1),  # 5c7cfa
    "mess":        (0.631, 0.533, 0.498, 1),  # a1887f
    "corridor":    (0.545, 0.580, 0.620, 1),  # 8b949e
    "safe":        (0.412, 0.941, 0.682, 1),  # 69f0ae
    "interactive": (1.000, 0.835, 0.310, 1),  # ffd54f
}
ROOM_LABEL = {
    "port-engine":"PORT ENGINE", "stbd-engine":"STBD ENGINE", "engineering":"ENGINEERING",
    "main-spine":"MAIN SPINE", "port-airlock":"PORT AIRLOCK", "cargo-hold":"CARGO HOLD",
    "armory":"ARMORY", "med-bay":"MED BAY", "life-support":"LIFE SUPPORT",
    "barracks":"BARRACKS", "stbd-airlock":"STBD AIRLOCK", "hydroponics":"HYDROPONICS",
    "mess":"MESS", "fore-connector":"CONNECTOR", "officer-qtrs":"OFFICER QTRS",
    "cic":"CIC", "comms-nav":"COMMS/NAV", "bridge":"BRIDGE",
}

WALLS = [
    ("A", (430, 288, 8, 94)), ("A", (556, 288, 8, 94)), ("A", (682, 288, 8, 94)),
    ("A", (470, 418, 8, 94)), ("A", (576, 418, 8, 94)), ("A", (642, 418, 8, 94)),
    ("A", (722, 418, 8, 94)), ("A", (822, 327, 103, 8)), ("A", (822, 465, 103, 8)),
    ("BB", (117, 296, 7, 208)),
    ("BB", (349, 268, 7, 115)), ("BB", (349, 417, 7, 115)),
    ("BB", (812, 268, 7, 115)), ("BB", (812, 417, 7, 115)),
    ("B", (372, 382, 22, 3)), ("B", (408, 382, 22, 3)),
    ("B", (438, 382, 52, 3)), ("B", (504, 382, 52, 3)),
    ("B", (564, 382, 52, 3)), ("B", (630, 382, 52, 3)),
    ("B", (690, 382, 42, 3)), ("B", (746, 382, 42, 3)),
    ("B", (372, 412, 42, 3)), ("B", (428, 412, 42, 3)),
    ("B", (478, 412, 42, 3)), ("B", (534, 412, 42, 3)),
    ("B", (584, 412, 22, 3)), ("B", (620, 412, 22, 3)),
    ("B", (650, 412, 29, 3)), ("B", (693, 412, 29, 3)),
    ("B", (730, 412, 24, 3)), ("B", (768, 412, 24, 3)),
    ("B", (140, 340, 93, 8)), ("B", (247, 340, 93, 8)),
    ("B", (140, 452, 93, 8)), ("B", (247, 452, 93, 8)),
    ("B", (337, 348, 3, 35)), ("B", (337, 417, 3, 35)),
    ("B", (822, 392, 3, 8)), ("B", (822, 408, 3, 57)),
    ("B", (925, 335, 3, 57)), ("B", (925, 408, 3, 57)),
]

DOORS = [
    ((394, 381, 14, 8), False), ((490, 381, 14, 8), False), ((616, 381, 14, 8), False),
    ((732, 381, 14, 8), False), ((414, 411, 14, 8), False), ((520, 411, 14, 8), False),
    ((606, 411, 14, 8), False), ((679, 411, 14, 8), False), ((754, 411, 14, 8), False),
    ((233, 340, 14, 8), False), ((233, 452, 14, 8), False),
    ((866, 327, 14, 8), False), ((866, 465, 14, 8), False),
    ((925, 392, 8, 16), False), ((818, 392, 8, 16), False),
    ((336, 383, 10, 34), True), ((796, 383, 10, 34), True),
]

OUTLINE = [
    (117,288),(340,288),(340,385),(372,385),(372,288),(788,288),(788,385),(822,385),
    (822,292),(925,292),(925,352),(933,352),(1044,374),(1104,395),(1112,400),(1104,405),
    (1044,426),(933,448),(925,448),(925,508),(822,508),(822,412),(792,412),(792,512),
    (372,512),(372,415),(340,415),(340,512),(117,512),
]
NOSE_EDGES = [((1104,395),(1112,400)), ((1112,400),(1104,405))]

# src/config.ts APERTURE_SITES
APERTURES = [
    ("top",    401.0, 3.2, "AP-PORT-AIRLOCK"),
    ("pa-left", 335.0, 2.6, "AP-PORT-AIRLOCK-2"),
    ("bottom", 613.0, 3.2, "AP-STBD-AIRLOCK"),
    ("top",    497.0, 3.6, "AP-CARGO"),
    ("top",    739.0, 3.0, "AP-MED"),
]
AP_Z0, AP_Z1 = 0.95, 2.15

# ---------------------------------------------------------------- SECTION 1: reset + collections + materials
def reset():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)

def collection(name):
    c = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(c)
    return c

COL = {}
def move_to(obj, colname):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    COL[colname].objects.link(obj)

def mat_principled(name, color, metallic=0.0, rough=0.5, emission=None, estr=0.0,
                   noise=False, trans=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bs = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bs.inputs["Base Color"].default_value = color
    bs.inputs["Metallic"].default_value = metallic
    bs.inputs["Roughness"].default_value = rough
    if emission is not None:
        bs.inputs["Emission Color"].default_value = emission
        bs.inputs["Emission Strength"].default_value = estr
    if trans > 0:
        bs.inputs["Transmission Weight"].default_value = trans
        bs.inputs["IOR"].default_value = 1.45
    if noise:
        tex = nt.nodes.new("ShaderNodeTexNoise"); tex.inputs["Scale"].default_value = 6.0
        tex.inputs["Detail"].default_value = 4.0; tex.inputs["Roughness"].default_value = 0.7
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        c0 = tuple(max(0.0, c * 0.62) for c in color[:3]) + (1,)
        c1 = tuple(min(1.0, c * 1.25) for c in color[:3]) + (1,)
        ramp.color_ramp.elements[0].color = c0
        ramp.color_ramp.elements[1].color = c1
        nt.links.new(tex.outputs["Fac"], ramp.inputs["Fac"])
        nt.links.new(ramp.outputs["Color"], bs.inputs["Base Color"])
        bump = nt.nodes.new("ShaderNodeBump"); bump.inputs["Strength"].default_value = 0.25
        bump.inputs["Distance"].default_value = 0.08
        nt.links.new(tex.outputs["Fac"], bump.inputs["Height"])
        nt.links.new(bump.outputs["Normal"], bs.inputs["Normal"])
    nt.links.new(bs.outputs["BSDF"], out.inputs["Surface"])
    return m

def make_materials():
    MAT = {}
    MAT["hull"]     = mat_principled("p1_hull_steel", (0.135,0.180,0.226,1), 0.85, 0.42, noise=True)
    MAT["deck"]     = mat_principled("p1_deck_plate", (0.145,0.190,0.240,1), 0.70, 0.50, noise=True)
    MAT["corridor"] = mat_principled("p1_corridor_floor", (0.230,0.255,0.285,1), 0.55, 0.55, noise=True)
    MAT["wall"]     = mat_principled("p1_wall_panel", (0.125,0.165,0.210,1), 0.60, 0.55, noise=True)
    MAT["bulkhead"] = mat_principled("p1_bulkhead", (0.105,0.140,0.180,1), 0.80, 0.40, noise=True)
    MAT["ceiling"]  = mat_principled("p1_ceiling", (0.085,0.115,0.150,1), 0.45, 0.65, noise=True)
    MAT["inter"]    = mat_principled("p1_interstitial", (0.227,0.290,0.345,1), 0.60, 0.60,
                                     emission=(0.165,0.212,0.267,1), estr=0.6, noise=True)
    MAT["machine"]  = mat_principled("p1_machinery", (0.085,0.105,0.130,1), 0.75, 0.35, noise=True)
    MAT["crate"]    = mat_principled("p1_crate", (0.220,0.240,0.170,1), 0.15, 0.75, noise=True)
    MAT["fixture"]  = mat_principled("p1_fixture", (0.9,0.9,0.9,1), 0.0, 0.4,
                                     emission=(1.0,0.87,0.70,1), estr=6.0)
    MAT["reactor"]  = mat_principled("p1_reactor_glow", (0.3,0.12,0.03,1), 0.2, 0.4,
                                     emission=(1.0,0.55,0.15,1), estr=9.0)
    MAT["glass"]    = mat_principled("p1_glazing", (0.05,0.09,0.13,1), 0.1, 0.08, trans=0.85)
    MAT["screen"]   = mat_principled("p1_screen", (0.02,0.05,0.08,1), 0.2, 0.3,
                                     emission=(0.35,0.75,0.85,1), estr=2.5)
    MAT["bunk"]     = mat_principled("p1_bunk", (0.30,0.34,0.38,1), 0.2, 0.8)
    MAT["trim"]     = {}
    for k, v in ACCENT.items():
        MAT["trim"][k] = mat_principled("p1_trim_" + k, tuple(c*0.35 for c in v[:3]) + (1,),
                                        0.3, 0.5, emission=v, estr=2.2)
    return MAT

# ---------------------------------------------------------------- SECTION 2: geometry helpers
def new_obj(name, verts, faces, mat, colname):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.update()
    ob = bpy.data.objects.new(name, me)
    COL[colname].objects.link(ob)
    if mat:
        ob.data.materials.append(mat)
    return ob

def box(name, x0, y0, x1, y1, z0, z1, mat, colname, bevel=0.0):
    v = [(x0,y0,z0),(x1,y0,z0),(x1,y1,z0),(x0,y1,z0),
         (x0,y0,z1),(x1,y0,z1),(x1,y1,z1),(x0,y1,z1)]
    f = [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
    ob = new_obj(name, v, f, mat, colname)
    if bevel > 0:
        mod = ob.modifiers.new("edge_soft", 'BEVEL'); mod.width = bevel; mod.segments = 2
    return ob

def prism(name, p0, p1, thick, z0, z1, mat, colname):
    d = Vector((p1[0]-p0[0], p1[1]-p0[1]))
    n = Vector((-d[1], d[0])).normalized() * (thick / 2.0)
    a = Vector(p0) + n; b = Vector(p1) + n; c = Vector(p1) - n; e = Vector(p0) - n
    v = [(a[0],a[1],z0),(b[0],b[1],z0),(c[0],c[1],z0),(e[0],e[1],z0),
         (a[0],a[1],z1),(b[0],b[1],z1),(c[0],c[1],z1),(e[0],e[1],z1)]
    f = [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
    return new_obj(name, v, f, mat, colname)

def cyl(name, cx, cy, z0, z1, radius, mat, colname, verts=16):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius, depth=(z1-z0),
                                        location=(cx, cy, (z0+z1)/2.0))
    ob = bpy.context.active_object; ob.name = name
    if mat: ob.data.materials.append(mat)
    move_to(ob, colname)
    return ob

def pipe(name, p0, p1, radius, mat, colname):
    a, b = Vector(p0), Vector(p1)
    d = b - a
    mid = (a + b) / 2.0
    bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=radius, depth=d.length, location=mid)
    ob = bpy.context.active_object; ob.name = name
    ob.rotation_mode = 'QUATERNION'
    ob.rotation_quaternion = Vector((0,0,1)).rotation_difference(d.normalized())
    if mat: ob.data.materials.append(mat)
    move_to(ob, colname)
    return ob

def text_obj(name, body, loc, size, mat, colname, rot=(math.pi/2, 0, 0), align='CENTER', flip=False):
    cu = bpy.data.curves.new(name, type='FONT')
    cu.body = body; cu.size = size; cu.align_x = align; cu.extrude = 0.012
    ob = bpy.data.objects.new(name, cu)
    ob.location = loc; ob.rotation_euler = rot
    if flip: ob.scale.x = -1.0
    if mat: ob.data.materials.append(mat)
    COL[colname].objects.link(ob)
    return ob

# ---------------------------------------------------------------- SECTION 3: floors / interstitial / ceilings
def poly_slab(name, pts_px, z0, z1, mat, colname):
    pts = [(X(px), Y(py)) for px, py in pts_px]
    n = len(pts)
    v = [(p[0], p[1], z0) for p in pts] + [(p[0], p[1], z1) for p in pts]
    f = [tuple(range(n-1, -1, -1)), tuple(range(n, 2*n))]
    for i in range(n):
        j = (i+1) % n
        f.append((i, j, n+j, n+i))
    return new_obj(name, v, f, mat, colname)

def build_floors(MAT):
    for rid, sec, acc, (x, y, w, h) in ROOMS:
        m = MAT["corridor"] if acc == "corridor" else MAT["deck"]
        box("floor_" + rid, X(x), Y(y), X(x+w), Y(y+h), FLOOR_TOP-0.10, FLOOR_TOP, m, "STRUCTURE")
    poly_slab("floor_bridge", BRIDGE_POLY, FLOOR_TOP-0.10, FLOOR_TOP, MAT["deck"], "STRUCTURE")
    poly_slab("interstitial_slab", OUTLINE, -0.01, SLAB_TOP, MAT["inter"], "STRUCTURE")   # R-DP16
    poly_slab("underbelly", OUTLINE, -0.45, -0.01, MAT["hull"], "ENVELOPE")
    # waist-bay floors: the 4 silhouette notches are recessed hull bays, not through-holes
    for bi, (bx0, by0, bx1, by1) in enumerate((
            (340, 288, 372, 385), (788, 288, 822, 385),
            (788, 415, 822, 512), (340, 415, 372, 512))):
        poly_slab("bay_floor_%d" % bi, [(bx0,by0),(bx1,by0),(bx1,by1),(bx0,by1)],
                  -0.45, -0.33, MAT["hull"], "ENVELOPE")

def build_ceilings(MAT):
    for rid, sec, acc, (x, y, w, h) in ROOMS:
        box("ceil_" + rid, X(x), Y(y), X(x+w), Y(y+h), H, H+0.10, MAT["ceiling"], "CEILINGS")
    poly_slab("ceil_bridge", BRIDGE_POLY, H, H+0.10, MAT["ceiling"], "CEILINGS")
    poly_slab("deckhead", OUTLINE, H+0.10, RING_TOP, MAT["hull"], "CEILINGS")

# ---------------------------------------------------------------- SECTION 4: interior walls + doors
def build_walls(MAT):
    for i, (cls, (x, y, w, h)) in enumerate(WALLS):
        m = MAT["bulkhead"] if cls == "BB" else MAT["wall"]
        box("wall_%s_%d" % (cls, i), X(x), Y(y), X(x+w), Y(y+h), SLAB_TOP, H, m, "STRUCTURE")
        if cls == "BB":
            if w >= h:
                box("bb_rib_%d" % i, X(x), Y(y)-0.03, X(x+w), Y(y)+0.03, 1.1, 1.5, MAT["machine"], "DRESSING")
                box("bb_rib2_%d" % i, X(x), Y(y+h)-0.03, X(x+w), Y(y+h)+0.03, 1.1, 1.5, MAT["machine"], "DRESSING")
            else:
                box("bb_rib_%d" % i, X(x)-0.03, Y(y), X(x)+0.03, Y(y+h), 1.1, 1.5, MAT["machine"], "DRESSING")
                box("bb_rib2_%d" % i, X(x+w)-0.03, Y(y), X(x+w)+0.03, Y(y+h), 1.1, 1.5, MAT["machine"], "DRESSING")

def build_doors(MAT):
    for i, ((x, y, w, h), blast) in enumerate(DOORS):
        zhead = 2.4
        box("lintel_%d" % i, X(x), Y(y), X(x+w), Y(y+h), zhead, H,
            MAT["bulkhead"] if blast else MAT["wall"], "STRUCTURE")
        horiz = w >= h
        ft = 0.05
        if horiz:
            box("df_%d_a" % i, X(x)-ft, Y(y)-0.02, X(x)+ft, Y(y+h)+0.02, SLAB_TOP, zhead, MAT["machine"], "DRESSING")
            box("df_%d_b" % i, X(x+w)-ft, Y(y)-0.02, X(x+w)+ft, Y(y+h)+0.02, SLAB_TOP, zhead, MAT["machine"], "DRESSING")
            box("df_%d_t" % i, X(x), Y(y)-0.02, X(x+w), Y(y+h)+0.02, zhead-0.12, zhead, MAT["trim"]["interactive"], "DRESSING")
            if blast:
                box("gate_%d" % i, X(x)+0.15, Y(y)+0.1, X(x+w)-0.15, Y(y+h)-0.1, zhead+0.05, H-0.05, MAT["bulkhead"], "DRESSING")
                box("rail_%d_a" % i, X(x)-0.12, Y(y)-0.1, X(x)+0.02, Y(y+h)+0.1, SLAB_TOP, H, MAT["machine"], "DRESSING")
                box("rail_%d_b" % i, X(x+w)-0.02, Y(y)-0.1, X(x+w)+0.12, Y(y+h)+0.1, SLAB_TOP, H, MAT["machine"], "DRESSING")
        else:
            box("df_%d_a" % i, X(x)-0.02, Y(y)-ft, X(x+w)+0.02, Y(y)+ft, SLAB_TOP, zhead, MAT["machine"], "DRESSING")
            box("df_%d_b" % i, X(x)-0.02, Y(y+h)-ft, X(x+w)+0.02, Y(y+h)+ft, SLAB_TOP, zhead, MAT["machine"], "DRESSING")
            box("df_%d_t" % i, X(x)-0.02, Y(y), X(x+w)+0.02, Y(y+h), zhead-0.12, zhead, MAT["trim"]["interactive"], "DRESSING")

# ---------------------------------------------------------------- SECTION 5: envelope ring + apertures
def edge_apertures(p0, p1):
    """Aperture intervals (t0,t1,label) along outline edge p0->p1, t normalized ascending."""
    x0, y0 = p0; x1, y1 = p1
    out = []
    for anchor, center_px, width_m, label in APERTURES:
        half = (width_m / M) / 2.0
        if anchor == "top" and abs(y0-288) < 0.5 and abs(y1-288) < 0.5:
            lo, hi = min(x0, x1), max(x0, x1)
            if lo <= center_px - half and center_px + half <= hi:
                t0 = (center_px-half - x0)/(x1-x0); t1 = (center_px+half - x0)/(x1-x0)
                out.append((min(t0,t1), max(t0,t1), label))
        elif anchor == "bottom" and abs(y0-512) < 0.5 and abs(y1-512) < 0.5:
            lo, hi = min(x0, x1), max(x0, x1)
            if lo <= center_px - half and center_px + half <= hi:
                t0 = (center_px-half - x0)/(x1-x0); t1 = (center_px+half - x0)/(x1-x0)
                out.append((min(t0,t1), max(t0,t1), label))
        elif anchor == "pa-left" and abs(x0-372) < 0.5 and abs(x1-372) < 0.5:
            lo, hi = min(y0, y1), max(y0, y1)
            if lo <= center_px - half and center_px + half <= hi:
                t0 = (center_px-half - y0)/(y1-y0); t1 = (center_px+half - y0)/(y1-y0)
                out.append((min(t0,t1), max(t0,t1), label))
    return sorted(out)

def solid_runs(p0, p1):
    aps = edge_apertures(p0, p1)
    runs = []
    t = 0.0
    for t0, t1, label in aps:
        if t0 > t: runs.append((t, t0))
        t = t1
    if t < 1.0: runs.append((t, 1.0))
    return runs

def outward_normal(p0, p1):
    d = Vector((p1[0]-p0[0], p1[1]-p0[1]))
    nv = Vector((-d[1], d[0])).normalized()
    mid = Vector(((p0[0]+p1[0])/2, (p0[1]+p1[1])/2))
    if nv.dot(mid) < 0: nv = -nv
    return nv

def build_envelope(MAT):
    TH = 0.7
    pts = OUTLINE
    n = len(pts)
    for i in range(n):
        p0 = pts[i]; p1 = pts[(i+1) % n]
        if (p0, p1) in NOSE_EDGES:
            continue  # nose corner glazing handled below
        aps = edge_apertures(p0, p1)
        for t0, t1 in solid_runs(p0, p1):
            q0 = (p0[0] + (p1[0]-p0[0])*t0, p0[1] + (p1[1]-p0[1])*t0)
            q1 = (p0[0] + (p1[0]-p0[0])*t1, p0[1] + (p1[1]-p0[1])*t1)
            b0, b1 = (X(q0[0]), Y(q0[1])), (X(q1[0]), Y(q1[1]))
            prism("env_%d_%g" % (i, round(t0*100)), b0, b1, TH, -0.45, RING_TOP, MAT["hull"], "ENVELOPE")
        for t0, t1, label in aps:
            q0 = (p0[0] + (p1[0]-p0[0])*t0, p0[1] + (p1[1]-p0[1])*t0)
            q1 = (p0[0] + (p1[0]-p0[0])*t1, p0[1] + (p1[1]-p0[1])*t1)
            b0, b1 = (X(q0[0]), Y(q0[1])), (X(q1[0]), Y(q1[1]))
            prism("env_ap_sill_" + label, b0, b1, TH, -0.45, AP_Z0, MAT["hull"], "ENVELOPE")
            prism("env_ap_head_" + label, b0, b1, TH, AP_Z1, RING_TOP, MAT["hull"], "ENVELOPE")
            d = Vector((b1[0]-b0[0], b1[1]-b0[1]))
            u = d.normalized()
            for tt in (0.0, 1.0):
                c = Vector(b0) + d*tt
                box("apf_%s_%d" % (label, int(tt)), c[0]-0.09, c[1]-0.09, c[0]+0.09, c[1]+0.09,
                    AP_Z0, AP_Z1, MAT["machine"], "ENVELOPE")
            g0 = Vector(b0) + u*0.09; g1 = Vector(b1) - u*0.09
            prism("apg_" + label, (g0[0],g0[1]), (g1[0],g1[1]), 0.06, AP_Z0+0.05, AP_Z1-0.05,
                  MAT["glass"], "ENVELOPE")
            prism("apft_b_" + label, (g0[0],g0[1]), (g1[0],g1[1]), TH+0.06, AP_Z0-0.06, AP_Z0+0.05, MAT["machine"], "ENVELOPE")
            prism("apft_t_" + label, (g0[0],g0[1]), (g1[0],g1[1]), TH+0.06, AP_Z1-0.05, AP_Z1+0.06, MAT["machine"], "ENVELOPE")
    # bridge nose corner viewport (AP-BRIDGE-NOSE)
    for j, (p0, p1) in enumerate(NOSE_EDGES):
        b0, b1 = (X(p0[0]), Y(p0[1])), (X(p1[0]), Y(p1[1]))
        prism("nose_sill_%d" % j, b0, b1, TH, -0.45, 0.75, MAT["hull"], "ENVELOPE")
        prism("nose_head_%d" % j, b0, b1, TH, 2.45, RING_TOP, MAT["hull"], "ENVELOPE")
        prism("nose_glass_%d" % j, b0, b1, 0.06, 0.75, 2.45, MAT["glass"], "ENVELOPE")
        prism("nose_frm_%d" % j, b0, b1, TH+0.06, 0.69, 0.78, MAT["machine"], "ENVELOPE")
        prism("nose_frm_t%d" % j, b0, b1, TH+0.06, 2.42, 2.51, MAT["machine"], "ENVELOPE")
    box("nose_mullion", X(1112)-0.10, Y(400)-0.10, X(1112)+0.10, Y(400)+0.10, 0.75, 2.45, MAT["machine"], "ENVELOPE")

# ---------------------------------------------------------------- SECTION 6: exterior treatment
def build_exterior(MAT):
    pts = [(X(px), Y(py)) for px, py in OUTLINE]
    pts_px = OUTLINE
    n = len(pts)
    for i in range(n):
        p0, p1 = pts[i], pts[(i+1) % n]
        p0px, p1px = pts_px[i], pts_px[(i+1) % n]
        if (p0px, p1px) in NOSE_EDGES:
            continue
        d = Vector((p1[0]-p0[0], p1[1]-p0[1]))
        if d.length < 2.0: continue
        nv = outward_normal(p0, p1)
        u = d.normalized()
        # maintenance band (proud dark stripe z 1.05..1.30) on solid runs only
        for t0, t1 in solid_runs(p0px, p1px):
            q0 = Vector(p0) + d*t0 + nv*0.37
            q1 = Vector(p0) + d*t1 + nv*0.37
            if (q1-q0).length < 0.5: continue
            prism("maint_%d_%g" % (i, round(t0*100)), (q0[0],q0[1]), (q1[0],q1[1]), 0.14, 1.05, 1.30,
                  MAT["machine"], "EXTERIOR")
        # vertical plating seams, skipping aperture windows
        if d.length >= 8.0:
            aps = edge_apertures(p0px, p1px)
            count = int(d.length / 6.0)
            for k in range(1, count):
                t = k / count
                if any(t0-0.02 <= t <= t1+0.02 for t0, t1, _ in aps):
                    continue
                c = Vector(p0) + d*t + nv*0.37
                box("plate_%d_%d" % (i, k), c[0]-0.055, c[1]-0.055, c[0]+0.055, c[1]+0.055,
                    -0.30, RING_TOP-0.06, MAT["bulkhead"], "EXTERIOR")
    # aft engine housings (port/stbd engine rooms exhaust through aft face)
    for tag, yc in (("port", 314), ("stbd", 486)):
        y0, y1 = Y(yc-20), Y(yc+20)
        box("eng_house_" + tag, X(117)-4.6, y0, X(117), y1, -0.35, H-0.3, MAT["bulkhead"], "EXTERIOR", bevel=0.15)
        for k, yy in enumerate((yc-10, yc+10)):
            bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=1.1, depth=1.6,
                location=(X(117)-5.2, Y(yy), 1.35), rotation=(0, math.pi/2, 0))
            ob = bpy.context.active_object; ob.name = "nozzle_%s_%d" % (tag, k)
            ob.data.materials.append(MAT["machine"]); move_to(ob, "EXTERIOR")
            bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=0.79, depth=0.25,
                location=(X(117)-6.0, Y(yy), 1.35), rotation=(0, math.pi/2, 0))
            ob = bpy.context.active_object; ob.name = "nozzle_glow_%s_%d" % (tag, k)
            ob.data.materials.append(MAT["reactor"]); move_to(ob, "EXTERIOR")
    # restrained top greebles
    box("mast_base", X(880)-0.5, Y(400)-0.5, X(880)+0.5, Y(400)+0.5, RING_TOP, RING_TOP+0.4, MAT["machine"], "EXTERIOR")
    cyl("mast", X(880), Y(400), RING_TOP+0.4, RING_TOP+2.2, 0.09, MAT["machine"], "EXTERIOR")
    box("mast_bar", X(880)-1.4, Y(400)-0.08, X(880)+1.4, Y(400)+0.08, RING_TOP+2.0, RING_TOP+2.2, MAT["machine"], "EXTERIOR")
    for k, xp in enumerate((200, 260)):
        cyl("vent_stack_%d" % k, X(xp), Y(400), RING_TOP, RING_TOP+0.8, 0.55, MAT["bulkhead"], "EXTERIOR")
    # waist notch service pipes
    for (x0, x1, yy) in ((340, 372, 340), (788, 822, 340), (788, 822, 460), (340, 372, 460)):
        for zi, z in enumerate((0.6, 0.95)):
            pipe("waist_pipe_%g_%g_%d" % (x0, yy, zi), (X(x0), Y(yy), z), (X(x1), Y(yy), z), 0.09, MAT["machine"], "EXTERIOR")
    # deckhead plating: perimeter seam ring + hatches + sensor dome (restraint, VD §2 pillar 1)
    for i in range(n):
        p0, p1 = pts[i], pts[(i+1) % n]
        d = Vector((p1[0]-p0[0], p1[1]-p0[1]))
        if d.length < 4.0: continue
        nv = -outward_normal(p0, p1) * 0.75   # inset inward from the rim
        q0 = Vector(p0) + nv; q1 = Vector(p1) + nv
        prism("topseam_%d" % i, (q0[0],q0[1]), (q1[0],q1[1]), 0.07, RING_TOP+0.005, RING_TOP+0.03,
              MAT["bulkhead"], "EXTERIOR")
    for k, (hx, hy) in enumerate(((220, 340), (560, 400), (860, 400), (220, 460))):
        box("hatch_%d" % k, X(hx)-1.1, Y(hy)-1.1, X(hx)+1.1, Y(hy)+1.1, RING_TOP, RING_TOP+0.06, MAT["machine"], "EXTERIOR")
        box("hatch_in_%d" % k, X(hx)-0.85, Y(hy)-0.85, X(hx)+0.85, Y(hy)+0.85, RING_TOP+0.06, RING_TOP+0.10, MAT["bulkhead"], "EXTERIOR")
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, radius=0.9, location=(X(905), Y(385), RING_TOP+0.35))
    ob = bpy.context.active_object; ob.name = "sensor_dome"
    ob.scale = (1, 1, 0.55)
    ob.data.materials.append(MAT["bulkhead"]); move_to(ob, "EXTERIOR")

# ---------------------------------------------------------------- SECTION 7: interior dressing + signage + trim
def spine(MAT):
    for zi, (z, r) in enumerate(((2.55, 0.10), (2.32, 0.07), (2.72, 0.06))):
        pipe("spine_pipe_t_%d" % zi, (X(342), Y(386.2), z), (X(798), Y(386.2), z), r, MAT["machine"], "DRESSING")
        pipe("spine_pipe_b_%d" % zi, (X(342), Y(413.8), z), (X(798), Y(413.8), z), r, MAT["machine"], "DRESSING")
    for k, xp in enumerate(range(360, 790, 24)):
        box("spine_panel_%d" % k, X(xp), Y(385.2), X(xp+10), Y(385.9), 0.9, 2.1, MAT["wall"], "DRESSING")
    for k, xp in enumerate(range(372, 790, 24)):
        box("spine_vent_%d" % k, X(xp), Y(414.1), X(xp+6), Y(414.8), 1.9, 2.5, MAT["machine"], "DRESSING")
    for k, xp in enumerate(range(355, 800, 44)):
        box("spine_light_%d" % k, X(xp), Y(399.0), X(xp+16), Y(401.0), H-0.12, H-0.02, MAT["fixture"], "DRESSING")
    box("spine_stripe", X(345), Y(399.6), X(795), Y(400.4), FLOOR_TOP+0.005, FLOOR_TOP+0.02, MAT["trim"]["corridor"], "DRESSING")
    # engineering ceiling fixtures (identity-shot light story)
    for k, yp in enumerate((365, 400, 435)):
        box("eng_light_%d" % k, X(190), Y(yp-0.8), X(290), Y(yp+0.8), H-0.12, H-0.02, MAT["fixture"], "DRESSING")
    # corridor volumetric haze (VD §4.2 — AL0 baseline corridor haze)
    haze = box("spine_haze", X(340), Y(385), X(800), Y(415), 0.0, H, None, "DRESSING")
    hm = bpy.data.materials.get("p1_haze") or bpy.data.materials.new("p1_haze")
    hm.use_nodes = True
    hnt = hm.node_tree; hnt.nodes.clear()
    hout = hnt.nodes.new("ShaderNodeOutputMaterial")
    vol = hnt.nodes.new("ShaderNodeVolumePrincipled")
    vol.inputs["Density"].default_value = 0.012
    vol.inputs["Color"].default_value = (0.75, 0.80, 0.88, 1)
    hnt.links.new(vol.outputs["Volume"], hout.inputs["Volume"])
    haze.data.materials.append(hm)

# spine-door signage: navigation carrier faces the CORRIDOR (VD §3 — navigate by signage)
DOOR_SIGNS = [  # (room, door center px, side: 'top' room above spine / 'bottom' room below)
    ("port-airlock", 401, "top"), ("cargo-hold", 497, "top"), ("armory", 623, "top"), ("med-bay", 739, "top"),
    ("life-support", 421, "bottom"), ("barracks", 527, "bottom"), ("stbd-airlock", 613, "bottom"),
    ("hydroponics", 686, "bottom"), ("mess", 761, "bottom"),
]

def room_trim_and_signs(MAT):
    for rid, sec, acc, (x, y, w, h) in ROOMS:
        tm = MAT["trim"][acc]
        s = 0.07
        box("trim_%s_t" % rid, X(x)+0.15, Y(y)+0.10, X(x+w)-0.15, Y(y)+0.10+s, SLAB_TOP+0.02, SLAB_TOP+0.22, tm, "TRIM")
        box("trim_%s_b" % rid, X(x)+0.15, Y(y+h)-0.10-s, X(x+w)-0.15, Y(y+h)-0.10, SLAB_TOP+0.02, SLAB_TOP+0.22, tm, "TRIM")
        box("trim_%s_l" % rid, X(x)+0.10, Y(y)+0.15, X(x)+0.10+s, Y(y+h)-0.15, SLAB_TOP+0.02, SLAB_TOP+0.22, tm, "TRIM")
        box("trim_%s_r" % rid, X(x+w)-0.10-s, Y(y)+0.15, X(x+w)-0.10, Y(y+h)-0.15, SLAB_TOP+0.02, SLAB_TOP+0.22, tm, "TRIM")
    # corridor-facing door signs (on the spine side of the room walls, above each door)
    for rid, dx, side in DOOR_SIGNS:
        acc = next(a for r, s, a, f in ROOMS if r == rid)
        tm = MAT["trim"][acc]
        if side == "top":     # room above spine: sign at corridor face y=385, normal +Y (into spine)
            text_obj("sign_" + rid, ROOM_LABEL[rid], (X(dx), Y(385)+0.16, 2.18), 0.30, tm, "SIGNAGE",
                     rot=(math.pi/2, 0, math.pi))
        else:                 # room below spine: sign at corridor face y=415, normal -Y (into spine)
            text_obj("sign_" + rid, ROOM_LABEL[rid], (X(dx), Y(415)-0.16, 2.18), 0.30, tm, "SIGNAGE",
                     rot=(math.pi/2, 0, 0))
    # block-room signage (interior identity signs)
    for rid, sec, acc, (x, y, w, h) in ROOMS:
        tm = MAT["trim"][acc]
        label = ROOM_LABEL[rid]
        size = 0.34 if w > 60 else 0.22
        if rid in ("main-spine",) or any(r == rid for r, d, s in DOOR_SIGNS):
            continue
        cy = Y(y) + L(h)/2
        if rid == "engineering":
            # identity-shot sign on WEST wall (x=140 face), reads behind the reactor from the blast-door camera
            text_obj("sign_" + rid, label, (X(x)+0.75, cy, 2.05), size, tm, "SIGNAGE", rot=(math.pi/2, 0, math.pi/2), flip=True)
        elif y + h <= 385:
            text_obj("sign_" + rid, label, (X(x)+L(w)/2, Y(y+h)-0.75, 2.05), size, tm, "SIGNAGE", rot=(math.pi/2, 0, 0))
        elif y >= 415:
            text_obj("sign_" + rid, label, (X(x)+L(w)/2, Y(y)+0.75, 2.05), size, tm, "SIGNAGE", rot=(math.pi/2, 0, math.pi))
        else:
            text_obj("sign_" + rid, label, (X(x+w)-0.75, cy, 2.05), size, tm, "SIGNAGE", rot=(math.pi/2, 0, -math.pi/2))
    # bridge (polygon room): command trim along the two long hull faces + signage
    tm = MAT["trim"]["command"]
    s = 0.07
    for j, (p0, p1) in enumerate((((933,352),(1044,374)), ((1044,426),(933,448)))):
        b0, b1 = (X(p0[0]), Y(p0[1])), (X(p1[0]), Y(p1[1]))
        d = Vector((b1[0]-b0[0], b1[1]-b0[1]))
        nv = Vector((-d[1], d[0])).normalized()
        mid = Vector(((b0[0]+b1[0])/2, (b0[1]+b1[1])/2))
        ctr = Vector((X(1020), Y(400)))
        if nv.dot(ctr - mid) < 0: nv = -nv
        q0 = Vector(b0) + nv*0.14; q1 = Vector(b1) + nv*0.14
        prism("trim_bridge_%d" % j, (q0[0],q0[1]), (q1[0],q1[1]), s, SLAB_TOP+0.02, SLAB_TOP+0.22, tm, "TRIM")
    text_obj("sign_bridge", "BRIDGE", (X(975), Y(400), 2.05), 0.34, tm, "SIGNAGE", rot=(math.pi/2, 0, math.pi/2))

def console(name, cx, cy, w, d, mat_body, mat_screen):
    box(name, cx-w/2, cy-d/2, cx+w/2, cy+d/2, FLOOR_TOP, FLOOR_TOP+0.95, mat_body, "PROPS", bevel=0.04)
    box(name+"_scr", cx-w/2+0.06, cy-d/2+0.02, cx+w/2-0.06, cy+d/2-0.02, FLOOR_TOP+0.95, FLOOR_TOP+1.35, mat_screen, "PROPS")

def build_props(MAT):
    MACH = MAT["machine"]
    # engineering: reactor core + proud glow band + pipes + consoles + android rack
    ecx, ecy = X(240), Y(400)
    cyl("reactor_core", ecx, ecy, FLOOR_TOP, 2.7, 1.9, MAT["bulkhead"], "PROPS", verts=24)
    cyl("reactor_glow", ecx, ecy, 0.9, 1.9, 1.93, MAT["reactor"], "PROPS", verts=24)
    cyl("reactor_cap", ecx, ecy, 2.7, 2.95, 1.2, MACH, "PROPS", verts=24)
    for a in range(0, 360, 45):
        r = math.radians(a)
        pipe("reactor_pipe_%d" % a, (ecx + math.cos(r)*1.9, ecy + math.sin(r)*1.9, 2.5),
             (ecx + math.cos(r)*4.5, ecy + math.sin(r)*4.5, 2.75), 0.12, MACH, "DRESSING")
    console("eng_console", X(180), Y(375), 4.0, 0.8, MACH, MAT["screen"])
    console("eng_console2", X(180), Y(425), 4.0, 0.8, MACH, MAT["screen"])
    for tag, (rx, ry) in (("eng", (321, 379)), ("arm", (665, 359))):
        bx, by = X(rx), Y(ry)
        box("rack_%s" % tag, bx-1.5, by-0.4, bx+1.5, by+0.4, FLOOR_TOP, 2.5, MACH, "PROPS")
        for s in (-1, 0, 1):
            box("rack_slot_%s_%d" % (tag, s), bx+s*1.0-0.35, by-0.25, bx+s*1.0+0.35, by+0.25, 0.3, 2.3,
                MAT["bulkhead"], "PROPS")
            box("rack_light_%s_%d" % (tag, s), bx+s*1.0-0.15, by-0.28, bx+s*1.0+0.15, by-0.24, 2.2, 2.35,
                MAT["trim"]["corridor"], "PROPS")
    # engine rooms
    for tag, y0 in (("port", 288), ("stbd", 460)):
        for k, xp in enumerate((170, 230, 290)):
            box("engine_%s_%d" % (tag, k), X(xp), Y(y0+12), X(xp+38), Y(y0+40), FLOOR_TOP, 2.2, MACH, "PROPS", bevel=0.1)
            pipe("engine_pipe_%s_%d" % (tag, k), (X(xp+19), Y(y0+8), 2.0), (X(xp+19), Y(y0+2), 2.0), 0.22, MAT["bulkhead"], "DRESSING")
    # airlock rails (safe green)
    for tag, (x, y) in (("port", (372, 288)), ("stbd", (584, 418))):
        bx, by = X(x), Y(y)
        box("airlock_rail_%s_a" % tag, bx+0.3, by+1.2, bx+L(58)-0.3, by+1.35, 1.0, 1.12, MAT["trim"]["safe"], "PROPS")
        box("airlock_rail_%s_b" % tag, bx+0.3, by+L(94)-1.35, bx+L(58)-0.3, by+L(94)-1.2, 1.0, 1.12, MAT["trim"]["safe"], "PROPS")
    # cargo crates
    import random
    rng = random.Random(7)
    for k in range(9):
        cxp = 452 + (k % 3) * 34 + rng.uniform(-3, 3)
        cyp = 300 + (k // 3) * 26 + rng.uniform(-2, 2)
        w, d = rng.uniform(2.2, 3.6), rng.uniform(1.6, 2.6)
        hgt = rng.uniform(0.8, 1.6)
        box("crate_%d" % k, X(cxp)-w/2, Y(cyp)-d/2, X(cxp)+w/2, Y(cyp)+d/2, FLOOR_TOP, FLOOR_TOP+hgt, MAT["crate"], "PROPS", bevel=0.05)
        if rng.random() > 0.5:
            box("crate_top_%d" % k, X(cxp)-w/2+0.15, Y(cyp)-d/2+0.15, X(cxp)+w/2-0.15, Y(cyp)+d/2-0.15,
                FLOOR_TOP+hgt, FLOOR_TOP+hgt+0.6, MAT["crate"], "PROPS", bevel=0.04)
    # armory racks
    for k in range(4):
        box("armrack_%d" % k, X(572)+k*4.4, Y(296), X(572)+k*4.4+3.4, Y(296)+0.5, FLOOR_TOP, 2.0, MACH, "PROPS")
        for s in range(3):
            box("armrack_w_%d_%d" % (k, s), X(572)+k*4.4+0.3+s*1.1, Y(296)+0.15, X(572)+k*4.4+0.5+s*1.1, Y(296)+0.45,
                0.5, 1.7, MAT["bulkhead"], "PROPS")
    # med bay
    for k in range(3):
        bx = X(700) + k*8.2
        box("medbed_%d" % k, bx, Y(300), bx+4.6, Y(300)+1.9, FLOOR_TOP+0.35, FLOOR_TOP+0.85, MAT["bunk"], "PROPS", bevel=0.06)
        box("medbed_leg_%d" % k, bx+0.2, Y(300)+0.2, bx+4.4, Y(300)+1.7, FLOOR_TOP, FLOOR_TOP+0.35, MACH, "PROPS")
    box("med_monitor", X(694), Y(292.5), X(714), Y(293.5), 1.4, 2.2, MAT["screen"], "PROPS")
    # life support tanks
    for k, xp in enumerate((385, 415, 445)):
        cyl("ls_tank_%d" % k, X(xp), Y(430), FLOOR_TOP, 2.6, 1.4, MAT["bulkhead"], "PROPS", verts=20)
        pipe("ls_pipe_%d" % k, (X(xp), Y(430), 2.6), (X(xp), Y(419), 2.75), 0.14, MACH, "DRESSING")
    # barracks
    for k in range(6):
        bx = X(486) + (k % 3) * 9.5
        by = Y(430) if k < 3 else Y(486)
        box("bunk_%d" % k, bx, by, bx+6.5, by+2.4, FLOOR_TOP+0.4, FLOOR_TOP+0.8, MAT["bunk"], "PROPS")
        box("bunk_top_%d" % k, bx, by, bx+6.5, by+2.4, FLOOR_TOP+1.5, FLOOR_TOP+1.9, MAT["bunk"], "PROPS")
    for k in range(4):
        box("locker_%d" % k, X(566)+0.15, Y(428)+k*4.4, X(566)+1.05, Y(428)+k*4.4+3.6, FLOOR_TOP, 2.1, MACH, "PROPS")
    # hydroponics
    for k in range(3):
        bx = X(657) + k*7.6
        box("hydro_rack_%d" % k, bx, Y(430), bx+5.6, Y(430)+1.6, FLOOR_TOP, 2.2, MACH, "PROPS")
        box("hydro_gel_%d" % k, bx+0.1, Y(430)+0.1, bx+5.5, Y(430)+1.5, 1.75, 1.85, MAT["trim"]["hydro"], "PROPS")
    # mess
    for k in range(3):
        bx = X(736) + (k % 2) * 9.5
        by = Y(432) + k*13
        box("mess_table_%d" % k, bx, by, bx+6.0, by+2.2, FLOOR_TOP+0.65, FLOOR_TOP+0.8, MAT["bunk"], "PROPS")
        box("mess_bench_%d_a" % k, bx, by-1.1, bx+6.0, by-0.3, FLOOR_TOP+0.35, FLOOR_TOP+0.5, MACH, "PROPS")
        box("mess_bench_%d_b" % k, bx, by+3.0, bx+6.0, by+3.8, FLOOR_TOP+0.35, FLOOR_TOP+0.5, MACH, "PROPS")
    # officer qtrs
    box("oq_bunk", X(828), Y(298), X(834.5), Y(300.4), FLOOR_TOP+0.35, FLOOR_TOP+0.75, MAT["bunk"], "PROPS")
    console("oq_desk", X(900), Y(297.5), 3.5, 0.9, MACH, MAT["screen"])
    # CIC
    ccx, ccy = X(873.5), Y(400)
    cyl("cic_holo_base", ccx, ccy, FLOOR_TOP, 1.0, 1.5, MACH, "PROPS", verts=20)
    cyl("cic_holo_top", ccx, ccy, 1.0, 1.12, 1.35, MAT["trim"]["command"], "PROPS", verts=20)
    for a in range(0, 360, 60):
        r = math.radians(a)
        console("cic_console_%d" % a, ccx + math.cos(r)*4.6, ccy + math.sin(r)*4.6, 2.6, 0.8, MACH, MAT["screen"])
    # comms-nav
    console("cn_console_a", X(845), Y(480), 5.0, 0.8, MACH, MAT["screen"])
    console("cn_console_b", X(880), Y(480), 5.0, 0.8, MACH, MAT["screen"])
    # bridge
    bcx, bcy = X(1040), Y(400)
    for a in (-35, 0, 35):
        r = math.radians(a)
        console("bridge_console_%d" % (a+35), bcx + math.cos(r)*5.5, bcy + math.sin(r)*5.5, 3.0, 0.9, MACH, MAT["screen"])
    box("bridge_helm", X(1020)-0.8, Y(400)-0.8, X(1020)+0.8, Y(400)+0.8, FLOOR_TOP, 1.1, MACH, "PROPS", bevel=0.08)

# ---------------------------------------------------------------- SECTION 8: lighting + world
def build_lighting(MAT):
    def area(name, cx, cy, z, size, energy, color):
        li = bpy.data.lights.new(name, type='AREA')
        li.energy = energy; li.color = color; li.shape = 'DISK'; li.size = size
        ob = bpy.data.objects.new(name, li)
        ob.location = (cx, cy, z)
        COL["LIGHTS"].objects.link(ob)
        return ob
    warm = (1.0, 0.85, 0.68)
    for rid, sec, acc, (x, y, w, h) in ROOMS:
        cx, cy = X(x) + L(w)/2, Y(y) + L(h)/2
        size = min(L(max(w, h)) * 0.55, 8.0)
        energy = L(w) * L(h) * 14.0
        area("key_" + rid, cx, cy, H-0.25, size, energy, warm)
    area("key_bridge", X(1010), Y(400), H-0.25, 7.0, 900, warm)
    # engineering identity: cool key from fixtures + controlled reactor glow (one light story, VD §7 rule 4)
    area("key_eng_extra", X(240), Y(400), H-0.15, 9.0, 1400, (0.92, 0.95, 1.0))
    for k, xp in enumerate(range(376, 800, 72)):
        area("spine_prac_%d" % k, X(xp), Y(400), H-0.2, 3.5, 330, warm)
    li = bpy.data.lights.new("reactor_light", type='POINT'); li.energy = 150; li.color = (1.0, 0.55, 0.2)
    li.shadow_soft_size = 1.2
    ob = bpy.data.objects.new("reactor_light", li); ob.location = (X(240), Y(400), 2.2)
    COL["LIGHTS"].objects.link(ob)
    for tag, (x, y) in (("port", (401, 335)), ("stbd", (613, 465))):
        li = bpy.data.lights.new("airlock_gel_" + tag, type='POINT'); li.energy = 60; li.color = (0.41, 0.94, 0.68)
        li.shadow_soft_size = 0.6
        ob = bpy.data.objects.new("airlock_gel_" + tag, li); ob.location = (X(x), Y(y), 2.3)
        COL["LIGHTS"].objects.link(ob)
    su = bpy.data.lights.new("key_sun", type='SUN'); su.energy = 1.6; su.color = (0.75, 0.84, 1.0)
    su.angle = math.radians(8)
    ob = bpy.data.objects.new("key_sun", su)
    ob.rotation_euler = (math.radians(38), math.radians(-12), math.radians(-30))
    COL["LIGHTS"].objects.link(ob)
    # dim counter-fill so shadow-side hull faces stay readable (dim structure, never true black)
    fi = bpy.data.lights.new("fill_sun", type='SUN'); fi.energy = 0.45; fi.color = (0.55, 0.68, 0.85)
    ob = bpy.data.objects.new("fill_sun", fi)
    ob.rotation_euler = (math.radians(125), math.radians(20), math.radians(145))
    COL["LIGHTS"].objects.link(ob)

def build_world():
    w = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree; nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld")
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.inputs["Color"].default_value = (0.0196, 0.0314, 0.0588, 1)  # #05080f
    bg.inputs["Strength"].default_value = 1.0
    tex = nt.nodes.new("ShaderNodeTexVoronoi")
    tex.feature = 'DISTANCE_TO_EDGE'; tex.inputs["Scale"].default_value = 90.0
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (0.9, 0.95, 1.0, 1)
    ramp.color_ramp.elements[1].position = 0.045
    ramp.color_ramp.elements[1].color = (0, 0, 0, 1)
    starbg = nt.nodes.new("ShaderNodeBackground")
    starbg.inputs["Strength"].default_value = 0.5
    add = nt.nodes.new("ShaderNodeAddShader")
    nt.links.new(tex.outputs["Distance"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], starbg.inputs["Color"])
    nt.links.new(bg.outputs["Background"], add.inputs[0])
    nt.links.new(starbg.outputs["Background"], add.inputs[1])
    nt.links.new(add.outputs["Shader"], out.inputs["Surface"])

# ---------------------------------------------------------------- SECTION 9: cameras + render setup
def look_at(ob, target, track='-Z', up='Y'):
    d = Vector(target) - ob.location
    ob.rotation_euler = d.to_track_quat(track, up).to_euler()

def build_cameras():
    def cam(name, loc, lens=32):
        c = bpy.data.cameras.new(name); c.lens = lens
        ob = bpy.data.objects.new(name, c); ob.location = loc
        COL["CAMERAS"].objects.link(ob)
        return ob
    d = 165.0
    c1 = cam("CAM_R1_topdown", (0, -d*math.cos(math.radians(60)), d*math.sin(math.radians(60))), lens=26)
    look_at(c1, (0, 6, 0))
    c2 = cam("CAM_R2_spine", (X(352), Y(405.5), 1.75), lens=24)
    look_at(c2, (X(700), Y(397), 1.35))
    c3 = cam("CAM_R3_airlock_ext", (X(430), Y(243), 3.2), lens=38)
    look_at(c3, (X(401), Y(288), 1.4))
    c4 = cam("CAM_R4_engineering", (X(327), Y(424), 1.95), lens=22)
    look_at(c4, (X(215), Y(393), 1.45))
    c5 = cam("CAM_R5_exterior", (X(1250), Y(150), 90), lens=45)
    look_at(c5, (0, 0, 0))

def setup_render():
    sc = bpy.context.scene
    try:
        sc.render.engine = 'BLENDER_EEVEE_NEXT'
    except TypeError:
        sc.render.engine = 'BLENDER_EEVEE'
    sc.render.resolution_x = 1920; sc.render.resolution_y = 1080
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = 'PNG'
    sc.render.film_transparent = False
    try:
        sc.view_settings.look = 'AgX - Medium High Contrast'
    except Exception:
        pass
    # compositor fog-glow (Blender 5.x: scene compositor is a node group)
    ng = bpy.data.node_groups.get("NP_Composite")
    if ng is None:
        ng = bpy.data.node_groups.new("NP_Composite", 'CompositorNodeTree')
    ng.nodes.clear()
    # new-compositor group interface (Blender 5.x): Image output socket
    try:
        ng.interface.new_socket(name="Image", in_out='OUTPUT', socket_type='NodeSocketColor')
    except Exception:
        pass
    rl = ng.nodes.new("CompositorNodeRLayers")
    gl = ng.nodes.new("CompositorNodeGlare")
    try:
        gl.glare_type = 'FOG_GLOW'
    except AttributeError:
        pass
    try:
        gl.quality = 'HIGH'
    except AttributeError:
        pass
    if "Threshold" in gl.inputs: gl.inputs["Threshold"].default_value = 1.2
    if "Size" in gl.inputs:
        try: gl.inputs["Size"].default_value = 7
        except Exception: pass
    gout = ng.nodes.new("NodeGroupOutput")
    ng.links.new(rl.outputs["Image"], gl.inputs["Image"])
    ng.links.new(gl.outputs["Image"], gout.inputs["Image"])
    sc.compositing_node_group = ng

# ---------------------------------------------------------------- SECTION 10: build + save + renders
# ---------------------------------------------------------------- SECTION 10b: engine GLB export (R-BM8 / p1-deck-blender-mesh)

ROOM_IDS_EXPORT = [r[0] for r in ROOMS] + ["bridge"]

APERTURE_EXPORT_RENAMES = {
    "apg_AP-PORT-AIRLOCK": "aperture:port-airlock:wall-c-port-airlock-top",
    "apg_AP-PORT-AIRLOCK-2": "aperture:port-airlock:wall-c-port-airlock-left",
    "apg_AP-STBD-AIRLOCK": "aperture:stbd-airlock:wall-c-stbd-airlock-bottom",
    "apg_AP-CARGO": "aperture:cargo-hold:wall-c-cargo-top",
    "apg_AP-MED": "aperture:med-bay:wall-c-med-top",
}

EXPORT_SKIP_PREFIXES = ("CAM_", "key_", "spine_prac_", "reactor_light", "airlock_gel_", "key_sun", "fill_sun")
EXPORT_SKIP_COLLECTIONS = ("SIGNAGE", "LIGHTS", "CAMERAS")


def _mesh_in_export_collection(ob):
    for col in ob.users_collection:
        if col.name in EXPORT_SKIP_COLLECTIONS:
            return False
    return True


def prepare_export_hierarchy(MAT):
    """Naming + engine-origin transform for y-up GLB (R-BM6)."""
    hull_mat = MAT.get("hull") or MAT.get("machine")

    for rid in ROOM_IDS_EXPORT:
        cn = "ceil_" + rid if rid != "bridge" else "ceil_bridge"
        ob = bpy.data.objects.get(cn)
        if ob:
            ob.name = "ceiling:" + rid
        fn = "floor_" + rid if rid != "bridge" else "floor_bridge"
        fo = bpy.data.objects.get(fn)
        if fo:
            fo.name = "floor:" + rid

    dh = bpy.data.objects.get("deckhead")
    if dh:
        bpy.data.objects.remove(dh, do_unlink=True)

    haze = bpy.data.objects.get("spine_haze")
    if haze:
        bpy.data.objects.remove(haze, do_unlink=True)

    for old, new in APERTURE_EXPORT_RENAMES.items():
        ob = bpy.data.objects.get(old)
        if not ob:
            continue
        ob.name = new
        if ob.data and hasattr(ob.data, "materials") and hull_mat:
            ob.data.materials.clear()
            ob.data.materials.append(hull_mat)

    ng = bpy.data.objects.get("nose_glass_0")
    if ng:
        ng.name = "aperture:bridge:wall-c-bridge-nose"
        if ng.data and hasattr(ng.data, "materials") and hull_mat:
            ng.data.materials.clear()
            ng.data.materials.append(hull_mat)

    shift_x, shift_y = CX * M, CY * M
    to_xform = [
        ob for ob in bpy.data.objects
        if ob.type in ("MESH", "EMPTY")
        and _mesh_in_export_collection(ob)
        and not ob.name.startswith(EXPORT_SKIP_PREFIXES)
    ]
    bpy.ops.object.select_all(action="DESELECT")
    for ob in to_xform:
        ob.location.x += shift_x
        ob.location.y += shift_y
        if ob.type == "MESH":
            ob.select_set(True)
            bpy.context.view_layer.objects.active = ob
            bpy.ops.object.transform_apply(location=True, rotation=False, scale=False)
            ob.select_set(False)

    if bpy.data.objects.get("hullEnvelope") is None:
        hull_empty = bpy.data.objects.new("hullEnvelope", None)
        COL["STRUCTURE"].objects.link(hull_empty)
    else:
        hull_empty = bpy.data.objects["hullEnvelope"]

    for rid in ROOM_IDS_EXPORT:
        rname = "room:" + rid
        if bpy.data.objects.get(rname) is None:
            empty = bpy.data.objects.new(rname, None)
            COL["STRUCTURE"].objects.link(empty)
        else:
            empty = bpy.data.objects[rname]
        for child_name in ("ceiling:" + rid, "floor:" + rid):
            child = bpy.data.objects.get(child_name)
            if child and child.parent != empty:
                child.parent = empty


def _merge_meshes_by_material(objects):
    from collections import defaultdict
    groups = defaultdict(list)
    for ob in objects:
        if ob.type != "MESH":
            continue
        key = ob.data.materials[0].name if ob.data.materials else "__none__"
        groups[key].append(ob)
    for obs in groups.values():
        if len(obs) < 2:
            continue
        bpy.ops.object.select_all(action="DESELECT")
        for ob in obs:
            ob.select_set(True)
        bpy.context.view_layer.objects.active = obs[0]
        bpy.ops.object.join()


def merge_meshes_for_export():
    """G5 proxy — reduce draw-call-heavy dressing/exterior mesh count (R-BM5)."""
    skip_prefix = (
        "ceiling:", "floor:", "room:", "aperture:", "hull-", "wall_", "door_", "bay_",
        "interstitial", "hullEnvelope",
    )
    for cname in ("DRESSING", "EXTERIOR", "TRIM"):
        col = COL.get(cname)
        if not col:
            continue
        candidates = [
            ob for ob in col.objects
            if ob.type == "MESH" and not any(ob.name.startswith(p) for p in skip_prefix)
        ]
        _merge_meshes_by_material(candidates)


def export_glb(filepath=None):
    """
    Write shipped deck GLB for the engine (R-BM8).
    Run after main() build or from saved .blend with prepare already applied once.
    """
    filepath = filepath or "/home/benh/Source/nemesis-protocol/assets/models/p1_nemesis_deck03.glb"
    for cname in EXPORT_SKIP_COLLECTIONS:
        col = COL.get(cname)
        if not col:
            continue
        col.hide_render = True
        col.hide_viewport = True
        for ob in col.objects:
            ob.hide_render = True

    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        use_selection=False,
        export_yup=True,
        export_apply=True,
        export_lights=False,
        export_cameras=False,
    )
    print("EXPORT OK", filepath)


def main(render=False, export_after=False):
    reset()
    for name in ("STRUCTURE", "ENVELOPE", "CEILINGS", "DRESSING", "EXTERIOR", "PROPS", "TRIM", "SIGNAGE", "LIGHTS", "CAMERAS"):
        COL[name] = collection(name)
    MAT = make_materials()
    build_floors(MAT)
    build_ceilings(MAT)
    build_walls(MAT)
    build_doors(MAT)
    build_envelope(MAT)
    build_exterior(MAT)
    spine(MAT)
    room_trim_and_signs(MAT)
    build_props(MAT)
    build_lighting(MAT)
    build_world()
    build_cameras()
    setup_render()
    bpy.ops.wm.save_as_mainfile(filepath="/home/benh/Source/nemesis-protocol/assets/blender/p1_nemesis_deck03_viz.blend")
    print("BUILD OK — objects:", len(bpy.context.scene.objects))
    if render:
        outdir = "/home/benh/Source/nemesis-protocol/features/p1-ship-blender-viz/renders/"
        shots = [
            ("CAM_R1_topdown", "r1_topdown_hero.png", False),
            ("CAM_R2_spine", "r2_spine_oblique.png", True),
            ("CAM_R3_airlock_ext", "r3_airlock_exterior.png", True),
            ("CAM_R4_engineering", "r4_engineering_identity.png", True),
            ("CAM_R5_exterior", "r5_exterior_deck_slice.png", True),
        ]
        for camname, fname, ceilings in shots:
            COL["CEILINGS"].hide_render = not ceilings
            bpy.context.scene.camera = bpy.data.objects[camname]
            bpy.context.scene.render.filepath = outdir + fname
            bpy.ops.render.render(write_still=True)
            print("RENDERED", fname)
        COL["CEILINGS"].hide_render = False

    if export_after:
        prepare_export_hierarchy(MAT)
        merge_meshes_for_export()
        export_glb()

import sys

main(render=False, export_after="--export-glb" in sys.argv)
