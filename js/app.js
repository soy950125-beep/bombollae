// 앱의 중심: 상태를 들고 있고, 버튼이 눌리면 상태를 바꾼 뒤 화면을 다시 그린다.
//   상태(S) 바뀜 → save()로 브라우저에 저장 → render()로 화면 다시 그림

import { APP_NAME, THEMES } from './config.js';
import { readJSON, writeJSON } from './storage.js';
import { fetchCatalog, searchTitles, fetchDetail, errorMessage } from './tmdb.js';
import { decoSVG } from './flowers.js';
import * as View from './views.js';

const STATE_KEY = 'bombollae-state-v1';
const CATALOG_KEY = 'bombollae-catalog-v1';
const CATALOG_TTL = 12 * 60 * 60 * 1000; // 작품 목록은 12시간마다 새로 받는다

/* ---------- 상태 ---------- */

function defaultState() {
  return {
    screen: 'survey',   // survey(설문) → watched(본 작품 체크) → main(추천 탭들)
    q: 0,               // 설문 몇 번째 질문인지
    kinds: ['drama', 'movie', 'anime'],
    loves: [],          // 좋아하는 요소 (최대 2개)
    dislikes: [],       // 피하고 싶은 요소
    habit: '',          // 보는 습관
    status: {},         // { 작품키: 'seen' | 'best' }
    wish: [],           // 찜한 작품키
    nope: [],           // '별로예요' 누른 작품키
    meta: {},           // 체크·찜한 작품 정보 (목록이 바뀌어도 기억하도록)
    theme: 'sakura',
    tab: 'rec',
    filter: 'all',
    wfilter: 'all',
    detail: null        // 열려 있는 상세 창의 작품키
  };
}

let S = { ...defaultState(), ...readJSON(STATE_KEY, {}), detail: null };
const savedCatalog = readJSON(CATALOG_KEY, null);
const catalog = { items: savedCatalog?.items || [], at: savedCatalog?.at || 0, loading: false, error: '' };
const search = { q: '', items: [], loading: false, error: '', seq: 0, timer: null };
const details = {};
let wipeArmed = false;

const save = () => writeJSON(STATE_KEY, S);

/** 작품키로 작품 정보 찾기: 현재 목록 → 검색 결과 → 저장해 둔 정보 순서 */
function lookup(key) {
  return catalog.items.find((it) => it.key === key)
    || search.items.find((it) => it.key === key)
    || S.meta[key]
    || null;
}

function remember(item) {
  if (!item) return;
  S.meta[item.key] = { ...item, overview: (item.overview || '').slice(0, 400) };
}

/* ---------- TMDB 불러오기 ---------- */

async function loadCatalog(force = false) {
  if (catalog.loading) return;
  if (!force && catalog.items.length && Date.now() - catalog.at < CATALOG_TTL) return;
  catalog.loading = true;
  catalog.error = '';
  render();
  try {
    catalog.items = await fetchCatalog();
    catalog.at = Date.now();
    writeJSON(CATALOG_KEY, { at: catalog.at, items: catalog.items });
  } catch (err) {
    catalog.error = errorMessage(err);
  }
  catalog.loading = false;
  render();
}

async function runSearch(q) {
  const seq = ++search.seq; // 빨리 연달아 칠 때 늦게 온 옛날 결과는 버린다
  search.q = q;
  search.error = '';
  if (!q) { search.items = []; search.loading = false; paintGrid(); return; }
  search.loading = true;
  paintGrid();
  try {
    const items = await searchTitles(q);
    if (seq !== search.seq) return;
    search.items = items;
  } catch (err) {
    if (seq !== search.seq) return;
    search.error = errorMessage(err);
  }
  search.loading = false;
  paintGrid();
}

async function loadDetail(item) {
  if (details[item.key] && !details[item.key].error) return;
  details[item.key] = { loading: true };
  try {
    const { data, providers } = await fetchDetail(item);
    details[item.key] = { data, providers };
    if (data.overview) item.overview = data.overview;
    const isLong = item.type === 'tv' && ((data.number_of_seasons || 0) >= 3 || (data.number_of_episodes || 0) > 50);
    if (isLong && !item.dis.includes('long')) item.dis.push('long');
    if (S.meta[item.key]) { remember(item); save(); }
  } catch (err) {
    details[item.key] = { error: errorMessage(err) };
  }
  if (S.detail === item.key) paintSheet();
}

/* ---------- 화면 그리기 ---------- */

const $ = (sel) => document.querySelector(sel);
const context = () => ({ S, catalog, search, details, lookup, wipeArmed });

function applyTheme() {
  const t = THEMES[S.theme] || THEMES.sakura;
  for (const k of ['bg', 'soft', 'accent', 'deep', 'ink', 'muted', 'line']) {
    document.documentElement.style.setProperty(`--${k}`, t[k]);
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.bg);
  const tl = $('#decoTL');
  if (tl.dataset.theme !== S.theme) {
    tl.innerHTML = decoSVG(S.theme);
    $('#decoBR').innerHTML = decoSVG(S.theme);
    tl.dataset.theme = S.theme;
  }
}

function paintGrid() {
  const grid = $('#wgrid');
  if (grid) grid.innerHTML = View.watchedGrid(context());
}

function paintSheet() {
  const sheet = $('#sheet');
  if (S.detail && S.screen === 'main') {
    const sameItem = sheet.dataset.key === S.detail; // 같은 작품을 다시 그릴 땐 올라오는 효과를 반복하지 않는다
    const scroll = sameItem ? sheet.firstElementChild?.scrollTop || 0 : 0;
    sheet.innerHTML = View.sheetView(context());
    sheet.hidden = false;
    sheet.dataset.key = S.detail;
    const panel = sheet.firstElementChild;
    if (panel) {
      if (sameItem) panel.classList.add('no-anim');
      panel.scrollTop = scroll;
    }
  } else {
    sheet.hidden = true;
    sheet.innerHTML = '';
    delete sheet.dataset.key;
  }
}

function render() {
  applyTheme();
  // 다시 그린 뒤에도 키보드 초점이 같은 버튼에 남도록 기억해 둔다
  const active = document.activeElement?.dataset?.act ? `${document.activeElement.dataset.act}|${document.activeElement.dataset.v || ''}` : '';

  const ctx = context();
  const view = $('#view');
  if (S.screen === 'survey') view.innerHTML = View.surveyView(ctx);
  else if (S.screen === 'watched') view.innerHTML = View.watchedView(ctx);
  else view.innerHTML = ({ rec: View.recView, wish: View.wishView, seen: View.seenView, theme: View.themeView }[S.tab] || View.recView)(ctx);

  const nav = $('#nav');
  nav.hidden = S.screen !== 'main';
  if (!nav.hidden) nav.innerHTML = View.navView(ctx);
  paintSheet();

  if (active) {
    const [act, v] = active.split('|');
    const el = document.querySelector(`[data-act="${act}"]${v ? `[data-v="${CSS.escape(v)}"]` : ''}`);
    if (el && !el.disabled) el.focus({ preventScroll: true });
  }
}

let toastTimer = null;
function toast(message) {
  const t = $('#toast');
  t.textContent = message;
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2200);
}

const toggle = (arr, v) => { const i = arr.indexOf(v); if (i === -1) arr.push(v); else arr.splice(i, 1); };
const top = () => window.scrollTo(0, 0);

/* ---------- 버튼 동작 ---------- */

const actions = {
  // 설문
  kind: (v) => toggle(S.kinds, v),
  love: (v) => {
    const i = S.loves.indexOf(v);
    if (i !== -1) S.loves.splice(i, 1);
    else { S.loves.push(v); if (S.loves.length > 2) S.loves.shift(); }
  },
  dis: (v) => toggle(S.dislikes, v),
  habit: (v) => { S.habit = v; },
  prev: () => { S.q = Math.max(0, S.q - 1); top(); },
  next: () => {
    if (S.q < 3) S.q++;
    else { S.screen = 'watched'; loadCatalog(); }
    top();
  },

  // 본 작품 체크: 안 봄 → 봤어요 → 인생작 → 안 봄
  mark: (key) => {
    const cur = S.status[key];
    if (!cur) { S.status[key] = 'seen'; remember(lookup(key)); }
    else if (cur === 'seen') S.status[key] = 'best';
    else delete S.status[key];
  },
  wkind: (v) => { S.wfilter = v; },
  done: () => { S.screen = 'main'; S.tab = 'rec'; search.q = ''; top(); loadCatalog(); },
  more: () => { S.screen = 'watched'; top(); },

  // 메인 탭
  tab: (v) => { S.tab = v; top(); },
  filter: (v) => { S.filter = v; },
  open: (key) => { S.detail = key; const it = lookup(key); if (it) loadDetail(it); },
  close: () => {
    const key = S.detail;
    S.detail = null;
    setTimeout(() => document.querySelector(`[data-act="open"][data-v="${CSS.escape(key)}"]`)?.focus({ preventScroll: true }), 0);
  },
  wish: (key) => {
    const adding = !S.wish.includes(key);
    toggle(S.wish, key);
    if (adding) remember(lookup(key));
    toast(adding ? '찜 목록에 담았어요' : '찜 목록에서 뺐어요');
  },
  seen: (key) => {
    const it = lookup(key);
    S.status[key] = 'seen';
    remember(it);
    S.detail = null;
    toast(`「${it ? it.title : ''}」 본 작품으로 옮겼어요`);
  },
  nope: (key) => {
    if (!S.nope.includes(key)) S.nope.push(key);
    S.detail = null;
    toast('이 작품은 더 추천하지 않을게요');
  },

  // 테마·설정
  theme: (v) => { S.theme = v; toast(`${THEMES[v].name} 테마로 바꿨어요`); },
  reload: () => { loadCatalog(true); },
  resurvey: () => { S.screen = 'survey'; S.q = 0; top(); },
  wipe: () => {
    if (!wipeArmed) { wipeArmed = true; return; } // 실수 방지: 두 번 눌러야 지워짐
    wipeArmed = false;
    const theme = S.theme;
    S = { ...defaultState(), theme };
    toast('기록을 모두 지웠어요');
  }
};

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-act]');
  if (!btn) {
    if (e.target.id === 'sheet') { actions.close(); save(); render(); } // 상세 창 바깥 누르면 닫기
    return;
  }
  const fn = actions[btn.dataset.act];
  if (!fn) return;
  if (btn.dataset.act !== 'wipe') wipeArmed = false;
  fn(btn.dataset.v);
  save();
  render();
});

document.addEventListener('input', (e) => {
  if (e.target.id !== 'wsearch') return;
  const q = e.target.value.trim();
  clearTimeout(search.timer);
  search.timer = setTimeout(() => runSearch(q), 350); // 다 칠 때까지 잠깐 기다렸다가 검색
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && S.detail) { actions.close(); save(); render(); }
});

/* ---------- 시작 화면 (로고) ---------- */

function startSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    splash.classList.add('splash-out');
    setTimeout(() => splash.remove(), 700);
    document.removeEventListener('keydown', close);
  };
  splash.addEventListener('click', close);      // 누르면 바로 넘어가기
  document.addEventListener('keydown', close);

  // 글꼴이 준비된 뒤에 애니메이션을 시작해야 이름이 기본 글꼴로 깜빡이지 않는다 (최대 0.6초만 기다림)
  const fontsReady = document.fonts?.ready || Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 600))]).then(() => {
    splash.classList.add('play');
    setTimeout(close, reduced ? 1500 : 3600);
  });
}

/* ---------- 시작 ---------- */
document.title = `${APP_NAME} · 안 본 작품만 골라 주는 추천`;
startSplash();
render();
if (S.screen !== 'survey') loadCatalog();
