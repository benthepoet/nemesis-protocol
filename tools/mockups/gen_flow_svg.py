#!/usr/bin/env python3
"""Generate a studio-quality sci-fi cruiser boarding-map SVG."""
import random

random.seed(42)

W, H = 1200, 860
S = []  # svg fragments

def add(s):
    S.append(s)

# ---------------------------------------------------------------- stars
stars = []
for _ in range(110):
    x, y = random.uniform(0, W), random.uniform(0, H)
    r = random.uniform(0.4, 1.4)
    o = random.uniform(0.15, 0.75)
    stars.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.1f}" fill="#cfd8e3" opacity="{o:.2f}"/>')
# a few brighter stars with cross sparkle
for _ in range(6):
    x, y = random.uniform(0, W), random.uniform(0, H)
    stars.append(f'<path d="M{x-4:.0f} {y:.0f} H{x+4:.0f} M{x:.0f} {y-4:.0f} V{y+4:.0f}" stroke="#e8f0ff" stroke-width="0.7" opacity="0.7"/>')

# ---------------------------------------------------------------- defs
defs = f"""
<defs>
  <linearGradient id="hullGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#2a3644"/>
    <stop offset="0.5" stop-color="#1a232e"/>
    <stop offset="1" stop-color="#232f3c"/>
  </linearGradient>
  <linearGradient id="deckGrad" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#10161d"/>
    <stop offset="0.5" stop-color="#151d26"/>
    <stop offset="1" stop-color="#10161d"/>
  </linearGradient>
  <linearGradient id="exhaustGrad" x1="1" y1="0" x2="0" y2="0">
    <stop offset="0" stop-color="#7fd4ff" stop-opacity="0.9"/>
    <stop offset="0.4" stop-color="#3f9fe0" stop-opacity="0.45"/>
    <stop offset="1" stop-color="#1a5a9a" stop-opacity="0"/>
  </linearGradient>
  <radialGradient id="reactorGrad" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#fff3e0"/>
    <stop offset="0.35" stop-color="#ffb74d"/>
    <stop offset="0.7" stop-color="#e65100"/>
    <stop offset="1" stop-color="#e65100" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="holoGrad" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#80d8ff" stop-opacity="0.9"/>
    <stop offset="1" stop-color="#80d8ff" stop-opacity="0"/>
  </radialGradient>
  <pattern id="deckGrid" width="14" height="14" patternUnits="userSpaceOnUse">
    <path d="M14 0 H0 V14" fill="none" stroke="#ffffff" stroke-width="0.5" opacity="0.05"/>
  </pattern>
  <pattern id="hazard" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <rect width="5" height="10" fill="#ffd54f"/>
    <rect x="5" width="5" height="10" fill="#21262d"/>
  </pattern>
  <pattern id="hatchRed" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="9" stroke="#ff5252" stroke-width="2" opacity="0.55"/>
  </pattern>
  <marker id="arrowG" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
    <path d="M0 0 L7 3 L0 6 Z" fill="#69f0ae"/>
  </marker>
  <marker id="arrowB" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
    <path d="M0 0 L7 3 L0 6 Z" fill="#82b1ff"/>
  </marker>
  <marker id="arrowO" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
    <path d="M0 0 L7 3 L0 6 Z" fill="#ffb74d"/>
  </marker>
  <marker id="arrowR" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
    <path d="M0 0 L7 3 L0 6 Z" fill="#ff5252"/>
  </marker>
  <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="4" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
    <feGaussianBlur stdDeviation="9"/>
  </filter>
</defs>
"""

# ---------------------------------------------------------------- header
add(f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg" font-family="Segoe UI, Arial, sans-serif">')
add(defs)
add(f'<rect width="{W}" height="{H}" fill="#05080f"/>')
add('<g id="stars">' + "".join(stars) + '</g>')

# subtle nebula blobs
add('<ellipse cx="180" cy="120" rx="220" ry="90" fill="#123" opacity="0.18" filter="url(#softGlow)"/>')
add('<ellipse cx="1050" cy="700" rx="240" ry="100" fill="#31205a" opacity="0.14" filter="url(#softGlow)"/>')

# ---------------------------------------------------------------- title block
add("""
<g id="title">
  <text x="40" y="48" fill="#e6edf3" font-size="24" font-weight="700" letter-spacing="2">ISV NEMESIS — DECK 03 // MISSION FLOW OVERLAY</text>
  <text x="40" y="70" fill="#7d8fa3" font-size="12" letter-spacing="1.5">ANNOTATED BEATS &#8226; GATES &amp; KEYS &#8226; ROUTES &#8226; SPAWN ZONES &#8226; EXTRACTION — DESIGN DOC v1.5 COMPANION</text>
  <text x="1160" y="48" fill="#ff8a65" font-size="13" text-anchor="end" font-weight="600" letter-spacing="2">&#9654; FORE</text>
  <text x="1160" y="66" fill="#7d8fa3" font-size="11" text-anchor="end" letter-spacing="1">AFT &#9664;</text>
</g>
""")

# ================================================================ EXTERNALS (behind hull)
ext = []
# radiator panels (port & starboard, amidships) — kept clear of breach markers
for x0 in range(470, 700, 62):
    ext.append(f'<rect x="{x0}" y="222" width="46" height="26" fill="#1c2836" stroke="#3d4f63" stroke-width="1.5"/>')
    ext.append(f'<line x1="{x0+23}" y1="222" x2="{x0+23}" y2="248" stroke="#3d4f63" stroke-width="1"/>')
for x0 in range(470, 570, 62):
    ext.append(f'<rect x="{x0}" y="552" width="46" height="26" fill="#1c2836" stroke="#3d4f63" stroke-width="1.5"/>')
    ext.append(f'<line x1="{x0+23}" y1="552" x2="{x0+23}" y2="578" stroke="#3d4f63" stroke-width="1"/>')
# point-defense turrets mounted on the hull edge
for (tx, ty, ang) in [(345, 262, -90), (705, 262, -90), (345, 538, 90), (705, 538, 90), (975, 293, -45), (975, 507, 45)]:
    ext.append(f'''<g transform="translate({tx} {ty}) rotate({ang})">
      <circle r="9" fill="#2a3644" stroke="#5c7186" stroke-width="1.5"/>
      <line x1="0" y1="-4" x2="0" y2="-17" stroke="#5c7186" stroke-width="3"/>
      <line x1="-4" y1="-3" x2="-5" y2="-14" stroke="#5c7186" stroke-width="2"/>
      <line x1="4" y1="-3" x2="5" y2="-14" stroke="#5c7186" stroke-width="2"/>
    </g>''')
# sensor mast near bow
ext.append('<line x1="905" y1="262" x2="895" y2="222" stroke="#5c7186" stroke-width="2.5"/>')
ext.append('<circle cx="895" cy="220" r="4" fill="#ff5252" filter="url(#glow)"/>')
ext.append('<circle cx="895" cy="220" r="10" fill="none" stroke="#ff5252" stroke-width="1" opacity="0.5"/>')
add('<g id="externals">' + "".join(ext) + '</g>')

# ================================================================ ENGINE EXHAUST (behind hull rear)
exh = []
for (y0, y1) in [(292, 332), (378, 424), (468, 508)]:
    cy = (y0 + y1) / 2
    exh.append(f'<polygon points="70,{y0} 70,{y1} -30,{cy}" fill="url(#exhaustGrad)"/>')
add('<g id="exhaust" filter="url(#softGlow)">' + "".join(exh) + '</g>')

# ================================================================ HULL
hull_path = ("M 95 292 L 205 262 L 805 262 "
             "Q 975 282 1128 392 L 1136 400 L 1128 408 "
             "Q 975 518 805 538 L 205 538 L 95 508 Z")
add(f'<path d="{hull_path}" fill="url(#hullGrad)" stroke="#8fa3b8" stroke-width="5" stroke-linejoin="round"/>')
# armor trim inset
hull_inset = ("M 103 298 L 208 270 L 802 270 "
              "Q 968 290 1118 396 L 1124 400 L 1118 404 "
              "Q 968 510 802 530 L 208 530 L 103 502 Z")
add(f'<path d="{hull_inset}" fill="none" stroke="#5c7186" stroke-width="1.5" stroke-dasharray="10 6" opacity="0.7"/>')
# deck floor
add(f'<path d="{hull_inset}" fill="url(#deckGrad)" opacity="0.85"/>')
add(f'<path d="{hull_inset}" fill="url(#deckGrid)"/>')

# engine nozzles mounted on rear face
noz = []
for (y0, y1) in [(292, 332), (378, 424), (468, 508)]:
    noz.append(f'<polygon points="98,{y0+6} 66,{y0} 66,{y1} 98,{y1-6}" fill="#222e3b" stroke="#8fa3b8" stroke-width="3"/>')
    noz.append(f'<polygon points="70,{y0+8} 70,{y1-8} 60,{(y0+y1)/2-8} 60,{(y0+y1)/2+8}" fill="#7fd4ff" opacity="0.85" filter="url(#glow)"/>')
add('<g id="nozzles">' + "".join(noz) + '</g>')

# ================================================================ ROOM HELPERS
def room(x, y, w, h, fill, stroke, label, sub=None, sw=2, lx=None, ly=None, fs=13, r=3):
    g = [f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" rx="{r}"/>']
    cx = lx if lx is not None else x + w / 2
    cy = ly if ly is not None else y + h / 2
    if sub:
        g.append(f'<text x="{cx}" y="{cy-2}" fill="#e6edf3" font-size="{fs}" text-anchor="middle" font-weight="600">{label}</text>')
        g.append(f'<text x="{cx}" y="{cy+14}" fill="{stroke}" font-size="10.5" text-anchor="middle">{sub}</text>')
    else:
        g.append(f'<text x="{cx}" y="{cy+4}" fill="#e6edf3" font-size="{fs}" text-anchor="middle" font-weight="600">{label}</text>')
    return '<g class="room">' + "".join(g) + '</g>'

def door(x, y, w, h, label=False):
    d = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#ffd54f" stroke="#8d6e00" stroke-width="1"/>'
    return d

# ================================================================ AFT SECTION (x 120-360)
aft = []
# Port engine room
aft.append(room(140, 288, 200, 52, "#311b1b", "#ef5350", "PORT ENGINE", None, 2, ly=300))
# engine cylinders
for i in range(4):
    aft.append(f'<rect x="{152+i*46}" y="318" width="34" height="15" rx="7" fill="#452323" stroke="#ef5350" stroke-width="1.2"/>')
# Starboard engine room
aft.append(room(140, 460, 200, 52, "#311b1b", "#ef5350", "STBD ENGINE", None, 2, ly=500))
for i in range(4):
    aft.append(f'<rect x="{152+i*46}" y="466" width="34" height="15" rx="7" fill="#452323" stroke="#ef5350" stroke-width="1.2"/>')
# Engineering / reactor
aft.append(room(140, 348, 200, 104, "#311b1b", "#ef5350", "", None, 2.5))
# fuel lines from reactor to engines
aft.append('<path d="M240 362 V340 M240 438 V460" stroke="#ffb74d" stroke-width="3" opacity="0.7"/>')
# reactor core
aft.append('<circle cx="240" cy="400" r="52" fill="url(#reactorGrad)" opacity="0.5" filter="url(#softGlow)"/>')
aft.append('<circle cx="240" cy="400" r="40" fill="#241212" stroke="#ef5350" stroke-width="2.5"/>')
aft.append('<circle cx="240" cy="400" r="30" fill="none" stroke="#ff8a65" stroke-width="1.5" stroke-dasharray="6 4"/>')
aft.append('<circle cx="240" cy="400" r="17" fill="url(#reactorGrad)" filter="url(#glow)"/>')
for a in range(0, 360, 45):
    import math
    x1 = 240 + 40 * math.cos(math.radians(a)); y1 = 400 + 40 * math.sin(math.radians(a))
    x2 = 240 + 30 * math.cos(math.radians(a)); y2 = 400 + 30 * math.sin(math.radians(a))
    aft.append(f'<line x1="{x1:.0f}" y1="{y1:.0f}" x2="{x2:.0f}" y2="{y2:.0f}" stroke="#ef5350" stroke-width="1.5"/>')
aft.append('<text x="150" y="364" fill="#ffcdd2" font-size="12" font-weight="700">ENGINEERING</text>')
add('<g id="aft-section">' + "".join(aft) + '</g>')

# ================================================================ MIDSHIPS (x 360-800)
mid = []
# ---- main spine (label removed — extraction route runs on the centerline)
mid.append('<rect x="340" y="385" width="460" height="30" fill="#141a22" stroke="#8b949e" stroke-width="2" rx="3"/>')
# ---- PORT rooms (top)  y 288-382
# Port boarding airlock
mid.append(room(372, 288, 58, 94, "#0f2d23", "#69f0ae", "", None, 2.5))
mid.append('<circle cx="401" cy="330" r="16" fill="none" stroke="#69f0ae" stroke-width="2.5"/>')
mid.append('<circle cx="401" cy="330" r="9" fill="none" stroke="#69f0ae" stroke-width="1.5"/>')
mid.append('<text x="401" y="304" fill="#b9f6ca" font-size="9.5" text-anchor="middle" font-weight="700">PORT</text>')
mid.append('<text x="401" y="314" fill="#69f0ae" font-size="9.5" text-anchor="middle">AIRLOCK</text>')
# Cargo hold
mid.append(room(438, 288, 118, 94, "#2e2a1f", "#ffb74d", "CARGO HOLD", None, 2, ly=306))
for r_ in range(2):
    for c in range(3):
        mid.append(f'<rect x="{452+c*34}" y="{322+r_*24}" width="26" height="18" fill="#3a3527" stroke="#ffb74d" stroke-width="1" rx="1"/>')
# Armory
mid.append(room(564, 288, 118, 94, "#3e2723", "#ff8a65", "ARMORY", None, 2, ly=306))
for r_ in range(2):
    mid.append(f'<line x1="578" y1="{326+r_*26}" x2="668" y2="{326+r_*26}" stroke="#ff8a65" stroke-width="2.5"/>')
    for c in range(5):
        mid.append(f'<rect x="{580+c*19}" y="{320+r_*26}" width="5" height="12" fill="#ff8a65" opacity="0.55"/>')
# Med bay
mid.append(room(690, 288, 98, 94, "#1f3038", "#80cbc4", "MED BAY", None, 2, ly=306))
mid.append('<rect x="732" y="318" width="14" height="40" rx="3" fill="#ffffff" opacity="0.85"/>')
mid.append('<rect x="719" y="331" width="40" height="14" rx="3" fill="#ffffff" opacity="0.85"/>')
mid.append('<rect x="702" y="320" width="24" height="12" rx="2" fill="#2b3a42" stroke="#80cbc4" stroke-width="1"/>')
mid.append('<rect x="702" y="342" width="24" height="12" rx="2" fill="#2b3a42" stroke="#80cbc4" stroke-width="1"/>')
# ---- STARBOARD rooms (bottom) y 418-512
mid.append(room(372, 418, 98, 94, "#1a2f3a", "#4dd0e1", "LIFE SUPPORT", None, 2, ly=436))
for c in range(3):
    mid.append(f'<circle cx="{392+c*28}" cy="470" r="9" fill="none" stroke="#4dd0e1" stroke-width="1.5"/>')
    mid.append(f'<circle cx="{392+c*28}" cy="470" r="3.5" fill="#4dd0e1" opacity="0.6"/>')
mid.append(room(478, 418, 98, 94, "#2a1f3d", "#ce93d8", "BARRACKS", None, 2, ly=436))
for r_ in range(2):
    for c in range(3):
        mid.append(f'<rect x="{486+c*30}" y="{452+r_*30}" width="24" height="11" rx="2" fill="#382b4d" stroke="#ce93d8" stroke-width="1"/>')
# starboard airlock
mid.append(room(584, 418, 58, 94, "#0f2d23", "#69f0ae", "", None, 2.5))
mid.append('<circle cx="613" cy="462" r="16" fill="none" stroke="#69f0ae" stroke-width="2.5"/>')
mid.append('<circle cx="613" cy="462" r="9" fill="none" stroke="#69f0ae" stroke-width="1.5"/>')
mid.append('<text x="613" y="436" fill="#b9f6ca" font-size="9.5" text-anchor="middle" font-weight="700">STBD</text>')
mid.append('<text x="613" y="446" fill="#69f0ae" font-size="9.5" text-anchor="middle">AIRLOCK</text>')
# hydroponics
mid.append(room(650, 418, 72, 94, "#1f2e1f", "#81c784", "HYDROPONICS", None, 2, ly=436, fs=11))
for r_ in range(3):
    for c in range(4):
        mid.append(f'<circle cx="{660+c*15}" cy="{452+r_*18}" r="4" fill="#81c784" opacity="0.55"/>')
# mess hall
mid.append(room(730, 418, 62, 94, "#33261d", "#a1887f", "MESS", None, 2, ly=436))
for r_ in range(2):
    for c in range(2):
        mid.append(f'<circle cx="{744+c*30}" cy="{456+r_*30}" r="8" fill="#3e2f24" stroke="#a1887f" stroke-width="1"/>')
add('<g id="midships">' + "".join(mid) + '</g>')

# ================================================================ FORWARD (x 800-1130)
fwd = []
# connector corridor spine -> CIC
fwd.append('<rect x="800" y="388" width="22" height="24" fill="#141a22" stroke="#8b949e" stroke-width="1.5"/>')
# Officer quarters (port fwd)
fwd.append(room(822, 292, 103, 35, "#2a1f3d", "#ce93d8", "OFFICER QTRS", None, 2, fs=10.5))
# Comms / sensors (stbd fwd)
fwd.append(room(822, 473, 103, 35, "#14213d", "#5c7cfa", "COMMS / NAV", None, 2, fs=10.5))
# CIC
fwd.append(room(822, 335, 103, 130, "#14213d", "#5c7cfa", "", None, 2.5))
fwd.append('<ellipse cx="873" cy="400" rx="30" ry="20" fill="url(#holoGrad)" opacity="0.35" filter="url(#softGlow)"/>')
fwd.append('<ellipse cx="873" cy="400" rx="18" ry="11" fill="#0d1526" stroke="#5c7cfa" stroke-width="1.5"/>')
fwd.append('<ellipse cx="873" cy="400" rx="9" ry="5.5" fill="none" stroke="#80d8ff" stroke-width="1" opacity="0.8"/>')
fwd.append('<text x="873" y="356" fill="#c5cae9" font-size="12.5" text-anchor="middle" font-weight="700">CIC</text>')
fwd.append('<text x="873" y="370" fill="#5c7cfa" font-size="9" text-anchor="middle">COMBAT INFO CTR</text>')
for (dx, dy) in [(-38, -18), (38, -18), (-38, 18), (38, 18)]:
    fwd.append(f'<rect x="{873+dx-7}" y="{400+dy-4}" width="14" height="8" rx="1.5" fill="#1c2b4d" stroke="#5c7cfa" stroke-width="1"/>')
# Bridge (wedge at nose)
bridge_poly = "933,352 1044,374 1104,395 1112,400 1104,405 1044,426 933,448"
fwd.append(f'<polygon points="{bridge_poly}" fill="#1a237e" stroke="#7986cb" stroke-width="2.5" stroke-linejoin="round"/>')
fwd.append('<polygon points="933,352 1044,374 1104,395 1112,400 1104,405 1044,426 933,448" fill="url(#deckGrid)"/>')
# bridge consoles along the forward viewport
fwd.append('<path d="M1044 374 Q1078 387 1104 395" fill="none" stroke="#9fa8da" stroke-width="2.5"/>')
fwd.append('<path d="M1044 426 Q1078 413 1104 405" fill="none" stroke="#9fa8da" stroke-width="2.5"/>')
for t in (0.25, 0.5, 0.75):
    pass
fwd.append('<rect x="1028" y="394" width="12" height="12" rx="2" fill="#283593" stroke="#9fa8da" stroke-width="1.2"/>')  # captain chair
for (cx_, cy_) in [(966, 368), (990, 374), (1014, 380), (966, 432), (990, 426), (1014, 420)]:
    fwd.append(f'<rect x="{cx_}" y="{cy_}" width="16" height="7" rx="1.5" fill="#283593" stroke="#7986cb" stroke-width="1"/>')
fwd.append('<text x="975" y="404" fill="#c5cae9" font-size="13" text-anchor="middle" font-weight="700">BRIDGE</text>')
fwd.append('<text x="975" y="416" fill="#7986cb" font-size="9" text-anchor="middle">COMMAND DECK</text>')
# viewport hint at nose tip
fwd.append('<line x1="1104" y1="395" x2="1128" y2="398" stroke="#80d8ff" stroke-width="2" opacity="0.6"/>')
fwd.append('<line x1="1104" y1="405" x2="1128" y2="402" stroke="#80d8ff" stroke-width="2" opacity="0.6"/>')
add('<g id="forward-section">' + "".join(fwd) + '</g>')

# ================================================================ DOORS & BLAST DOORS
doors = []
# spine room doors (top row into spine)
for cx_ in (401, 497, 623, 739):
    doors.append(door(cx_-7, 381, 14, 8))
# bottom row
for cx_ in (421, 527, 613, 686, 761):
    doors.append(door(cx_-7, 411, 14, 8))
# engineering <-> engine rooms
doors.append(door(233, 340, 14, 8))
doors.append(door(233, 452, 14, 8))
# CIC <-> officer/comms
doors.append(door(866, 327, 14, 8))
doors.append(door(866, 465, 14, 8))
# CIC <-> bridge
doors.append(door(925, 392, 8, 16))
# aft bulkhead blast door (spine)
doors.append('<rect x="336" y="383" width="10" height="34" fill="#ffd54f" stroke="#8d6e00" stroke-width="1.5"/>')
doors.append('<line x1="341" y1="383" x2="341" y2="417" stroke="#8d6e00" stroke-width="1.5"/>')
# forward bulkhead blast door
doors.append('<rect x="796" y="383" width="10" height="34" fill="#ffd54f" stroke="#8d6e00" stroke-width="1.5"/>')
doors.append('<line x1="801" y1="383" x2="801" y2="417" stroke="#8d6e00" stroke-width="1.5"/>')
# blast-door GATE chips (sealed until keys)
def gate_chip(cx_, cy_):
    return (f'<rect x="{cx_-15}" y="{cy_-9}" width="30" height="18" rx="3" fill="#1a1405" stroke="#ffd54f" stroke-width="1.5"/>'
            f'<text x="{cx_}" y="{cy_+4}" fill="#ffd54f" font-size="9" text-anchor="middle" font-weight="700">GATE</text>')
doors.append(gate_chip(356, 428))
doors.append(gate_chip(807, 428))
# connector -> CIC door
doors.append(door(818, 392, 8, 16))
add('<g id="doors" filter="url(#glow)">' + "".join(doors) + '</g>')

# section bulkhead lines on hull
add('<line x1="120" y1="296" x2="120" y2="504" stroke="#5c7186" stroke-width="2" opacity="0.6"/>')
add('<line x1="352" y1="270" x2="352" y2="530" stroke="#5c7186" stroke-width="2" opacity="0.6"/>')
add('<line x1="816" y1="270" x2="816" y2="530" stroke="#5c7186" stroke-width="2" opacity="0.6"/>')

# section labels along top of hull (fore label omitted — bow area carries extraction annotations)
add("""
<g id="section-labels" fill="#7d8fa3" font-size="10" letter-spacing="2" text-anchor="middle">
  <text x="240" y="256">— AFT / PROPULSION —</text>
  <text x="585" y="256">— MIDSHIPS / CREW + OPS —</text>
</g>
""")

# ================================================================ SPAWN ZONES (hold-out)
sp = []
for (sx, sy) in [(140, 288), (140, 460)]:
    sp.append(f'<rect x="{sx}" y="{sy}" width="200" height="52" fill="url(#hatchRed)" opacity="0.35"/>')
    sp.append(f'<rect x="{sx}" y="{sy}" width="200" height="52" fill="none" stroke="#ff5252" stroke-width="1.2" stroke-dasharray="5 4"/>')
sp.append('<text x="330" y="300" fill="#ff8a80" font-size="8.5" text-anchor="end" font-weight="700">SPAWN</text>')
sp.append('<text x="330" y="508" fill="#ff8a80" font-size="8.5" text-anchor="end" font-weight="700">SPAWN</text>')
add('<g id="spawns">' + "".join(sp) + '</g>')

# ================================================================ BREACH MARKERS + BEAT 1
br = []
# port breach
br.append('<rect x="376" y="248" width="50" height="12" fill="url(#hazard)" stroke="#ffd54f" stroke-width="1.5"/>')
br.append('<text x="401" y="240" fill="#ffd54f" font-size="10" text-anchor="middle" font-weight="700">BREACH POINT</text>')
br.append('<path d="M401 236 V204" stroke="#69f0ae" stroke-width="2" stroke-dasharray="5 4"/>')
br.append('<polygon points="401,192 392,206 410,206" fill="#69f0ae" filter="url(#glow)"/>')
br.append('<text x="401" y="184" fill="#69f0ae" font-size="11" text-anchor="middle" font-weight="700">BOARDING PARTY ENTRY</text>')
# sealed marker (extraction phase) — red X over the breach strip
br.append('<g stroke="#ff5252" stroke-width="3" stroke-linecap="round">'
          '<line x1="384" y1="250" x2="418" y2="258"/><line x1="418" y1="250" x2="384" y2="258"/></g>')
br.append('<text x="401" y="279" fill="#ff8a80" font-size="8.5" text-anchor="middle" font-weight="700">SEALED IN PHASE 4</text>')
# stbd breach (alt entry)
br.append('<rect x="588" y="540" width="50" height="12" fill="url(#hazard)" stroke="#ffd54f" stroke-width="1.5"/>')
br.append('<text x="613" y="566" fill="#ffd54f" font-size="10" text-anchor="middle" font-weight="700">BREACH POINT</text>')
br.append('<path d="M613 566 V596" stroke="#69f0ae" stroke-width="2" stroke-dasharray="5 4"/>')
br.append('<polygon points="613,608 604,594 622,594" fill="#69f0ae" filter="url(#glow)"/>')
br.append('<text x="613" y="624" fill="#69f0ae" font-size="11" text-anchor="middle" font-weight="700">ALT ENTRY</text>')
add('<g id="breaches">' + "".join(br) + '</g>')

# ================================================================ KEY PAIR OUTLINES (beat 2 — simultaneous)
add("""
<g id="key-outlines">
  <rect x="822" y="335" width="103" height="130" fill="none" stroke="#b388ff" stroke-width="2.5" stroke-dasharray="9 6" rx="4"/>
  <rect x="372" y="418" width="98" height="94" fill="none" stroke="#b388ff" stroke-width="2.5" stroke-dasharray="9 6" rx="4"/>
</g>
""")

# ================================================================ ROUTE LANES
add("""
<g id="routes" fill="none">
  <!-- beat 1->2A : breach to CIC (fore lane) -->
  <path d="M401 389 V393 H806" stroke="#69f0ae" stroke-width="2.5" marker-end="url(#arrowG)" opacity="0.9"/>
  <!-- beat 2A->2B : CIC back to Life Support (aft lane) -->
  <path d="M806 407 H428" stroke="#82b1ff" stroke-width="2.5" opacity="0.9"/>
  <path d="M428 407 H424 V413" stroke="#82b1ff" stroke-width="2.5" marker-end="url(#arrowB)" opacity="0.9"/>
  <!-- beat 2B->3 : Life Support to reactor -->
  <path d="M424 407 H308" stroke="#ffb74d" stroke-width="2.5" marker-end="url(#arrowO)" opacity="0.9" transform="translate(0 0)"/>
  <!-- beat 4 : extraction, reactor to forward collar (center lane) -->
  <path d="M306 400 H830 C885 400 930 368 963 318 L992 296" stroke="#ff5252" stroke-width="2.5" stroke-dasharray="10 7" marker-end="url(#arrowR)" opacity="0.85"/>
</g>
""")

# ================================================================ DOCKING COLLAR (alt extraction)
add("""
<g id="collar">
  <circle cx="1000" cy="290" r="9" fill="#0f2d23" stroke="#69f0ae" stroke-width="2.5"/>
  <circle cx="1000" cy="290" r="4" fill="none" stroke="#69f0ae" stroke-width="1.5"/>
  <line x1="1000" y1="300" x2="1000" y2="312" stroke="#69f0ae" stroke-width="1.2" opacity="0.8"/>
  <text x="1000" y="326" fill="#69f0ae" font-size="9.5" text-anchor="middle" font-weight="700">DOCKING COLLAR</text>
</g>
""")

# ================================================================ REACTOR TARGET RING
obj = []
obj.append('<circle cx="240" cy="400" r="60" fill="none" stroke="#ff5252" stroke-width="2.5" stroke-dasharray="10 7"/>')
obj.append('<circle cx="240" cy="400" r="66" fill="none" stroke="#ff5252" stroke-width="1" opacity="0.4"/>')
obj.append('<path d="M240 462 V546" stroke="#ff5252" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.8"/>')
add('<g id="objectives">' + "".join(obj) + '</g>')

# ================================================================ BEAT BADGES
def badge(x, y, n, color, sub=None, fs=13):
    g = [f'<circle cx="{x}" cy="{y}" r="14" fill="#0b1017" stroke="{color}" stroke-width="2.5" filter="url(#glow)"/>',
         f'<text x="{x}" y="{y+5}" fill="{color}" font-size="{fs}" text-anchor="middle" font-weight="800">{n}</text>']
    if sub:
        g.append(f'<text x="{x}" y="{y+30}" fill="{color}" font-size="9" text-anchor="middle" font-weight="700">{sub}</text>')
    return "".join(g)

bd = []
bd.append(badge(345, 204, "1", "#69f0ae"))                    # BOARD
bd.append('<line x1="360" y1="198" x2="388" y2="190" stroke="#69f0ae" stroke-width="1.2" opacity="0.7"/>')
bd.append(badge(862, 226, "2A", "#b388ff", "KEY — SLICE CIC", 11))
bd.append('<line x1="856" y1="239" x2="846" y2="330" stroke="#b388ff" stroke-width="1.2" stroke-dasharray="4 3" opacity="0.8"/>')
bd.append(badge(421, 572, "2B", "#b388ff", "KEY — VENT COOLANT", 11))
bd.append('<line x1="421" y1="558" x2="421" y2="516" stroke="#b388ff" stroke-width="1.2" stroke-dasharray="4 3" opacity="0.8"/>')
bd.append(badge(240, 566, "3", "#ffb74d", "ARM + HOLD 90s"))
bd.append(badge(990, 236, "4", "#ff5252", "EXTRACT 150s"))
bd.append('<line x1="992" y1="251" x2="997" y2="278" stroke="#ff5252" stroke-width="1.2" stroke-dasharray="4 3" opacity="0.8"/>')
add('<g id="beats">' + "".join(bd) + '</g>')

# ================================================================ SECTION BULKHEAD LABELS

# ================================================================ LEGEND — MISSION BEATS
leg = []
leg.append('<rect x="40" y="648" width="1120" height="192" fill="#0b1017" stroke="#30363d" stroke-width="1.5" rx="8"/>')
leg.append('<text x="60" y="676" fill="#e6edf3" font-size="15" font-weight="700" letter-spacing="1">MISSION BEATS</text>')

beats_txt = [
    ("#69f0ae", "1", "BOARD — breach hull (stealth window until first contact)"),
    ("#b388ff", "2A", "SLICE — CIC security override (20 s hack, defend the slicer)"),
    ("#b388ff", "2B", "VENT — coolant at Life Support (within 30 s of 2A)"),
    ("#ffb74d", "3", "ARM &amp; HOLD — reactor demo charge (90 s hold-out)"),
    ("#ff5252", "4", "EXTRACT — forward docking collar (150 s, ship in meltdown)"),
]
for i, (c, n, t) in enumerate(beats_txt):
    yy = 696 + i * 22
    leg.append(f'<circle cx="70" cy="{yy-4}" r="9" fill="#0b1017" stroke="{c}" stroke-width="2"/>')
    leg.append(f'<text x="70" y="{yy}" fill="{c}" font-size="9.5" text-anchor="middle" font-weight="800">{n}</text>')
    leg.append(f'<text x="88" y="{yy}" fill="#c9d1d9" font-size="11.5">{t}</text>')

# routes column
leg.append('<text x="500" y="676" fill="#e6edf3" font-size="13" font-weight="700">ROUTES &amp; MARKERS</text>')
routes_leg = [
    ("#69f0ae", "solid", "Ingress — breach to CIC"),
    ("#82b1ff", "solid", "Key run — CIC to Life Support"),
    ("#ffb74d", "solid", "Objective run — to reactor"),
    ("#ff5252", "dash", "Extraction — to docking collar"),
]
for i, (c, style, t) in enumerate(routes_leg):
    yy = 700 + i * 22
    dash = ' stroke-dasharray="8 5"' if style == "dash" else ''
    leg.append(f'<line x1="500" y1="{yy-4}" x2="540" y2="{yy-4}" stroke="{c}" stroke-width="2.5"{dash}/>')
    leg.append(f'<text x="550" y="{yy}" fill="#c9d1d9" font-size="11.5">{t}</text>')
leg.append('<rect x="500" y="786" width="40" height="14" fill="none" stroke="#b388ff" stroke-width="2" stroke-dasharray="6 4" rx="3"/>')
leg.append('<text x="550" y="797" fill="#c9d1d9" font-size="11.5">Simultaneous key pair (&#8804;30 s window)</text>')

# symbols column
leg.append('<text x="790" y="676" fill="#e6edf3" font-size="13" font-weight="700">SYMBOLS</text>')
leg.append('<rect x="790" y="690" width="30" height="16" rx="3" fill="#1a1405" stroke="#ffd54f" stroke-width="1.5"/>')
leg.append('<text x="805" y="702" fill="#ffd54f" font-size="8.5" text-anchor="middle" font-weight="700">GATE</text>')
leg.append('<text x="830" y="702" fill="#c9d1d9" font-size="11.5">Blast gate — opens with both keys</text>')
leg.append('<rect x="790" y="714" width="30" height="16" fill="url(#hatchRed)" opacity="0.5" stroke="#ff5252" stroke-width="1" stroke-dasharray="4 3"/>')
leg.append('<text x="830" y="726" fill="#c9d1d9" font-size="11.5">Spawn zone — hold-out waves</text>')
leg.append('<g stroke="#ff5252" stroke-width="2.5" stroke-linecap="round"><line x1="796" y1="740" x2="814" y2="752"/><line x1="814" y1="740" x2="796" y2="752"/></g>')
leg.append('<text x="830" y="749" fill="#c9d1d9" font-size="11.5">Entry breach sealed at extraction</text>')
leg.append('<circle cx="805" cy="770" r="8" fill="#0f2d23" stroke="#69f0ae" stroke-width="2"/>')
leg.append('<text x="830" y="774" fill="#c9d1d9" font-size="11.5">Airlock / docking collar</text>')

# alarm ladder column
leg.append('<text x="1012" y="676" fill="#e6edf3" font-size="13" font-weight="700">ALARM</text>')
alarm = [
    ("AL1", "first contact"),
    ("AL2", "first key done"),
    ("AL3", "aft gate opens"),
    ("MTD", "charge armed"),
]
for i, (a, t) in enumerate(alarm):
    yy = 700 + i * 22
    col = "#ff5252" if a == "MTD" else "#ffb74d"
    leg.append(f'<rect x="1012" y="{yy-13}" width="34" height="16" rx="3" fill="none" stroke="{col}" stroke-width="1.5"/>')
    leg.append(f'<text x="1029" y="{yy-1}" fill="{col}" font-size="9" text-anchor="middle" font-weight="800">{a}</text>')
    leg.append(f'<text x="1054" y="{yy}" fill="#c9d1d9" font-size="10.5">{t}</text>')

leg.append('<text x="60" y="828" fill="#7d8fa3" font-size="10.5">DESIGN RULE — no straight lines: every key lives in a different section than its lock; the extraction point differs from the entry. The way out is never the way in.</text>')
add('<g id="legend">' + "".join(leg) + '</g>')

# scale bar
add("""
<g id="scale">
  <line x1="1000" y1="630" x2="1120" y2="630" stroke="#7d8fa3" stroke-width="2"/>
  <line x1="1000" y1="624" x2="1000" y2="636" stroke="#7d8fa3" stroke-width="2"/>
  <line x1="1060" y1="626" x2="1060" y2="634" stroke="#7d8fa3" stroke-width="1.5"/>
  <line x1="1120" y1="624" x2="1120" y2="636" stroke="#7d8fa3" stroke-width="2"/>
  <text x="1060" y="618" fill="#7d8fa3" font-size="10" text-anchor="middle">0 — 25 m</text>
</g>
""")

add('</svg>')

svg = "\n".join(S)
out = "/mnt/agents/output/assets/mockups/cruiser_mission_flow_overlay.svg"
with open(out, "w") as f:
    f.write(svg)
print("written", out, len(svg), "chars")
