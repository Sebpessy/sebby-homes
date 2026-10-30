// Plan 818220JSS by Architectural Designs: a one-story transitional farmhouse with a bonus room over the
// garage, modeled in 3D by Sebby Homes with the designer's permission. The rooms and their sizes are the
// plan's; roof heights come from its 12/12 pitch and 28′-9″ ridge, finishes from its renderings.
// Units are feet. x runs across the front (left to right seen from the street), z from the front of the
// garage (z = 0) to the back yard, y is up. The slab is y 0 and the bonus room floor is y 10.
// Built on the "Exploded House" technique from Flat to 3D by Samnang Aing (MIT, see core.js).
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  THREE, Part, bx, cyl, beam, V, clamp, ease, win,
  scene, lineMat, toneMat, segs, liveLine, eyeKey, canvasTex, ctx, ACCENT, INK, patchFill,
} from '../concept-home/core.js';

/* ---------------- the plan ---------------- */

const LVL2 = 10, EYE = 5.4, G = 0.5;

// blocks of the house: footprint and wall plate height. Exterior walls come from these.
const VOLS = [
  { x0: 0, z0: 62, x1: 17.5, z1: 114.5, h: 12 },     // primary wing: closet, bath, suite
  { x0: -8, z0: 80, x1: 0, z1: 92.5, h: 10 },        // tub bay
  { x0: 17.5, z0: 64, x1: 29.5, z1: 81.5, h: 10 },   // gym / office and gallery
  { x0: 29.5, z0: 59, x1: 58.5, z1: 81.5, h: 16.5 }, // great room
  { x0: 58.5, z0: 48.5, x1: 77, z1: 84, h: 16 },     // kitchen and dining
  { x0: 77, z0: 49, x1: 106.5, z1: 82, h: 10 },      // bedroom wing
  { x0: 77, z0: 82, x1: 97, z1: 97, h: 10 },         // bedroom 2
  { x0: 88.5, z0: 36, x1: 106.5, z1: 49, h: 11.5 },  // mud room, stair, bedroom 4
  { x0: 85.5, z0: 0, x1: 109.5, z1: 36, h: 11.5 },   // three-car garage, bonus room above
];

// rooms: [id, level, x0, z0, x1, z1, name, floor, open-plan group, flat ceiling]
export const ROOMS = [
  ['primary', 1, 0, 96, 17.5, 114.5, 'Primary suite', 'oak'],
  ['pbath', 1, 0, 77, 13, 96, 'Primary bath', 'stone', 'pb'],
  ['tubbay', 1, -8, 80, 0, 92.5, '', 'stone', 'pb', 10],
  ['closet', 1, 0, 62, 17.5, 77, 'Closet', 'oak'],
  ['gal', 1, 13, 81.5, 17.5, 96, '', 'oak', 'gal', 10],
  ['gal2', 1, 13, 77, 29.5, 81.5, '', 'oak', 'gal', 10],
  ['gym', 1, 17.5, 64, 29.5, 77, 'Gym / office', 'oak', null, 10],
  ['great', 1, 29.5, 59, 58.5, 81.5, 'Great room', 'oak', 'great'],
  ['kitchen', 1, 58.5, 63.5, 77, 84, 'Kitchen', 'oak', 'great'],
  ['dining', 1, 58.5, 48.5, 77, 63.5, 'Dining', 'oak', 'great'],
  ['kalc', 1, 77, 63.5, 79.5, 77.5, '', 'oak', 'great', 10],
  ['pantry', 1, 79.5, 63.5, 87.5, 77.5, 'Pantry', 'oak', null, 10],
  ['hall', 1, 77, 77.5, 87.5, 82, '', 'oak', null, 10],
  ['bath2', 1, 77, 82, 83.5, 97, 'Bath', 'stone', null, 10],
  ['bed2', 1, 83.5, 82, 97, 97, 'Bedroom 2', 'oak', null, 10],
  ['b3a', 1, 87.5, 77.5, 93, 82, '', 'oak', 'b3', 10],
  ['bed3', 1, 93, 69, 106.5, 82, 'Bedroom 3', 'oak', 'b3', 10],
  ['b3clos', 1, 87.5, 69, 93, 77.5, 'Closet', 'oak', null, 10],
  ['bath3', 1, 87.5, 63.5, 100.5, 69, 'Bath', 'stone', 'b3b', 10],
  ['bath3b', 1, 94.5, 58, 100.5, 63.5, '', 'stone', 'b3b', 10],
  ['bath4', 1, 100.5, 58, 106.5, 69, 'Bath', 'stone', null, 10],
  ['bed4', 1, 94.5, 44.5, 106.5, 58, 'Bedroom 4', 'oak', null, 10],
  ['bhall', 1, 77, 59, 88.5, 63.5, '', 'oak', 'bh', 10],
  ['utility', 1, 77, 49, 88.5, 59, 'Utility', 'stone', null, 10],
  ['mud', 1, 88.5, 36, 94.5, 63.5, 'Mud room', 'stone', 'bh', 9],
  ['stair', 1, 94.5, 36, 106.5, 44.5, 'Stair', 'oak', null, 10],
  ['garage', 1, 85.5, 0, 109.5, 36, '3 car garage', 'concrete', null, 9],
  ['bonus', 2, 89, 0, 106, 36, 'Bonus room', 'oak', 'bon'],
  ['bland', 2, 94.5, 36, 106, 40, '', 'oak', 'bon'],
  ['bland2', 2, 105.5, 40, 106, 44.5, '', 'oak', 'bon'],
  ['bbath', 2, 89, 36, 94.5, 44.5, 'Bath', 'stone'],
].map(([id, lvl, x0, z0, x1, z1, name, floor, group, c]) => ({ id, lvl, x0, z0, x1, z1, name, floor, group, c }));

// doors between rooms: [room, room, width], centered on the wall they share; open-plan groups need none
const DOORS = [
  ['primary', 'gal', 3], ['primary', 'pbath', 3.5], ['pbath', 'closet', 3], ['pbath', 'gal', 3], ['gal2', 'gym', 4],
  ['gal2', 'great', 3], ['dining', 'bhall', 3.5], ['kitchen', 'hall', 3.5], ['hall', 'pantry', 3], ['hall', 'bed2', 3],
  ['bed2', 'bath2', 3], ['hall', 'b3a', 3], ['bed3', 'bath3', 3], ['bath3', 'b3clos', 2.5], ['bath4', 'bed4', 3], ['bland', 'bbath', 3],
  ['bhall', 'utility', 3], ['mud', 'bed4', 3], ['mud', 'stair', 7], ['garage', 'mud', 3],
];

// openings in the exterior: [axis, line, from, to, y0, y1, kind]; axis 'z' is a wall at constant z
const OPEN = [
  // front
  ['z', 62, 3, 14.5, 0.5, 11, 'win'], ['z', 64, 20.5, 26.5, 0.2, 8.5, 'win'],
  ['z', 59, 31.5, 36.5, 0.2, 8.5, 'win'], ['z', 59, 40, 45, 0.2, 8.5, 'win'], ['z', 59, 48.5, 55, 0.2, 8.5, 'entry'],
  ['z', 59, 31.5, 36.5, 11.5, 14.5, 'win'], ['z', 59, 40, 45, 11.5, 14.5, 'win'], ['z', 59, 48.5, 55, 11.5, 14.5, 'win'],
  ['z', 48.5, 60.5, 75, 0.2, 15.5, 'win'], ['z', 49, 79.5, 85, 3, 8, 'win'],
  ['z', 0, 89.5, 105.5, 1.5, 9, 'win'], ['z', 0, 95.5, 99.5, 14, 19, 'win'],
  // left side
  ['x', -8, 82.5, 90, 2.5, 8, 'win'], ['x', 0, 99, 111, 2, 9.5, 'win'], ['x', 58.5, 50.5, 57, 0.5, 9, 'win'],
  ['x', 85.5, 2.5, 11, 0, 8, 'garage'], ['x', 85.5, 13.5, 22, 0, 8, 'garage'], ['x', 85.5, 24.5, 33, 0, 8, 'garage'],
  ['x', 88.5, 39.5, 43.5, 3, 8, 'win'],
  // right side
  ['x', 17.5, 99.5, 104, 0.2, 8.5, 'win'], ['x', 17.5, 106, 110.5, 0.2, 8.5, 'win'], ['x', 17.5, 85, 90, 0.2, 8.5, 'win'],
  ['x', 97, 85, 93, 3, 8, 'win'], ['x', 106.5, 71, 78, 3, 8, 'win'], ['x', 106.5, 61, 65, 5, 8, 'win'],
  ['x', 106.5, 48, 55, 3, 8, 'win'], ['x', 109.5, 14, 22, 4, 8, 'win'],
  // back
  ['z', 114.5, 3.5, 14, 2, 11, 'win'],
  ['z', 81.5, 31.5, 36.5, 0.2, 8.5, 'win'], ['z', 81.5, 40, 45, 0.2, 8.5, 'win'], ['z', 81.5, 48.5, 55, 0.2, 8.5, 'win'],
  ['z', 81.5, 31.5, 36.5, 11.5, 14.5, 'win'], ['z', 81.5, 40, 45, 11.5, 14.5, 'win'], ['z', 81.5, 48.5, 55, 11.5, 14.5, 'win'],
  ['z', 84, 60.5, 75, 3.5, 10, 'win'], ['z', 97, 86, 94, 3, 8, 'win'], ['z', 97, 78.5, 81.5, 5, 8, 'win'], ['z', 82, 98.5, 104.5, 3, 8, 'win'],
];

// roofs. gable: ridge along 'x' or 'z', 12/12, gable walls at the listed ends; hip: 12/12 all round;
// shed: the 1/12 porch roofs, high against the house. oh is the eave overhang, rk the rake.
const ROOFS = [
  { t: 'gable', r: 'x', x0: 29.5, z0: 59, x1: 58.5, z1: 81.5, e: 16.5, ends: [1, 1], o: { x1: 0 } },           // great room
  { t: 'gable', r: 'z', x0: 58.5, z0: 48.5, x1: 77, z1: 84, e: 16, ends: [1, 1], glass: 0, o: { x0: 0 } },     // kitchen and dining, glass gable to the front
  { t: 'gable', r: 'z', x0: 0, z0: 62, x1: 17.5, z1: 114.5, e: 12, ends: [1, 1] },               // primary wing
  { t: 'gable', r: 'x', x0: -8, z0: 80, x1: 0, z1: 92.5, e: 10, ends: [1, 0], o: { x1: 0 } },                  // tub bay
  { t: 'gable', r: 'z', x0: 17.5, z0: 64, x1: 29.5, z1: 81.5, e: 10, ends: [1, 1], o: { x0: 0, x1: 0 } },             // gym and gallery
  { t: 'hip', x0: 77, z0: 49, x1: 106.5, z1: 82, e: 10, o: { x0: 0, z0: 0, z1: 0 } },                                        // bedroom wing
  { t: 'gable', r: 'z', x0: 77, z0: 82, x1: 97, z1: 97, e: 10, ends: [0, 1], o: { x0: 0, z0: 0 } },                    // bedroom 2
  { t: 'gable', r: 'z', x0: 85.5, z0: 0, x1: 109.5, z1: 49, e: 11.5, ends: [1, 1] },             // garage and the bonus room
  { t: 'shed', x0: 29.5, z0: 52.5, x1: 58.5, z1: 59, low: 'z0', e: 10.5, o: { x1: 0 } },                       // front porch
  { t: 'shed', x0: 17.5, z0: 81.5, x1: 58.5, z1: 93.5, low: 'z1', e: 10.6 },                     // back porch
  { t: 'shed', x0: 58.5, z0: 84, x1: 77, z1: 93.5, low: 'z1', e: 10.4, o: { x1: 0 } },
  { t: 'shed', x0: 17.5, z0: 93.5, x1: 29.5, z1: 114.5, low: 'x1', e: 10.6 },                    // primary porch
];
const PORCH_POSTS = [[29.8, 52.8], [58.2, 52.8], [29.2, 114.2], [29.2, 93.5], [58.5, 93.2], [76.7, 93.2]];

// the walls that get dark board and batten, and the one in limestone; everything else is cedar
const DARK = [['z', 62, 0, 17.5], ['z', 64, 17.5, 29.5], ['z', 97, 77, 97], ['z', 49, 77, 88.5], ['x', -8, 80, 92.5], ['z', 80, -8, 0], ['z', 92.5, -8, 0], ['x', 88.5, 36, 49]];
const STONE = [['z', 84, 58.5, 77]];
const skin = (axis, line, mid) => {
  const hit = L => L.some(([a, l, u0, u1]) => a === axis && Math.abs(l - line) < 0.01 && mid > u0 && mid < u1);
  return hit(STONE) ? 'limestone' : hit(DARK) ? 'charcoal' : 'cedar';
};

const inside = (v, x, z) => x > v.x0 && x < v.x1 && z > v.z0 && z < v.z1;
const cellH = (x, z) => { let h = 0; for (const v of VOLS) if (inside(v, x, z)) h = Math.max(h, v.h); return h; };
const roomAt = (lvl, x, z) => ROOMS.find(r => r.lvl === lvl && inside(r, x, z)) || null;

// walls as runs on a half-foot grid: exterior where the plate height changes, interior where the room changes
function wallRuns() {
  const segs = [];
  const push = (axis, line, a, y0, y1, kind, tag = '') => segs.push({ axis, line, a, b: a + G, y0, y1, kind, lvl: 1, tag });
  for (let i = -20; i <= 222; i++) for (let j = -4; j <= 232; j++) {
    const X = i * G, Z = j * G;
    for (const [axis, line, a, ca, cb] of [['x', X, Z, [X - G / 2, Z + G / 2], [X + G / 2, Z + G / 2]], ['z', Z, X, [X + G / 2, Z - G / 2], [X + G / 2, Z + G / 2]]]) {
      const ha = cellH(...ca), hb = cellH(...cb);
      if (ha !== hb) push(axis, line, a, Math.min(ha, hb), Math.max(ha, hb), 'ext');
      const ra = roomAt(1, ...ca), rb = roomAt(1, ...cb);
      if (ra && rb && ra !== rb && !(ra.group && ra.group === rb.group)) {
        // up to the taller flat ceiling of the two; between two vaulted rooms, up to the plate
        const top = ra.c && rb.c ? Math.max(ra.c, rb.c) : ra.c || rb.c || Math.min(ha, hb);
        push(axis, line, a, 0, top, 'int', [ra.id, rb.id].sort().join('|'));
      }
    }
  }
  const runs = new Map();
  for (const s of segs) { const k = [s.axis, s.line, s.y0, s.y1, s.kind, s.tag].join('/'); (runs.get(k) || runs.set(k, []).get(k)).push(s); }
  const out = [];
  for (const list of runs.values()) {
    list.sort((p, q) => p.a - q.a);
    let cur = { ...list[0] };
    for (let n = 1; n < list.length; n++) { if (list[n].a === cur.b) cur.b = list[n].b; else { out.push(cur); cur = { ...list[n] }; } }
    out.push(cur);
  }
  return out;
}

// where a door sits on the wall two rooms share
function doorAt(tag, r) {
  const door = DOORS.find(([p, q]) => [p, q].sort().join('|') === tag);
  if (!door) return null;
  const w = Math.min(door[2], r.b - r.a - 1), m = (r.a + r.b) / 2;
  return [m - w / 2, m + w / 2];
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

/* ---------------- roof geometry ---------------- */

// the top faces of each roof as flat polygons, the gable triangles under them, and the outline on the plan
function roofPlanes(R) {
  const oh = R.oh ?? 1.5, rk = R.rk ?? 1.2;
  const { x0, z0, x1, z1, e } = R, xm = (x0 + x1) / 2, zm = (z0 + z1) / 2;
  // how far the roof runs past each wall; 0 where the wall meets a taller room, so no eave pokes inside
  const O = (side, d) => R.o?.[side] ?? d;
  const planes = [], gables = [];
  if (R.t === 'gable' && R.r === 'x') {
    const H = e + (zm - z0), a = O('x0', rk), b = O('x1', rk), c = O('z0', oh), d = O('z1', oh);
    planes.push([[x0 - a, e - c, z0 - c], [x1 + b, e - c, z0 - c], [x1 + b, H, zm], [x0 - a, H, zm]]);
    planes.push([[x1 + b, e - d, z1 + d], [x0 - a, e - d, z1 + d], [x0 - a, H, zm], [x1 + b, H, zm]]);
    [x0, x1].forEach((l, k) => { if (R.ends[k]) gables.push({ axis: 'x', line: l, pts: [[z0, e], [z1, e], [zm, H - 0.5]], glass: R.glass === k, out: k ? 1 : -1 }); });
    return { planes, gables, H, rect: [x0 - a, z0 - c, x1 + b, z1 + d] };
  }
  if (R.t === 'gable') {
    const H = e + (xm - x0), a = O('x0', oh), b = O('x1', oh), c = O('z0', rk), d = O('z1', rk);
    planes.push([[x0 - a, e - a, z1 + d], [x0 - a, e - a, z0 - c], [xm, H, z0 - c], [xm, H, z1 + d]]);
    planes.push([[x1 + b, e - b, z0 - c], [x1 + b, e - b, z1 + d], [xm, H, z1 + d], [xm, H, z0 - c]]);
    [z0, z1].forEach((l, k) => { if (R.ends[k]) gables.push({ axis: 'z', line: l, pts: [[x0, e], [x1, e], [xm, H - 0.5]], glass: R.glass === k, out: k ? 1 : -1 }); });
    return { planes, gables, H, rect: [x0 - a, z0 - c, x1 + b, z1 + d] };
  }
  if (R.t === 'hip') {
    // a hip at 12/12: the roof is the lowest of its four planes, each plane the part of the eave rectangle where it is lowest
    const H = e + Math.min(x1 - x0, z1 - z0) / 2;
    const rect = [x0 - O('x0', oh), z0 - O('z0', oh), x1 + O('x1', oh), z1 + O('z1', oh)];
    const f = [(x, z) => e + (x - x0), (x, z) => e + (x1 - x), (x, z) => e + (z - z0), (x, z) => e + (z1 - z)];
    for (let k = 0; k < 4; k++) {
      let poly = [[rect[0], rect[1]], [rect[2], rect[1]], [rect[2], rect[3]], [rect[0], rect[3]]];
      for (let j = 0; j < 4; j++) {
        if (j === k) continue;
        const g = ([x, z]) => f[k](x, z) - f[j](x, z), out = [];
        poly.forEach((P, i) => {
          const Q = poly[(i + 1) % poly.length], gp = g(P), gq = g(Q);
          if (gp <= 1e-9) out.push(P);
          if ((gp < -1e-9 && gq > 1e-9) || (gp > 1e-9 && gq < -1e-9)) { const t = gp / (gp - gq); out.push([P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]); }
        });
        poly = out;
      }
      const clean = poly.filter((P, i) => { const Q = poly[(i + 1) % poly.length]; return Math.hypot(P[0] - Q[0], P[1] - Q[1]) > 1e-6; });
      if (clean.length >= 3) planes.push(clean.map(([x, z]) => [x, f[k](x, z), z]));
    }
    return { planes, gables, H, rect };
  }
  // shed at 1/12, overhanging on the low side and the two ends
  const o = 1, f = 1 / 12, a = O('x0', o), b = O('x1', o), c = O('z0', o), d = O('z1', o);
  const lowY = side => R.e - (side === 'z0' || side === 'z1' ? (z1 - z0) : (x1 - x0)) * f;
  const yl = lowY(R.low) - o * f, yh = R.e;
  const pts = {
    z0: [[x0 - a, yl, z0 - o], [x1 + b, yl, z0 - o], [x1 + b, yh, z1], [x0 - a, yh, z1]],
    z1: [[x1 + b, yl, z1 + o], [x0 - a, yl, z1 + o], [x0 - a, yh, z0], [x1 + b, yh, z0]],
    x1: [[x1 + o, yl, z1 + d], [x1 + o, yl, z0 - c], [x0, yh, z0 - c], [x0, yh, z1 + d]],
  }[R.low];
  planes.push(pts);
  return { planes, gables, H: yh, shed: true, rect: [Math.min(...pts.map(q => q[0])), Math.min(...pts.map(q => q[2])), Math.max(...pts.map(q => q[0])), Math.max(...pts.map(q => q[2]))] };
}

// a flat polygon given by its top face, made solid by dropping it th along its normal
function slab(P, th) {
  let n = new THREE.Vector3();
  for (let i = 0; i < P.length; i++) { const [a, b] = [P[i], P[(i + 1) % P.length]]; n.x += (a[1] - b[1]) * (a[2] + b[2]); n.y += (a[2] - b[2]) * (a[0] + b[0]); n.z += (a[0] - b[0]) * (a[1] + b[1]); }
  n.normalize();
  if (n.y < 0) { P = [...P].reverse(); n.negate(); }
  const T = P.map(p => V(...p)), B = T.map(p => p.clone().addScaledVector(n, -th));
  const pos = [], nor = [];
  const tri = (a, b, c) => { const nn = b.clone().sub(a).cross(c.clone().sub(a)).normalize(); for (const q of [a, b, c]) { pos.push(q.x, q.y, q.z); nor.push(nn.x, nn.y, nn.z); } };
  for (let i = 1; i < T.length - 1; i++) { tri(T[0], T[i], T[i + 1]); tri(B[0], B[i + 1], B[i]); }
  for (let i = 0; i < T.length; i++) { const j = (i + 1) % T.length; tri(T[i], B[i], B[j]); tri(T[i], B[j], T[j]); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(pos.length / 3 * 2).fill(0), 2));
  return { g, n };
}

// a plane's own frame: across (level, along the eave) and up the slope
function planeFrame(P) {
  const { n } = slab(P, 0.1);
  const up = V(0, 1, 0), s = up.clone().addScaledVector(n, -n.dot(up)).normalize(), u = s.clone().cross(n).normalize();
  const uv = P.map(p => [V(...p).dot(u), V(...p).dot(s)]);
  const c = V(...P[0]).dot(n);
  const at = (a, b, off = 0) => u.clone().multiplyScalar(a).addScaledVector(s, b).addScaledVector(n, c + off);
  // the slice of the plane at a given distance across: lowest and highest point up the slope
  const span = a => {
    const hits = [];
    for (let i = 0; i < uv.length; i++) {
      const [p, q] = [uv[i], uv[(i + 1) % uv.length]];
      if ((p[0] - a) * (q[0] - a) <= 0 && p[0] !== q[0]) hits.push(p[1] + (q[1] - p[1]) * (a - p[0]) / (q[0] - p[0]));
    }
    return hits.length >= 2 ? [Math.min(...hits), Math.max(...hits)] : null;
  };
  return { n, u, s, at, span, a0: Math.min(...uv.map(q => q[0])), a1: Math.max(...uv.map(q => q[0])) };
}

// an upright polygon drawn in a wall's (u, v) and given the wall's thickness between t0 and t1 off its line
function upright(axis, line, pts, t0, t1, holes = []) {
  const s = new THREE.Shape(pts.map(([u, v]) => new THREE.Vector2(u, v)));
  for (const h of holes) s.holes.push(new THREE.Path(h.map(([u, v]) => new THREE.Vector2(u, v))));
  const g = new THREE.ExtrudeGeometry(s, { depth: t1 - t0, bevelEnabled: false });
  if (axis === 'z') g.translate(0, 0, line + t0);
  else g.applyMatrix4(new THREE.Matrix4().set(0, 0, -1, line + t1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1));
  return g;
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
    frame: { mat: toneMat('#8e8a82', { mode: 3, scale: 0.6 }), w: 'thin' },
    roof: { mat: toneMat('#e4e1da', { mode: 2, scale: 0.35 }) },
    metal: { mat: toneMat('#dedbd4', { mode: 3, scale: 0.5 }) },
    soft: { mat: toneMat('#f6f3ec', { mode: 4, scale: 0.3 }), hull: 1, w: 'mid' },
    gold: { mat: toneMat('#e7cf93', { mode: 4, scale: 0.4 }), hull: 1, w: 'thin', thr: 50 },
    top: { mat: toneMat('#f6f4f0', { mode: 0, scale: 0.5 }), w: 'mid' },
    dark: { mat: toneMat('#9f9a90', { mode: 3, scale: 0.6 }), w: 'thin' },
    water: { mat: toneMat('#cfe2e4', { mode: 5, opacity: 0.9 }), edges: false },
    lumber: { mat: toneMat('#efdcb6', { mode: 1, scale: 0.5 }), w: 'thin', thr: 40 },
    sheath: { mat: toneMat('#e9dfc9', { mode: 2, scale: 0.4 }) },
    limestone: { mat: toneMat('#ece6d8', { mode: 2, scale: 0.35 }) },
    cedar: { mat: toneMat('#e8cfa4', { mode: 1, scale: 0.45 }) },
    charcoal: { mat: toneMat('#a8a49b', { mode: 1, scale: 0.45 }) },
  };
  const hatchMat = lineMat({ w: 0.6, color: '#8f897d', opacity: 0.9 });
  const dashMat = lineMat({ w: 0.9, color: INK, dashed: true, dash: 0.9, gap: 0.7, opacity: 0.75 });
  const RF = ROOFS.map(roofPlanes);

  // ---- the site plan the house stands on
  const PLAN = { x0: -36, z0: -44, x1: 136, z1: 136 };
  const plan = new THREE.Mesh(new THREE.PlaneGeometry(PLAN.x1 - PLAN.x0, PLAN.z1 - PLAN.z0).rotateX(-Math.PI / 2),
    patchFill(new THREE.MeshBasicMaterial({ map: drawPlan(PLAN, RF) })));
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

  // 01 Foundation: monolithic slab with thickened edges, the porches a step down, the garage a step lower
  const L1 = layer('slab', '01', 'Foundation', 'Monolithic slab', 1);
  for (const v of VOLS) {
    const top = v.x0 === 85.5 ? -0.35 : 0;
    L1.part.add('concrete', bx(v.x0, -1.5, v.z0, v.x1, top, v.z1));
    L1.part.add('concrete', bx(v.x0, -2.6, v.z0, v.x1, -1.5, v.z0 + 1), bx(v.x0, -2.6, v.z1 - 1, v.x1, -1.5, v.z1),
      bx(v.x0, -2.6, v.z0 + 1, v.x0 + 1, -1.5, v.z1 - 1), bx(v.x1 - 1, -2.6, v.z0 + 1, v.x1, -1.5, v.z1 - 1));
  }
  L1.part.add('concrete', bx(29.5, -1.5, 52.5, 58.5, -0.4, 59), bx(17.5, -1.5, 81.5, 58.5, -0.4, 93.5), bx(58.5, -1.5, 84, 77, -0.4, 93.5), bx(17.5, -1.5, 93.5, 29.5, -0.4, 114.5));
  const tendons = [];
  for (let x = 2; x < 107; x += 6) for (const v of VOLS) if (x > v.x0 && x < v.x1) tendons.push([x, 0.01, v.z0 + 0.6, x, 0.01, v.z1 - 0.6]);
  segs(L1.g, tendons, hatchMat);

  // 02-04 Framing: the 1st Floor walls, the bonus room floor and knee walls over the garage, then the rafters
  const LF1 = layer('frame1', '02', '1st Floor framing', '2×4 studs at 16″ · 10 ft ceilings', 1);
  const LF2 = layer('frame2', '03', 'Bonus room framing', 'Floor joists over the garage · knee walls', 2);
  const LFR = layer('roofframe', '04', 'Roof framing', '12/12 rafters at 24″ · 1/12 porch roofs', 3);
  const LS = layer('sheath', '05', 'Sheathing & decking', 'Walls wrapped · roof decked', 4);
  const LC = layer('clad', '07', 'Siding & stone', 'Cedar · board and batten · limestone', 6);
  const L2 = LC;

  const runs = wallRuns();
  const holesOn = (axis, line) => OPEN.filter(o => o[0] === axis && o[1] === line).map(o => [o[2], o[3], o[4], o[5]]);
  const outOf = (axis, line, mid) => axis === 'z' ? (cellH(mid, line - 0.25) < cellH(mid, line + 0.25) ? -1 : 1) : (cellH(line - 0.25, mid) < cellH(line + 0.25, mid) ? -1 : 1);
  for (const r of runs) {
    const t = r.kind === 'ext' ? 0.7 : 0.45;
    let rects;
    if (r.kind === 'ext') rects = cutRect(r.a - (t / 2), r.b + (t / 2), r.y0, r.y1, holesOn(r.axis, r.line));
    else { const d = doorAt(r.tag, r); rects = d ? cutRect(r.a, r.b, r.y0, r.y1, [[d[0], d[1], r.y0 - 1, r.y0 + 8]]) : [[r.a, r.b, r.y0, r.y1]]; }
    const key = r.kind === 'ext' ? 'white' : 'int';
    for (const [u0, u1, v0, v1] of rects) LS.part.add(key, r.axis === 'x' ? bx(r.line - t / 2, v0, u0, r.line + t / 2, v1, u1) : bx(u0, v0, r.line - t / 2, u1, v1, r.line + t / 2));
  }
  // gable ends: the triangle of wall over the plate at each end of a gable roof
  const gableHoles = (gb) => OPEN.filter(o => o[0] === gb.axis && o[1] === gb.line && o[4] >= gb.pts[0][1] - 0.01).map(o => [[o[2], o[4]], [o[3], o[4]], [o[3], o[5]], [o[2], o[5]]]);
  for (const R of RF) for (const gb of R.gables) {
    if (gb.glass) continue;
    LS.part.add('white', upright(gb.axis, gb.line, gb.pts, -0.35, 0.35, gableHoles(gb)));
  }

  // floors, and the flat ceilings; the great room, kitchen, dining and primary wing are vaulted
  for (const r of ROOMS) {
    if (r.lvl === 1) LC.part.add(r.floor, bx(r.x0, r.floor === 'concrete' ? -0.35 : 0, r.z0, r.x1, r.floor === 'concrete' ? -0.25 : 0.12, r.z1));
    else LS.part.add('sheath', bx(r.x0, LVL2 - 0.12, r.z0, r.x1, LVL2, r.z1));
    if (r.lvl === 1 && r.c && r.id !== 'stair') LS.part.add('int', bx(r.x0, r.c, r.z0, r.x1, r.c + 0.06, r.z1));
  }
  LS.part.add('int', bx(85.5, 9, 0, 89, 9.06, 36), bx(106, 9, 0, 109.5, 9.06, 36));
  const boards = [];
  for (const r of ROOMS.filter(q => q.floor === 'oak')) {
    const y = (r.lvl === 1 ? 0.12 : LVL2) + 0.01;
    for (let z = r.z0 + 0.8; z < r.z1; z += 0.8) boards.push([r.x0, y, z, r.x1, y, z]);
  }
  segs(LC.g, boards, hatchMat);

  // ---- the bonus room over the garage: knee walls, the bath, a rail round the stair, a flat 9 ft ceiling
  const B2 = [
    ['x', 89, 0, 36, LVL2, 15], ['x', 106, 0, 44.5, LVL2, 15], ['x', 89, 36, 44.5, LVL2, 14.5],
    ['z', 44.5, 89, 106, LVL2, 19], ['z', 36, 89, 94.5, LVL2, 19], ['x', 94.5, 36, 44.5, LVL2, 19],
  ];
  for (const [axis, line, a, b, y0, y1] of B2) {
    const holes = axis === 'x' && line === 94.5 ? [[36.5, 39.5, y0 - 1, y0 + 8]] : [];
    for (const [u0, u1, v0, v1] of cutRect(a, b, y0, y1, holes)) LS.part.add('int', axis === 'x' ? bx(line - 0.22, v0, u0, line + 0.22, v1, u1) : bx(u0, v0, line - 0.22, u1, v1, line + 0.22));
    for (let u = a + 0.07; u < b; u += 4 / 3) {
      if (holes.some(h => u > h[0] - 0.2 && u < h[1] + 0.1)) continue;
      LF2.part.add('lumber', axis === 'x' ? bx(line - 0.17, y0, u, line + 0.17, y1, u + 0.13) : bx(u, y0, line - 0.17, u + 0.13, y1, line + 0.17));
    }
  }
  LS.part.add('int', bx(93, 19, 0, 102, 19.06, 36));
  LS.part.add('glass', bx(94.5, LVL2, 39.94, 105.5, LVL2 + 3.4, 40.06));
  LS.part.add('frame', bx(94.5, LVL2 + 3.4, 39.88, 105.5, LVL2 + 3.55, 40.12));
  // bonus floor joists, 16 in on center, over the garage and the mud room
  for (let x = 85.7; x < 109.4; x += 4 / 3) LF2.part.add('lumber', bx(x, 9.06, 0.1, x + 0.13, LVL2 - 0.12, 35.9));
  for (let z = 36.2; z < 44.4; z += 4 / 3) LF2.part.add('lumber', bx(88.6, 9.06, z, 94.4, LVL2 - 0.12, z + 0.13), bx(94.6, 9.06, z, 106.4, LVL2 - 0.12, z + 0.13));
  LF2.part.add('lumber', bx(85.5, 9.06, 0, 109.5, LVL2 - 0.12, 0.12), bx(85.5, 9.06, 35.88, 109.5, LVL2 - 0.12, 36));

  // ---- the roof: rafters at 24 in up each plane, the deck over them, shingle courses on the 12/12, seams on the porches
  const seams = [];
  RF.forEach((R) => {
    for (const P of R.planes) {
      const th = R.shed ? 0.25 : 0.35;
      const { g } = slab(P, th);
      LS.part.add(R.shed ? 'metal' : 'roof', g);
      const F = planeFrame(P);
      const dep = R.shed ? 0.5 : 0.8;
      for (let a = Math.ceil(F.a0 / 2) * 2 + 0.5; a < F.a1 - 0.3; a += 2) {
        const sp = F.span(a); if (!sp || sp[1] - sp[0] < 0.6) continue;
        LFR.part.add('lumber', beam(F.at(a, sp[0] + 0.1, -th - dep / 2), F.at(a, sp[1] - 0.1, -th - dep / 2), 0.15, dep));
        if (R.shed && Math.round(a) % 2 === 0) seams.push([...F.at(a, sp[0], 0.04).toArray(), ...F.at(a, sp[1], 0.04).toArray()]);
      }
      if (!R.shed) {
        // shingle courses, level across the plane
        const bs = []; for (let a = F.a0; a <= F.a1; a += 0.25) { const sp = F.span(a); if (sp) bs.push(sp); }
        const b0 = Math.min(...bs.map(q => q[0])), b1 = Math.max(...bs.map(q => q[1]));
        for (let b = b0 + 1.4; b < b1 - 0.2; b += 1.4) {
          let run = null;
          for (let a = F.a0; a <= F.a1 + 0.26; a += 0.25) {
            const sp = F.span(a), inP = sp && b > sp[0] + 0.05 && b < sp[1] - 0.05;
            if (inP && !run) run = a; else if (!inP && run != null) { seams.push([...F.at(run, b, 0.04).toArray(), ...F.at(a - 0.25, b, 0.04).toArray()]); run = null; }
          }
        }
      }
    }
  });
  segs(LS.g, seams, hatchMat);
  for (const [x, z] of PORCH_POSTS) { LFR.part.add('wood', bx(x - 0.35, 0, z - 0.35, x + 0.35, 9.4, z + 0.35)); }
  LFR.part.add('lumber', bx(29.5, 9.1, 52.5, 58.5, 9.6, 52.9), bx(17.5, 9.1, 93.1, 77, 9.6, 93.5), bx(28.9, 9.1, 93.5, 29.5, 9.6, 114.5));
  // the chimney over the great room fireplace
  LFR.part.add('limestone', bx(27.6, 14, 67.5, 31.4, 30.5, 72.5));
  LS.part.add('dark', bx(27.4, 30.5, 67.3, 31.6, 30.9, 72.7));

  // ---- framing: studs at 16 in along every wall run, plates, headers over the openings
  for (const r of runs) {
    const F = LF1;
    const d = r.kind === 'ext' ? 0.23 : 0.18, w = 0.07;
    const B = (u0, v0, u1, v1, dd = d) => r.axis === 'x' ? bx(r.line - dd, v0, u0, r.line + dd, v1, u1) : bx(u0, v0, r.line - dd, u1, v1, r.line + dd);
    let holes = [];
    if (r.kind === 'ext') holes = holesOn(r.axis, r.line);
    else { const dr = doorAt(r.tag, r); if (dr) holes = [[dr[0], dr[1], r.y0, r.y0 + 8]]; }
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
  // gable-end studs, each cut to the slope
  for (const R of RF) for (const gb of R.gables) {
    if (gb.glass) continue;
    const [[u0, e], [u1], [um, top]] = gb.pts;
    for (let u = u0 + 0.6; u < u1 - 0.3; u += 4 / 3) {
      const h = top - Math.abs(u - um) - 0.2; if (h - e < 0.4) continue;
      const g = gb.axis === 'x' ? bx(gb.line - 0.2, e, u, gb.line + 0.2, h, u + 0.13) : bx(u, e, gb.line - 0.2, u + 0.13, h, gb.line + 0.2);
      LFR.part.add('lumber', g);
    }
  }

  // ---- siding: cedar boards, dark board and batten, limestone on the kitchen's back gable; a skin outside the sheathing
  const course = [];
  const cladRect = (axis, line, out, kind, u0, u1, v0, v1, top) => {
    const lo = Math.min(out * 0.35, out * 0.55), hi = Math.max(out * 0.35, out * 0.55), oc = out * 0.56;
    const P = (u, v) => axis === 'x' ? [line + oc, v, u] : [u, v, line + oc];
    if (kind === 'limestone') for (let v = v0 + 0.9, k = 0; v < v1 - 0.2; v += 0.9, k++) {
      const [a, b] = top ? top(v) : [u0, u1]; if (b - a < 0.3) continue;
      course.push([...P(a, v), ...P(b, v)]);
      for (let u = a + (k % 2 ? 1.1 : 0.4); u < b - 0.2; u += 2.2) course.push([...P(u, v - 0.9), ...P(u, v)]);
    } else for (let u = u0 + (kind === 'charcoal' ? 0.66 : 0.6); u < u1 - 0.1; u += kind === 'charcoal' ? 1.33 : 0.6) {
      const h = top ? top(null, u) : v1; if (h - v0 > 0.2) course.push([...P(u, v0), ...P(u, h)]);
    }
    return [lo, hi];
  };
  for (const r of runs) {
    if (r.kind !== 'ext') continue;
    const mid = (r.a + r.b) / 2, out = outOf(r.axis, r.line, mid);
    const holes = holesOn(r.axis, r.line);
    for (const [u0, u1, v0, v1] of cutRect(r.a - 0.35, r.b + 0.35, r.y0, r.y1, holes)) {
      const kind = skin(r.axis, r.line, (u0 + u1) / 2);
      const [lo, hi] = cladRect(r.axis, r.line, out, kind, u0, u1, v0, v1);
      LC.part.add(kind, r.axis === 'x' ? bx(r.line + lo, v0, u0, r.line + hi, v1, u1) : bx(u0, v0, r.line + lo, u1, v1, r.line + hi));
    }
  }
  for (const R of RF) for (const gb of R.gables) {
    if (gb.glass) continue;
    const [[u0, e], [u1], [um, top]] = gb.pts, out = gb.out, kind = skin(gb.axis, gb.line, um);
    const lo = Math.min(out * 0.35, out * 0.55), hi = Math.max(out * 0.35, out * 0.55);
    LC.part.add(kind, upright(gb.axis, gb.line, [[u0 - 0.35, e], [u1 + 0.35, e], [um, top + 0.35]], lo, hi, gableHoles(gb)));
    const hAt = u => top + 0.2 - Math.abs(u - um);
    cladRect(gb.axis, gb.line, out, kind, u0, u1, e, top, kind === 'limestone' ? v => [um - (top - v), um + (top - v)] : (_, u) => {
      const h = hAt(u); const hole = gableHoles(gb).find(q => u > q[0][0] && u < q[1][0]); return hole ? Math.min(h, hole[0][1]) : h;
    });
  }
  segs(LC.g, course, hatchMat);

  // ---- inside: the great room, kitchen and dining
  L2.part.add('limestone', bx(29.75, 0.12, 66, 31.2, 16.3, 74));
  L2.part.add('dark', bx(31.2, 1.4, 68, 31.3, 4.4, 72), bx(31.2, 0.12, 65.5, 33, 0.5, 74.5));
  L2.part.add('soft', bx(35, 0.12, 63.5, 49, 0.16, 77));
  L2.part.add('soft', rb(40.5, 0.12, 64, 48.5, 1.5, 66.8), rb(40.5, 1.5, 64, 48.5, 2.9, 64.8), rb(46, 0.12, 66.8, 48.8, 1.5, 76), rb(48, 1.5, 66.8, 48.8, 2.9, 76),
    rb(36, 0.12, 74.5, 43, 1.5, 77.2), rb(36, 1.5, 76.4, 43, 2.9, 77.2));
  L2.part.add('wood', bx(39, 0.12, 68.5, 44, 1.3, 72.5));
  L2.part.add('gold', rb(41, 1.5, 64.9, 42.4, 2.6, 65.9, 0.2), rb(46.9, 1.5, 74, 47.9, 2.6, 75.4, 0.2));
  // kitchen: back counter with the sink under the window, two islands, an appliance wall, pendants
  L2.part.add('wood', bx(59, 0.12, 81.4, 76.6, 3, 83.6), bx(77.2, 0.12, 64, 79.3, 8.5, 77.2));
  L2.part.add('top', bx(58.9, 3, 81.3, 76.7, 3.15, 83.65), bx(66.5, 3.05, 82, 69, 3.2, 83.2));
  for (const [x0, x1] of [[61.1, 65.3], [69.2, 73.3]]) {
    L2.part.add('wood', bx(x0, 0.12, 67.5, x1, 3, 76.5));
    L2.part.add('top', bx(x0 - 0.2, 3, 67.3, x1 + 0.2, 3.2, 76.7));
    for (const z of [69.5, 72, 74.5]) L2.part.add('gold', cyl(0.6, 0.8, (x0 + x1) / 2, 9.2, z, 20, 0.2), cyl(0.03, 6, (x0 + x1) / 2, 10, z, 6));
  }
  // dining: table for eight under the glass gable, and its chandelier
  L2.part.add('wood', bx(63, 2.4, 53, 72.5, 2.6, 58), bx(64, 0.12, 55, 64.6, 2.4, 56), bx(70.9, 0.12, 55, 71.5, 2.4, 56));
  for (const x of [64.5, 67.75, 71]) for (const z of [51.9, 59.1]) L2.part.add('soft', rb(x - 0.8, 0.12, z - 0.8, x + 0.8, 1.6, z + 0.8, 0.2));
  L2.part.add('gold', cyl(2.6, 0.3, 67.75, 9.5, 55.5, 36, 2.6), cyl(0.04, 8, 67.75, 9.8, 55.5, 6));
  // gym / office: a desk and a treadmill
  L2.part.add('wood', bx(18.2, 0.12, 64.6, 24, 2.5, 67));
  L2.part.add('dark', bx(25, 0.12, 67, 28.4, 1.4, 73.5), bx(25, 1.4, 72.8, 28.4, 4.4, 73.3));
  // primary suite: bed on the west wall, benches; the bath: tub in its bay, a long double vanity, toilet rooms and a shower
  L2.part.add('soft', rb(0.6, 0.12, 102, 7.8, 2, 108.5), rb(0.3, 0.12, 101.6, 1, 4.6, 108.9, 0.15));
  L2.part.add('wood', bx(7.8, 0.12, 102.6, 9.4, 1.6, 107.9));
  L2.part.add('white', rb(-6.5, 0.12, 84, -2, 2, 88.5, 0.6));
  L2.part.add('stone', bx(7.1, 0.12, 81.5, 9.4, 3, 93));
  for (const z of [83, 89.7]) L2.part.add('white', cyl(0.6, 0.15, 8, 3, z, 18));
  L2.part.add('int', bx(9.4, 0.12, 84, 13, 8, 84.25), bx(9.4, 0.12, 88.5, 13, 8, 88.75), bx(9.4, 0.12, 92.4, 13, 8, 92.65));
  L2.part.add('glass', bx(9.4, 0.12, 84.25, 9.5, 7.5, 88.5));
  L2.part.add('wood', bx(9.6, 0.12, 88.8, 11, 7, 92.3));
  for (const [x, z] of [[11.6, 94.5], [11.6, 80.5]]) L2.part.add('white', rb(x - 0.9, 0.12, z - 0.7, x + 0.9, 1.4, z + 0.7, 0.3));
  // the primary closet: a dresser island and hanging on three walls
  L2.part.add('wood', bx(5.5, 0.12, 67, 12, 3, 71), bx(0.3, 0.12, 62.8, 2.2, 7, 76.2), bx(15.3, 0.12, 62.8, 17.2, 7, 76.2), bx(2.2, 0.12, 62.4, 15.3, 7, 64.2));
  // bedrooms, each with a bed on its outside wall
  L2.part.add('soft', rb(89.6, 0.12, 86.2, 96.2, 2, 92.8), rb(96.1, 0.12, 85.8, 96.7, 4.6, 93.2, 0.15));
  L2.part.add('soft', rb(99.6, 0.12, 72.2, 106.1, 2, 78.8), rb(105.9, 0.12, 71.8, 106.3, 4.6, 79.2, 0.15));
  L2.part.add('soft', rb(99.6, 0.12, 47.6, 106.1, 2, 54.2), rb(105.9, 0.12, 47.2, 106.3, 4.6, 54.6, 0.15));
  // the other baths: tubs, showers, vanities, toilets
  const toilet = (x, y, z, rot = 0) => { const w = rot ? 0.7 : 0.9, d = rot ? 0.9 : 0.7; L2.part.add('white', rb(x - w, y, z - d, x + w, y + 1.4, z + d, 0.3)); };
  L2.part.add('white', rb(77.3, 0.12, 93.6, 82.8, 2, 96.7, 0.4), rb(97.8, 0.12, 63.8, 100.3, 2, 68.8, 0.4));
  L2.part.add('stone', bx(77.3, 0.12, 84.5, 79.3, 3, 88.5), bx(88, 0.12, 63.7, 92.5, 3, 65.6), bx(104.4, 0.12, 59, 106.3, 3, 62));
  toilet(78.4, 0.12, 91.4, 1); toilet(94, 0.12, 64.5); toilet(105.4, 0.12, 64.2, 1);
  L2.part.add('glass', bx(100.6, 0.12, 65.9, 106.4, 7.5, 66), bx(94.6, 0.12, 61.5, 100.4, 7.5, 61.6));
  L2.part.add('stone', bx(100.6, 0.12, 66, 106.4, 0.3, 68.9), bx(94.6, 0.12, 61.6, 100.4, 0.3, 63.4));
  // utility, mud room lockers, pantry and closet shelving, the garage bench
  L2.part.add('white', bx(79.8, 0.12, 49.4, 82.4, 3.2, 51.8), bx(82.6, 0.12, 49.4, 85.2, 3.2, 51.8));
  L2.part.add('wood', bx(77.3, 0.12, 52.5, 79.6, 3, 58.6), bx(88.7, 0.12, 44, 90.4, 7, 55), bx(79.7, 0.12, 64, 81.3, 7, 77.1), bx(85.7, 0.12, 64, 87.3, 7, 77.1),
    bx(87.7, 0.12, 69.6, 89.2, 7, 77.2), bx(91.3, 0.12, 69.6, 92.8, 7, 77.2), bx(106.6, -0.25, 29.5, 109.2, 3, 35.6));
  L2.part.add('top', bx(77.2, 3, 52.4, 79.7, 3.15, 58.7));
  // the stair up to the bonus room: thirteen oak risers along the north wall of the stair hall
  for (let i = 0; i < 13; i++) { const y = (i + 1) * (LVL2 / 13), x0 = 95 + i * 0.8; L2.part.add('wood', bx(x0, y - 0.18, 40.6, x0 + 0.8, y, 44.2)); }
  L2.part.add('dark', beam(V(95, 0.2, 40.5), V(105.4, 9.8, 40.5), 0.2, 0.9));
  // the bonus room: a sofa, a media wall; its bath
  L2.part.add('soft', bx(93, LVL2, 9, 101, LVL2 + 0.04, 19), rb(93.5, LVL2, 17, 100.5, LVL2 + 1.5, 19.6), rb(93.5, LVL2 + 1.5, 19, 100.5, LVL2 + 2.9, 19.6));
  L2.part.add('wood', bx(94, LVL2, 1, 101, LVL2 + 1.8, 2.4), bx(96, LVL2 + 3, 0.5, 99.5, LVL2 + 5, 0.7));
  L2.part.add('white', rb(89.3, LVL2, 41.5, 94.2, LVL2 + 2, 44.2, 0.4)); toilet(90.4, LVL2, 37.3, 1);
  L2.part.add('stone', bx(89.3, LVL2, 38.6, 91.2, LVL2 + 3, 41.2));

  // 06 Windows and doors: each opening slides out from its own wall
  const L4 = layer('glazing', '06', 'Windows & doors', 'Black frames · glass to the gable peak', 5);
  const subs = {};
  const sideFor = (axis, line, mid) => {
    const out = outOf(axis, line, mid);
    const k = `${axis}${out}1`;
    return subs[k] || (subs[k] = L4.side(axis === 'z' ? V(0, 0, out) : V(out, 0, 0), 1));
  };
  for (const [axis, line, a, b, v0, v1, kind] of OPEN) {
    const s = sideFor(axis, line, (a + b) / 2);
    const B = (u0, w0, u1, w1, t0, t1) => axis === 'z' ? bx(u0, w0, line + t0, u1, w1, line + t1) : bx(line + t0, w0, u0, line + t1, w1, u1);
    if (kind === 'garage') { s.part.add('wood', B(a, v0, b, v1, -0.25, 0.1)); for (let v = v0 + 2; v < v1; v += 2) s.part.add('frame', B(a, v - 0.05, b, v + 0.05, -0.3, -0.25)); continue; }
    const f = 0.25;
    s.part.add('frame', B(a, v0, b, v0 + f, -0.3, 0.3), B(a, v1 - f, b, v1, -0.3, 0.3), B(a, v0, a + f, v1, -0.3, 0.3), B(b - f, v0, b, v1, -0.3, 0.3));
    if (kind === 'entry') continue;
    const n = Math.max(1, Math.round((b - a) / 2.6));
    for (let k = 1; k < n; k++) { const u = a + (b - a) * k / n; s.part.add('frame', B(u - 0.08, v0, u + 0.08, v1, -0.25, 0.25)); }
    if (v1 - v0 > 4) for (const v of v1 - v0 > 9 ? [v0 + (v1 - v0) * 0.36, v0 + (v1 - v0) * 0.68] : [v0 + (v1 - v0) * 0.55]) s.part.add('frame', B(a, v - 0.08, b, v + 0.08, -0.25, 0.25));
    s.part.add('glass', B(a + f, v0 + f, b - f, v1 - f, -0.04, 0.04));
  }
  // the dining room's gable is glass to the peak, on the mullions of the wall of glass below it
  for (const R of RF) for (const gb of R.gables) {
    if (!gb.glass) continue;
    const s = sideFor(gb.axis, gb.line, gb.pts[2][0]);
    const [[u0, e], [u1], [um, top]] = gb.pts;
    s.part.add('glass', upright(gb.axis, gb.line, [[u0 + 1.6, e + 0.2], [u1 - 1.6, e + 0.2], [um, top - 1.6]], -0.04, 0.04));
    const P = (u, v) => gb.axis === 'z' ? V(u, v, gb.line) : V(gb.line, v, u);
    s.part.add('frame', beam(P(u0 + 1.4, e + 0.1), P(um, top - 1.4), 0.5, 0.25), beam(P(u1 - 1.4, e + 0.1), P(um, top - 1.4), 0.5, 0.25), bx(u0 + 1.4, e - 0.5, gb.line - 0.3, u1 - 1.4, e + 0.2, gb.line + 0.3));
    for (let k = 1; k < 6; k++) { const u = 60.5 + 14.5 * k / 6, h = top - 1.6 - Math.abs(u - um); if (h > e + 0.5) s.part.add('frame', bx(u - 0.08, e, gb.line - 0.25, u + 0.08, h, gb.line + 0.25)); }
  }
  // the front doors: a pair of glass doors swinging in
  const entry = subs['z-11'];
  const leaves = [[48.75, 1], [54.75, -1]].map(([x, dir]) => {
    const pv = new THREE.Group(); pv.position.set(x, 0, 59); entry.g.add(pv);
    const dp = new Part(pv, PAL, L4.line, L4.W);
    const X = u => u * dir, lo = Math.min(X(0), X(3)), hi = Math.max(X(0), X(3));
    dp.add('frame', bx(lo, 0.2, -0.15, hi, 0.55, 0.15), bx(lo, 8, -0.15, hi, 8.3, 0.15), bx(Math.min(X(0), X(0.3)), 0.2, -0.15, Math.max(X(0), X(0.3)), 8.3, 0.15), bx(Math.min(X(2.7), X(3)), 0.2, -0.15, Math.max(X(2.7), X(3)), 8.3, 0.15));
    dp.add('glass', bx(Math.min(X(0.3), X(2.7)), 0.55, -0.04, Math.max(X(0.3), X(2.7)), 8, 0.04));
    L4.subs.push({ g: pv, dir: V(0, 0, 0), lvl: 0, part: dp, isDoor: true });
    return { pv, dp, dir };
  });

  // the site, always on: front walk, the back terrace and the pool
  const site = new THREE.Group(); scene.add(site);
  const sitePart = new Part(site, PAL, lineMat({ w: 1.1 }), { mid: lineMat({ w: 0.8 }), thin: lineMat({ w: 0.6, opacity: 0.6 }) });
  sitePart.add('top', bx(33, -1, 99, 55, -0.7, 100.2), bx(33, -1, 112.8, 55, -0.7, 114), bx(33, -1, 100.2, 34.2, -0.7, 112.8), bx(53.8, -1, 100.2, 55, -0.7, 112.8));
  sitePart.add('water', bx(34.2, -1.6, 100.2, 53.8, -1.2, 112.8));
  sitePart.build();

  for (const L of layers) { L.part.build(); for (const s of L.subs) if (!s.isDoor) s.part.build(); }
  for (const l of leaves) l.dp.build();

  // ---- the build: each stage is lowered into place in construction order; windows slide in from outside
  const DROP = 18;
  const PULL = { glazing: 12 };
  const ORDER = ['slab', 'frame1', 'frame2', 'roofframe', 'sheath', 'glazing', 'clad'];
  const TOP = { slab: 0, frame1: 10, frame2: 15, roofframe: 27, sheath: 27, glazing: 14, clad: 12 };
  const T0 = 0.04, STEP = 0.05, DUR = 0.055;
  let O = x => x;   // set once the walk has been measured: turns a fraction of a 12-screen story into p
  const landAt = id => { const i = ORDER.indexOf(id); return [O(T0 + i * STEP), O(T0 + i * STEP + DUR)]; };

  // ---- labels in a column right of the drawing, each on its layer's back right corner
  const anchor = {
    slab: [L1.g, V(106.5, -1, 82)],
    frame1: [LF1.g, V(106.5, 6, 82)],
    frame2: [LF2.g, V(106, 14, 30)],
    roofframe: [LFR.g, V(97, 18, 90)],
    sheath: [LS.g, V(106.5, 9, 60)],
    glazing: [subs['x11'].g, V(106.8, 6, 75)],
    clad: [LC.g, V(107, 3, 56)],
  };
  const SHORT = { slab: 'Slab', frame1: '1st Floor', frame2: 'Bonus room', roofframe: 'Roof frame', sheath: 'Sheathing', glazing: 'Windows', clad: 'Siding · stone' };
  for (const L of layers) { const [obj, at] = anchor[L.id]; L.label = labels.add({ no: L.no, name: L.name, short: SHORT[L.id], sub: L.sub, obj, at, rank: 10 - Number(L.no) }); }

  const dash = liveLine(dashMat);
  const corners = [[0, 62], [85.5, 0], [109.5, 0], [106.5, 82], [0, 114.5], [58.5, 48.5]];

  // ---- camera: the long lens over the stack, then down to the front porch, then a walk through every room
  const EYE2 = LVL2 + EYE, SC = 12;
  // [screens from the last key, eye, look at, lens, room to stop in]; a stop holds the camera while its caption shows
  const WALK = [
    [0.6, [51.75, EYE, 55], [51.75, 6.5, 75], 58],
    [0.6, [52, EYE, 66], [30, 8, 70], 66, 'great'],
    [0.4, [51, EYE, 78.5], [30, 5, 79.25], 62],
    [0.5, [31, EYE, 79.25], [15, 5, 79.25], 62],
    [0.5, [15.25, EYE, 79.5], [15.25, 5, 96], 62],
    [0.5, [15.25, EYE, 93.5], [15.25, 6, 110], 62],
    [0.4, [14, EYE, 100.5], [3, 5, 110], 66, 'primary'],
    [0.35, [6.5, EYE, 99], [6.5, 4, 85], 62],
    [0.4, [5.5, EYE, 93], [-5, 3, 85], 66, 'pbath'],
    [0.35, [6.5, EYE, 80.5], [6.5, 4, 70], 62],
    [0.3, [6.5, EYE, 75], [12, 4, 64], 66, 'closet'],
    [0.35, [6.5, EYE, 81], [6.5, 5, 95], 62],
    [0.4, [6.5, EYE, 98.5], [15, 5, 98.5], 62],
    [0.3, [15.25, EYE, 98], [15.25, 5, 85], 62],
    [0.55, [15.25, EYE, 79.5], [30, 5, 79.5], 62],
    [0.3, [23.5, EYE, 79.25], [23.5, 4, 66], 62],
    [0.35, [23.5, EYE, 74], [21, 4, 64], 66, 'gym'],
    [0.35, [23.5, EYE, 79.25], [40, 5, 79.25], 62],
    [0.6, [50, EYE, 79], [60, 5, 66], 62],
    [0.5, [56.5, EYE, 62.5], [68, 8, 48.5], 62],
    [0.35, [67.75, EYE, 61.5], [67.75, 9, 48.5], 64, 'dining'],
    [0.4, [67.25, EYE, 65.5], [67.25, 5, 84], 64, 'kitchen'],
    [0.45, [67.25, EYE, 79.5], [80, 5, 79.75], 62],
    [0.4, [80.5, EYE, 79.75], [83.5, 4, 70], 62],
    [0.25, [83.5, EYE, 78.5], [83.5, 4, 66], 62],
    [0.3, [83.5, EYE, 74], [83.5, 4, 64], 66, 'pantry'],
    [0.3, [83.5, EYE, 79.6], [86, 5, 90], 62],
    [0.3, [85.5, EYE, 81], [85.5, 5, 92], 62],
    [0.35, [86.5, EYE, 85.5], [93, 4, 92], 66, 'bed2'],
    [0.3, [86.5, EYE, 89.5], [80, 4, 89.5], 62],
    [0.3, [82.5, EYE, 89.5], [80, 3, 89.5], 62],
    [0.25, [82.6, EYE, 85.2], [77.5, 2.5, 94], 76, 'bath2'],
    [0.25, [82.5, EYE, 89.5], [86, 5, 89.5], 62],
    [0.35, [86, EYE, 89], [85.5, 5, 80], 62],
    [0.3, [85.5, EYE, 79.75], [95, 5, 79.75], 62],
    [0.3, [90, EYE, 79.75], [100, 5, 76], 62],
    [0.35, [94, EYE, 80.5], [104, 2.8, 73], 72, 'bed3'],
    [0.3, [96.75, EYE, 71], [96.75, 4, 64], 62],
    [0.3, [96.5, EYE, 68], [88.5, 2.5, 64.5], 76, 'bath3'],
    [0.3, [90.25, EYE, 66.25], [90.25, 4, 77], 62],
    [0.3, [90.25, EYE, 71.5], [90.25, 4, 77.5], 66, 'b3clos'],
    [0.3, [90.25, EYE, 66.25], [97, 4, 66.25], 62],
    [0.3, [96.75, EYE, 67], [96.75, 5, 75], 62],
    [0.3, [95, EYE, 79.5], [86, 5, 79.75], 62],
    [0.35, [75.5, EYE, 79.75], [75, 5, 62], 62],
    [0.5, [75.5, EYE, 61.25], [90, 5, 61.25], 62],
    [0.3, [82.75, EYE, 61.25], [82.75, 4, 50], 62],
    [0.3, [82.75, EYE, 56.5], [82, 3.5, 49], 66, 'utility'],
    [0.3, [82.75, EYE, 61.5], [92, 5, 61.5], 62],
    [0.35, [91.5, EYE, 61], [91.5, 4.5, 40], 62],
    [0.3, [91.5, EYE, 54], [91.5, 4, 38], 66, 'mud'],
    [0.25, [91.5, EYE, 51.25], [100, 5, 51.25], 62],
    [0.2, [96, EYE, 51.25], [100, 4.5, 56], 62],
    [0.3, [96, EYE, 56.6], [104.5, 2.8, 50], 72, 'bed4'],
    [0.3, [103.5, EYE, 56.5], [103.5, 4, 66], 62],
    [0.25, [103.2, EYE, 59.4], [104.5, 2.5, 67.5], 78, 'bath4'],
    [0.3, [103.5, EYE, 55.5], [96, 5, 51.25], 62],
    [0.3, [96, EYE, 51.25], [88, 5, 51.25], 62],
    [0.3, [91.5, EYE, 50], [91.5, 5, 38], 62],
    [0.3, [92.5, EYE, 42.4], [106, 9, 42.4], 62, 'stair'],
    [0.9, [104.6, EYE2 - 0.2, 42.4], [107, 14, 30], 62],
    [0.3, [105.75, EYE2, 38.5], [96, 13.5, 30], 62],
    [0.35, [100, EYE2, 37.5], [97.5, 13, 20], 62],
    [0.4, [97.5, EYE2, 31], [97.5, 13.5, 2], 66, 'bonus'],
    [0.35, [97, EYE2, 38], [90, 13.5, 38], 62],
    [0.3, [92.5, EYE2, 38], [90, 12.5, 42], 66, 'bbath'],
    [0.3, [97, EYE2, 38], [106, 15, 38], 62],
    [0.3, [105.75, EYE2, 39.5], [104, 14, 44], 62],
    [0.2, [105, EYE2 - 0.2, 42.4], [96, 9, 42.4], 62],
    [0.9, [95.5, EYE + 0.4, 42.4], [88, 4, 42], 62],
    [0.3, [91.5, EYE, 40], [91.5, 4, 30], 62],
    [0.35, [91.5, EYE, 33], [96, 4, 20], 62],
    [0.35, [96, EYE, 28], [92, 4, 6], 66, 'garage'],
  ];
  const HOLD = 0.35, PACE = 0.75, LEAVE = 0.9, END = 0.35;   // PACE scales every walking leg
  const easeIn = t => t * t, easeOut = t => 1 - (1 - t) * (1 - t);
  let s = 8.4;
  const walkKeys = [], walkStops = [];
  WALK.forEach(([d0, E, Tg, fov, stop], i) => {
    const d = d0 * PACE;
    const from = i === 0 || WALK[i - 1][4], to = !!stop;
    const fn = from && to ? ease : from ? easeIn : to ? easeOut : (t => t);
    s += d;
    const key = at => eyeKey(at, E, Tg, fov, { easeFn: fn, ph: eyeKey(at, E, Tg, Math.min(fov + 12, 82), { easeFn: fn }) });
    walkKeys.push(key(s));
    if (stop) { walkStops.push({ id: stop, a: s - d * 0.55, at: s, b: s + HOLD + 0.2 }); s += HOLD; walkKeys.push(key(s)); walkKeys[walkKeys.length - 1].easeFn = ease; }
  });
  const TOTAL = s + LEAVE + END;
  O = x => x * SC / TOTAL; const P = x => x / TOTAL;
  const AX = { t: [50, 9, 57], az: -52, el: 27, fov: 1.5, h: 215, sx: -0.01, sy: 0.02, ph: { h: 320, sx: 0.2, sy: -0.16 } };
  const OUT = { t: [50, 8, 57], az: -52, el: 27, fov: 1.5, h: 190, sx: 0.12, sy: -0.02, ph: { h: 400, sx: 0, sy: 0.06 } };
  const keys = [
    { at: 0, ...AX },
    { at: O(0.40), ...AX },
    { at: O(0.48), t: [52, 8, 50], az: -62, el: 24, fov: 1.5, h: 120, sx: -0.1, ph: { h: 240, sx: 0, sy: -0.25 } },
    { at: O(0.52), t: [52, 8, 50], az: -74, el: 18, fov: 1.6, h: 95, sx: -0.06, ph: { h: 190, sx: 0, sy: -0.2 } },
    eyeKey(O(0.62), [51.75, EYE, 18], [51.75, 8, 59], 46, { sy: -0.12, ph: eyeKey(O(0.62), [51.75, EYE, 12], [51.75, 8.4, 59], 62, { sy: -0.1 }) }),
    eyeKey(O(0.70), [51.75, EYE, 42], [51.75, 7.5, 62], 50, { sy: -0.1, ph: eyeKey(O(0.70), [51.75, EYE, 42], [51.75, 7.8, 62], 64, { sy: -0.08 }) }),
    ...walkKeys.map(k => ({ ...k, at: P(k.at), ph: { ...k.ph, at: P(k.at) } })),
    // and back out through the roof to the whole house, finished
    { at: P(s + LEAVE), ...OUT, easeFn: ease },
    { at: 1.0, ...OUT },
  ];
  keys[4].easeFn = t => ease(t);

  const INFO = {
    great: ['GREAT ROOM // 28′-0″ × 22′-0″ · VAULT OFF 16′', 'The heart of the house', 'Vaulted ceiling  ·  fireplace  ·  glass doors to both porches'],
    primary: ['PRIMARY SUITE // 17′-0″ × 18′-0″ · VAULT OFF 12′', 'The primary suite', 'Its own wing, away from the other bedrooms  ·  doors to the primary porch'],
    pbath: ['PRIMARY BATH // 4:12 VAULT', 'The primary bath', 'Freestanding tub in its own bay  ·  long double vanity  ·  toilet rooms and shower'],
    closet: ['CLOSET // 17′-0″ × 15′-0″ · VAULT OFF 12′', 'A dressing room', 'Walk-in closet with a dresser island, through the bath'],
    gym: ['GYM / OFFICE // 12′-0″ × 13′-0″ · 10′ CLG', 'Gym or office', 'Double doors off the gallery  ·  a window to the front'],
    dining: ['DINING // 18′-0″ × 14′-0″ · VAULT OFF 16′', 'Dining under a glass gable', 'Windows from the floor to the peak, facing the front'],
    kitchen: ['KITCHEN // 18′-0″ × 20′-4″ · VAULT OFF 16′', 'Two islands', 'Open to the great room and dining  ·  sink under the back window'],
    pantry: ['PANTRY // 8′-0″ × 13′-9″ · 10′ CLG', 'Walk-in pantry', 'Shelves on both sides, just off the kitchen'],
    bed2: ['BEDROOM 2 // 13′-0″ × 15′-0″ · 10′ CLG', 'Bedroom 2', 'Windows to the back yard  ·  a bath of its own'],
    bath2: ['BATH // BEDROOM 2', 'Bath for bedroom 2', 'Tub, toilet and vanity, through the bedroom'],
    bed3: ['BEDROOM 3 // 13′-0″ × 12′-2″ · 10′ CLG', 'Bedroom 3', 'A bath and a walk-in closet of its own'],
    bath3: ['BATH // BEDROOM 3', 'Bath for bedroom 3', 'Tub, toilet and vanity, with the closet through it'],
    b3clos: ['CLOSET // 5′-0″ × 7′-10″', 'Walk-in closet', 'Shelves both sides, through the bath'],
    utility: ['UTILITY // 12′-0″ × 9′-8″ · 10′ CLG', 'Utility room', 'Washer, dryer and a folding counter'],
    mud: ['MUD ROOM // 7′-3″ × 12′-3″ · 9′ CLG', 'Mud room', 'Lockers between the garage and the house'],
    bed4: ['BEDROOM 4 // 12′-0″ × 13′-0″ · 10′ CLG', 'Bedroom 4', 'By the mud room, with a bath of its own'],
    bath4: ['BATH // BEDROOM 4', 'Bath for bedroom 4', 'Glass shower, toilet and vanity'],
    stair: ['STAIR // UP TO THE BONUS ROOM', 'Up over the garage', 'Thirteen risers from the mud room'],
    bonus: ['BONUS // 16′-10″ × 35′-4″ · SLOPE 5′ TO 9′', 'The bonus room', 'Over the three-car garage  ·  optional, 772 sq ft'],
    bbath: ['BONUS BATH', 'A bath upstairs', 'Tub, toilet and vanity for the bonus room'],
    garage: ['GARAGE // 23′-0″ × 35′-4″ · 9′ CLG', 'Three-car garage', 'Doors to the side courtyard  ·  straight into the mud room'],
  };
  const STOPS = [
    { id: 'porch', a: O(0.55), b: O(0.735), lv: 'ARRIVAL // FRONT PORCH · 28′-8″ × 6′-0″', t: 'The front porch', m: 'Glass doors straight into the great room  ·  10 ft ceiling' },
    ...walkStops.map(w => ({ id: w.id, a: P(w.a), b: P(w.b), lv: INFO[w.id][0], t: INFO[w.id][1], m: INFO[w.id][2] })),
    { id: 'back', a: P(s + LEAVE * 0.7), b: 1.05, lv: 'PLAN 818220JSS // ARCHITECTURAL DESIGNS', t: 'Their plan, in 3D', m: 'Modeled by Sebby Homes with their permission  ·  have a plan you love? Start below' },
  ];
  const stopAt = Object.fromEntries(walkStops.map(w => [w.id, P(w.at + HOLD / 2)]));
  const lvlOf = Object.fromEntries(ROOMS.map(r => [r.id, r.lvl]));

  function update(p) {
    const land = {};
    for (const id of ORDER) { const [a, b] = landAt(id); land[id] = ease(win(p, a, b)); }
    const cur = ORDER.reduce((c, id) => p >= landAt(id)[0] - O(0.006) ? id : c, null);
    for (const L of layers) {
      const [a, b] = landAt(L.id), u = land[L.id];
      L.g.visible = p > a;
      L.g.position.y = L.id === 'glazing' ? 0 : DROP * (1 - u);
      const pull = PULL[L.id] ? PULL[L.id] * (1 - u) : 0;
      for (const s of L.subs) if (!s.isDoor) s.g.position.copy(s.dir).multiplyScalar(pull);
      const on = L.id === cur && p < b + O(0.012);
      for (const m of L.lines) m.color.set(on ? ACCENT : INK);
      L.label.on = on;
      L.label.op = (p < a ? 0 : p > b + O(0.012) ? 0.85 : 1) * (1 - win(p, O(0.40), O(0.45)));
    }
    // the front doors swing open as the camera reaches the porch
    const sw = 1.35 * ease(win(p, O(0.6), O(0.7)));
    for (const l of leaves) l.pv.rotation.y = -sw * l.dir;

    const ls = [];
    for (const id of ORDER) {
      const off = DROP * (1 - land[id]);
      if (id === 'glazing' || off < 0.2 || p < landAt(id)[0]) continue;
      for (const [x, z] of corners) ls.push([x, TOP[id] + off, z, x, TOP[id], z]);
    }
    const gp = PULL.glazing * (1 - land.glazing);
    if (gp > 0.2 && p > landAt('glazing')[0]) for (const [x, z, dx, dz] of [[52, 59, 0, -1], [67.75, 48.5, 0, -1], [52, 81.5, 0, 1], [106.5, 75, 1, 0], [0, 105, -1, 0]]) ls.push([x, 5, z, x + dx * gp, 5, z + dz * gp]);
    dash.set(ls);

    const landed = ORDER.filter(id => land[id] > 0.98).length;
    let cap = '', capOp = 0, activeStop = p < O(0.52) ? 'axo' : 'porch';
    for (const s of STOPS) {
      const v = win(p, s.a, s.a + P(0.25)) * (1 - win(p, s.b - P(0.2), s.b));
      if (v > capOp) { capOp = v; cap = `<span class="lv">${s.lv}</span><span class="t">${s.t}</span><span class="m">${s.m}</span>`; }
      if (p >= s.a - P(0.1)) activeStop = s.id;
    }
    return {
      hero: 1 - clamp((p - O(0.39)) / O(0.05)),
      counter: p < O(0.54) ? `Stage <b>${String(Math.min(7, landed + (p > O(T0) ? 1 : 0))).padStart(2, '0')}</b> / 07` : '',
      hint: p < O(0.42) ? 'Scroll to build it' : p < O(0.62) ? 'Scroll to the front door' : p < O(0.74) ? 'Scroll to walk in' : p > P(TOTAL - END * 0.6) ? 'Scroll to start yours' : '',
      lvl: lvlOf[activeStop] || 1,
      cap, capOp, stop: activeStop,
    };
  }

  const planOf = lvl => ROOMS.filter(r => r.lvl === lvl).map(r => `M${r.x0} ${r.z0}H${r.x1}V${r.z1}H${r.x0}Z`).join(' ');
  const tagOf = id => INFO[id][0].split(' // ')[0];
  return {
    update, keys, R: 420, screens: TOTAL,
    colX: () => ctx.phone ? ctx.W - 150 : ctx.W * 0.74,
    draw: { dir: [0, 1, 0], radial: 0, min: -4, max: 34, soft: 4 },
    radar: {
      scale: '1/16″ = 1′', viewBox: '-10 -4 122 122', svgH: 84, svgHPhone: 62, plan: planOf(1), plans: { 1: planOf(1), 2: planOf(2) }, strokeW: 0.8, dotR: 2.6, coneW: 0.8, coneLen: 14,
      lvlNames: { 1: 'MAIN FL', 2: 'BONUS' }, lvl2Y: 12.5,
      clampX: [-10, 112], clampZ: [-6, 117], axoDot: [112, -4], axoAng: 2.4,
      zones: [
        { stop: 'porch', lvl: 1, p: O(0.66), tag: 'PORCH // FRONT DOOR', x: 29.5, y: 52.5, w: 29, h: 6.5 },
        ...ROOMS.filter(r => stopAt[r.id] != null).map(r => ({ stop: r.id, lvl: r.lvl, p: stopAt[r.id], tag: tagOf(r.id), x: r.x0, y: r.z0, w: r.x1 - r.x0, h: r.z1 - r.z0 })),
      ],
      stops: [
        { stop: 'axo', p: O(0.2), tag: 'AXO // STAGES 01-07', label: 'BUILD' },
        { stop: 'porch', p: O(0.66), tag: 'PORCH // FRONT DOOR', label: 'PORCH' },
        { stop: 'primary', p: stopAt.primary, tag: 'PRIMARY SUITE', label: 'PRIMARY' },
        { stop: 'kitchen', p: stopAt.kitchen, tag: 'KITCHEN // DINING', label: 'KITCHEN' },
        { stop: 'bonus', p: stopAt.bonus, tag: 'BONUS ROOM', label: 'BONUS' },
        { stop: 'garage', p: stopAt.garage, tag: 'GARAGE // MUD ROOM', label: 'GARAGE' },
      ],
    },
    chrome: {
      kicker: 'Plan 818220JSS · Architectural Designs',
      loader: 'Plotting plan 818220JSS',
      h1: 'A transitional farmhouse,<br><em>layer by layer.</em>',
      lede: 'Architectural Designs plan 818220JSS, modeled in 3D by Sebby Homes. Scroll to put it together in building order, then walk through every room.',
      spec: [['Plan', '818220JSS · Architectural Designs'], ['Size', '4,106 sq ft · 1 story'], ['Rooms', '4 bed · 4.5 bath · gym/office'], ['Garage', '3 cars · bonus room over']],
      hint: 'Scroll to build it',
    },
  };
}

/* ---------------- the site plan, drawn once into a canvas ---------------- */

function drawPlan(P, RF) {
  const S = 14, W = (P.x1 - P.x0) * S, H = (P.z1 - P.z0) * S;
  const X = x => (x - P.x0) * S, Y = z => (z - P.z0) * S;
  return canvasTex(W, H, (g) => {
    g.fillStyle = '#f2efe7'; g.fillRect(0, 0, W, H);
    g.strokeStyle = INK; g.fillStyle = INK;
    g.lineWidth = 2.6; g.strokeRect(30, 30, W - 60, H - 60); g.lineWidth = 1; g.strokeRect(40, 40, W - 80, H - 80);
    const line = (x0, z0, x1, z1, w = 2, dash = []) => { g.setLineDash(dash); g.lineWidth = w; g.beginPath(); g.moveTo(X(x0), Y(z0)); g.lineTo(X(x1), Y(z1)); g.stroke(); g.setLineDash([]); };
    // the camera looks at the sheet from the street side, so every word is turned half a turn to read upright
    const T = (str, x, y, dy = 0, rot = Math.PI) => { g.save(); g.translate(x, y); g.rotate(rot); g.fillText(str, 0, dy); g.restore(); };
    const rect = (x0, z0, x1, z1, w = 2, fill) => { if (fill) { g.fillStyle = fill; g.fillRect(X(x0), Y(z0), X(x1) - X(x0), Y(z1) - Y(z0)); g.fillStyle = INK; } if (w) { g.lineWidth = w; g.strokeRect(X(x0), Y(z0), X(x1) - X(x0), Y(z1) - Y(z0)); } };
    const hatch = (x0, z0, x1, z1, step = 1.6) => { g.save(); g.beginPath(); g.rect(X(x0), Y(z0), X(x1) - X(x0), Y(z1) - Y(z0)); g.clip(); g.lineWidth = 0.8; g.strokeStyle = '#8f897d'; for (let k = -(z1 - z0); k < x1 - x0; k += step) { g.beginPath(); g.moveTo(X(x0 + k), Y(z1)); g.lineTo(X(x0 + k + (z1 - z0)), Y(z0)); g.stroke(); } g.restore(); rect(x0, z0, x1, z1, 1.4); };
    // drive into the side courtyard, the front walk, porches, the back terrace and the pool
    hatch(58.5, -36, 85.5, 36, 2.4); hatch(62, 36, 85.5, 47, 2.4); hatch(49.5, 36, 54, 52.5, 1.2);
    hatch(29.5, 52.5, 58.5, 59, 1.2); hatch(17.5, 81.5, 58.5, 93.5, 1.4); hatch(58.5, 84, 77, 93.5, 1.4); hatch(17.5, 93.5, 29.5, 114.5, 1.4); hatch(29.5, 93.5, 58.5, 118, 1.4);
    rect(34.2, 100.2, 53.8, 112.8, 2.4, '#e6eeec');
    g.strokeStyle = '#8fb3b6'; g.lineWidth = 1.2;
    for (let z = 101.6; z < 112; z += 2.2) { g.beginPath(); for (let x = 35; x < 53.4; x += 0.5) g.lineTo(X(x), Y(z + Math.sin(x * 0.9 + z) * 0.25)); g.stroke(); }
    g.strokeStyle = INK;
    // grid with bubbles
    g.font = '500 24px "IBM Plex Mono"'; g.textAlign = 'center'; g.textBaseline = 'middle';
    [[-8, 'A'], [29.5, 'B'], [58.5, 'C'], [77, 'D'], [109.5, 'E']].forEach(([x, n]) => { line(x, -30, x, 122, 1, [24, 8, 4, 8]); g.beginPath(); g.arc(X(x), Y(-31.6), 22, 0, 7); g.stroke(); T(n, X(x), Y(-31.6)); });
    [[0, '1'], [36, '2'], [59, '3'], [81.5, '4'], [114.5, '5']].forEach(([z, n]) => { line(-26, z, 122, z, 1, [24, 8, 4, 8]); g.beginPath(); g.arc(X(-27.6), Y(z), 22, 0, 7); g.stroke(); T(n, X(-27.6), Y(z)); });
    // roof outlines, dashed
    for (const R of RF) { const [x0, z0, x1, z1] = R.rect; line(x0, z0, x1, z0, 1.2, [14, 10]); line(x1, z0, x1, z1, 1.2, [14, 10]); line(x1, z1, x0, z1, 1.2, [14, 10]); line(x0, z1, x0, z0, 1.2, [14, 10]); }
    // walls in poché, openings left white
    for (const r of wallRuns().filter(q => q.y0 === 0)) {
      const t = r.kind === 'ext' ? 0.7 : 0.45;
      let rects = [[r.a, r.b]];
      if (r.kind === 'ext') {
        for (const o of OPEN.filter(o => o[0] === r.axis && o[1] === r.line && o[4] < 4)) rects = rects.flatMap(([u0, u1]) => [[u0, Math.min(u1, o[2])], [Math.max(u0, o[3]), u1]]).filter(([u0, u1]) => u1 - u0 > 0.01);
      } else { const d = doorAt(r.tag, r); if (d) rects = [[r.a, d[0]], [d[1], r.b]]; }
      for (const [u0, u1] of rects) {
        if (r.axis === 'x') g.fillRect(X(r.line - t / 2), Y(u0), X(r.line + t / 2) - X(r.line - t / 2), Y(u1) - Y(u0));
        else g.fillRect(X(u0), Y(r.line - t / 2), X(u1) - X(u0), Y(r.line + t / 2) - Y(r.line - t / 2));
      }
    }
    for (const [axis, l, a, b, y0] of OPEN) {
      if (y0 > 4) continue;
      if (axis === 'z') { line(a, l - 0.2, b, l - 0.2, 1.2); line(a, l + 0.2, b, l + 0.2, 1.2); }
      else { line(l - 0.2, a, l - 0.2, b, 1.2); line(l + 0.2, a, l + 0.2, b, 1.2); }
    }
    // islands, table, tub, stair, fireplace
    rect(61.1, 67.5, 65.3, 76.5, 1.6); rect(69.2, 67.5, 73.3, 76.5, 1.6); rect(63, 53, 72.5, 58, 1.6); rect(59, 81.4, 76.6, 83.6, 1.2);
    rect(-6.5, 84, -2, 88.5, 1.4); rect(7.1, 81.5, 9.4, 93, 1.2); rect(29.75, 66, 31.2, 74, 1.4, '#d9d3c6');
    for (let i = 0; i <= 13; i++) line(95 + i * 0.8, 40.6, 95 + i * 0.8, 44.2, 0.9);
    g.font = '400 18px "IBM Plex Mono"'; T('UP', X(97), Y(42.4));
    [5.5, 16.5, 27.5].forEach(z => line(84, z, 84, z + 7.5, 1, [8, 6]));
    // room names and sizes, as the plan gives them
    const DIM = { primary: '17′-0″ × 18′-0″', closet: '17′-0″ × 15′-0″', gym: '12′-0″ × 13′-0″', great: '28′-0″ × 22′-0″', kitchen: '18′-0″ × 20′-4″', dining: '18′-0″ × 14′-0″', pantry: '8′-0″ × 13′-9″', bed2: '13′-0″ × 15′-0″', bed3: '13′-0″ × 12′-2″', bed4: '12′-0″ × 13′-0″', utility: '12′-0″ × 9′-8″', mud: '7′-3″ × 12′-3″', garage: '23′-0″ × 35′-4″' };
    for (const r of ROOMS.filter(q => q.lvl === 1 && q.name)) {
      const cx = (r.x0 + r.x1) / 2, cz = r.id === 'mud' ? 47 : r.id === 'closet' && false ? 0 : (r.z0 + r.z1) / 2, small = r.x1 - r.x0 < 9 || r.z1 - r.z0 < 8;
      const lab = r.name.toUpperCase();
      let fs = small ? 18 : 26;
      g.fillStyle = INK; g.font = `700 ${fs}px "Chakra Petch"`;
      const room = (r.x1 - r.x0) * S - 18, wide = g.measureText(lab).width;
      if (wide > room) { fs = Math.floor(fs * room / wide); g.font = `700 ${fs}px "Chakra Petch"`; }
      T(lab, X(cx), Y(cz), -(fs * 0.45));
      if (DIM[r.id]) { g.font = `400 ${Math.min(small ? 14 : 17, fs * 0.8)}px "IBM Plex Mono"`; T(DIM[r.id], X(cx), Y(cz), fs * 0.62); }
    }
    g.font = '700 24px "Chakra Petch"';
    T('FRONT PORCH', X(44), Y(55.75)); T('BACK PORCH', X(38), Y(87.5)); T('PRIMARY PORCH', X(23.5), Y(104)); T('POOL', X(44), Y(106.5)); T('COURTYARD', X(72), Y(14));
    // dimensions: the plan's overall width and depth
    const dim = (x0, x1, z, t) => { line(x0, z, x1, z, 1.1); for (const x of [x0, x1]) line(x - 0.6, z + 0.6, x + 0.6, z - 0.6, 2); g.font = '400 20px "IBM Plex Mono"'; T(t, X((x0 + x1) / 2), Y(z), -16); };
    dim(-8, 109.5, -22, `117′-5″`);
    line(118, 0, 118, 114.5, 1.1); for (const z of [0, 114.5]) line(117.4, z + 0.6, 118.6, z - 0.6, 2);
    g.font = '400 20px "IBM Plex Mono"'; T(`114′-3″`, X(118), Y(57), -16, Math.PI / 2);
    // north arrow and title block
    g.save(); g.translate(X(-16), Y(-14)); g.rotate(Math.PI); g.lineWidth = 1.6; g.beginPath(); g.arc(0, 0, 34, 0, 7); g.stroke();
    g.beginPath(); g.moveTo(0, -30); g.lineTo(12, 14); g.lineTo(0, 6); g.lineTo(-12, 14); g.closePath(); g.fill();
    g.font = '700 22px "Chakra Petch"'; g.fillText('N', 0, -50); g.restore();
    const tbx = X(84), tby = Y(118), tbw = X(132) - X(84), tbh = Y(132) - Y(118);
    g.save(); g.translate(tbx + tbw / 2, tby + tbh / 2); g.rotate(Math.PI); g.translate(-tbx - tbw / 2, -tby - tbh / 2);
    g.lineWidth = 2; g.strokeRect(tbx, tby, tbw, tbh); g.lineWidth = 1;
    g.beginPath(); g.moveTo(tbx, tby + tbh * 0.55); g.lineTo(tbx + tbw, tby + tbh * 0.55); g.moveTo(tbx + tbw * 0.66, tby + tbh * 0.55); g.lineTo(tbx + tbw * 0.66, tby + tbh); g.stroke();
    g.textAlign = 'left'; g.font = '700 28px "Chakra Petch"'; g.fillText('PLAN 818220JSS', tbx + 18, tby + tbh * 0.2);
    g.font = '500 16px "IBM Plex Mono"'; g.fillText('© ARCHITECTURAL DESIGNS · SHOWN WITH PERMISSION', tbx + 18, tby + tbh * 0.42);
    g.fillText('MAIN FLOOR · MODELED BY SEBBY HOMES', tbx + 18, tby + tbh * 0.77);
    g.font = '700 34px "Chakra Petch"'; g.fillText('A-01', tbx + tbw * 0.66 + 22, tby + tbh * 0.79);
    g.restore();
  });
}
