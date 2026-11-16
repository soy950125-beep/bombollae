// 꽃 테마 그림. 사진 대신 SVG(코드로 그린 그림)를 써서 저작권 걱정이 없고 어떤 화면 크기에서도 선명하다.
// 각 함수는 150×150 크기 안에 꽃가지 하나를 그린다. 같은 그림을 오른쪽 아래에 180도 돌려서 한 번 더 쓴다.

function sakura() {
  return '<path d="M-4 104C24 96 52 80 74 58C92 40 104 22 112 2L116 4C108 26 96 44 78 62C56 84 28 100-2 110Z" fill="#9B7178"/>' +
    '<path d="M60 72C70 78 82 82 96 80L96 83C82 86 68 82 58 75Z" fill="#9B7178"/>' +
    '<use href="#skf" transform="translate(50 66) scale(1.25)"/><use href="#skf" transform="translate(92 34) scale(0.95) rotate(18)"/>' +
    '<use href="#skf" transform="translate(102 80) scale(0.7) rotate(40)"/>' +
    '<g transform="translate(118 12) rotate(30)"><ellipse rx="4" ry="6.5" fill="#F4AFC2"/><path d="M-4 3C-3 8 3 8 4 3L2 6L0 4L-2 6Z" fill="#9BB58A"/></g>' +
    '<use href="#skp" transform="translate(134 116) rotate(50) scale(0.6)"/><use href="#skp" transform="translate(76 130) rotate(-20) scale(0.5)"/>';
}

function lavender() {
  const colors = ['#B79CE0', '#A585D9', '#C9B3EC'];
  let out = '';
  for (const [x0, y0, x1, y1] of [[-6, 118, 72, 12], [10, 140, 108, 44], [-12, 84, 34, -6]]) {
    const ang = Math.atan2(y1 - y0, x1 - x0);
    const deg = ang * 180 / Math.PI + 90;
    const nx = -Math.sin(ang), ny = Math.cos(ang);
    const lx = x0 + (x1 - x0) * 0.32 + nx * 6, ly = y0 + (y1 - y0) * 0.32 + ny * 6;
    out += `<path d="M${x0} ${y0}L${x1} ${y1}" stroke="#7FA36B" stroke-width="1.8" stroke-linecap="round"/>`;
    out += `<ellipse cx="${lx}" cy="${ly}" rx="2" ry="9" fill="#93B784" transform="rotate(${deg + 30} ${lx} ${ly})"/>`;
    for (let k = 0; k < 10; k++) {
      const t = 0.5 + k * 0.055, off = (k % 2 ? 3.3 : -3.3) * (1 - k * 0.05);
      const px = (x0 + (x1 - x0) * t + nx * off).toFixed(1), py = (y0 + (y1 - y0) * t + ny * off).toFixed(1);
      out += `<ellipse cx="${px}" cy="${py}" rx="${(3.1 - k * 0.12).toFixed(2)}" ry="${(4.8 - k * 0.15).toFixed(2)}" fill="${colors[k % 3]}" transform="rotate(${deg.toFixed(1)} ${px} ${py})"/>`;
    }
  }
  return out;
}

function hydrangea() {
  let out = '<ellipse cx="98" cy="94" rx="12" ry="27" transform="rotate(-45 98 94)" fill="#9CC48E"/><path d="M98 94L80 76" stroke="#7FA36B" stroke-width="1"/>' +
    '<ellipse cx="76" cy="110" rx="9" ry="21" transform="rotate(-20 76 110)" fill="#86B27A"/>';
  const colors = ['#9DBDF0', '#B9AEEF', '#B6D4F4', '#C9C1F4', '#8FB0EA'];
  // 해바라기 씨앗 배열(황금각)로 작은 꽃 23송이를 둥글게 모은다
  for (let i = 22; i >= 0; i--) {
    const r = 8.6 * Math.sqrt(i), a = i * 2.39996;
    const px = (52 + Math.cos(a) * r).toFixed(1), py = (50 + Math.sin(a) * r).toFixed(1);
    out += `<g transform="translate(${px} ${py}) rotate(${i * 17})" fill="${colors[i % colors.length]}">` +
      '<ellipse cy="-4.6" rx="3.7" ry="4.9"/><ellipse cy="-4.6" rx="3.7" ry="4.9" transform="rotate(90)"/>' +
      '<ellipse cy="-4.6" rx="3.7" ry="4.9" transform="rotate(180)"/><ellipse cy="-4.6" rx="3.7" ry="4.9" transform="rotate(270)"/><circle r="1.2" fill="#FFFFFF"/></g>';
  }
  return out;
}

function sunflowerHead(cx, cy, s) {
  let out = `<g transform="translate(${cx} ${cy}) scale(${s})">`;
  for (let i = 0; i < 16; i++) out += `<ellipse cy="-27" rx="6" ry="15" fill="#F4C43C" transform="rotate(${i * 22.5 + 11.25})"/>`;
  for (let j = 0; j < 16; j++) out += `<ellipse cy="-25" rx="6.4" ry="15" fill="url(#sfg)" stroke="#E0A92B" stroke-width="0.6" transform="rotate(${j * 22.5})"/>`;
  out += '<circle r="17" fill="#6B4423" stroke="#8A5A2E" stroke-width="1.5"/>';
  for (let k = 1; k < 70; k++) {
    const r = 1.95 * Math.sqrt(k), a = k * 2.39996;
    out += `<circle cx="${(Math.cos(a) * r).toFixed(1)}" cy="${(Math.sin(a) * r).toFixed(1)}" r="0.85" fill="#3F2814"/>`;
  }
  return out + '</g>';
}

function sunflower() {
  return '<path d="M116 100L150 150" stroke="#7FA36B" stroke-width="3" stroke-linecap="round"/><ellipse cx="134" cy="126" rx="6" ry="14" transform="rotate(-60 134 126)" fill="#8DB57A"/>' +
    sunflowerHead(50, 50, 1) + sunflowerHead(116, 100, 0.5);
}

function tulipStem(bx, by, hx, hy, tone) {
  const ang = Math.atan2(hy - by, hx - bx), deg = ang * 180 / Math.PI + 90;
  const mx = (bx + hx) / 2, my = (by + hy) / 2;
  return `<path d="M${bx} ${by}Q${mx - 8} ${my + 4} ${hx} ${hy}" stroke="#7FA36B" stroke-width="2.2" fill="none" stroke-linecap="round"/>` +
    `<ellipse cx="${mx}" cy="${my}" rx="4" ry="16" fill="#8DB57A" transform="rotate(${(deg - 28).toFixed(1)} ${mx} ${my})"/>` +
    `<g transform="translate(${hx} ${hy}) rotate(${deg.toFixed(1)})"><g transform="translate(0 -6)">` +
    '<path d="M-11-2C-12-16-5-21-4-14L0-21L4-14C5-21 12-16 11-2C11 8-11 8-11-2Z" fill="url(#tlg)" stroke="#E07F6A" stroke-width="0.8"/>' +
    `<path d="M0-19C-3-12-3-4 0 5C3-4 3-12 0-19Z" fill="${tone}" opacity="0.55"/></g></g>`;
}

function tulip() {
  return tulipStem(-4, 150, 62, 30, '#F6B3A1') + tulipStem(-10, 140, 94, 62, '#F9C3B4') + tulipStem(-14, 132, 28, 16, '#F6B3A1');
}

const ART = { sakura, lavender, hydrangea, sunflower, tulip };

/** 모서리 장식용 SVG 전체 */
export function decoSVG(themeId) {
  const draw = ART[themeId] || sakura;
  return `<svg viewBox="0 0 150 150" fill="none">${draw()}</svg>`;
}

/** 테마 고르는 화면의 작은 꽃 아이콘 */
export const FLOWER_ICONS = {
  sakura: '<svg aria-hidden="true" width="34" height="34" viewBox="-24 -24 48 48"><use href="#skf" transform="scale(0.95)"/></svg>',
  lavender: '<svg aria-hidden="true" width="34" height="34" viewBox="-20 -20 40 40"><path d="M0 19V-17" stroke="#7FA36B" stroke-width="1.6" stroke-linecap="round"/><g fill="#B79CE0"><ellipse cx="-3" cy="-14" rx="2.6" ry="3.8"/><ellipse cx="3" cy="-10" rx="2.6" ry="3.8"/><ellipse cx="-3" cy="-6" rx="2.6" ry="3.8"/><ellipse cx="3" cy="-2" rx="2.6" ry="3.8"/><ellipse cx="-3" cy="2" rx="2.6" ry="3.8"/><ellipse cx="3" cy="6" rx="2.6" ry="3.8"/></g></svg>',
  hydrangea: '<svg aria-hidden="true" width="34" height="34" viewBox="-20 -20 40 40"><circle cx="-7" cy="-4" r="7" fill="#9DBDF0"/><circle cx="6" cy="-7" r="7" fill="#B9AEEF"/><circle cx="8" cy="6" r="7" fill="#9DBDF0"/><circle cx="-4" cy="8" r="7" fill="#B6D4F4"/><circle r="6" fill="#C9C1F4"/><g fill="#FFFFFF"><circle cx="-7" cy="-4" r="1.2"/><circle cx="6" cy="-7" r="1.2"/><circle cx="8" cy="6" r="1.2"/><circle cx="-4" cy="8" r="1.2"/><circle r="1.2"/></g></svg>',
  sunflower: `<svg aria-hidden="true" width="36" height="36" viewBox="-44 -44 88 88">${sunflowerHead(0, 0, 1)}</svg>`,
  tulip: '<svg aria-hidden="true" width="34" height="34" viewBox="-20 -24 40 46"><path d="M0 20V0" stroke="#7FA36B" stroke-width="1.8" stroke-linecap="round"/><path d="M0 15C-4 9-9 8-12 10C-8 11-4 13 0 18Z" fill="#8DB57A"/><g transform="translate(0 -4)"><path d="M-11-2C-12-16-5-21-4-14L0-21L4-14C5-21 12-16 11-2C11 8-11 8-11-2Z" fill="url(#tlg)" stroke="#E07F6A" stroke-width="0.8"/></g></svg>'
};
