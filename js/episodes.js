// 드라마·애니 회차 수 ("16부작", "24화", "시즌 3 · 48화").
// 작품 목록에는 회차 수가 없어서, 화면에 보이는 작품만 하나씩 TMDB에 물어보고 받는 대로 채워 넣는다.
// 받은 회차 수는 브라우저에 저장해서 다음부터는 바로 보여 준다.

import { tmdb } from './tmdb.js';
import { readJSON, writeJSON } from './storage.js';

const KEY = 'bombollae-eps-v1';
const cache = readJSON(KEY, {});   // 작품키 → [시즌 수, 전체 회차 수]
const failed = new Set();          // 이번에 못 받은 작품 (저장하지 않아서 다음에 다시 시도)
const queued = new Set();
const queue = [];
const MAX_AT_ONCE = 6;             // 한꺼번에 너무 많이 묻지 않도록 동시에 6개까지만
let active = 0;
let saveTimer = null;

function label(key, kind) {
  const v = cache[key];
  if (!v || !v[1]) return '';
  const [seasons, episodes] = v;
  if (seasons > 1) return `시즌 ${seasons} · ${episodes}화`;
  return kind === 'anime' ? `${episodes}화` : `${episodes}부작`;
}

/** 작품 정보 줄 끝에 붙일 회차 수 자리. 아직 모르면 빈칸으로 두고, 받아오면 채운다. */
export function epsSpan(it) {
  if (it.type !== 'tv') return '';
  const text = label(it.key, it.kind);
  return `<span class="eps" data-eps="${it.key}" data-kind="${it.kind}">${text ? ' · ' + text : ''}</span>`;
}

function paint(key) {
  document.querySelectorAll(`[data-eps="${CSS.escape(key)}"]`).forEach((el) => {
    const text = label(key, el.dataset.kind);
    el.textContent = text ? ' · ' + text : '';
  });
}

function saveSoon() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => writeJSON(KEY, cache), 800);
}

/** 상세 정보를 이미 받았을 때 (상세 화면을 열었을 때) 바로 저장 */
export function rememberEps(it, data) {
  if (it.type !== 'tv' || !data?.number_of_episodes) return;
  cache[it.key] = [data.number_of_seasons || 1, data.number_of_episodes];
  saveSoon();
  paint(it.key);
}

function pump() {
  while (active < MAX_AT_ONCE && queue.length) {
    const key = queue.shift();
    active++;
    tmdb(`/tv/${key.split('-')[1]}`)
      .then((d) => {
        cache[key] = [d.number_of_seasons || 1, d.number_of_episodes || 0];
        saveSoon();
        paint(key);
      })
      .catch(() => failed.add(key))
      .finally(() => { active--; queued.delete(key); pump(); });
  }
}

/** 화면을 다시 그린 뒤 호출: 회차 수가 비어 있는 드라마·애니를 찾아서 받아 온다 */
export function fillEpisodes() {
  document.querySelectorAll('[data-eps]').forEach((el) => {
    const key = el.dataset.eps;
    if (cache[key] || queued.has(key) || failed.has(key)) return;
    queued.add(key);
    queue.push(key);
  });
  pump();
}
