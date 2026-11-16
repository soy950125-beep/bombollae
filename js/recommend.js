// 추천 점수 계산.
// 작품마다 점수를 매겨 높은 순으로 보여 준다. 점수를 올리고 내린 이유가 그대로 "왜 재밌을까요?" 문장이 된다.
//
//   + 3점    설문에서 고른 취향 꼬리표와 겹칠 때마다
//   + 1.5점  인생작과 겹치는 장르 하나마다 (같은 종류면 0.5점 더)
//   + 1~1.5점 보는 습관과 맞을 때
//   + 1점    TMDB 평점 8점 이상 (그 아래는 6점 기준으로 조금씩 가감)
//   - 4점    피하고 싶다고 고른 요소가 있을 때

import { REASON, WARN, ROW_TITLE, GENRE_GROUPS } from './config.js';

export function analyze(item, state, lookup) {
  let score = 0;
  const reasons = [];

  // 1) 취향 꼬리표
  for (const tag of item.tags) {
    if (state.loves.includes(tag)) { score += 3; reasons.push(REASON[tag]); }
  }

  // 2) 인생작과 얼마나 비슷한지 (드라마 장르(18)는 너무 흔해서 제외)
  let similar = null;
  let similarity = 0;
  for (const [key, status] of Object.entries(state.status)) {
    if (status !== 'best') continue;
    const best = lookup(key);
    if (!best || best.key === item.key) continue;
    const shared = best.g.filter((id) => id !== 18 && item.g.includes(id)).length;
    const n = shared + (best.kind === item.kind ? 0.5 : 0);
    if (n > similarity) { similarity = n; similar = best; }
  }
  if (similar && similarity >= 1) {
    score += similarity * 1.5;
    reasons.push(`인생작 「${similar.title}」와 장르가 비슷해요`);
  }

  // 3) 보는 습관
  const has = (t) => item.tags.includes(t);
  if (state.habit === 'binge' && (has('fast') || has('twist'))) { score += 1.5; reasons.push('다음 화가 궁금해지는 장르라 몰아보기 좋아요'); }
  if (state.habit === 'light' && has('fun')) { score += 1.5; reasons.push('틀어놓고 가볍게 보기 좋아요'); }
  if (state.habit === 'daily' && (has('mood') || has('real'))) { score += 1; reasons.push('하루 한 편씩 천천히 보기 좋아요'); }

  // 4) 평점
  if (item.vote >= 8) { score += 1; reasons.push(`TMDB 평점 ${item.vote.toFixed(1)}점으로 평이 아주 좋아요`); }
  else if (item.vote) { score += (item.vote - 6) * 0.3; }

  if (!reasons.length) reasons.push(REASON[item.tags[0]]);

  // 5) 피하고 싶은 요소
  const warns = item.dis.map((d) => {
    const hit = state.dislikes.includes(d);
    if (hit) score -= 4;
    return { text: WARN[d], hit };
  });

  return { score, reasons, warns };
}

/** 안 본 작품만 골라 점수 높은 순으로 정렬. 점수가 같으면 인기 많은 순. */
export function rankCandidates(catalog, state, lookup) {
  return catalog
    .filter((item) => {
      if (state.status[item.key] || state.nope.includes(item.key)) return false;
      if (state.kinds.length && !state.kinds.includes(item.kind)) return false;
      return state.filter === 'all' || state.filter === item.kind;
    })
    .map((item) => ({ item, a: analyze(item, state, lookup) }))
    .sort((x, y) => y.a.score - x.a.score || y.item.pop - x.item.pop);
}

/**
 * 추천 화면 구성: 1순위 작품 하나(hero) + 이유별 가로 줄(rows).
 * 같은 작품이 여러 줄에 겹쳐 나오지 않도록, 앞 줄에서 쓴 작품은 다음 줄에서 뺀다.
 */
export function buildShelves(ranked, state, lookup) {
  if (!ranked.length) return { hero: null, rows: [] };
  const hero = ranked[0];
  const used = new Set([hero.item.key]);
  const rows = [];

  const addRow = (id, title, test, { sort, limit = 12, min = 3 } = {}) => {
    let pool = ranked.filter((x) => !used.has(x.item.key) && test(x.item));
    if (sort) pool = [...pool].sort(sort);
    const items = pool.slice(0, limit);
    if (items.length < min) return;
    items.forEach((x) => used.add(x.item.key));
    rows.push({ id, title, items });
  };

  // 1) 인생작과 비슷한 작품 (가장 개인적인 줄이라 맨 위에)
  const bests = Object.entries(state.status)
    .filter(([, status]) => status === 'best')
    .map(([key]) => lookup(key))
    .filter(Boolean)
    .slice(0, 2);
  for (const best of bests) {
    const genres = best.g.filter((id) => id !== 18);
    const shared = (it) => it.g.filter((id) => genres.includes(id)).length;
    addRow(`like-${best.key}`, `인생작 「${best.title}」와 비슷한`, (it) => shared(it) > 0,
      { sort: (x, y) => shared(y.item) - shared(x.item) || y.a.score - x.a.score });
  }

  // 2) 설문에서 고른 '중요한 것'마다 한 줄
  for (const tag of state.loves) addRow(`tag-${tag}`, ROW_TITLE[tag], (it) => it.tags.includes(tag));

  // 3) 보는 습관에 맞는 줄
  const has = (it, ...tags) => tags.some((t) => it.tags.includes(t));
  if (state.habit === 'binge') addRow('habit', '주말에 몰아보기 좋은 작품', (it) => it.type === 'tv' && has(it, 'fast', 'twist'));
  if (state.habit === 'daily') addRow('habit', '하루 한 편씩 보기 좋은 작품', (it) => has(it, 'mood', 'real'));
  if (state.habit === 'light') addRow('habit', '틀어놓고 편하게 보기 좋은 작품', (it) => has(it, 'fun'));

  // 4) 평이 좋은 작품, 5) 나머지는 인기순
  addRow('top', '평이 아주 좋은 작품', (it) => it.vote >= 7.8, { sort: (x, y) => y.item.vote - x.item.vote });
  addRow('popular', '지금 많이 보는 작품', () => true, { sort: (x, y) => y.item.pop - x.item.pop, min: 1 });

  return { hero, rows };
}

/**
 * 찾기 화면: 종류·장르·안 본 것만 조건으로 거르고, 고른 기준으로 정렬한다.
 * find = { kind, genre, unseenOnly, sort }
 */
export function filterAndSort(items, find, state, lookup) {
  const group = GENRE_GROUPS.find((g) => g.id === find.genre);
  const list = items.filter((it) => {
    if (find.kind !== 'all' && it.kind !== find.kind) return false;
    if (group && !it.g.some((id) => group.ids.includes(id))) return false;
    if (find.unseenOnly && (state.status[it.key] || state.nope.includes(it.key))) return false;
    return true;
  });
  const dateOf = (it) => it.date || it.year || '';
  // 추천순은 점수를 한 번씩만 계산해 두고 비교한다
  const score = new Map();
  if ((find.sort || 'rec') === 'rec') list.forEach((it) => score.set(it.key, analyze(it, state, lookup).score));
  const sorters = {
    rec: (x, y) => score.get(y.key) - score.get(x.key) || y.pop - x.pop,
    new: (x, y) => dateOf(y).localeCompare(dateOf(x)),
    rating: (x, y) => y.vote - x.vote || y.pop - x.pop,
    popular: (x, y) => y.pop - x.pop
  };
  return list.sort(sorters[find.sort] || sorters.rec);
}
