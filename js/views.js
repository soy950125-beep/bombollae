// 화면(HTML)을 만드는 함수 모음. 상태(ctx)를 받아서 HTML 문자열을 돌려줄 뿐, 상태를 바꾸지는 않는다.
// 버튼에는 data-act(무슨 동작인지)와 data-v(대상)를 붙여 두고, 실제 동작은 app.js가 처리한다.

import {
  APP_NAME, KINDS, KIND_HINT, TAGS, TAG_HINT, DIS, DIS_HINT, HABITS, THEMES, GENRE_NAME, IMG_BASE, POSTER_COLORS, GENRE_GROUPS, SORTS
} from './config.js';
import { FLOWER_ICONS } from './flowers.js';
import { epsSpan } from './episodes.js';
import { analyze, rankCandidates, buildShelves, filterAndSort } from './recommend.js';

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
  home: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9v11h5v-6h4v6h5V9"/></svg>',
  starLine: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3.5l2.5 5.3 5.8.7-4.3 4 1.1 5.8L12 16.4l-5.1 2.9 1.1-5.8-4.3-4 5.8-.7z"/></svg>',
  starFill: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M12 3.5l2.5 5.3 5.8.7-4.3 4 1.1 5.8L12 16.4l-5.1 2.9 1.1-5.8-4.3-4 5.8-.7z"/></svg>',
  trophy: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5.5a2.5 2.5 0 0 0 2.6 4M16 6h2.5a2.5 2.5 0 0 1-2.6 4"/><path d="M12 13v4M9 20h6M10 17h4"/></svg>',
  undo: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>',
  search: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  back: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  soundOn: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
  soundOff: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
  play: '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>',
  x: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
};

/** 포스터가 없을 때 쓸 파스텔 색 (작품마다 항상 같은 색) */
function colorFor(key) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return POSTER_COLORS[h % POSTER_COLORS.length];
}

function genreLine(it) {
  // 종류(드라마·애니)와 같은 장르 이름은 빼서 '드라마 · 드라마'처럼 겹치지 않게
  const skip = it.kind === 'drama' ? [18] : it.kind === 'anime' ? [16] : [];
  return it.g.filter((id) => !skip.includes(id)).map((id) => GENRE_NAME[id]).filter(Boolean).slice(0, 3).join(' · ');
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

/**
 * 본 작품 칸: 포스터를 누르면 '봤어요' 켜기/끄기, 오른쪽 위 별을 누르면 '인생작' 켜기/끄기.
 * (예전엔 한 번·두 번·세 번 누르는 방식이라 헷갈려서 버튼을 둘로 나눴다)
 */
function pick(it, S) {
  const st = S.status[it.key] || '';
  const seen = Boolean(st);
  const best = st === 'best';
  const label = best ? '인생작' : seen ? '봤어요' : '';
  const check = seen ? `<span class="badge">${ICON.checkSm}</span>` : '';
  return `<div class="pick-wrap" data-state="${st}">` +
    `<button type="button" class="pick" data-act="mark" data-v="${it.key}" data-state="${st}" aria-pressed="${seen}" aria-label="${esc(it.title)}, ${seen ? '봤어요' : '안 봤어요'}">` +
    poster(it, 'w185', check) +
    `<span class="pname">${esc(it.title)}</span><span class="pmeta">${KINDS[it.kind]}${it.year ? ' · ' + it.year : ''}${epsSpan(it)}${label ? ' · ' + label : ''}</span></button>` +
    `<button type="button" class="pick-star" data-act="best" data-v="${it.key}" aria-pressed="${best}" aria-label="${esc(it.title)} ${best ? '인생작 취소' : '인생작으로 표시'}">${best ? ICON.starFill : ICON.starLine}</button>` +
    '</div>';
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
  return '<header class="page-head"><h1>본 작품 체크</h1><p>본 작품을 눌러 주세요. 특히 재밌었던 작품은 <b>★</b>을 눌러 <b>인생작</b>으로!</p></header>' +
    `<div class="tools"><label class="search">${ICON.search}<input id="wsearch" type="search" placeholder="보고 싶은 작품 찾기" aria-label="보고 싶은 작품 찾기" autocomplete="off" value="${esc(search.q)}"></label>${kindChips('wkind', S.wfilter)}</div>` +
    `<div class="pgrid" id="wgrid">${watchedGrid(ctx)}</div>` +
    `<div class="bar"><span><span class="count">${c.seen}</span>개 체크 · 인생작 ${c.best}개</span><button type="button" class="primary sm" data-act="done">추천 받기</button></div>`;
}

/* ---------- 추천 · 찜 · 본 작품 ---------- */

/** 가로 줄 안의 작품 한 칸: 포스터 + 제목 + 줄거리 요약 + 찜 버튼 */
function tile({ item }, S, justWished) {
  const wished = S.wish.includes(item.key);
  const summary = item.overview || genreLine(item) || KINDS[item.kind];
  return '<div class="tile">' +
    `<button type="button" class="tile-open" data-act="open" data-v="${item.key}" aria-label="${esc(item.title)} 자세히 보기">` +
    poster(item, 'w342') +
    `<span class="tile-title">${esc(item.title)}</span>` +
    `<span class="tile-meta">${[KINDS[item.kind], item.year].filter(Boolean).join(' · ')}${epsSpan(item)}</span>` +
    `<span class="tile-sum">${esc(summary)}</span></button>` +
    `<button type="button" class="tile-heart${justWished === item.key ? ' heart-pop' : ''}" data-act="wish" data-v="${item.key}" aria-pressed="${wished}" aria-label="${esc(item.title)} ${wished ? '찜 취소' : '찜하기'}">${wished ? ICON.heartSolid : ICON.heart}</button>` +
    '</div>';
}

/** TOP 10 한 칸: 큰 순위 숫자 + 포스터 + 제목 */
function rankTile({ item }, rank) {
  return `<button type="button" class="rank-tile" data-act="open" data-v="${item.key}" aria-label="${rank}위 ${esc(item.title)} 자세히 보기">` +
    `<span class="rank-num${rank === 10 ? ' ten' : ''}" aria-hidden="true">${rank}</span>` +
    `<span class="rank-body">${poster(item, 'w342')}<span class="rank-title">${esc(item.title)}</span></span></button>`;
}

/** 맨 위 큰 카드: 오늘의 1순위 */
function heroCard({ item, a }, S, justWished) {
  const wished = S.wish.includes(item.key);
  const img = item.backdrop ? `${IMG_BASE}w780${item.backdrop}` : item.poster ? `${IMG_BASE}w500${item.poster}` : '';
  const style = `background-color:${colorFor(item.key)}${img ? `;background-image:url(${img})` : ''}`;
  return `<article class="hero${img ? ' has-img' : ''}" style="${style}">` +
    '<span class="hero-eyebrow">오늘의 1순위</span>' +
    `<h2 class="hero-title">${esc(item.title)}</h2>` +
    `<span class="hero-meta">${[KINDS[item.kind], item.year].filter(Boolean).join(' · ')}${epsSpan(item)}${genreLine(item) ? ' · ' + genreLine(item) : ''}</span>` +
    `<p class="hero-reason">${esc(a.reasons[0])}</p>` +
    '<div class="hero-actions">' +
    `<button type="button" class="hero-open" data-act="open" data-v="${item.key}">자세히 보기</button>` +
    `<button type="button" class="hero-heart${justWished === item.key ? ' heart-pop' : ''}" data-act="wish" data-v="${item.key}" aria-pressed="${wished}" aria-label="${wished ? '찜 취소' : '찜하기'}">${wished ? ICON.heartSolid : ICON.heart}</button>` +
    '</div></article>';
}

export function recView({ S, catalog, lookup, justWished, more }) {
  const head = '<header class="page-head"><h1>오늘의 추천</h1></header>' +
    `<button type="button" class="search search-entry" data-act="findOpen">${ICON.search}<span>보고 싶은 작품 찾기</span></button>`;
  if (catalog.loading && !catalog.items.length) return head + loading('작품을 불러오는 중이에요');
  if (catalog.error && !catalog.items.length) {
    return head + empty('작품을 불러오지 못했어요', esc(catalog.error), '<br><br><button type="button" class="ghost sm" data-act="reload">다시 불러오기</button>');
  }
  const ranked = rankCandidates(catalog.items, S, lookup);
  if (!ranked.length) {
    if (more.loading || (S.filter !== 'all' && !more.exhausted)) return head + kindChips('filter', S.filter) + loading('작품을 더 불러오는 중이에요');
    return head + kindChips('filter', S.filter) +
      empty('지금 추천할 작품을 다 봤어요!', '다른 종류도 둘러보거나, 찾기에서 장르로 골라 보세요.',
        '<br><br><button type="button" class="ghost sm" data-act="filter" data-v="all">전체 작품 보기</button> <button type="button" class="ghost sm" data-act="findOpen">찾기로 둘러보기</button>');
  }
  const { hero, top10, rows } = buildShelves(ranked, S, lookup);
  const rank = top10.length
    ? '<section class="shelf rank-shelf" aria-label="다들 봤는데 나만 안 본 TOP 10">' +
      '<h2 class="shelf-title">다들 봤는데 나만 안 본 TOP 10</h2>' +
      '<p class="shelf-sub">지금 인기 순위에서 내가 본 작품을 뺀, 나만의 순위예요</p>' +
      `<button type="button" class="shelf-arrow prev" data-act="shelfMove" data-v="top10|-1" aria-label="TOP 10 이전 작품 보기">${ICON.back}</button>` +
      `<button type="button" class="shelf-arrow next" data-act="shelfMove" data-v="top10|1" aria-label="TOP 10 다음 작품 보기">${ICON.back}</button>` +
      `<ol class="shelf-scroll rank-list" data-row="top10">${top10.map((x, i) => `<li>${rankTile(x, i + 1)}</li>`).join('')}</ol></section>`
    : '';
  const shelves = rows.map((row) =>
    `<section class="shelf" aria-label="${esc(row.title)}">` +
    `<h2 class="shelf-title">${esc(row.title)}</h2>` +
    // PC에서 마우스로 넘길 수 있는 화살표 (휴대폰에서는 숨김)
    `<button type="button" class="shelf-arrow prev" data-act="shelfMove" data-v="${esc(row.id)}|-1" aria-label="${esc(row.title)} 이전 작품 보기">${ICON.back}</button>` +
    `<button type="button" class="shelf-arrow next" data-act="shelfMove" data-v="${esc(row.id)}|1" aria-label="${esc(row.title)} 다음 작품 보기">${ICON.back}</button>` +
    `<div class="shelf-scroll" data-row="${esc(row.id)}">${row.items.map((x) => tile(x, S, justWished)).join('')}</div></section>`
  ).join('');
  return head + kindChips('filter', S.filter) + heroCard(hero, S, justWished) + rank + shelves;
}

export function wishView({ S, lookup, justWished }) {
  const list = S.wish.map(lookup).filter(Boolean).map((item) => ({ item }));
  return '<header class="page-head"><span class="eyebrow">나중에 볼 작품</span><h1>찜 목록</h1></header>' +
    (list.length ? `<div class="tile-grid">${list.map((x) => tile(x, S, justWished)).join('')}</div>`
      : empty('아직 찜한 작품이 없어요', '홈 화면에서 하트를 누르면 여기에 모여요.'));
}

function installBox(install) {
  if (install.installed) return '';
  let help = '';
  if (install.help) {
    help = install.inApp
      ? '<p class="desc">카카오톡 같은 앱 안에서는 설치가 안 돼요. 오른쪽 아래 <b>⋯</b> 또는 <b>공유</b>를 눌러 <b>Safari / Chrome으로 열기</b>를 한 뒤 다시 눌러 주세요.</p>'
      : install.ios
        ? '<ol class="install-steps"><li>Safari 아래쪽 <b>공유 버튼</b>(네모에서 화살표가 나온 모양)을 눌러요</li><li><b>홈 화면에 추가</b>를 눌러요</li><li>오른쪽 위 <b>추가</b>를 누르면 끝!</li></ol>'
        : '<ol class="install-steps"><li>Chrome 오른쪽 위 <b>⋮</b> 메뉴를 눌러요</li><li><b>홈 화면에 추가</b> 또는 <b>앱 설치</b>를 눌러요</li></ol>';
    help = `<div class="install-help">${help}</div>`;
  }
  return '<div class="install">' +
    `<button type="button" class="primary install-btn" data-act="install" aria-expanded="${install.help}">휴대폰에 앱으로 설치하기</button>` +
    '<p class="fine">홈 화면에 벚꽃 아이콘이 생기고, 주소창 없이 앱처럼 열려요.</p>' + help + '</div>';
}

export function seenView({ S, lookup, catalog, wipeArmed, install }) {
  const list = Object.keys(S.status).map(lookup).filter(Boolean);
  const c = counts(S);
  const mins = catalog.at ? Math.round((Date.now() - catalog.at) / 60000) : 0;
  const when = !catalog.at ? '아직 안 불러왔어요' : mins < 60 ? `${mins}분 전` : `${Math.round(mins / 60)}시간 전`;
  return `<header class="page-head"><span class="eyebrow">봤어요 ${c.seen}개 · 인생작 ${c.best}개</span><h1>본 작품</h1></header>` +
    (list.length ? `<div class="pgrid">${list.map((it) => pick(it, S)).join('')}</div>`
      : empty('아직 체크한 작품이 없어요', '본 작품을 체크하면 추천에서 빠져요.')) +
    '<button type="button" class="ghost" data-act="more">본 작품 더 체크하기</button>' +
    '<h2 class="section-title">설정</h2>' + installBox(install) + '<div class="settings">' +
    `<button type="button" class="ghost sm" data-act="reload">작품 목록 새로 불러오기 (${when})</button>` +
    '<button type="button" class="ghost sm" data-act="resurvey">취향 설문 다시 하기</button>' +
    `<button type="button" class="ghost sm${wipeArmed ? ' danger-armed' : ''}" data-act="wipe">${wipeArmed ? '정말 지울까요? 한 번 더 누르면 모두 지워져요' : '모든 기록 지우기'}</button></div>` +
    '<div class="credit"><span>작품 정보·포스터 제공: <a href="https://www.themoviedb.org" target="_blank" rel="noopener">TMDB</a></span>' +
    '<span>This product uses the TMDB API but is not endorsed or certified by TMDB.</span>' +
    '<span>시청 서비스 정보 제공: <a href="https://www.justwatch.com" target="_blank" rel="noopener">JustWatch</a></span></div>';
}

/* ---------- 오른쪽 위 꽃 테마 버튼 ---------- */

export function themeFab({ S }) {
  return FLOWER_ICONS[S.theme] || FLOWER_ICONS.sakura;
}

export function themePop({ S }) {
  return '<p class="theme-pop-title">꽃 테마</p><div class="theme-dots" role="group" aria-label="꽃 테마">' +
    Object.entries(THEMES).map(([id, t]) =>
      `<button type="button" class="theme-dot" data-act="theme" data-v="${id}" aria-pressed="${S.theme === id}">` +
      `<span class="dot" style="background:${t.soft}">${FLOWER_ICONS[id]}</span>${t.name}</button>`
    ).join('') + '</div>';
}

/* ---------- 오늘의 한 편 월드컵 ---------- */

const roundName = (n) => (n === 2 ? '결승' : `${n}강`);

function contender(it) {
  const summary = it.overview || genreLine(it) || KINDS[it.kind];
  return `<button type="button" class="contender" data-act="cupPick" data-v="${it.key}" aria-label="${esc(it.title)} 고르기">` +
    poster(it, 'w342') +
    `<span class="contender-title">${esc(it.title)}</span>` +
    `<span class="tile-meta">${[KINDS[it.kind], it.year].filter(Boolean).join(' · ')}${epsSpan(it)}</span>` +
    `<span class="contender-sum">${esc(summary)}</span></button>`;
}

export function cupView({ S, cup, cupCount, catalog, lookup }) {
  if (catalog.loading && !catalog.items.length) return loading('작품을 불러오는 중이에요');

  if (cup.stage === 'match') {
    const a = lookup(cup.round[cup.idx * 2]);
    const b = lookup(cup.round[cup.idx * 2 + 1]);
    if (!a || !b) return empty('작품 정보를 찾지 못했어요', '월드컵을 처음부터 다시 해 주세요.', '<br><br><button type="button" class="ghost sm" data-act="cupReset">처음으로</button>');
    const matches = cup.round.length / 2;
    const pct = Math.round((cup.done / cup.total) * 100);
    return `<header class="page-head"><span class="eyebrow">${roundName(cup.round.length)} · ${cup.idx + 1} / ${matches}</span><h1>더 보고 싶은 쪽은?</h1></header>` +
      `<div class="progress cup-progress" role="progressbar" aria-label="월드컵 진행" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width:${pct}%"></span></div>` +
      `<div class="vs">${contender(a)}<span class="vs-badge" aria-hidden="true">VS</span>${contender(b)}</div>` +
      '<div class="cup-foot">' +
      (cup.history.length ? `<button type="button" class="mini" data-act="cupUndo">${ICON.undo}되돌리기</button>` : '') +
      '<button type="button" class="mini" data-act="cupQuit">그만두기</button></div>';
  }

  if (cup.stage === 'done') {
    const w = lookup(cup.winner);
    if (!w) return empty('작품 정보를 찾지 못했어요', '월드컵을 처음부터 다시 해 주세요.', '<br><br><button type="button" class="ghost sm" data-act="cupReset">처음으로</button>');
    const a = analyze(w, S, lookup);
    const wished = S.wish.includes(w.key);
    return '<header class="page-head"><span class="eyebrow">최종 선택</span><h1>오늘의 한 편은</h1></header>' +
      '<div class="cup-win">' + poster(w, 'w500') +
      `<h2 class="cup-win-title">${esc(w.title)}</h2>` +
      `<span class="meta">${[KINDS[w.kind], w.year].filter(Boolean).join(' · ')}${epsSpan(w)}${genreLine(w) ? ' · ' + genreLine(w) : ''}</span>` +
      (w.overview ? `<p class="desc">${esc(w.overview)}</p>` : '') +
      `<div class="box"><h2>이런 점이 잘 맞을 거예요</h2><ul>${a.reasons.slice(0, 3).map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>` +
      '<div class="cup-actions">' +
      `<button type="button" class="primary" data-act="open" data-v="${w.key}">어디서 볼 수 있는지 보기</button>` +
      `<button type="button" class="ghost wish-btn" data-act="wish" data-v="${w.key}" aria-pressed="${wished}">${wished ? ICON.heartSolid : ICON.heart}${wished ? '찜했어요' : '찜하기'}</button>` +
      '<button type="button" class="ghost" data-act="cupReset">월드컵 다시 하기</button></div></div>';
  }

  // 준비 화면: 고를 것 없이 바로 시작 (찜한 작품 + 취향 추천작이 섞여서 나온다)
  const startSize = cupCount >= 8 ? 8 : cupCount >= 4 ? 4 : 0;
  return '<header class="page-head"><span class="eyebrow">고르기 힘들 땐</span><h1>오늘의 한 편 월드컵</h1></header>' +
    '<p class="desc">찜한 작품과 내 취향 추천작 중에서 두 편씩 맞붙어요. 더 보고 싶은 쪽을 계속 고르면, 마지막에 남은 한 편이 오늘 볼 작품이에요.</p>' +
    `<button type="button" class="primary cup-start" data-act="cupStart"${startSize ? '' : ' disabled'}>${startSize ? '시작하기' : '작품이 부족해요'}</button>` +
    (startSize ? `<p class="fine" style="text-align:center">${startSize}편이 맞붙어요 · ${startSize - 1}번만 고르면 끝나요</p>` : '');
}

/* ---------- 찾기 (검색 · 장르 · 정렬) ---------- */

function findTile(it, S) {
  const st = S.status[it.key];
  const badge = st ? `<span class="find-badge">${st === 'best' ? '인생작' : '봤어요'}</span>` : '';
  const meta = [KINDS[it.kind], it.year].filter(Boolean).join(' · ') + epsSpan(it) + (it.vote ? ` · ★ ${it.vote.toFixed(1)}` : '');
  return `<button type="button" class="pick" data-act="open" data-v="${it.key}" aria-label="${esc(it.title)} 자세히 보기">` +
    poster(it, 'w185', badge) +
    `<span class="pname">${esc(it.title)}</span><span class="pmeta">${meta}</span></button>`;
}

/** 결과 목록과 결과 수 (검색어를 칠 때는 이 부분만 다시 그린다) */
export function findResults({ S, find, catalog, lookup }) {
  if (find.q && find.loading) return { count: '찾는 중…', html: fullRow(loading('찾는 중이에요')) };
  if (find.q && find.error) return { count: '', html: fullRow(empty('검색하지 못했어요', esc(find.error))) };
  if (!find.q && catalog.loading && !catalog.items.length) return { count: '', html: fullRow(loading('작품을 불러오는 중이에요')) };

  const source = find.q ? find.items : catalog.items;
  const list = filterAndSort(source, find, S, lookup);
  const count = find.q ? `「${esc(find.q)}」 ${list.length}개` : `${list.length}개`;
  if (!list.length) {
    const tips = [];
    if (find.genre !== 'all' || find.kind !== 'all') tips.push('종류나 장르를 바꿔 보세요.');
    if (find.unseenOnly) tips.push('"안 본 것만"을 끄면 본 작품도 보여요.');
    if (find.q && !tips.length) tips.push('제목을 조금 다르게 써 보세요.');
    return { count, html: fullRow(empty('맞는 작품이 없어요', tips.join(' '))) };
  }
  return { count, html: list.slice(0, 60).map((it) => findTile(it, S)).join('') };
}

export function findView(ctx) {
  const { find } = ctx;
  const kinds = ['all', ...Object.keys(KINDS)].map((k) =>
    `<button type="button" class="chip" data-act="findKind" data-v="${k}" aria-pressed="${find.kind === k}">${k === 'all' ? '전체' : KINDS[k]}</button>`).join('');
  const genres = [{ id: 'all', name: '모든 장르' }, ...GENRE_GROUPS].map((g) =>
    `<button type="button" class="chip" data-act="findGenre" data-v="${g.id}" aria-pressed="${find.genre === g.id}">${g.name}</button>`).join('');
  const sorts = SORTS.map((o) => `<option value="${o.id}"${find.sort === o.id ? ' selected' : ''}>${o.name}</option>`).join('');
  const { count, html } = findResults(ctx);
  return '<div class="find-top">' +
    `<button type="button" class="icon-btn" data-act="findClose" aria-label="홈으로 돌아가기">${ICON.back}</button>` +
    `<label class="search find-input">${ICON.search}<input id="fsearch" type="search" placeholder="보고 싶은 작품 찾기" aria-label="보고 싶은 작품 찾기" autocomplete="off" enterkeyhint="search" value="${esc(find.q)}">` +
    `<button type="button" class="clear-btn" data-act="findClear" aria-label="검색어 지우기"${find.q ? '' : ' hidden'}>${ICON.x}</button></label></div>` +
    `<div class="chips" role="group" aria-label="종류">${kinds}</div>` +
    `<div class="chip-scroll" role="group" aria-label="장르">${genres}</div>` +
    '<div class="find-bar">' +
    `<span class="find-count" id="fcount" aria-live="polite">${count}</span>` +
    `<label class="check"><input type="checkbox" id="funseen"${find.unseenOnly ? ' checked' : ''}><span>안 본 것만</span></label>` +
    `<label class="sort"><span class="sr-only">정렬</span><select id="fsort">${sorts}</select></label></div>` +
    `<div class="pgrid" id="fresults">${html}</div>`;
}

// 아래 메뉴 아이콘: 지금 있는 탭은 꽉 찬 모양, 나머지는 선만 있는 모양
const NAV_ICONS = {
  rec: [
    '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9v11h5v-6h4v6h5V9"/></svg>',
    '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3.2L3.6 10.2V20.2h5.6v-5.6h5.6v5.6h5.6V10.2Z"/></svg>'
  ],
  cup: [
    ICON.trophy,
    '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v5a4 4 0 0 1-8 0z" fill="currentColor"/><path d="M8 6H5.5a2.5 2.5 0 0 0 2.6 4M16 6h2.5a2.5 2.5 0 0 1-2.6 4"/><path d="M12 13v4M9 20h6M10 17h4"/></svg>'
  ],
  wish: [
    ICON.heartLg,
    '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>'
  ],
  seen: [
    '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" fill="currentColor"/><circle cx="12" cy="12" r="3.2" fill="#FFFFFF" stroke="none"/></svg>'
  ]
};

export function navView({ S }) {
  const tabs = [['rec', '홈'], ['cup', '월드컵'], ['wish', '찜'], ['seen', '본 작품']];
  return tabs.map(([id, label]) => {
    const on = S.tab === id;
    return `<button type="button" data-act="tab" data-v="${id}"${on ? ' aria-current="page"' : ''}>` +
      `<span class="nav-ic">${NAV_ICONS[id][on ? 1 : 0]}</span>${label}</button>`;
  }).join('');
}

/* ---------- 작품 상세 ---------- */

function providerRow(label, list) {
  if (!list?.length) return '';
  return `<p class="prov-kind">${label}</p><div class="providers">${list.map((p) =>
    `<span class="prov">${p.logo_path ? `<img src="${IMG_BASE}w92${p.logo_path}" alt="">` : ''}${esc(p.provider_name)}</span>`
  ).join('')}</div>`;
}

/** 예고편 미리보기 음소거 버튼 아이콘 */
export function muteIcon(muted) {
  return muted ? ICON.soundOff : ICON.soundOn;
}

/** 상세 화면 찜 버튼 안쪽 (예고편을 보는 중에도 버튼만 바꿀 수 있게 따로 뺐다) */
export function wishLabel(wished) {
  return `${wished ? ICON.heartSolid : ICON.heart}${wished ? '찜했어요' : '찜하기'}`;
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
      : '<p class="desc">아직 한국 OTT 정보가 등록되지 않은 작품이에요. 아래 버튼으로 바로 찾아볼 수 있어요.</p>' +
        '<div class="where-actions">' +
        `<a class="mini" href="https://www.google.com/search?q=${encodeURIComponent(`${it.title} 다시보기`)}" target="_blank" rel="noopener">${ICON.search}볼 수 있는 곳 검색</a>` +
        `<a class="mini" href="https://www.youtube.com/results?search_query=${encodeURIComponent(`${it.title} 예고편`)}" target="_blank" rel="noopener">${ICON.play}유튜브에서 보기</a></div>` +
        '<p class="fine">홈 추천에는 한국에서 정식으로 볼 수 있는 작품만 나와요.</p>';
  }

  const hero = it.backdrop
    ? `class="panel-hero has-img${det.preview ? ' previewing' : ''}" style="background-image:url(${IMG_BASE}w780${it.backdrop})"`
    : `class="panel-hero${det.preview ? ' has-img previewing' : ''}" style="background:${colorFor(it.key)}"`;
  // 넷플릭스처럼 열자마자 소리 없이 예고편 재생 (30초 뒤 app.js가 끄고 원래 이미지로)
  const preview = det.preview && det.trailer
    ? `<div class="hero-video" aria-hidden="true"><iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(det.trailer.key)}?autoplay=1&mute=1&controls=0&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&enablejsapi=1&origin=${encodeURIComponent(location.origin)}" tabindex="-1" title="${esc(it.title)} 예고편 미리보기" allow="autoplay; encrypted-media"></iframe></div>` +
      `<button type="button" class="hero-mute" data-act="toggleMute" data-v="${it.key}" aria-pressed="${det.muted !== false}" aria-label="${det.muted !== false ? '소리 켜기' : '소리 끄기'}">${muteIcon(det.muted !== false)}</button>`
    : det.trailer
      ? `<button type="button" class="hero-replay" data-act="replayTrailer" data-v="${it.key}">${ICON.play}${det.previewDone ? '예고편 다시 보기' : '예고편 보기'}</button>`
      : '';

  return '<div class="panel" role="dialog" aria-modal="true" aria-labelledby="dtitle">' +
    `<div ${hero}>${preview}<button type="button" class="close" data-act="close" aria-label="닫기">${ICON.x}</button>` +
    `<div><span class="meta">${meta}</span><div class="title" id="dtitle">${esc(it.title)}</div></div></div>` +
    (genreLine(it) ? `<span class="meta">${genreLine(it)}</span>` : '') +
    (it.overview ? `<p class="desc">${esc(it.overview)}</p>` : '<p class="desc" style="color:var(--muted)">한국어 줄거리가 아직 등록되지 않았어요.</p>') +
    `<div class="box"><h2>왜 재밌을까요?</h2><ul>${a.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>` +
    warns +
    `<div class="box"><h2>어디서 볼 수 있어요?</h2>${where}</div>` +
    '<div class="panel-actions">' +
    (watched ? '' : `<button type="button" class="ghost" data-act="nope" data-v="${it.key}">별로예요</button><button type="button" class="ghost" data-act="seen" data-v="${it.key}">이미 봤어요</button>`) +
    `<button type="button" class="primary wish-btn" data-act="wish" data-v="${it.key}" aria-pressed="${wished}">${wishLabel(wished)}</button></div>` +
    `<a class="fine" href="https://www.themoviedb.org/${it.type}/${it.id}" target="_blank" rel="noopener">TMDB에서 자세히 보기</a></div>`;
}
