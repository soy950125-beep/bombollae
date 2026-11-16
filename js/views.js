// 화면(HTML)을 만드는 함수 모음. 상태(ctx)를 받아서 HTML 문자열을 돌려줄 뿐, 상태를 바꾸지는 않는다.
// 버튼에는 data-act(무슨 동작인지)와 data-v(대상)를 붙여 두고, 실제 동작은 app.js가 처리한다.

import {
  APP_NAME, KINDS, KIND_HINT, TAGS, TAG_HINT, DIS, DIS_HINT, HABITS, THEMES, GENRE_NAME, IMG_BASE, POSTER_COLORS
} from './config.js';
import { FLOWER_ICONS } from './flowers.js';
import { analyze, rankCandidates, buildShelves } from './recommend.js';

/* ---------- 작은 도우미 ---------- */

/** 작품 제목처럼 바깥에서 온 글자를 HTML에 넣기 전에 안전하게 바꾼다 */
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const ICON = {
  star: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/></svg>',
  heart: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  heartLg: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  heartSolid: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  heartFill: '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  check: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4 10-10"/></svg>',
  checkSm: '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4 10-10"/></svg>',
  eye: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l4 4 10-10"/></svg>',
  flower: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="8" r="3"/><circle cx="7.5" cy="13" r="3"/><circle cx="16.5" cy="13" r="3"/><path d="M12 15v6"/></svg>',
  search: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  x: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
};

/** 포스터가 없을 때 쓸 파스텔 색 (작품마다 항상 같은 색) */
function colorFor(key) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return POSTER_COLORS[h % POSTER_COLORS.length];
}

function genreLine(it) {
  return it.g.map((id) => GENRE_NAME[id]).filter(Boolean).slice(0, 3).join(' · ');
}

/** 포스터 칸. 이미지가 없거나 깨지면 파스텔 색 + 제목으로 보인다. inner는 체크 표시 같은 덧붙임. */
function poster(it, size = 'w342', inner = '') {
  const img = it.poster
    ? `<img src="${IMG_BASE}${size}${it.poster}" alt="" loading="lazy" onerror="this.nextElementSibling.hidden=false;this.remove()"><span class="ptitle" hidden>${esc(it.title)}</span>`
    : `<span class="ptitle">${esc(it.title)}</span>`;
  return `<span class="poster" style="background:${colorFor(it.key)}">${img}${inner}</span>`;
}

const loading = (text) => `<p class="loading"><span class="dot"></span><span class="dot"></span><span class="dot"></span><br>${text}</p>`;
const empty = (title, body, extra = '') => `<div class="empty"><strong>${title}</strong>${body}${extra}</div>`;
const fullRow = (html) => `<div style="grid-column:1/-1">${html}</div>`;

function counts(S) {
  let seen = 0, best = 0;
  for (const v of Object.values(S.status)) { if (v) seen++; if (v === 'best') best++; }
  return { seen, best };
}

/* ---------- 설문 ---------- */

function option(act, value, label, hint, on) {
  return `<button type="button" class="opt" data-act="${act}" data-v="${value}" aria-pressed="${on}">` +
    `<span class="opt-label">${label}</span><span class="opt-hint">${hint}</span></button>`;
}
function lead(eyebrow, heading, text) {
  return `<div class="lead"><span class="eyebrow">${eyebrow}</span><h1>${heading}</h1><p>${text}</p></div>`;
}

export function surveyView({ S }) {
  const q = S.q;
  let body = '';
  let ok = true;
  if (q === 0) {
    body = lead(`${APP_NAME}에 오신 걸 환영해요`, '어떤 걸 추천받고 싶어요?', '여러 개 골라도 돼요. 본 작품은 빼고 골라 드릴게요.') +
      `<div class="opts one">${Object.keys(KINDS).map((k) => option('kind', k, KINDS[k], KIND_HINT[k], S.kinds.includes(k))).join('')}</div>`;
    ok = S.kinds.length > 0;
  } else if (q === 1) {
    body = lead('취향 알아보기', '볼 때 가장 중요한 건 뭐예요?', '2개까지 골라 주세요. 추천 이유를 쓸 때 참고할게요.') +
      `<div class="opts">${Object.keys(TAGS).map((k) => option('love', k, TAGS[k], TAG_HINT[k], S.loves.includes(k))).join('')}</div>`;
    ok = S.loves.length > 0;
  } else if (q === 2) {
    body = lead('취향 알아보기', '이런 건 피하고 싶어요', '없으면 그냥 넘어가도 돼요. 골라 두면 추천 순위에서 뒤로 보낼게요.') +
      `<div class="opts">${Object.keys(DIS).map((k) => option('dis', k, DIS[k], DIS_HINT[k], S.dislikes.includes(k))).join('')}</div>`;
  } else {
    body = lead('마지막 질문', '주로 어떻게 봐요?', '보는 습관에 맞는 작품을 위로 올려 드려요.') +
      `<div class="opts one">${HABITS.map((h) => option('habit', h.id, h.label, h.hint, S.habit === h.id)).join('')}</div>`;
    ok = Boolean(S.habit);
  }
  return '<section class="survey" aria-label="취향 설문">' +
    `<div class="survey-top"><div class="progress" role="progressbar" aria-label="설문 진행" aria-valuemin="1" aria-valuemax="4" aria-valuenow="${q + 1}"><span style="width:${(q + 1) * 25}%"></span></div><span class="step">${q + 1} / 4</span></div>` +
    body +
    `<div class="survey-foot">${q > 0 ? '<button type="button" class="ghost" data-act="prev">이전</button>' : ''}` +
    `<button type="button" class="primary" data-act="next"${ok ? '' : ' disabled'}>${q === 3 ? '본 작품 체크하러 가기' : '다음'}</button></div></section>`;
}

/* ---------- 본 작품 체크 ---------- */

function kindChips(act, current) {
  return `<div class="chips" role="group" aria-label="종류">${['all', ...Object.keys(KINDS)].map((k) =>
    `<button type="button" class="chip" data-act="${act}" data-v="${k}" aria-pressed="${current === k}">${k === 'all' ? '전체' : KINDS[k]}</button>`
  ).join('')}</div>`;
}

function pick(it, S) {
  const st = S.status[it.key] || '';
  const label = st === 'best' ? '인생작' : st === 'seen' ? '봤어요' : '';
  const badge = st === 'best' ? `<span class="badge">${ICON.heartFill}</span>` : st === 'seen' ? `<span class="badge">${ICON.checkSm}</span>` : '';
  return `<button type="button" class="pick" data-act="mark" data-v="${it.key}" data-state="${st}" aria-label="${esc(it.title)}, ${label || '안 봤어요'}">` +
    poster(it, 'w185', badge) +
    `<span class="pname">${esc(it.title)}</span><span class="pmeta">${KINDS[it.kind]}${it.year ? ' · ' + it.year : ''}${label ? ' · ' + label : ''}</span></button>`;
}

export function watchedGrid({ S, catalog, search }) {
  const byKind = (it) => S.wfilter === 'all' || it.kind === S.wfilter;
  if (search.q) {
    if (search.loading) return fullRow(loading('찾는 중이에요'));
    if (search.error) return fullRow(empty('검색하지 못했어요', esc(search.error)));
    const found = search.items.filter(byKind);
    return found.length ? found.map((it) => pick(it, S)).join('') : fullRow(empty('검색 결과가 없어요', '제목을 조금 다르게 써 보세요.'));
  }
  if (catalog.loading && !catalog.items.length) return fullRow(loading('인기 작품을 불러오는 중이에요'));
  if (catalog.error && !catalog.items.length) {
    return fullRow(empty('작품을 불러오지 못했어요', esc(catalog.error), '<br><br><button type="button" class="ghost sm" data-act="reload">다시 불러오기</button>'));
  }
  return catalog.items.filter(byKind).sort((a, b) => b.pop - a.pop).slice(0, 90).map((it) => pick(it, S)).join('');
}

export function watchedView(ctx) {
  const { S, search } = ctx;
  const c = counts(S);
  return '<header class="page-head"><h1>본 작품 체크</h1><p>한 번 누르면 <b>봤어요</b>, 두 번 누르면 <b>인생작</b>, 세 번 누르면 취소돼요.</p></header>' +
    `<div class="tools"><label class="search">${ICON.search}<input id="wsearch" type="search" placeholder="못 찾겠으면 제목으로 검색" aria-label="작품 제목 검색" autocomplete="off" value="${esc(search.q)}"></label>${kindChips('wkind', S.wfilter)}</div>` +
    `<div class="pgrid" id="wgrid">${watchedGrid(ctx)}</div>` +
    `<div class="bar"><span><span class="count">${c.seen}</span>개 체크 · 인생작 ${c.best}개</span><button type="button" class="primary sm" data-act="done">추천 받기</button></div>`;
}

/* ---------- 추천 · 찜 · 본 작품 ---------- */

/** 가로 줄 안의 작품 한 칸: 포스터 + 제목 + 줄거리 요약 + 찜 버튼 */
function tile({ item }, S) {
  const wished = S.wish.includes(item.key);
  const summary = item.overview || genreLine(item) || KINDS[item.kind];
  return '<div class="tile">' +
    `<button type="button" class="tile-open" data-act="open" data-v="${item.key}" aria-label="${esc(item.title)} 자세히 보기">` +
    poster(item, 'w342') +
    `<span class="tile-title">${esc(item.title)}</span>` +
    `<span class="tile-meta">${[KINDS[item.kind], item.year].filter(Boolean).join(' · ')}</span>` +
    `<span class="tile-sum">${esc(summary)}</span></button>` +
    `<button type="button" class="tile-heart" data-act="wish" data-v="${item.key}" aria-pressed="${wished}" aria-label="${esc(item.title)} ${wished ? '찜 취소' : '찜하기'}">${wished ? ICON.heartSolid : ICON.heart}</button>` +
    '</div>';
}

/** 맨 위 큰 카드: 오늘의 1순위 */
function heroCard({ item, a }, S) {
  const wished = S.wish.includes(item.key);
  const img = item.backdrop ? `${IMG_BASE}w780${item.backdrop}` : item.poster ? `${IMG_BASE}w500${item.poster}` : '';
  const style = `background-color:${colorFor(item.key)}${img ? `;background-image:url(${img})` : ''}`;
  const meta = [KINDS[item.kind], item.year, genreLine(item)].filter(Boolean).join(' · ');
  return `<article class="hero${img ? ' has-img' : ''}" style="${style}">` +
    '<span class="hero-eyebrow">오늘의 1순위</span>' +
    `<h2 class="hero-title">${esc(item.title)}</h2>` +
    `<span class="hero-meta">${meta}</span>` +
    `<p class="hero-reason">${esc(a.reasons[0])}</p>` +
    '<div class="hero-actions">' +
    `<button type="button" class="hero-open" data-act="open" data-v="${item.key}">자세히 보기</button>` +
    `<button type="button" class="hero-heart" data-act="wish" data-v="${item.key}" aria-pressed="${wished}" aria-label="${wished ? '찜 취소' : '찜하기'}">${wished ? ICON.heartSolid : ICON.heart}</button>` +
    '</div></article>';
}

export function recView({ S, catalog, lookup }) {
  const head = '<header class="page-head"><h1>오늘의 추천</h1></header>';
  if (catalog.loading && !catalog.items.length) return head + loading('작품을 불러오는 중이에요');
  if (catalog.error && !catalog.items.length) {
    return head + empty('작품을 불러오지 못했어요', esc(catalog.error), '<br><br><button type="button" class="ghost sm" data-act="reload">다시 불러오기</button>');
  }
  const ranked = rankCandidates(catalog.items, S, lookup);
  if (!ranked.length) {
    return head + kindChips('filter', S.filter) + empty('추천할 작품을 다 봤어요!', '다른 종류를 골라 보거나, 테마 탭에서 목록을 새로 불러와 보세요.');
  }
  const { hero, rows } = buildShelves(ranked, S, lookup);
  const shelves = rows.map((row) =>
    `<section class="shelf" aria-label="${esc(row.title)}">` +
    `<h2 class="shelf-title">${esc(row.title)}</h2>` +
    `<div class="shelf-scroll" data-row="${esc(row.id)}">${row.items.map((x) => tile(x, S)).join('')}</div></section>`
  ).join('');
  return head + kindChips('filter', S.filter) + heroCard(hero, S) + shelves;
}

export function wishView({ S, lookup }) {
  const list = S.wish.map(lookup).filter(Boolean).map((item) => ({ item }));
  return '<header class="page-head"><span class="eyebrow">나중에 볼 작품</span><h1>찜 목록</h1></header>' +
    (list.length ? `<div class="tile-grid">${list.map((x) => tile(x, S)).join('')}</div>`
      : empty('아직 찜한 작품이 없어요', '추천 화면에서 하트를 누르면 여기에 모여요.'));
}

export function seenView({ S, lookup }) {
  const list = Object.keys(S.status).map(lookup).filter(Boolean);
  const c = counts(S);
  return `<header class="page-head"><span class="eyebrow">봤어요 ${c.seen}개 · 인생작 ${c.best}개</span><h1>본 작품</h1></header>` +
    (list.length ? `<div class="pgrid">${list.map((it) => pick(it, S)).join('')}</div>`
      : empty('아직 체크한 작품이 없어요', '본 작품을 체크하면 추천에서 빠져요.')) +
    '<button type="button" class="ghost" data-act="more">본 작품 더 체크하기</button>';
}

/* ---------- 테마 · 설정 ---------- */

export function themeView({ S, catalog, wipeArmed }) {
  const mins = catalog.at ? Math.round((Date.now() - catalog.at) / 60000) : 0;
  const when = !catalog.at ? '아직 안 불러왔어요' : mins < 60 ? `${mins}분 전` : `${Math.round(mins / 60)}시간 전`;
  const themes = Object.entries(THEMES).map(([id, t]) =>
    `<button type="button" class="theme" data-act="theme" data-v="${id}" aria-pressed="${S.theme === id}">` +
    `<span class="theme-icon" style="background:${t.soft}">${FLOWER_ICONS[id]}</span>` +
    `<span class="theme-text"><span class="theme-name">${t.name}</span><span class="theme-sub">${t.sub}${S.theme === id ? ' · 사용 중' : ''}</span></span>` +
    `<span class="dots"><span style="background:${t.bg}"></span><span style="background:${t.accent}"></span><span style="background:${t.deep}"></span></span></button>`
  ).join('');
  return '<header class="page-head"><span class="eyebrow">앱 분위기 바꾸기</span><h1>꽃 테마</h1></header>' +
    `<div class="themes" role="group" aria-label="꽃 테마">${themes}</div>` +
    '<h2 class="section-title">설정</h2><div class="settings">' +
    `<button type="button" class="ghost sm" data-act="reload">작품 목록 새로 불러오기 (${when})</button>` +
    '<button type="button" class="ghost sm" data-act="resurvey">취향 설문 다시 하기</button>' +
    `<button type="button" class="ghost sm${wipeArmed ? ' danger-armed' : ''}" data-act="wipe">${wipeArmed ? '정말 지울까요? 한 번 더 누르면 모두 지워져요' : '모든 기록 지우기'}</button></div>` +
    '<div class="credit"><span>작품 정보·포스터 제공: <a href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a></span>' +
    '<span>This product uses the TMDB API but is not endorsed or certified by TMDB.</span>' +
    '<span>시청 서비스 정보 제공: <a href="https://www.justwatch.com" target="_blank" rel="noopener">JustWatch</a></span></div>';
}

export function navView({ S }) {
  const tabs = [['rec', '추천', ICON.star], ['wish', '찜', ICON.heartLg], ['seen', '본 작품', ICON.eye], ['theme', '테마', ICON.flower]];
  return tabs.map(([id, label, icon]) =>
    `<button type="button" data-act="tab" data-v="${id}"${S.tab === id ? ' aria-current="page"' : ''}>${icon}${label}</button>`
  ).join('');
}

/* ---------- 작품 상세 ---------- */

function providerRow(label, list) {
  if (!list?.length) return '';
  return `<p class="prov-kind">${label}</p><div class="providers">${list.map((p) =>
    `<span class="prov">${p.logo_path ? `<img src="${IMG_BASE}w92${p.logo_path}" alt="">` : ''}${esc(p.provider_name)}</span>`
  ).join('')}</div>`;
}

export function sheetView({ S, details, lookup }) {
  const it = lookup(S.detail);
  if (!it) return '';
  const det = details[it.key] || { loading: true };
  const d = det.data;
  const a = analyze(it, S, lookup);
  const wished = S.wish.includes(it.key);
  const watched = S.status[it.key];

  let length = '';
  if (d && it.type === 'tv') length = [d.number_of_seasons && `시즌 ${d.number_of_seasons}개`, d.number_of_episodes && `${d.number_of_episodes}화`].filter(Boolean).join(' · ');
  if (d && it.type === 'movie' && d.runtime) length = `${d.runtime}분`;
  const meta = [KINDS[it.kind], it.year, length, it.vote ? `평점 ${it.vote.toFixed(1)}` : ''].filter(Boolean).join(' · ');

  const warns = a.warns.length
    ? `<div class="warn"><strong>미리 알고 보면 좋아요</strong>${a.warns.map((w) =>
      `<span${w.hit ? ' class="hit"' : ''}>${w.text}${w.hit ? ' (피하고 싶다고 고른 요소예요)' : ''}</span>`).join('')}</div>`
    : '';

  let where;
  if (det.loading) where = '<p class="desc" style="color:var(--muted)">불러오는 중이에요…</p>';
  else if (det.error) where = `<p class="desc" style="color:var(--muted)">${esc(det.error)}</p>`;
  else {
    const p = det.providers;
    where = p && (p.flatrate || p.rent || p.buy)
      ? providerRow('구독해서 보기', p.flatrate) + providerRow('대여', p.rent) + providerRow('구매', p.buy) + '<p class="fine">정보 제공: JustWatch · 실제 서비스 상황과 다를 수 있어요</p>'
      : '<p class="desc" style="color:var(--muted)">지금 한국에서 볼 수 있는 정식 서비스 정보가 없어요.</p>';
  }

  const hero = it.backdrop
    ? `class="panel-hero has-img" style="background-image:url(${IMG_BASE}w780${it.backdrop})"`
    : `class="panel-hero" style="background:${colorFor(it.key)}"`;

  return '<div class="panel" role="dialog" aria-modal="true" aria-labelledby="dtitle">' +
    `<div ${hero}><button type="button" class="close" data-act="close" aria-label="닫기">${ICON.x}</button>` +
    `<div><span class="meta">${meta}</span><div class="title" id="dtitle">${esc(it.title)}</div></div></div>` +
    (genreLine(it) ? `<span class="meta">${genreLine(it)}</span>` : '') +
    (it.overview ? `<p class="desc">${esc(it.overview)}</p>` : '<p class="desc" style="color:var(--muted)">한국어 줄거리가 아직 등록되지 않았어요.</p>') +
    `<div class="box"><h2>왜 재밌을까요?</h2><ul>${a.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>` +
    warns +
    `<div class="box"><h2>어디서 볼 수 있어요?</h2>${where}</div>` +
    '<div class="panel-actions">' +
    (watched ? '' : `<button type="button" class="ghost" data-act="nope" data-v="${it.key}">별로예요</button><button type="button" class="ghost" data-act="seen" data-v="${it.key}">이미 봤어요</button>`) +
    `<button type="button" class="primary" data-act="wish" data-v="${it.key}" aria-pressed="${wished}">${wished ? '찜 취소' : '찜하기'}</button></div>` +
    `<a class="fine" href="https://www.themoviedb.org/${it.type}/${it.id}" target="_blank" rel="noopener">TMDB에서 자세히 보기</a></div>`;
}
