// 추천 점수 계산.
// 작품마다 점수를 매겨 높은 순으로 보여 준다. 점수를 올리고 내린 이유가 그대로 "왜 재밌을까요?" 문장이 된다.
//
//   + 3점    설문에서 고른 취향 꼬리표와 겹칠 때마다
//   + 1.5점  인생작과 겹치는 장르 하나마다 (같은 종류면 0.5점 더)
//   + 1~1.5점 보는 습관과 맞을 때
//   + 1점    TMDB 평점 8점 이상 (그 아래는 6점 기준으로 조금씩 가감)
//   - 4점    피하고 싶다고 고른 요소가 있을 때

import { REASON, WARN } from './config.js';

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
