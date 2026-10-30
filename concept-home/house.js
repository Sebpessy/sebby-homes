// Concept Residence No. 01, a sample Sebby Homes custom home drawn as an exploded axonometric.
// Units are feet. x runs across the front (left to right seen from the street), z runs from the
// street (z = 0) to the back yard, y is up. Level 1 floor is y 0, level 2 floor is y 12.
// Built on the "Exploded House" technique from Flat to 3D by Samnang Aing (MIT, see core.js).
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  THREE, Part, bx, cyl, V, clamp, lerp, ease, win,
  scene, lineMat, toneMat, segs, liveLine, eyeKey, canvasTex, ctx, ACCENT, INK, patchFill,
} from './core.js';

/* ---------------- the plan ---------------- */

const LVL2 = 12, CEIL1 = 11, CEIL2 = 21, EYE = 5.4;

// exterior volumes: footprint and roof top. Walls, steps and parapets come from these.
const VOLS = [
  { x0: 0, z0: 0, x1: 33, z1: 44, h: 22 },   // two-story block: garage below, bedrooms above
  { x0: 33, z0: 6, x1: 47, z1: 34, h: 22 },  // two-story entry and stair
  { x0: 33, z0: 34, x1: 49, z1: 54, h: 22 }, // two-story family room
  { x0: 47, z0: 0, x1: 66, z1: 34, h: 12 },  // study and primary bath
  { x0: 49, z0: 34, x1: 66, z1: 54, h: 12 }, // primary bedroom
  { x0: 0, z0: 44, x1: 33, z1: 54, h: 12 },  // kitchen and dining
];

// rooms: [id, level, x0, z0, x1, z1, name, floor, open-plan group]
export const ROOMS = [
  ['garage', 1, 0, 0, 33, 23, 'Garage', 'concrete'],
  ['foyer', 1, 33, 6, 47, 22, 'Foyer', 'stone', 'entry'],
  ['study', 1, 47, 0, 66, 15, 'Study', 'oak'],
  ['powder', 1, 47, 15, 54, 22, 'Powder', 'stone'],
  ['pclos', 1, 54, 15, 66, 22, 'Closet', 'oak'],
  ['poolbath', 1, 0, 23, 8, 34, 'Pool bath', 'stone'],
  ['mud', 1, 8, 23, 18, 34, 'Mud · laundry', 'stone'],
  ['pantry', 1, 18, 23, 33, 34, "Butler's pantry", 'oak'],
  ['stair', 1, 33, 22, 47, 34, 'Stair · wine', 'stone', 'entry'],
  ['pbath', 1, 47, 22, 66, 34, 'Primary bath', 'stone'],
  ['kitchen', 1, 0, 34, 20, 54, 'Kitchen', 'oak', 'great'],
  ['dining', 1, 20, 34, 33, 54, 'Dining', 'oak', 'great'],
  ['family', 1, 33, 34, 49, 54, 'Family', 'oak', 'great'],
  ['primary', 1, 49, 34, 66, 54, 'Primary suite', 'oak'],
  ['bed2', 2, 0, 0, 15, 15, 'Bedroom 2', 'oak'],
  ['bath2', 2, 0, 15, 10, 23, 'Bath', 'stone'],
  ['game', 2, 15, 0, 33, 15, 'Game room', 'oak'],
  ['hall', 2, 10, 15, 33, 23, 'Loft', 'oak', 'circ'],
  ['landing', 2, 33, 15, 47, 22, 'Bridge', 'oak', 'circ'],
  ['landing2', 2, 33, 26, 47, 34, 'Landing', 'oak', 'circ'],
  ['bed3', 2, 0, 23, 15, 44, 'Bedroom 3', 'oak'],
  ['bath4', 2, 15, 23, 25, 31, 'Bath', 'stone'],
  ['linen', 2, 25, 23, 33, 31, 'Linen', 'oak'],
  ['bed4', 2, 15, 31, 33, 44, 'Bedroom 4', 'oak'],
].map(([id, lvl, x0, z0, x1, z1, name, floor, group]) => ({ id, lvl, x0, z0, x1, z1, name, floor, group }));

// doors between rooms: [room, room, width]; open-plan groups need none
const DOORS = [
  ['garage', 'mud', 3], ['mud', 'poolbath', 3], ['mud', 'kitchen', 3], ['pantry', 'kitchen', 2.6],
  ['pantry', 'dining', 4], ['foyer', 'study', 6], ['foyer', 'powder', 3], ['stair', 'family', 10],
  ['pclos', 'pbath', 3], ['pbath', 'primary', 4], ['family', 'primary', 4],
  ['bed2', 'hall', 3], ['bed2', 'bath2', 3], ['game', 'hall', 10], ['bed3', 'hall', 3],
  ['bed3', 'bath4', 3], ['bed4', 'bath4', 3], ['bed4', 'landing2', 2.6], ['linen', 'hall', 3],
];

// openings in the exterior: [axis, line, from, to, y0, y1, kind]; axis 'z' is a wall at constant z
const OPEN = [
  ['z', 0, 1.5, 10.5, 0, 8, 'garage'], ['z', 0, 12, 21, 0, 8, 'garage'], ['z', 0, 22.5, 31.5, 0, 8, 'garage'],
  ['z', 0, 3, 12, 14, 19.5, 'win'], ['z', 0, 17, 31, 14, 19.5, 'win'],
  ['z', 6, 35, 45, 0.2, 20, 'entry'], ['z', 0, 50, 63, 1.5, 9.5, 'win'],
  ['x', 66, 3, 12, 2, 9, 'win'], ['x', 66, 24, 32, 7, 10, 'win'], ['x', 66, 47, 53, 0.2, 9, 'win'],
  ['z', 54, 3, 17, 3.5, 9, 'win'], ['z', 54, 21, 32, 0.2, 9, 'win'], ['z', 54, 34.5, 48, 0.2, 20, 'win'],
  ['z', 54, 51, 64, 0.2, 9, 'win'], ['z', 44, 3, 12, 14, 19.5, 'win'], ['z', 44, 18, 30, 14, 19.5, 'win'],
  ['x', 0, 37, 51, 4, 9, 'win'], ['x', 0, 28, 39, 14, 19.5, 'win'], ['x', 0, 3, 12, 14, 19.5, 'win'],
  ['x', 47, 8, 20, 14, 19.5, 'win'], ['x', 49, 38, 50, 14, 19.5, 'win'], ['x', 33, 45, 52, 14, 19.5, 'win'],
];

// roof planes [x0, z0, x1, z1, top]: flat, with deep overhangs only where nothing rises above them
const ROOFS = [
  [-2, -2, 33, 44, 22], [33, -6, 47, 34, 22], [33, 34, 49, 56, 22],
  [47, -2, 68, 34, 12], [49, 34, 68, 56, 12], [-2, 44, 33, 56, 12],
];

const cellH = (x, z) => { let h = 0; for (const v of VOLS) if (x > v.x0 && x < v.x1 && z > v.z0 && z < v.z1) h = Math.max(h, v.h); return h; };
const roomAt = (lvl, x, z) => ROOMS.find(r => r.lvl === lvl && x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1) || null;

// walls as runs on a 1 ft grid: exterior where the roof height changes, interior where the room changes
function wallRuns() {
  const segs = [];
  const push = (axis, line, a, y0, y1, kind, lvl, tag = '') => segs.push({ axis, line, a, b: a + 1, y0, y1, kind, lvl, tag });
  for (let i = -1; i <= 68; i++) for (let j = -1; j <= 56; j++) {
    for (const [axis, line, a, ca, cb] of [['x', i, j, [i - .5, j + .5], [i + .5, j + .5]], ['z', j, i, [i + .5, j - .5], [i + .5, j + .5]]]) {
      const ha = cellH(...ca), hb = cellH(...cb);
      if (ha !== hb) {
        const lo = Math.min(ha, hb), hi = Math.max(ha, hb) - 1;
        // the outside of a two-story wall carries on through the floor line as one face
        if (lo < LVL2) push(axis, line, a, lo, Math.min(hi, LVL2), 'ext', 1);
        if (hi > LVL2) push(axis, line, a, Math.max(lo, LVL2), hi, 'ext', 2);
      }
      for (const lvl of [1, 2]) {
        const ra = roomAt(lvl, ...ca), rb = roomAt(lvl, ...cb);
        if (ra === rb) continue;
        if (ra && rb) {
          if (ra.group && ra.group === rb.group) continue;
          const tag = [ra.id, rb.id].sort().join('|');
          if (lvl === 1) push(axis, line, a, 0, CEIL1, 'int', 1, tag); else push(axis, line, a, LVL2, CEIL2, 'int', 2, tag);
        } else if (lvl === 2 && cellH(...(ra ? cb : ca)) >= 22) {
          push(axis, line, a, LVL2, LVL2 + 3.5, 'rail', 2);     // a room beside the two-story void: glass rail
        }
      }
    }
  }
  const runs = new Map();
  for (const s of segs) { const k = [s.axis, s.line, s.y0, s.y1, s.kind, s.lvl, s.tag].join('/'); (runs.get(k) || runs.set(k, []).get(k)).push(s); }
  const out = [];
  for (const list of runs.values()) {
    list.sort((p, q) => p.a - q.a);
    let cur = { ...list[0] };
    for (let n = 1; n < list.length; n++) { if (list[n].a === cur.b) cur.b = list[n].b; else { out.push(cur); cur = { ...list[n] }; } }
    out.push(cur);
  }
  return out;
}

// a wall run minus its openings, as rectangles in the wall's own (u along, v up) drawing
function cutRect(a, b, y0, y1, holes) {
  const us = [...new Set([a, b, ...holes.flatMap(h => [h[0], h[1]]).filter(u => u > a && u < b)])].sort((p, q) => p - q);
  const rects = [];
  for (let k = 0; k < us.length - 1; k++) {
    const u0 = us[k], u1 = us[k + 1], mid = (u0 + u1) / 2;
    let spans = [[y0, y1]];
    for (const [h0, h1, v0, v1] of holes) if (mid > h0 && mid < h1) spans = spans.flatMap(([s, e]) => [[s, Math.min(e, v0)], [Math.max(s, v1), e]]).filter(([s, e]) => e - s > 0.01);
    for (const [s, e] of spans) {
      const prev = rects.find(r => r[1] === u0 && r[2] === s && r[3] === e);
      if (prev) prev[1] = u1; else rects.push([u0, u1, s, e]);
    }
  }
  return rects;
}

/* ---------------- build ---------------- */

export async function build(labels) {
  const PAL = {
    white: { mat: toneMat('#fbfaf6', { mode: 0, scale: 0.3 }) },
    int: { mat: toneMat('#f7f4ee', { mode: 0, scale: 0.3 }), w: 'mid' },
    concrete: { mat: toneMat('#dfdbd2', { mode: 2, scale: 0.3 }) },
    oak: { mat: toneMat('#f3e5cd', { mode: 1, scale: 0.36 }) },
    stone: { mat: toneMat('#ece8df', { mode: 0, scale: 0.4 }) },
    wood: { mat: toneMat('#f2e2c6', { mode: 1, scale: 0.5 }), w: 'mid' },
    glass: { mat: toneMat('#dce8eb', { opacity: 0.16, mode: 5 }), w: 'thin' },
    frame: { mat: toneMat('#d2cec5', { mode: 3, scale: 0.6 }), w: 'thin' },
    roof: { mat: toneMat('#f3f1eb', { mode: 0, scale: 0.3 }) },
    soft: { mat: toneMat('#f6f3ec', { mode: 4, scale: 0.3 }), hull: 1, w: 'mid' },
    gold: { mat: toneMat('#e7cf93', { mode: 4, scale: 0.4 }), hull: 1, w: 'thin', thr: 50 },
    top: { mat: toneMat('#f6f4f0', { mode: 0, scale: 0.5 }), w: 'mid' },
    dark: { mat: toneMat('#b9b4a9', { mode: 3, scale: 0.6 }), w: 'thin' },
    water: { mat: toneMat('#cfe2e4', { mode: 5, opacity: 0.9 }), edges: false },
    lumber: { mat: toneMat('#efdcb6', { mode: 1, scale: 0.5 }), w: 'thin', thr: 40 },
    sheath: { mat: toneMat('#e9dfc9', { mode: 2, scale: 0.4 }) },
    limestone: { mat: toneMat('#e6e0d2', { mode: 2, scale: 0.35 }) },
    cedar: { mat: toneMat('#e8cfa4', { mode: 1, scale: 0.45 }) },
  };
  const hatchMat = lineMat({ w: 0.6, color: '#8f897d', opacity: 0.9 });
  const dashMat = lineMat({ w: 0.9, color: INK, dashed: true, dash: 0.9, gap: 0.7, opacity: 0.75 });

  // ---- the site plan the house stands on
  const PLAN = { x0: -34, z0: -44, x1: 100, z1: 110 };
  const plan = new THREE.Mesh(new THREE.PlaneGeometry(PLAN.x1 - PLAN.x0, PLAN.z1 - PLAN.z0).rotateX(-Math.PI / 2),
    patchFill(new THREE.MeshBasicMaterial({ map: drawPlan(PLAN) })));
  plan.position.set((PLAN.x0 + PLAN.x1) / 2, -1.02, (PLAN.z0 + PLAN.z1) / 2);
  scene.add(plan);

  const layers = [];
  function layer(id, no, name, sub, level) {
    const g = new THREE.Group(); scene.add(g);
    const line = lineMat({ w: 1.45 }), mid = lineMat({ w: 0.95 }), thin = lineMat({ w: 0.6, opacity: 0.6 });
    const W = { mid, thin };
    const L = { id, no, name, sub, level, g, line, lines: [line, mid, thin], subs: [], W };
    L.part = new Part(g, PAL, line, W);
    L.side = (dir, lvl, parent = g) => {
      const sg = new THREE.Group(); parent.add(sg);
      const s = { g: sg, dir, lvl, part: new Part(sg, PAL, line, W) }; L.subs.push(s); return s;
    };
    layers.push(L); return L;
  }
  const rb = (x0, y0, z0, x1, y1, z1, r = 0.25) => {
    const w = x1 - x0, h = y1 - y0, d = z1 - z0;
    const g = new RoundedBoxGeometry(w, h, d, 3, Math.min(r, Math.min(w, h, d) / 2 - 0.01));
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); return g;
  };

  // 01 Foundation: post-tension slab with grade beams, the porch and the patio
  const L1 = layer('slab', '01', 'Foundation', 'Post-tension slab on clay', 1);
  for (const v of VOLS) {
    L1.part.add('concrete', bx(v.x0, -1.5, v.z0, v.x1, 0, v.z1));
    L1.part.add('concrete', bx(v.x0, -3, v.z0, v.x1, -1.5, v.z0 + 1), bx(v.x0, -3, v.z1 - 1, v.x1, -1.5, v.z1),
      bx(v.x0, -3, v.z0 + 1, v.x0 + 1, -1.5, v.z1 - 1), bx(v.x1 - 1, -3, v.z0 + 1, v.x1, -1.5, v.z1 - 1));
  }
  L1.part.add('concrete', bx(33, -1.5, -6, 47, -0.4, 6), bx(4, -1.5, 54, 49, -0.4, 68));
  const tendons = [];
  for (let x = 4; x < 66; x += 6) tendons.push([x, 0.01, 0.6, x, 0.01, cellH(x + 0.1, 30) ? 53.4 : 33.4]);
  for (let z = 4; z < 54; z += 6) tendons.push([0.6, 0.01, z, z < 34 || z > 44 ? 65.4 : 65.4, 0.01, z]);
  segs(L1.g, tendons, hatchMat);

  // 02-04 Framing: level 1 walls, the level 2 floor and walls, then the roof joists
  const LF1 = layer('frame1', '02', 'Level 1 framing', '2×6 studs at 16″ · 11 ft walls', 1);
  const LF2 = layer('frame2', '03', 'Level 2 framing', 'Floor joists · 9 ft walls', 2);
  const LFR = layer('roofframe', '04', 'Roof framing', 'Joists at 24″ · 2 ft overhangs', 3);
  // 05 Sheathing and decking: the walls are wrapped, the floors and roof are decked
  const LS = layer('sheath', '05', 'Sheathing & decking', 'Walls wrapped · floors and roof decked', 4);
  // 07 Stone and siding, with the interior finishes: floors, the stair, kitchen and furniture
  const LC = layer('clad', '07', 'Stone & siding', 'Limestone below · cedar above · finishes in', 6);
  const L2 = LC, L3 = LC;

  const runs = wallRuns();
  for (const r of runs) {
    const t = r.kind === 'ext' ? 0.7 : r.kind === 'int' ? 0.45 : 0.12;
    const Lr = LS;
    let rects;
    if (r.kind === 'ext') {
      const holes = OPEN.filter(o => o[0] === r.axis && o[1] === r.line).map(o => [o[2], o[3], o[4], o[5]]);
      rects = cutRect(r.a - (t / 2), r.b + (t / 2), r.y0, r.y1, holes);
    } else if (r.kind === 'int') {
      const door = DOORS.find(([p, q]) => [p, q].sort().join('|') === r.tag);
      if (door) {
        const w = Math.min(door[2], r.b - r.a - 1), m = (r.a + r.b) / 2;
        rects = cutRect(r.a, r.b, r.y0, r.y1, [[m - w / 2, m + w / 2, r.y0 - 1, r.y0 + 8]]);
      } else rects = [[r.a, r.b, r.y0, r.y1]];
    } else rects = [[r.a, r.b, r.y0, r.y1]];
    const key = r.kind === 'ext' ? 'white' : r.kind === 'int' ? 'int' : 'glass';
    for (const [u0, u1, v0, v1] of rects) {
      Lr.part.add(key, r.axis === 'x' ? bx(r.line - t / 2, v0, u0, r.line + t / 2, v1, u1) : bx(u0, v0, r.line - t / 2, u1, v1, r.line + t / 2));
    }
    if (r.kind === 'rail') Lr.part.add('frame', r.axis === 'x' ? bx(r.line - 0.12, r.y1, r.a, r.line + 0.12, r.y1 + 0.15, r.b) : bx(r.a, r.y1, r.line - 0.12, r.b, r.y1 + 0.15, r.line + 0.12));
  }
  // floors: oak and stone on level 1, a deck under each level 2 room
  for (const r of ROOMS) {
    if (r.lvl === 1) LC.part.add(r.floor === 'concrete' ? 'concrete' : r.floor, bx(r.x0, 0, r.z0, r.x1, 0.12, r.z1));
    else LS.part.add('sheath', bx(r.x0, LVL2 - 0.12, r.z0, r.x1, LVL2, r.z1), bx(r.x0, CEIL1 - 0.06, r.z0, r.x1, CEIL1, r.z1));
  }
  const boards = [];
  for (const r of ROOMS.filter(q => q.floor === 'oak')) {
    const y = (r.lvl === 1 ? 0.12 : LVL2) + 0.01;
    for (let z = r.z0 + 0.8; z < r.z1; z += 0.8) boards.push([r.x0, y, z, r.x1, y, z]);
  }
  segs(LC.g, boards.filter(b => b[1] < 1), hatchMat);
  segs(LC.g, boards.filter(b => b[1] > 1), hatchMat);

  // the stair: floating oak treads on a steel stringer, rising toward the back of the house,
  // with a glass wine room tucked under its high end
  for (let i = 0; i < 16; i++) {
    const x0 = 33.8 + i * 0.83, y = (i + 1) * 0.75;
    L2.part.add('wood', bx(x0, y - 0.18, 22.4, x0 + 0.83, y, 26));
  }
  L2.part.add('dark', new THREE.BoxGeometry(0.3, 1.1, 18.2).rotateX(-Math.atan2(12, 13.3)).rotateY(Math.PI / 2).translate(40.4, 5.6, 24.2));
  L2.part.add('glass', bx(40.9, 0.12, 22.6, 44.2, 6.2, 22.7), bx(40.9, 0.12, 25.8, 44.2, 6.2, 25.9),
    bx(40.8, 0.12, 22.6, 40.9, 6.2, 25.9), bx(44.1, 0.12, 22.6, 44.2, 6.2, 25.9));
  for (let x = 41.4; x < 44; x += 0.85) L2.part.add('dark', bx(x, 0.12, 23.4, x + 0.08, 6.2, 25.2));
  for (let y = 1; y < 6.2; y += 1.2) L2.part.add('dark', bx(41.2, y, 23.4, 43.9, y + 0.06, 25.2));
  // foyer: console and a chandelier in the two-story volume
  L2.part.add('wood', bx(45.4, 0.12, 9, 46.5, 2.8, 15));
  L2.part.add('gold', cyl(2.2, 0.35, 40, 15.5, 14, 36, 2.2), cyl(0.05, 5, 40, 16, 14, 8));
  // family room: sofa, coffee table, rug, fireplace wall
  L2.part.add('soft', bx(36, 0.12, 37.5, 47, 0.16, 50));
  L2.part.add('soft', rb(36.5, 0.12, 47.4, 46.5, 1.5, 50.2), rb(36.5, 1.5, 49.4, 46.5, 2.9, 50.4),
    rb(36.5, 0.12, 40.5, 39.3, 1.5, 47.4), rb(36.5, 1.5, 40.5, 37.5, 2.9, 47.4));
  L2.part.add('gold', rb(37.2, 1.5, 48.2, 38.6, 2.6, 49.2, 0.2), rb(44.6, 1.5, 48.2, 46, 2.6, 49.2, 0.2));
  L2.part.add('wood', bx(40.5, 0.12, 41.5, 44.5, 1.3, 45.5));
  L2.part.add('stone', bx(33.4, 0.12, 37.5, 34.6, 21, 50.5));
  L2.part.add('dark', bx(34.6, 1.2, 40.5, 34.7, 3.6, 47.5));
  // kitchen: tall wall, perimeter runs, a waterfall island, stools and pendants
  L2.part.add('wood', bx(2.5, 0.12, 34.4, 17.5, 9, 36.6));
  L2.part.add('wood', bx(0.4, 0.12, 36.6, 2.6, 3, 53.6), bx(2.6, 0.12, 51.4, 18, 3, 53.6));
  L2.part.add('top', bx(0.35, 3, 36.6, 2.7, 3.15, 53.65), bx(2.7, 3, 51.3, 18.1, 3.15, 53.65));
  L2.part.add('wood', bx(6.2, 0.12, 42.2, 15.8, 3, 45.8));
  L2.part.add('top', bx(5.9, 3, 41.9, 16.1, 3.2, 46.1), bx(5.9, 0.12, 41.9, 6.1, 3, 46.1), bx(15.9, 0.12, 41.9, 16.1, 3, 46.1));
  for (const x of [8, 11, 14]) {
    L2.part.add('dark', cyl(0.7, 0.2, x, 2.4, 47.4, 20), cyl(0.08, 2.3, x, 0.12, 47.4, 8));
    L2.part.add('gold', cyl(0.75, 0.9, x, 7.3, 44, 24, 0.25), cyl(0.03, 2.8, x, 8.2, 44, 6));
  }
  // dining: table for eight and its chandelier
  L2.part.add('wood', bx(23, 2.4, 40.5, 30.5, 2.6, 45.5), bx(23.8, 0.12, 42.5, 24.4, 2.4, 43.5), bx(29.1, 0.12, 42.5, 29.7, 2.4, 43.5));
  for (const x of [24.2, 26.7, 29.2]) for (const z of [39.4, 46.6]) L2.part.add('soft', rb(x - 0.8, 0.12, z - 0.8, x + 0.8, 1.6, z + 0.8, 0.2));
  L2.part.add('gold', cyl(2.6, 0.3, 26.75, 7.6, 43, 36, 2.6), cyl(0.04, 3, 26.75, 7.9, 43, 6));
  // primary suite, study, game room and the bedrooms above
  L2.part.add('soft', rb(58, 0.12, 38, 65.2, 2, 45), rb(64.6, 0.12, 37.6, 65.5, 4.2, 45.4, 0.15));
  L2.part.add('wood', bx(53, 0.12, 4.5, 60, 2.6, 7.5));
  L2.part.add('stone', bx(52, 0.12, 25, 58, 2, 28.5), bx(60, 0.12, 30.5, 65.5, 3, 33.6));
  L3.part.add('soft', rb(1, LVL2, 4, 7.5, LVL2 + 2, 11), rb(0.5, LVL2, 30, 7.5, LVL2 + 2, 36.5), rb(26, LVL2, 35, 32.6, LVL2 + 2, 41.5),
    rb(18, LVL2, 2, 28, LVL2 + 1.5, 5), rb(18, LVL2, 5, 21, LVL2 + 1.5, 11));

  // 04 Glass and doors: each opening slides out from its own wall, then rides down with its level
  const L4 = layer('glazing', '06', 'Windows & doors', 'Black steel · 10 ft oak pivot door', 5);
  const subs = {};
  const sideFor = (axis, line, mid, lvl) => {
    const out = axis === 'z' ? (cellH(mid, line - 0.5) < cellH(mid, line + 0.5) ? -1 : 1) : (cellH(line - 0.5, mid) < cellH(line + 0.5, mid) ? -1 : 1);
    const dir = axis === 'z' ? V(0, 0, out) : V(out, 0, 0);
    const k = `${axis}${out}${lvl}`;
    return subs[k] || (subs[k] = L4.side(dir, lvl));
  };
  for (const [axis, line, a, b, y0, y1, kind] of OPEN) {
    const parts = y0 < LVL2 && y1 > LVL2 ? [[y0, LVL2 - 0.5], [LVL2 + 0.5, y1]] : [[y0, y1]];
    for (const [v0, v1] of parts) {
      const s = sideFor(axis, line, (a + b) / 2, v0 < LVL2 ? 1 : 2);
      const B = (u0, w0, u1, w1, t0, t1) => axis === 'z' ? bx(u0, w0, line + t0, u1, w1, line + t1) : bx(line + t0, w0, u0, line + t1, w1, u1);
      if (kind === 'garage') {
        s.part.add('wood', B(a, v0, b, v1, -0.25, 0.1));
        continue;
      }
      const f = 0.25;
      s.part.add('frame', B(a, v0, b, v0 + f, -0.3, 0.3), B(a, v1 - f, b, v1, -0.3, 0.3), B(a, v0, a + f, v1, -0.3, 0.3), B(b - f, v0, b, v1, -0.3, 0.3));
      // steel mullions about every 3 ft, and a transom on the tall walls of glass
      const n = Math.max(1, Math.round((b - a) / 3.2));
      for (let k = 1; k < n; k++) { const u = a + (b - a) * k / n; if (kind === 'entry' && v0 < LVL2 && u > 38.5 && u < 43.5) continue; s.part.add('frame', B(u - 0.08, v0, u + 0.08, v1, -0.25, 0.25)); }
      if (v1 - v0 > 9) s.part.add('frame', B(a, v0 + 9.6, b, v0 + 9.8, -0.25, 0.25));
      if (kind === 'entry' && v0 < LVL2) {
        s.part.add('glass', B(a + f, v0 + f, 39, v1 - f, -0.04, 0.04), B(43, v0 + f, b - f, v1 - f, -0.04, 0.04), B(39, 10, 43, v1 - f, -0.04, 0.04));
        s.part.add('frame', B(38.8, v0, 39, 10, -0.3, 0.3), B(43, v0, 43.2, 10, -0.3, 0.3), B(39, 9.8, 43, 10, -0.3, 0.3));
      } else s.part.add('glass', B(a + f, v0 + f, b - f, v1 - f, -0.04, 0.04));
    }
  }
  const entry = subs['z-11'];
  // the pivot door: oak, 4 ft by 10 ft, turning on a pin 1 ft in from its edge
  const pivot = new THREE.Group(); pivot.position.set(39, 0, 6); entry.g.add(pivot);
  const doorPart = new Part(pivot, PAL, L4.line, L4.W);
  doorPart.add('wood', bx(0, 0.2, -0.2, 3.9, 9.8, 0.2));
  doorPart.add('dark', bx(3.2, 3.2, -0.45, 3.35, 6.8, -0.25));
  for (let x = 0.6; x < 3.8; x += 0.65) segs(pivot, [[x, 0.4, -0.21, x, 9.6, -0.21]], hatchMat);
  for (const L of [L4]) L.subs.push({ g: pivot, dir: V(0, 0, 0), lvl: 0, part: doorPart, isDoor: true });

  // roof framing: joists at 24 in on a rim, steel posts at the porch and patio; the roof deck goes on with the sheathing
  for (const [x0, z0, x1, z1, top] of ROOFS) {
    LFR.part.add('lumber', bx(x0, top - 1.2, z0, x1, top - 0.3, z0 + 0.15), bx(x0, top - 1.2, z1 - 0.15, x1, top - 0.3, z1),
      bx(x0, top - 1.2, z0, x0 + 0.15, top - 0.3, z1), bx(x1 - 0.15, top - 1.2, z0, x1, top - 0.3, z1));
    for (let x = x0 + 2; x < x1 - 0.5; x += 2) LFR.part.add('lumber', bx(x - 0.07, top - 1.2, z0 + 0.15, x + 0.07, top - 0.3, z1 - 0.15));
    LS.part.add('roof', bx(x0, top - 0.3, z0, x1, top, z1));
    LS.part.add('int', bx(x0, top - 1.26, z0, x1, top - 1.2, z1));
    LS.part.add('frame', bx(x0 + 1.5, top, z0 + 1.5, x1 - 1.5, top + 0.05, z1 - 1.5));
  }
  for (const x of [34, 46]) LFR.part.add('dark', bx(x - 0.3, 0, -5.3, x + 0.3, 20.8, -4.7));
  LFR.part.add('lumber', bx(4, 10.2, 54, 33, 10.8, 54.3), bx(4, 10.2, 67.7, 33, 10.8, 68));
  for (let x = 5; x < 33; x += 2) LFR.part.add('lumber', bx(x - 0.07, 10.2, 54.3, x + 0.07, 10.8, 67.7));
  LS.part.add('roof', bx(4, 10.8, 54, 33, 11, 68));
  LS.part.add('int', bx(4, 10.14, 54, 33, 10.2, 68));
  for (const x of [4.5, 18.75, 32.5]) LFR.part.add('dark', bx(x - 0.3, 0, 67.2, x + 0.3, 10.2, 67.8));
  const seams = [];
  for (const [x0, z0, x1, z1, top] of ROOFS) for (let x = x0 + 3; x < x1 - 1; x += 3) seams.push([x, top + 0.06, z0 + 1.5, x, top + 0.06, z1 - 1.5]);
  segs(LS.g, seams, hatchMat);

  // ---- framing: studs at 16 in along every wall run, plates, headers over the openings, cripples under the sills
  const studs = { 1: [], 2: [] };
  for (const r of runs) {
    if (r.kind === 'rail') continue;
    const F = r.lvl === 1 ? LF1 : LF2;
    const d = r.kind === 'ext' ? 0.23 : 0.18, w = 0.07;
    const B = (u0, v0, u1, v1, dd = d) => r.axis === 'x' ? bx(r.line - dd, v0, u0, r.line + dd, v1, u1) : bx(u0, v0, r.line - dd, u1, v1, r.line + dd);
    let holes = [];
    if (r.kind === 'ext') holes = OPEN.filter(o => o[0] === r.axis && o[1] === r.line).map(o => [o[2], o[3], o[4], o[5]]);
    else {
      const door = DOORS.find(([p, q]) => [p, q].sort().join('|') === r.tag);
      if (door) { const ww = Math.min(door[2], r.b - r.a - 1), m = (r.a + r.b) / 2; holes = [[m - ww / 2, m + ww / 2, r.y0, r.y0 + 8]]; }
    }
    holes = holes.filter(([h0, h1, v0, v1]) => h1 > r.a && h0 < r.b && v1 > r.y0 && v0 < r.y1);
    F.part.add('lumber', B(r.a, r.y0, r.b, r.y0 + 0.13), B(r.a, r.y1 - 0.26, r.b, r.y1));
    for (let u = r.a + 0.07; u <= r.b; u += 4 / 3) {
      const u0 = Math.min(u, r.b - w * 2), u1 = u0 + w * 2;
      let spans = [[r.y0 + 0.13, r.y1 - 0.26]];
      for (const [h0, h1, v0, v1] of holes) if (u1 > h0 && u0 < h1) spans = spans.flatMap(([a, b]) => [[a, Math.min(b, v0 - (v0 > r.y0 + 0.5 ? 0.13 : 0))], [Math.max(a, v1 + 0.9), b]]).filter(([a, b]) => b - a > 0.2);
      for (const [a, b] of spans) F.part.add('lumber', B(u0, a, u1, b));
    }
    for (const [h0, h1, v0, v1] of holes) {
      const a = Math.max(h0, r.a), b = Math.min(h1, r.b);
      if (v1 + 0.9 < r.y1 - 0.26) F.part.add('lumber', B(a - 0.15, v1, b + 0.15, v1 + 0.9));
      if (v0 > r.y0 + 0.5) F.part.add('lumber', B(a, v0 - 0.13, b, v0));
      F.part.add('lumber', B(a - 0.15, r.y0 + 0.13, a, Math.min(v1, r.y1 - 0.26)), B(b, r.y0 + 0.13, b + 0.15, Math.min(v1, r.y1 - 0.26)));
    }
  }
  // the level 2 floor: joists at 16 in under every level 2 room, on a rim
  for (const r of ROOMS.filter(q => q.lvl === 2)) {
    LF2.part.add('lumber', bx(r.x0, CEIL1, r.z0, r.x1, LVL2 - 0.12, r.z0 + 0.12), bx(r.x0, CEIL1, r.z1 - 0.12, r.x1, LVL2 - 0.12, r.z1));
    for (let x = r.x0 + 0.1; x < r.x1; x += 4 / 3) LF2.part.add('lumber', bx(x, CEIL1, r.z0 + 0.12, Math.min(x + 0.13, r.x1), LVL2 - 0.12, r.z1 - 0.12));
  }

  // ---- stone and siding: limestone on the level 1 walls, cedar boards above, each a skin just outside the sheathing
  const course = [];
  for (const r of runs) {
    if (r.kind !== 'ext') continue;
    const mid = (r.a + r.b) / 2;
    const out = r.axis === 'z' ? (cellH(mid, r.line - 0.5) < cellH(mid, r.line + 0.5) ? -1 : 1) : (cellH(r.line - 0.5, mid) < cellH(r.line + 0.5, mid) ? -1 : 1);
    const o0 = out * 0.35, o1 = out * 0.55, lo = Math.min(o0, o1), hi = Math.max(o0, o1), oc = out * 0.56;
    const holes = OPEN.filter(o => o[0] === r.axis && o[1] === r.line).map(o => [o[2], o[3], o[4], o[5]]);
    const stone = r.lvl === 1;
    for (const [u0, u1, v0, v1] of cutRect(r.a - 0.35, r.b + 0.35, r.y0, r.y1, holes)) {
      LC.part.add(stone ? 'limestone' : 'cedar', r.axis === 'x' ? bx(r.line + lo, v0, u0, r.line + hi, v1, u1) : bx(u0, v0, r.line + lo, u1, v1, r.line + hi));
      const P = (u, v) => r.axis === 'x' ? [r.line + oc, v, u] : [u, v, r.line + oc];
      if (stone) for (let v = v0 + 0.9, k = 0; v < v1 - 0.2; v += 0.9, k++) {
        course.push([...P(u0, v), ...P(u1, v)]);
        for (let u = u0 + (k % 2 ? 1.1 : 0.4); u < u1 - 0.2; u += 2.2) course.push([...P(u, v - 0.9), ...P(u, v)]);
      } else for (let u = u0 + 0.6; u < u1 - 0.1; u += 0.6) course.push([...P(u, v0), ...P(u, v1)]);
    }
  }
  segs(LC.g, course, hatchMat);

  // the site, always on: pool and coping, an outdoor kitchen on the patio
  const site = new THREE.Group(); scene.add(site);
  const sitePart = new Part(site, PAL, lineMat({ w: 1.1 }), { mid: lineMat({ w: 0.8 }), thin: lineMat({ w: 0.6, opacity: 0.6 }) });
  sitePart.add('top', bx(15, -1, 71, 49, -0.7, 72.2), bx(15, -1, 87.8, 49, -0.7, 89), bx(15, -1, 72.2, 16.2, -0.7, 87.8), bx(47.8, -1, 72.2, 49, -0.7, 87.8));
  sitePart.add('water', bx(16.2, -1.6, 72.2, 47.8, -1.2, 87.8));
  sitePart.add('top', bx(5.5, -0.4, 56.5, 8.2, 2.6, 66));
  sitePart.add('wood', bx(15, -0.4, 59, 24, 2.1, 63));
  sitePart.build();

  for (const L of layers) { L.part.build(); for (const s of L.subs) if (!s.isDoor) s.part.build(); }
  doorPart.build();

  // ---- the stack: how far each level floats, and the order things land
  // ---- the build: each stage is lowered into place in construction order; windows slide in from outside
  const DROP = 16;
  const PULL = { glazing: 11 };
  const ORDER = ['slab', 'frame1', 'frame2', 'roofframe', 'sheath', 'glazing', 'clad'];
  const TOP = { slab: 0, frame1: CEIL1, frame2: CEIL2, roofframe: 22, sheath: 22, glazing: 20, clad: 12 };
  const T0 = 0.04, STEP = 0.05, DUR = 0.055;
  const landAt = id => { const i = ORDER.indexOf(id); return [T0 + i * STEP, T0 + i * STEP + DUR]; };

  // ---- labels in a column right of the drawing, each on its layer's back right corner
  const anchor = {
    slab: [L1.g, V(66, -1, 54)],
    frame1: [LF1.g, V(66, 6, 54)],
    frame2: [LF2.g, V(33, 17, 44)],
    roofframe: [LFR.g, V(68, 11.5, 56)],
    sheath: [LS.g, V(66, 9, 20)],
    glazing: [subs['x11'].g, V(66.3, 6, 50)],
    clad: [LC.g, V(66.6, 3, 6)],
  };
  const SHORT = { slab: 'Slab', frame1: 'L1 frame', frame2: 'L2 frame', roofframe: 'Roof frame', sheath: 'Sheathing', glazing: 'Windows', clad: 'Stone · siding' };
  for (const L of layers) { const [obj, at] = anchor[L.id]; L.label = labels.add({ no: L.no, name: L.name, short: SHORT[L.id], sub: L.sub, obj, at, rank: 10 - Number(L.no) }); }

  const dash = liveLine(dashMat);
  const corners = [[0, 0], [66, 0], [66, 54], [0, 54]];

  // ---- camera: the long lens over the stack, then a dolly zoom down to the front porch
  const AX = { t: [33, 10, 27], az: -52, el: 27, fov: 1.5, h: 130, sx: -0.01, sy: -0.06, ph: { h: 210, sx: 0, sy: -0.16 } };
  const keys = [
    { at: 0, ...AX },
    { at: 0.40, ...AX },
    { at: 0.48, t: [36, 9, 22], az: -60, el: 24, fov: 1.5, h: 74, sx: -0.1, ph: { h: 150, sx: 0, sy: -0.25 } },
    { at: 0.52, t: [38, 8, 14], az: -72, el: 18, fov: 1.6, h: 60, sx: -0.06, ph: { h: 120, sx: 0, sy: -0.2 } },
    eyeKey(0.62, [40, EYE, -24], [40, 7.2, 6], 46, { sy: -0.12, ph: eyeKey(0.62, [40, EYE, -30], [40, 7.6, 6], 62, { sy: -0.1 }) }),
    eyeKey(0.70, [40, EYE, -15], [40, 7, 12], 50, { sy: -0.1, ph: eyeKey(0.70, [40, EYE, -20], [40, 7.4, 12], 64, { sy: -0.08 }) }),
    // through the door, under the high end of the stair, into the family room, across to the kitchen, look back
    eyeKey(0.75, [41.6, EYE, -2], [41.8, 6.2, 20], 58, { ph: eyeKey(0.75, [41.6, EYE, -4], [41.8, 6.4, 20], 70) }),
    eyeKey(0.79, [42.4, EYE, 9], [44, 6.4, 28], 66, { ph: eyeKey(0.79, [42.4, EYE, 8], [44, 6.6, 28], 76) }),
    eyeKey(0.835, [45.4, EYE, 24], [40.5, 5.4, 42], 64, { ph: eyeKey(0.835, [45.4, EYE, 23], [40.5, 5.6, 42], 74) }),
    eyeKey(0.875, [42, EYE, 37], [41, 4.6, 75], 60, { ph: eyeKey(0.875, [42, EYE, 36], [41, 4.8, 75], 72) }),
    eyeKey(0.905, [38.5, EYE, 52.2], [12, 4.4, 45], 60, { ph: eyeKey(0.905, [38.5, EYE, 52.2], [12, 4.6, 45], 72) }),
    eyeKey(0.93, [29, EYE, 52.2], [8, 4, 43], 60, { ph: eyeKey(0.93, [30, EYE, 52.6], [8, 4.2, 43], 72) }),
    eyeKey(0.955, [26, EYE, 52.4], [7, 4, 42], 58, { ph: eyeKey(0.955, [27, EYE, 52.8], [7, 4.2, 42], 70) }),
    // and back out through the roof to the whole house, finished
    { at: 0.99, t: [33, 9, 27], az: -52, el: 27, fov: 1.5, h: 112, sx: 0.12, sy: -0.02, ph: { h: 250, sx: 0, sy: 0.06 } },
    { at: 1.0, t: [33, 9, 27], az: -52, el: 27, fov: 1.5, h: 112, sx: 0.12, sy: -0.02, ph: { h: 250, sx: 0, sy: 0.06 } },
  ];
  keys[4].easeFn = t => ease(t);

  const STOPS = [
    { id: 'porch', a: 0.55, b: 0.735, lv: 'ARRIVAL // FRONT PORCH · +0′-0″', t: 'The two-story entry', m: '10 ft oak pivot door  ·  glass to the roof  ·  21 ft porch' },
    { id: 'foyer', a: 0.775, b: 0.83, lv: 'FOYER // 14′ × 16′ · 21′ CEILING', t: 'A stair that floats', m: 'Oak treads on one steel stringer  ·  glass wine room underneath' },
    { id: 'family', a: 0.86, b: 0.905, lv: 'FAMILY // 16′ × 20′ · 21′ CEILING', t: 'Two stories of glass', m: 'Stone fireplace wall  ·  looking out to the patio and pool' },
    { id: 'kitchen', a: 0.925, b: 0.96, lv: "KITCHEN // 20′ × 20′ · BUTLER'S PANTRY", t: 'Cook, gather, host', m: 'Waterfall island with stools  ·  dining for eight beside it' },
    { id: 'back', a: 0.975, b: 1.05, lv: 'SHEET A-01 // CONCEPT RESIDENCE NO. 01', t: 'Drawn before it is built', m: 'This is how we plan every Sebby home  ·  start yours below' },
  ];

  function update(p) {
    const land = {};
    for (const id of ORDER) { const [a, b] = landAt(id); land[id] = ease(win(p, a, b)); }
    const cur = ORDER.reduce((c, id) => p >= landAt(id)[0] - 0.006 ? id : c, null);
    for (const L of layers) {
      const [a, b] = landAt(L.id), u = land[L.id];
      L.g.visible = p > a;
      L.g.position.y = L.id === 'glazing' ? 0 : DROP * (1 - u);
      const pull = PULL[L.id] ? PULL[L.id] * (1 - u) : 0;
      for (const s of L.subs) if (!s.isDoor) s.g.position.copy(s.dir).multiplyScalar(pull);
      const on = L.id === cur && p < b + 0.012;
      for (const m of L.lines) m.color.set(on ? ACCENT : INK);
      L.label.on = on;
      L.label.op = (p < a ? (ctx.phone ? 0 : 0.22) : p > b + 0.012 ? 0.55 : 1) * (1 - win(p, 0.40, 0.45));
    }
    // the pivot door swings open as the camera reaches the porch
    pivot.rotation.y = -1.35 * ease(win(p, 0.6, 0.7));

    // dotted lines from the stage being lowered down to where it lands
    const ls = [];
    for (const id of ORDER) {
      const off = DROP * (1 - land[id]);
      if (id === 'glazing' || off < 0.2 || p < landAt(id)[0]) continue;
      for (const [x, z] of corners) ls.push([x, TOP[id] + off, z, x, TOP[id], z]);
    }
    const gp = PULL.glazing * (1 - land.glazing);
    if (gp > 0.2 && p > landAt('glazing')[0]) for (const [x, z, dx, dz] of [[40, 0, 0, -1], [40, 54, 0, 1], [66, 30, 1, 0], [0, 30, -1, 0]]) ls.push([x, 5, z, x + dx * gp, 5, z + dz * gp]);
    dash.set(ls);

    const landed = ORDER.filter(id => land[id] > 0.98).length;
    let cap = '', capOp = 0, activeStop = p < 0.52 ? 'axo' : 'porch';
    for (const s of STOPS) {
      const v = win(p, s.a, s.a + 0.03) * (1 - win(p, s.b - 0.025, s.b));
      if (v > capOp) { capOp = v; cap = `<span class="lv">${s.lv}</span><span class="t">${s.t}</span><span class="m">${s.m}</span>`; }
      if (p >= s.a - 0.01) activeStop = s.id;
    }
    return {
      hero: 1 - clamp((p - 0.39) / 0.05),
      counter: p < 0.54 ? `Stage <b>${String(Math.min(7, landed + (p > T0 ? 1 : 0))).padStart(2, '0')}</b> / 07` : '',
      hint: p < 0.42 ? 'Scroll to build it' : p < 0.62 ? 'Scroll to the front door' : p < 0.74 ? 'Scroll to walk in' : p > 0.985 ? 'Scroll to start yours' : '',
      cap, capOp, stop: activeStop,
    };
  }

  const planPath = ROOMS.filter(r => r.lvl === 1).map(r => `M${r.x0} ${r.z0}H${r.x1}V${r.z1}H${r.x0}Z`).join(' ');
  return {
    update, keys, R: 260,
    colX: () => ctx.phone ? ctx.W - 150 : ctx.W * 0.74,
    draw: { dir: [0, 1, 0], radial: 0, min: -4, max: 78, soft: 4 },
    radar: {
      scale: '1/8″ = 1′', viewBox: '-4 -10 74 70', plan: planPath, strokeW: 0.5, dotR: 1.8, coneW: 0.5, coneLen: 9,
      clampX: [-2, 68], clampZ: [-9, 56], axoDot: [70, -8], axoAng: 2.4,
      zones: [
        { stop: 'porch', p: 0.66, tag: 'PORCH // FRONT DOOR', x: 33, y: -6, w: 14, h: 12 },
        { stop: 'foyer', p: 0.8, tag: 'FOYER // STAIR', x: 33, y: 6, w: 14, h: 28 },
        { stop: 'family', p: 0.88, tag: 'FAMILY // POOL VIEW', x: 33, y: 34, w: 16, h: 20 },
        { stop: 'kitchen', p: 0.94, tag: 'KITCHEN // DINING', x: 0, y: 34, w: 33, h: 20 },
      ],
      stops: [
        { stop: 'axo', p: 0.2, tag: 'AXO // STAGES 01-07', label: 'BUILD' },
        { stop: 'porch', p: 0.66, tag: 'PORCH // FRONT DOOR', label: 'PORCH' },
        { stop: 'foyer', p: 0.8, tag: 'FOYER // STAIR', label: 'FOYER' },
        { stop: 'family', p: 0.88, tag: 'FAMILY // POOL VIEW', label: 'FAMILY' },
        { stop: 'kitchen', p: 0.94, tag: 'KITCHEN // DINING', label: 'KITCHEN' },
      ],
    },
    chrome: {
      kicker: 'Concept Residence No. 01 · Sheet A-01',
      loader: 'Plotting sheet A-01',
      h1: 'A Sebby home,<br><em>layer by layer.</em>',
      lede: 'A concept home, drawn the way we plan every build. Scroll to put it together in building order, then walk up to the front door.',
      spec: [['Home', 'Concept, not a client home'], ['Size', '~4,400 sq ft · 2 stories'], ['Rooms', '4 bed · 4.5 bath · study'], ['Garage', '3 cars']],
      hint: 'Scroll to build it',
    },
  };
}

/* ---------------- the site plan, drawn once into a canvas ---------------- */

function drawPlan(P) {
  const S = 16, W = (P.x1 - P.x0) * S, H = (P.z1 - P.z0) * S;
  const X = x => (x - P.x0) * S, Y = z => (z - P.z0) * S;
  return canvasTex(W, H, (g) => {
    g.fillStyle = '#f2efe7'; g.fillRect(0, 0, W, H);
    g.strokeStyle = INK; g.fillStyle = INK;
    g.lineWidth = 2.6; g.strokeRect(30, 30, W - 60, H - 60); g.lineWidth = 1; g.strokeRect(40, 40, W - 80, H - 80);
    const line = (x0, z0, x1, z1, w = 2, dash = []) => { g.setLineDash(dash); g.lineWidth = w; g.beginPath(); g.moveTo(X(x0), Y(z0)); g.lineTo(X(x1), Y(z1)); g.stroke(); g.setLineDash([]); };
    const rect = (x0, z0, x1, z1, w = 2, fill) => { if (fill) { g.fillStyle = fill; g.fillRect(X(x0), Y(z0), X(x1) - X(x0), Y(z1) - Y(z0)); g.fillStyle = INK; } if (w) { g.lineWidth = w; g.strokeRect(X(x0), Y(z0), X(x1) - X(x0), Y(z1) - Y(z0)); } };
    // property line and setbacks
    line(-24, -36, 90, -36, 2, [30, 10, 6, 10]); line(90, -36, 90, 104, 2, [30, 10, 6, 10]); line(90, 104, -24, 104, 2, [30, 10, 6, 10]); line(-24, 104, -24, -36, 2, [30, 10, 6, 10]);
    g.font = '500 22px "IBM Plex Mono"'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText('PROPERTY LINE · 114′ × 140′ LOT', X(-22), Y(-38.5));
    // drive, walk, patio and pool deck, hatched
    const hatch = (x0, z0, x1, z1, step = 1.6) => { g.save(); g.beginPath(); g.rect(X(x0), Y(z0), X(x1) - X(x0), Y(z1) - Y(z0)); g.clip(); g.lineWidth = 0.8; g.strokeStyle = '#8f897d'; for (let k = -(z1 - z0); k < x1 - x0; k += step) { g.beginPath(); g.moveTo(X(x0 + k), Y(z1)); g.lineTo(X(x0 + k + (z1 - z0)), Y(z0)); g.stroke(); } g.restore(); rect(x0, z0, x1, z1, 1.4); };
    hatch(1, -36, 32, 0, 2.4); hatch(37, -36, 43, -6, 1.2); hatch(4, 54, 49, 68, 1.4); hatch(10, 68, 54, 94, 1.4);
    rect(16.2, 72.2, 47.8, 87.8, 2.4, '#e6eeec');
    g.strokeStyle = '#8fb3b6'; g.lineWidth = 1.2;
    for (let z = 74; z < 87; z += 2.2) { g.beginPath(); for (let x = 17; x < 47.4; x += 0.5) g.lineTo(X(x), Y(z + Math.sin(x * 0.9 + z) * 0.25)); g.stroke(); }
    g.strokeStyle = INK;
    // grid with bubbles
    g.font = '500 24px "IBM Plex Mono"'; g.textAlign = 'center';
    [[0, 'A'], [33, 'B'], [47, 'C'], [66, 'D']].forEach(([x, n]) => { line(x, -30, x, 60, 1, [24, 8, 4, 8]); g.beginPath(); g.arc(X(x), Y(-31.6), 22, 0, 7); g.stroke(); g.fillText(n, X(x), Y(-31.6)); });
    [[0, '1'], [23, '2'], [34, '3'], [54, '4']].forEach(([z, n]) => { line(-18, z, 76, z, 1, [24, 8, 4, 8]); g.beginPath(); g.arc(X(-19.6), Y(z), 22, 0, 7); g.stroke(); g.fillText(n, X(-19.6), Y(z)); });
    // roof outline, dashed
    for (const [x0, z0, x1, z1] of ROOFS) { line(x0, z0, x1, z0, 1.4, [14, 10]); line(x1, z0, x1, z1, 1.4, [14, 10]); line(x1, z1, x0, z1, 1.4, [14, 10]); line(x0, z1, x0, z0, 1.4, [14, 10]); }
    // level 1 walls in poché, openings left white
    for (const r of wallRuns().filter(q => q.lvl === 1 && q.kind !== 'rail')) {
      const t = r.kind === 'ext' ? 0.7 : 0.45;
      let rects = [[r.a, r.b]];
      if (r.kind === 'ext') {
        for (const o of OPEN.filter(o => o[0] === r.axis && o[1] === r.line && o[4] < 4)) rects = rects.flatMap(([u0, u1]) => [[u0, Math.min(u1, o[2])], [Math.max(u0, o[3]), u1]]).filter(([u0, u1]) => u1 - u0 > 0.01);
      } else {
        const door = DOORS.find(([p, q]) => [p, q].sort().join('|') === r.tag);
        if (door) { const w = Math.min(door[2], r.b - r.a - 1), m = (r.a + r.b) / 2; rects = [[r.a, m - w / 2], [m + w / 2, r.b]]; }
      }
      for (const [u0, u1] of rects) {
        if (r.axis === 'x') g.fillRect(X(r.line - t / 2), Y(u0), X(r.line + t / 2) - X(r.line - t / 2), Y(u1) - Y(u0));
        else g.fillRect(X(u0), Y(r.line - t / 2), X(u1) - X(u0), Y(r.line + t / 2) - Y(r.line - t / 2));
      }
    }
    // glass as double lines
    for (const [axis, l, a, b, y0] of OPEN) {
      if (y0 > 4) continue;
      if (axis === 'z') { line(a, l - 0.2, b, l - 0.2, 1.2); line(a, l + 0.2, b, l + 0.2, 1.2); }
      else { line(l - 0.2, a, l - 0.2, b, 1.2); line(l + 0.2, a, l + 0.2, b, 1.2); }
    }
    // the pivot door swing
    g.lineWidth = 1.2; g.beginPath(); g.arc(X(39), Y(6), 4 * S, 0.5 * Math.PI, Math.PI * 0.93); g.stroke();
    // stair treads, island, table
    for (let i = 0; i <= 16; i++) line(33.8 + i * 0.83, 22.4, 33.8 + i * 0.83, 26, 0.9);
    line(34, 24.2, 46.5, 24.2, 1.2); g.font = '400 18px "IBM Plex Mono"'; g.fillText('UP', X(36), Y(23.4));
    rect(5.9, 41.9, 16.1, 46.1, 1.6); rect(23, 40.5, 30.5, 45.5, 1.6); rect(2.5, 34.4, 17.5, 36.6, 1.2); rect(0.4, 36.6, 2.6, 53.6, 1.2); rect(2.6, 51.4, 18, 53.6, 1.2);
    for (const x of [7, 17.5, 28]) { line(x - 3.6, 3, x + 3.6, 3, 1, [8, 6]); }
    // room names and sizes
    for (const r of ROOMS.filter(q => q.lvl === 1)) {
      const cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, small = r.x1 - r.x0 < 10 || r.z1 - r.z0 < 9;
      g.fillStyle = INK; g.font = `700 ${small ? 20 : 28}px "Chakra Petch"`;
      const lab = r.id === 'stair' ? 'STAIR' : r.name.toUpperCase();
      g.fillText(lab, X(cx), Y(cz) - (small ? 8 : 12));
      g.font = `400 ${small ? 15 : 18}px "IBM Plex Mono"`;
      g.fillText(`${r.x1 - r.x0}′ × ${r.z1 - r.z0}′`, X(cx), Y(cz) + (small ? 10 : 16));
    }
    g.font = '700 26px "Chakra Petch"';
    g.fillText('PORCH', X(40), Y(-2)); g.fillText('COVERED PATIO', X(18.5), Y(61)); g.fillText('POOL', X(32), Y(80));
    g.fillText('DRIVE', X(16.5), Y(-18)); g.font = '400 18px "IBM Plex Mono"'; g.fillText('32′ × 16′ · SPA READY', X(32), Y(83.5));
    // dimensions
    const dim = (x0, x1, z, t) => { line(x0, z, x1, z, 1.1); for (const x of [x0, x1]) line(x - 0.6, z + 0.6, x + 0.6, z - 0.6, 2); g.font = '400 20px "IBM Plex Mono"'; g.fillText(t, X((x0 + x1) / 2), Y(z) - 16); };
    dim(0, 66, -26, `66′-0″`); dim(0, 33, -22, `33′-0″`); dim(33, 47, -22, `14′-0″`); dim(47, 66, -22, `19′-0″`);
    line(74, 0, 74, 54, 1.1); for (const z of [0, 54]) line(73.4, z + 0.6, 74.6, z - 0.6, 2);
    g.save(); g.translate(X(74), Y(27)); g.rotate(-Math.PI / 2); g.font = '400 20px "IBM Plex Mono"'; g.fillText(`54′-0″`, 0, -16); g.restore();
    // north arrow and title block
    g.save(); g.translate(X(80), Y(-24)); g.lineWidth = 1.6; g.beginPath(); g.arc(0, 0, 34, 0, 7); g.stroke();
    g.beginPath(); g.moveTo(0, -30); g.lineTo(12, 14); g.lineTo(0, 6); g.lineTo(-12, 14); g.closePath(); g.fill();
    g.font = '700 22px "Chakra Petch"'; g.fillText('N', 0, -50); g.restore();
    const tbx = X(62), tby = Y(96), tbw = X(96) - X(62), tbh = Y(108) - Y(96);
    g.lineWidth = 2; g.strokeRect(tbx, tby, tbw, tbh); g.lineWidth = 1;
    g.beginPath(); g.moveTo(tbx, tby + tbh * 0.55); g.lineTo(tbx + tbw, tby + tbh * 0.55); g.moveTo(tbx + tbw * 0.62, tby + tbh * 0.55); g.lineTo(tbx + tbw * 0.62, tby + tbh); g.stroke();
    g.textAlign = 'left'; g.font = '700 30px "Chakra Petch"'; g.fillText('SEBBY HOMES', tbx + 18, tby + tbh * 0.22);
    g.font = '500 18px "IBM Plex Mono"'; g.fillText('CONCEPT RESIDENCE NO. 01 · DALLAS–FORT WORTH', tbx + 18, tby + tbh * 0.42);
    g.fillText('SITE + LEVEL 1 PLAN · FOR ILLUSTRATION', tbx + 18, tby + tbh * 0.77);
    g.font = '700 34px "Chakra Petch"'; g.fillText('A-01', tbx + tbw * 0.62 + 22, tby + tbh * 0.79);
  });
}
