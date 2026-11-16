// 앱의 중심: 상태를 들고 있고, 버튼이 눌리면 상태를 바꾼 뒤 화면을 다시 그린다.
//   상태(S) 바뀜 → save()로 브라우저에 저장 → render()로 화면 다시 그림

import { APP_NAME, THEMES } from './config.js';
import { readJSON, writeJSON } from './storage.js';
import { fetchCatalog, searchTitles, fetchDetail, errorMessage } from './tmdb.js';
import { decoSVG } from './flowers.js';
import { rankCandidates } from './recommend.js';
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
if (!['rec', 'cup', 'wish', 'seen'].includes(S.tab)) S.tab = 'rec'; // 예전 '테마' 탭은 오른쪽 위 버튼으로 옮겨짐
const savedCatalog = readJSON(CATALOG_KEY, null);
const catalog = { items: savedCatalog?.items || [], at: savedCatalog?.at || 0, loading: false, error: '' };
const search = { q: '', items: [], loading: false, error: '', seq: 0, timer: null };
const details = {};
let wipeArmed = false;
let justWished = null;  // 방금 찜한 작품 (그 하트만 톡 커지는 효과를 주려고)
let themeOpen = false; // 오른쪽 위 테마 버튼의 꽃 목록이 열려 있는지

// 찾기 화면 (검색어·종류·장르·정렬). 검색어가 있으면 TMDB 전체에서, 없으면 불러온 목록에서 찾는다
const find = { open: false, q: '', kind: 'all', genre: 'all', sort: 'rec', unseenOnly: true, items: [], loading: false, error: '', seq: 0, timer: null };

// 오늘의 한 편 월드컵 (새로고침하면 처음부터)
//   round: 이번 라운드 작품키들, next: 이긴 작품키들, idx: 몇 번째 대결인지, history: 되돌리기용
const cup = { stage: 'setup', source: 'rec', round: [], next: [], idx: 0, done: 0, total: 0, winner: null, history: [] };

const save = () => writeJSON(STATE_KEY, S);

/** 작품키로 작품 정보 찾기: 현재 목록 → 검색 결과 → 저장해 둔 정보 순서 */
function lookup(key) {
  return catalog.items.find((it) => it.key === key)
    || search.items.find((it) => it.key === key)
    || find.items.find((it) => it.key === key)
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

/** 찾기 화면 검색: 결과 부분만 다시 그려서 입력 중인 검색창이 흔들리지 않게 한다 */
async function runFind(q) {
  const seq = ++find.seq;
  find.q = q;
  find.error = '';
  if (!q) { find.items = []; find.loading = false; paintFind(); return; }
  find.loading = true;
  paintFind();
  try {
    const items = await searchTitles(q);
    if (seq !== find.seq) return;
    find.items = items;
  } catch (err) {
    if (seq !== find.seq) return;
    find.error = errorMessage(err);
  }
  find.loading = false;
  paintFind();
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
const context = () => ({
  S, catalog, search, details, lookup, wipeArmed, cup, find, justWished,
  cupCounts: S.tab === 'cup' && cup.stage === 'setup' ? { rec: cupPool('rec').length, wish: cupPool('wish').length } : {}
});

/* ---------- 월드컵 ---------- */

/** 월드컵 후보: 추천작이면 취향 점수 높은 순 16개, 찜이면 아직 안 본 찜 작품 전부 */
function cupPool(source) {
  if (source === 'wish') return S.wish.filter((key) => lookup(key) && !S.status[key]);
  return rankCandidates(catalog.items, { ...S, filter: 'all' }, lookup).slice(0, 16).map((x) => x.item.key);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 우승 축하: 화면 전체에 꽃잎을 잠깐 흩날린다 */
function petalRain() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const rain = document.createElement('div');
  rain.className = 'petal-rain';
  rain.setAttribute('aria-hidden', 'true');
  document.body.appendChild(rain);
  scatterPetals(rain, 36);
  setTimeout(() => rain.remove(), 5000);
}

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

function paintFind() {
  const grid = $('#fresults');
  if (!grid) return;
  const { count, html } = View.findResults(context());
  grid.innerHTML = html;
  $('#fcount').innerHTML = count;
  const clear = document.querySelector('[data-act="findClear"]');
  if (clear) clear.hidden = !find.q;
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
  // 지금 어떤 화면인지 body에 적어 두면, css에서 화면별로 장식을 다르게 할 수 있다
  const inFind = S.screen === 'main' && find.open;
  document.body.dataset.view = inFind ? 'find' : S.screen === 'main' ? S.tab : S.screen;
  // 다시 그린 뒤에도 키보드 초점이 같은 버튼에 남도록 기억해 둔다
  const active = document.activeElement?.dataset?.act ? `${document.activeElement.dataset.act}|${document.activeElement.dataset.v || ''}` : '';

  // 다시 그려도 가로 줄의 스크롤 위치가 처음으로 튀지 않도록 기억해 둔다
  const shelfScroll = {};
  document.querySelectorAll('.shelf-scroll[data-row]').forEach((el) => { shelfScroll[el.dataset.row] = el.scrollLeft; });

  const ctx = context();
  const view = $('#view');
  if (S.screen === 'survey') view.innerHTML = View.surveyView(ctx);
  else if (S.screen === 'watched') view.innerHTML = View.watchedView(ctx);
  else if (inFind) view.innerHTML = View.findView(ctx);
  else view.innerHTML = ({ rec: View.recView, cup: View.cupView, wish: View.wishView, seen: View.seenView }[S.tab] || View.recView)(ctx);

  document.querySelectorAll('.shelf-scroll[data-row]').forEach((el) => {
    if (shelfScroll[el.dataset.row]) el.scrollLeft = shelfScroll[el.dataset.row];
  });

  const nav = $('#nav');
  nav.hidden = S.screen !== 'main';
  if (!nav.hidden) nav.innerHTML = View.navView(ctx);

  const fab = $('#themeFab');
  fab.innerHTML = View.themeFab(ctx);
  fab.setAttribute('aria-expanded', String(themeOpen));
  const pop = $('#themePop');
  pop.hidden = !themeOpen;
  pop.innerHTML = themeOpen ? View.themePop(ctx) : '';
  paintSheet();
  justWished = null; // 효과는 한 번만

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
  tab: (v) => { S.tab = v; find.open = false; top(); if (v === 'cup') loadCatalog(); },

  // 찾기
  findOpen: () => {
    find.open = true;
    top();
    setTimeout(() => $('#fsearch')?.focus(), 0); // 열자마자 바로 칠 수 있게
  },
  findClose: () => { find.open = false; top(); },
  findClear: () => {
    clearTimeout(find.timer);
    find.q = ''; find.items = []; find.loading = false; find.seq++;
    setTimeout(() => $('#fsearch')?.focus(), 0);
  },
  findKind: (v) => { find.kind = v; },
  findGenre: (v) => { find.genre = v; },
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
    if (adding) { remember(lookup(key)); justWished = key; }
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

  // 월드컵
  cupSource: (v) => { cup.source = v; },
  cupStart: () => {
    const pool = cupPool(cup.source);
    const size = pool.length >= 8 ? 8 : pool.length >= 4 ? 4 : 0; // 8편이 되면 8강, 모자라면 4강
    if (!size) { toast('작품이 4개 이상 있어야 해요'); return; }
    // 추천작은 점수 높은 순으로 자른 뒤 섞고, 찜은 섞은 뒤 자른다
    const keys = cup.source === 'rec' ? shuffle(pool.slice(0, size)) : shuffle(pool).slice(0, size);
    Object.assign(cup, { stage: 'match', round: keys, next: [], idx: 0, done: 0, total: size - 1, winner: null, history: [] });
    keys.forEach((k) => remember(lookup(k)));
    top();
  },
  cupPick: (key) => {
    cup.history.push(JSON.stringify({ round: cup.round, next: cup.next, idx: cup.idx, done: cup.done }));
    cup.next.push(key);
    cup.idx++;
    cup.done++;
    if (cup.idx * 2 >= cup.round.length) {      // 이번 라운드 끝
      if (cup.next.length === 1) {              // 결승까지 끝 → 우승
        cup.winner = cup.next[0];
        cup.stage = 'done';
        petalRain();
      } else {                                   // 다음 라운드로
        cup.round = cup.next;
        cup.next = [];
        cup.idx = 0;
      }
    }
    top();
  },
  cupUndo: () => {
    const prev = cup.history.pop();
    if (prev) Object.assign(cup, JSON.parse(prev), { stage: 'match', winner: null });
  },
  cupQuit: () => { cup.stage = 'setup'; top(); },
  cupReset: () => { cup.stage = 'setup'; top(); },

  // 테마·설정
  themeMenu: () => { themeOpen = !themeOpen; },
  theme: (v) => {
    themeOpen = false;
    if (S.theme === v) return;
    S.theme = v;
    toast(`${THEMES[v].name} 테마로 바꿨어요`);
  },
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
  // 꽃 목록이 열려 있을 때 바깥을 누르면 닫기만 한다 (아래에 있던 버튼이 같이 눌리지 않도록)
  if (themeOpen && !e.target.closest('#themePop') && !e.target.closest('#themeFab')) {
    themeOpen = false;
    render();
    return;
  }
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
  if (e.target.id === 'fsearch') {
    const q = e.target.value.trim();
    clearTimeout(find.timer);
    find.timer = setTimeout(() => runFind(q), 350);
    return;
  }
  if (e.target.id !== 'wsearch') return;
  const q = e.target.value.trim();
  clearTimeout(search.timer);
  search.timer = setTimeout(() => runSearch(q), 350); // 다 칠 때까지 잠깐 기다렸다가 검색
});

// 찾기 화면의 정렬·안 본 것만
document.addEventListener('change', (e) => {
  if (e.target.id === 'fsort') { find.sort = e.target.value; paintFind(); }
  if (e.target.id === 'funseen') { find.unseenOnly = e.target.checked; paintFind(); }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.id === 'fsearch') { // 엔터를 누르면 기다리지 않고 바로 검색
    clearTimeout(find.timer);
    runFind(e.target.value.trim());
    e.target.blur();
    return;
  }
  if (e.key !== 'Escape') return;
  if (themeOpen) { themeOpen = false; render(); $('#themeFab').focus(); return; }
  if (S.detail) { actions.close(); save(); render(); }
});

/* ---------- 시작 화면 (로고) ---------- */

/** 흩날리는 꽃잎을 count장 만든다. 위치·크기·속도·방향을 조금씩 다르게 해서 자연스럽게 보이도록. */
function scatterPetals(container, count) {
  const colors = ['#F7BACB', '#F3A9BE', '#F9C9D6', '#FBD3DD', '#EE93AD'];
  const rand = (min, max) => min + Math.random() * (max - min);
  let html = '';
  for (let i = 0; i < count; i++) {
    const size = rand(9, 19).toFixed(0);
    // 시작 시간을 음수로 주면 화면이 열리자마자 이미 내려오고 있는 꽃잎도 생긴다
    const style = [
      `left:${rand(-5, 100).toFixed(1)}%`,
      `width:${size}px`, `height:${size}px`,
      `--dx:${rand(-80, 80).toFixed(0)}px`,
      `--rot:${rand(-320, 320).toFixed(0)}deg`,
      `animation-delay:${rand(-1.8, 1.6).toFixed(2)}s`,
      `animation-duration:${rand(2.8, 4.4).toFixed(2)}s`
    ].join(';');
    html += `<svg class="fall" style="${style}" viewBox="-12 -28 24 30"><use href="#lp" fill="${colors[i % colors.length]}"/></svg>`;
  }
  container.insertAdjacentHTML('beforeend', html);
}

function startSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    splash.classList.add('splash-out');
    setTimeout(() => splash.remove(), 500);
    document.removeEventListener('keydown', close);
  };
  splash.addEventListener('click', close);      // 누르면 바로 넘어가기
  document.addEventListener('keydown', close);
  if (!reduced) scatterPetals(splash, 28);

  // 글꼴이 준비된 뒤에 애니메이션을 시작해야 이름이 기본 글꼴로 깜빡이지 않는다 (최대 0.6초만 기다림)
  const fontsReady = document.fonts?.ready || Promise.resolve();
  Promise.race([fontsReady, new Promise((r) => setTimeout(r, 600))]).then(() => {
    splash.classList.add('play');
    setTimeout(close, reduced ? 1000 : 2000);
  });
}

/* ---------- 시작 ---------- */
document.title = `${APP_NAME} · 안 본 작품만 골라 주는 추천`;
startSplash();
render();
if (S.screen !== 'survey') loadCatalog();
