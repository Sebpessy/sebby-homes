// Scroll, loader and drawing chrome for the concept home. The story section's scroll is the one
// value from 0 to 1 that drives the model, the camera, the labels and the captions.
// Adapted from "Flat to 3D" by Samnang Aing (MIT, see core.js).
import { renderer, scene, camera, ctx, camAt, applyCam, resize, Labels, clamp, easeOut, win, DRAW } from './core.js';

const Q = new URLSearchParams(location.search);
const FIXED = Q.has('p') ? parseFloat(Q.get('p')) : null;   // ?p=0.6 freezes the drawing at 60%
const T_FIXED = Q.has('t') ? parseFloat(Q.get('t')) : (FIXED != null ? 99 : null);
const $ = id => document.getElementById(id);
const story = $('story');

await Promise.all([
  document.fonts.load('500 20px "IBM Plex Mono"'), document.fonts.load('600 20px "IBM Plex Mono"'),
  document.fonts.load('700 20px "Chakra Petch"'), document.fonts.load('600 40px "Cormorant Garamond"'),
]).catch(() => {});

resize();
const labels = new Labels();
const { build } = await import('./house.js');
const S = await build(labels);
if (S.screens) story.style.height = `${Math.round(S.screens * 100)}vh`;   // a screen of scroll for each step of the walk
document.body.classList.add('drawn');

// ---- chrome from the house. Headline lines sit in masks so they can slide up.
const C = S.chrome;
$('kicker').textContent = C.kicker; $('lede').textContent = C.lede;
$('h1').innerHTML = C.h1.split('<br>').map(l => `<span class="ln"><span>${l}</span></span>`).join('');
$('spec').innerHTML = C.spec.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join('');
$('hint').textContent = C.hint;
addEventListener('resize', resize);

// ---- the small plan in the corner: where the camera stands, and buttons to jump along the story
const cadMap = $('cad-map'), cmLbl = $('cm-lbl'), cmCone = $('cm-cone'), cmDot = $('cm-dot');
const R = S.radar;
$('cm-scale').textContent = R.scale;
$('cm-svg').setAttribute('viewBox', R.viewBox);
$('cm-plan').setAttribute('d', R.plan); $('cm-plan').setAttribute('stroke-width', R.strokeW);
cmDot.setAttribute('r', R.dotR); cmCone.setAttribute('stroke-width', R.coneW);
$('cm-zones').innerHTML = R.zones.map(z => `<rect class="cm-zone" data-lvl="${z.lvl || 1}" data-stop="${z.stop}" data-p="${z.p}" data-tag="${z.tag}" x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}"/>`).join('');
$('cm-stops').style.gridTemplateColumns = `repeat(${R.stops.length}, 1fr)`;
$('cm-stops').innerHTML = R.stops.map(s => `<button type="button" class="cm-btn" data-stop="${s.stop}" data-p="${s.p}" data-tag="${s.tag}">${s.label}</button>`).join('');
const span = () => Math.max(1, story.offsetHeight - innerHeight);
const jumpToP = tp => scrollTo({ top: story.offsetTop + clamp(tp) * span(), behavior: 'smooth' });
let hoverTag = '';
cadMap.querySelectorAll('[data-p]').forEach(el => {
  el.addEventListener('mouseenter', () => { hoverTag = el.dataset.tag || ''; });
  el.addEventListener('mouseleave', () => { hoverTag = ''; });
  el.addEventListener('click', e => { e.stopPropagation(); jumpToP(parseFloat(el.dataset.p)); });
});

// ---- the plotter loader: the sheet is plotted, then the headline arrives
const D = S.draw;
DRAW.uDrawDir.value.set(D.dir[0], D.dir[1], D.dir[2], D.radial || 0);
DRAW.uDrawSoft.value = D.soft || 1.2;
const lines = [...document.querySelectorAll('#h1 .ln > span')];
function intro(T) {
  const sm = x => x * x * (3 - 2 * x);
  const plot = sm(win(T, 0.35, 3.0)), fill = sm(win(T, 0.8, 3.35));
  const range = D.max - D.min + 2;
  DRAW.uDraw.value = T > 3.6 ? 1e5 : D.min - 1 + plot * (range + DRAW.uDrawSoft.value);
  DRAW.uDrawFill.value = T > 3.6 ? 1e5 : D.min - 1 + fill * range;
  $('fade').style.opacity = 1 - win(T, 0, 0.7);
  $('loader').style.opacity = (1 - win(T, 3.15, 3.55)) * win(T, 0.2, 0.5);
  $('ltext').textContent = `${C.loader} · ${String(Math.round(plot * 100)).padStart(3, '0')}%`;
  $('lbar').style.transform = `scaleX(${plot})`;
  const o = (a, d = 0.5) => win(T, a, a + d);
  $('cad-frame').style.opacity = o(1.8, 0.7);
  $('kicker').style.opacity = o(2.5);
  lines.forEach((l, i) => {
    const u = easeOut(win(T, 2.65 + i * 0.12, 3.45 + i * 0.12));
    l.style.transform = `translateY(${(1 - u) * 125}%)`;
    l.style.opacity = u > 0.005 ? '1' : '0';
  });
  $('lede').style.opacity = o(3.25); $('lede').style.transform = `translateY(${(1 - easeOut(o(3.25, 0.7))) * 14}px)`;
  $('spec').style.opacity = o(3.45);
  const cmOp = o(3.55, 0.55);
  cadMap.style.opacity = cmOp; cadMap.classList.toggle('interactive', cmOp > 0.25);
  document.querySelector('.bottom').style.opacity = o(3.7);
  return (i) => o(3.0 + i * 0.11, 0.35);
}

let p = FIXED ?? 0, T = T_FIXED ?? 0, frames = 0;
const t0 = performance.now();
const target = () => clamp((scrollY - story.offsetTop) / span());
function step() {
  const st = S.update(p) || {};
  const lab = intro(T);
  labels.items.forEach((it, i) => { it.op *= lab(it.order ?? i); });
  const cam = camAt(S.keys, p);
  applyCam(cam, S.R);
  labels.update(S.colX);
  const hero = $('hero'), ho = st.hero ?? 1;
  hero.style.opacity = ho; hero.style.transform = `translateY(${(1 - ho) * -20}px)`;
  $('counter').innerHTML = st.counter || '';
  const hint = st.hint ?? C.hint;
  if ($('hint').textContent !== hint) $('hint').textContent = hint;
  document.querySelector('.hint-wrap').style.opacity = hint ? '1' : '0';
  const mode = cam.fov < 6 ? 'PARALLEL AXO' : cam.fov < 28 ? 'TRANSITION' : 'EYE-LEVEL PERSP';
  $('camReadout').innerHTML = `PROJ <b>${mode}</b> (${cam.fov.toFixed(1)}°) &nbsp;//&nbsp; SEQ <b>${String(Math.round(p * 100)).padStart(3, '0')}%</b>`;
  // the corner plan: the dot follows the camera once it is down at eye level
  const persp = cam.fov >= 18;
  const cx = persp ? clamp(camera.position.x, ...R.clampX) : R.axoDot[0];
  const cz = persp ? clamp(camera.position.z, ...R.clampZ) : R.axoDot[1];
  cmDot.setAttribute('cx', cx.toFixed(2)); cmDot.setAttribute('cy', cz.toFixed(2));
  const ang = persp ? Math.atan2(cam.t[2] - camera.position.z, cam.t[0] - camera.position.x) : R.axoAng;
  const sp = 0.42, rad = R.coneLen;
  cmCone.setAttribute('points', `${cx},${cz} ${cx + Math.cos(ang - sp) * rad},${cz + Math.sin(ang - sp) * rad} ${cx + Math.cos(ang + sp) * rad},${cz + Math.sin(ang + sp) * rad}`);
  // the corner plan shows the floor the camera is on
  const lvl = String(persp && camera.position.y > 13 ? 2 : 1);
  if (R.plans && cadMap.dataset.lvl !== lvl) {
    cadMap.dataset.lvl = lvl; $('cm-plan').setAttribute('d', R.plans[lvl]);
    cadMap.querySelectorAll('.cm-zone').forEach(el => { el.style.display = el.dataset.lvl === lvl ? '' : 'none'; });
  }
  cmLbl.textContent = hoverTag ? `JUMP // ${hoverTag}` : persp ? `${lvl === '2' ? '2ND' : '1ST'} FL · X ${camera.position.x.toFixed(0)}′ · Z ${camera.position.z.toFixed(0)}′` : `AXO // ${String(Math.round(p * 100)).padStart(3, '0')}%`;
  cadMap.querySelectorAll('[data-stop]').forEach(el => el.classList.toggle('active', el.dataset.stop === st.stop));
  const cap = $('caption'); cap.style.opacity = st.capOp || 0;
  if (st.cap && cap.dataset.k !== st.cap) { cap.dataset.k = st.cap; cap.innerHTML = st.cap; }
  renderer.render(scene, camera);
}
// only draw while the story is on screen
let onScreen = true;
new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }).observe(story);
function frame() {
  if (FIXED == null) p += (target() - p) * 0.12;
  if (T_FIXED == null) T = (performance.now() - t0) / 1000;
  if (onScreen || frames < 3) step();
  if (++frames === 3) window.__ready = true;
  requestAnimationFrame(frame);
}
window.__frame = (t, pp) => { T = t; p = pp; step(); return true; };
requestAnimationFrame(frame);
