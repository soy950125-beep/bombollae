// 꽃 테마 그림. 사진 대신 SVG(코드로 그린 그림)를 써서 저작권 걱정이 없고 어떤 화면 크기에서도 선명하다.
// 각 함수는 150×150 크기 안에 꽃가지 하나를 그린다. 같은 그림을 오른쪽 아래에 180도 돌려서 한 번 더 쓴다.
// 색(그라데이션)은 index.html 맨 위 <defs>에 모아 두었다.

const f = (n) => n.toFixed(1);

/** 2차 곡선(시작점 p0, 조절점 p1, 끝점 p2) 위의 t 지점 좌표와 방향(각도) */
function onCurve([x0, y0], [x1, y1], [x2, y2], t) {
  const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * x1 + t ** 2 * x2;
  const y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * y1 + t ** 2 * y2;
  const dx = 2 * (1 - t) * (x1 - x0) + 2 * t * (x2 - x1);
  const dy = 2 * (1 - t) * (y1 - y0) + 2 * t * (y2 - y1);
  return { x, y, deg: Math.atan2(dy, dx) * 180 / Math.PI + 90 }; // +90: 위쪽(-y)을 진행 방향으로
}

// 위쪽(-y)을 향한 모양들. 뿌리(0,0)에서 시작한다.
const LEAF = 'M0 0C-9-6-11-21 0-31C11-21 9-6 0 0Z';
const SLIM_LEAF = 'M0 0C-2.6-6-2.6-15 0-22C2.6-15 2.6-6 0 0Z';

function leaf(x, y, deg, s = 1, d = LEAF) {
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(deg)}) scale(${s})">` +
    `<path d="${d}" fill="url(#lfg)" stroke="#6E9C5C" stroke-width="0.5"/>` +
    (d === LEAF ? '<path d="M0-1.5L0-27M0-9L-4.5-14M0-9L4.5-14M0-17L-3.5-21M0-17L3.5-21" stroke="#6E9C5C" stroke-width="0.6" stroke-linecap="round" fill="none" opacity=".7"/>' : '') +
    '</g>';
}

/* ---------- 벚꽃 ---------- */

function sakura() {
  return '<path d="M-4 104C24 96 52 80 74 58C92 40 104 22 112 2L116 4C108 26 96 44 78 62C56 84 28 100-2 110Z" fill="#9B7178"/>' +
    '<path d="M60 72C70 78 82 82 96 80L96 83C82 86 68 82 58 75Z" fill="#9B7178"/>' +
    '<path d="M88 46C94 44 99 40 102 34L104 35C101 42 95 46 89 48Z" fill="#9B7178"/>' +
    '<ellipse cx="80" cy="58" rx="3" ry="7" transform="rotate(-40 80 58)" fill="#A9C994"/>' +
    '<use href="#skf" transform="translate(50 66) scale(1.25)"/><use href="#skf" transform="translate(92 34) scale(0.95) rotate(18)"/>' +
    '<use href="#skf" transform="translate(104 80) scale(0.72) rotate(40)"/>' +
    '<g transform="translate(118 12) rotate(30)"><ellipse rx="4" ry="6.5" fill="#F4AFC2"/><path d="M-4 3C-3 8 3 8 4 3L2 6L0 4L-2 6Z" fill="#9BB58A"/></g>' +
    '<g transform="translate(103 33) rotate(55)"><ellipse rx="3.2" ry="5.2" fill="#F7BACB"/><path d="M-3.2 2.4C-2.4 6.4 2.4 6.4 3.2 2.4L1.6 4.8L0 3.2L-1.6 4.8Z" fill="#9BB58A"/></g>' +
    '<use href="#skp" transform="translate(134 116) rotate(50) scale(0.6)"/><use href="#skp" transform="translate(76 130) rotate(-20) scale(0.5)"/>';
}

/* ---------- 라벤더 ---------- */

const BUD = 'M0 0C-2.4-1.2-2.9-5.2 0-7.8C2.9-5.2 2.4-1.2 0 0Z';

/** 라벤더 줄기 하나: 아래는 잎, 위쪽 절반엔 꽃봉오리가 양쪽으로 엇갈려 달린다 */
function lavenderStem(p0, p1, p2, buds = 16, s = 1) {
  let out = `<path d="M${p0[0]} ${p0[1]}Q${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}" stroke="#86A872" stroke-width="${1.7 * s}" fill="none" stroke-linecap="round"/>`;
  for (const t of [0.18, 0.3]) {
    const p = onCurve(p0, p1, p2, t);
    out += leaf(p.x, p.y, p.deg - 32, s, SLIM_LEAF) + leaf(p.x, p.y, p.deg + 32, s * 0.9, SLIM_LEAF);
  }
  for (let k = 0; k < buds; k++) {
    const t = 0.48 + (k / buds) * 0.5;
    const p = onCurve(p0, p1, p2, t);
    const side = k % 2 ? 1 : -1;
    const size = s * (1.15 - (k / buds) * 0.45);
    for (const tilt of [side * 32, side * -14]) {
      out += `<path d="${BUD}" transform="translate(${f(p.x)} ${f(p.y)}) rotate(${f(p.deg + tilt)}) scale(${f(size)})" fill="url(#lvb)" stroke="#8061BD" stroke-width="0.35"/>`;
    }
  }
  const tip = onCurve(p0, p1, p2, 1);
  out += `<path d="${BUD}" transform="translate(${f(tip.x)} ${f(tip.y)}) rotate(${f(tip.deg)}) scale(${f(s * 0.75)})" fill="url(#lvb)"/>`;
  return out;
}

function lavender() {
  return lavenderStem([-8, 120], [30, 70], [70, 14]) +
    lavenderStem([4, 140], [60, 110], [110, 56], 14, 0.92) +
    lavenderStem([-14, 92], [8, 50], [36, 4], 12, 0.85);
}

/* ---------- 수국 ---------- */

const HY_PETAL = 'M0 0C-3.6-1.2-4.6-5.8-1.7-7.8C-.6-8.4.6-8.4 1.7-7.8C4.6-5.8 3.6-1.2 0 0Z';

function floret(x, y, rot, s, grad) {
  return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})">` +
    [0, 90, 180, 270].map((r) => `<path d="${HY_PETAL}" transform="rotate(${r})" fill="url(#${grad})" stroke="#8EA6DD" stroke-width="0.35"/>`).join('') +
    '<circle r="1.4" fill="#FFFFFF"/><circle r="0.7" fill="#8C97D6"/></g>';
}

/** 작은 꽃 여러 송이를 둥글게 모아 수국 한 덩이를 만든다. 아래쪽 꽃이 위쪽 꽃을 살짝 덮도록 위에서부터 그린다. */
function hydrangeaCluster(cx, cy, radius, count) {
  const grads = ['hy1', 'hy2', 'hy3'];
  const pts = [];
  for (let i = 0; i < count; i++) {
    const r = radius * Math.sqrt((i + 0.5) / count);
    const a = i * 2.39996;
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.88, i });
  }
  pts.sort((p, q) => p.y - q.y);
  return pts.map((p) => floret(p.x, p.y, (p.i * 37) % 90, 1.05 + ((p.i * 7) % 5) * 0.06, grads[p.i % 3])).join('');
}

function hydrangea() {
  // 잎은 꽃덩이 아래쪽에서 살짝 삐져나오게 (먼저 그려서 꽃 뒤에 깔리도록)
  return leaf(70, 68, 128, 1.3) + leaf(50, 78, 172, 1.1) + leaf(78, 46, 95, 0.9) +
    hydrangeaCluster(52, 50, 33, 30);
}

/* ---------- 해바라기 ---------- */

const SF_PETAL = 'M0 0C-6.5-7-7-21 0-31C7-21 6.5-7 0 0Z';

/** 해바라기 꽃: 꽃잎 두 겹 + 갈색 가운데. 씨앗은 점 몇 개로만 살짝 표현해서 깔끔하게. */
function sunflowerHead(cx, cy, s, rot = 0) {
  let out = `<g transform="translate(${cx} ${cy}) rotate(${rot}) scale(${s})">`;
  for (let i = 0; i < 14; i++) out += `<path d="${SF_PETAL}" transform="rotate(${f(i * 360 / 14 + 360 / 28)}) translate(0 -11)" fill="url(#sfb)"/>`;
  for (let i = 0; i < 14; i++) out += `<path d="${SF_PETAL}" transform="rotate(${f(i * 360 / 14)}) translate(0 -12)" fill="url(#sff)" stroke="#E6A436" stroke-width="0.5"/>`;
  out += '<circle r="15.5" fill="url(#sfc)"/><circle r="15.5" fill="none" stroke="#5E3B1C" stroke-width="0.9"/>';
  [[5.5, 6], [10, 11]].forEach(([r, n], k) => {
    for (let j = 0; j < n; j++) {
      const a = (j / n) * Math.PI * 2 + k * 0.28;
      out += `<circle cx="${f(Math.cos(a) * r)}" cy="${f(Math.sin(a) * r)}" r="0.95" fill="#C08D52" opacity=".75"/>`;
    }
  });
  return out + '</g>';
}

function sunflower() {
  return '<path d="M62 86C82 104 104 124 150 152" stroke="#7FAA67" stroke-width="3.4" fill="none" stroke-linecap="round"/>' +
    leaf(96, 112, 40, 1.05) + leaf(80, 98, 160, 0.85) +
    sunflowerHead(118, 96, 0.44, 15) +
    sunflowerHead(50, 50, 0.95);
}

/* ---------- 튤립 ---------- */

/** 튤립 꽃 한 송이 (뿌리 쪽이 0,0, 위쪽을 향함): 뒤의 꽃잎 두 장 + 앞의 꽃잎 한 장 */
function tulipHead() {
  return '<path d="M-1 0C-8-1-12.5-8-11.5-16C-11-20.5-8.8-23.5-6.6-24.6C-5-18-3-9-1 0Z" fill="url(#tps)"/>' +
    '<path d="M1 0C8-1 12.5-8 11.5-16C11-20.5 8.8-23.5 6.6-24.6C5-18 3-9 1 0Z" fill="url(#tps)"/>' +
    '<path d="M0 1.2C-6.8 1.2-9.4-6-8.4-13.2C-7.8-17.8-4.2-22-0-24.6C4.2-22 7.8-17.8 8.4-13.2C9.4-6 6.8 1.2 0 1.2Z" fill="url(#tpf)" stroke="#E07059" stroke-width="0.6"/>' +
    '<path d="M-2.2-20C-4.2-14-4.2-6-2.4-1.2" stroke="#FFEAE2" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".8"/>';
}

function tulipStem(p0, p1, p2, s = 1) {
  const leafAt = onCurve(p0, p1, p2, 0.22);
  const head = onCurve(p0, p1, p2, 1);
  return `<path d="M${p0[0]} ${p0[1]}Q${p1[0]} ${p1[1]} ${p2[0]} ${p2[1]}" stroke="#7FAA67" stroke-width="${2.2 * s}" fill="none" stroke-linecap="round"/>` +
    `<path d="M0 0C-5-9-6-27 2-44C1.5-27 3-10 0 0Z" transform="translate(${f(leafAt.x)} ${f(leafAt.y)}) rotate(${f(leafAt.deg - 18)}) scale(${s})" fill="url(#lfg)" stroke="#6E9C5C" stroke-width="0.5"/>` +
    `<g transform="translate(${f(head.x)} ${f(head.y)}) rotate(${f(head.deg)}) scale(${1.2 * s})">${tulipHead()}</g>`;
}

function tulip() {
  return tulipStem([-10, 140], [36, 100], [100, 72], 0.9) +
    tulipStem([-6, 150], [26, 88], [68, 44]) +
    tulipStem([-16, 130], [6, 74], [36, 34], 0.85);
}

/* ---------- 내보내기 ---------- */

const ART = { sakura, lavender, hydrangea, sunflower, tulip };

/** 모서리 장식용 SVG 전체 */
export function decoSVG(themeId) {
  const draw = ART[themeId] || sakura;
  return `<svg viewBox="0 0 150 150" fill="none">${draw()}</svg>`;
}

/** 테마 버튼·꽃 목록에 쓰는 작은 꽃 아이콘 */
export const FLOWER_ICONS = {
  sakura: '<svg aria-hidden="true" width="34" height="34" viewBox="-24 -24 48 48"><use href="#skf" transform="scale(0.95)"/></svg>',
  lavender: `<svg aria-hidden="true" width="34" height="34" viewBox="-20 -22 40 44">${lavenderStem([-4, 22], [-2, 2], [3, -20], 11, 0.8)}</svg>`,
  hydrangea: `<svg aria-hidden="true" width="34" height="34" viewBox="-20 -20 40 40">${hydrangeaCluster(0, 0, 13, 9)}</svg>`,
  sunflower: `<svg aria-hidden="true" width="34" height="34" viewBox="-45 -45 90 90">${sunflowerHead(0, 0, 1)}</svg>`,
  tulip: `<svg aria-hidden="true" width="34" height="34" viewBox="-20 -24 40 46"><path d="M0 22V-2" stroke="#7FAA67" stroke-width="1.8" stroke-linecap="round"/><path d="M0 18C-5 10-10 9-13 11C-9 12-4 15 0 21Z" fill="url(#lfg)"/><g transform="translate(0 -1) scale(0.92)">${tulipHead()}</g></svg>`
};
