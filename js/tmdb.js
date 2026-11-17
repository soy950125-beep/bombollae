// TMDB에서 작품 정보를 가져오는 파일.
// 브라우저는 TMDB에 직접 묻지 않고 우리 서버 함수(/api/tmdb)에 묻는다.
// 서버 함수가 숨겨 둔 키를 붙여서 TMDB에 대신 물어봐 주기 때문에, 키가 브라우저에 절대 노출되지 않는다.

import { GENRE_TAGS, EXCLUDE_GENRES } from './config.js';

export class TmdbError extends Error {
  constructor(status, code) {
    super(`TMDB request failed (${status})`);
    this.status = status;
    this.code = code;
  }
}

/** /api/tmdb 프록시를 통해 TMDB API를 호출한다. params 값이 null이면 그 항목은 빼고 보낸다. */
export async function tmdb(path, params = {}) {
  const query = new URLSearchParams({ path });
  const merged = { language: 'ko-KR', ...params };
  for (const [key, value] of Object.entries(merged)) {
    if (value !== null && value !== undefined) query.set(key, String(value));
  }
  let res;
  try {
    res = await fetch(`/api/tmdb?${query}`);
  } catch {
    throw new TmdbError(0, 'network');
  }
  if (!res.ok) {
    let code = '';
    try { code = (await res.json()).error || ''; } catch { /* 본문 없음 */ }
    throw new TmdbError(res.status, code);
  }
  return res.json();
}

/** 오류를 사람이 읽을 수 있는 문장으로 바꾼다. */
export function errorMessage(err) {
  if (err?.code === 'missing_token') return '서버에 TMDB 키가 아직 설정되지 않았어요. Vercel 환경 변수 TMDB_TOKEN을 확인해 주세요.';
  if (err?.status === 401) return 'TMDB 키가 맞지 않아요. Vercel 환경 변수 TMDB_TOKEN 값을 다시 확인해 주세요.';
  if (err?.status === 429) return '요청이 너무 많아요. 잠시 뒤에 다시 시도해 주세요.';
  if (err?.status === 404) return '서버 함수를 찾지 못했어요. Vercel로 배포한 주소에서 열었는지 확인해 주세요.';
  return 'TMDB에 연결하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.';
}

/** TMDB 응답 한 건을 앱에서 쓰기 좋은 모양으로 바꾼다. 추천에 안 맞는 작품이면 null. */
export function normalize(raw, typeHint) {
  const type = raw.media_type || typeHint;
  if (type !== 'tv' && type !== 'movie') return null;

  const genres = raw.genre_ids || (raw.genres || []).map((g) => g.id);
  if (genres.some((id) => EXCLUDE_GENRES.includes(id))) return null;

  // 장르 → 취향 꼬리표
  const tags = [];
  genres.forEach((id) => (GENRE_TAGS[id] || []).forEach((t) => { if (!tags.includes(t)) tags.push(t); }));
  if (!tags.length) tags.push('mood');

  // 장르 → 피하고 싶은 요소 (설문 3번과 비교)
  const dis = [];
  if (genres.includes(10752) || genres.includes(10768)) dis.push('violent');
  if (genres.includes(27)) dis.push('scary');
  const eventful = [28, 80, 9648, 53, 10759, 27];
  if (genres.includes(18) && !genres.some((id) => eventful.includes(id))) dis.push('slowburn');

  return {
    key: `${type}-${raw.id}`,
    id: raw.id,
    type,
    title: raw.name || raw.title || '제목 없음',
    kind: genres.includes(16) ? 'anime' : type === 'tv' ? 'drama' : 'movie',
    g: genres,
    tags,
    dis,
    poster: raw.poster_path || '',
    backdrop: raw.backdrop_path || '',
    date: raw.first_air_date || raw.release_date || '',
    year: (raw.first_air_date || raw.release_date || '').slice(0, 4),
    overview: raw.overview || '',
    lang: raw.original_language || '',
    vote: raw.vote_average || 0,
    pop: raw.popularity || 0
  };
}

// 처음 불러올 작품 목록. 전부 '한국에서 정식으로 볼 수 있는 작품'(구독·무료 서비스)만 받아서,
// 추천한 작품을 눌렀는데 볼 곳이 없는 일이 없도록 한다.
const KR = { watch_region: 'KR', with_watch_monetization_types: 'flatrate|free|ads' };
const POPULAR = { ...KR, sort_by: 'popularity.desc' };
const TOP = { ...KR, sort_by: 'vote_average.desc', 'vote_count.gte': 400 };
// 한국 사용자용 구성: 드라마는 한국 드라마 위주, 애니는 일본 애니 위주, 영화는 한국·해외 고르게
const CATALOG_REQUESTS = [
  // 드라마: 한국 5페이지 + 해외 인기작 1페이지
  ['/discover/tv', { ...POPULAR, with_original_language: 'ko', without_genres: '16', page: 1 }, 'tv'],
  ['/discover/tv', { ...POPULAR, with_original_language: 'ko', without_genres: '16', page: 2 }, 'tv'],
  ['/discover/tv', { ...POPULAR, with_original_language: 'ko', without_genres: '16', page: 3 }, 'tv'],
  ['/discover/tv', { ...POPULAR, with_original_language: 'ko', without_genres: '16', page: 4 }, 'tv'],
  ['/discover/tv', { ...TOP, with_original_language: 'ko', without_genres: '16', 'vote_count.gte': 50, page: 1 }, 'tv'],
  ['/discover/tv', { ...POPULAR, without_genres: '16', page: 1 }, 'tv'],
  // 애니: 일본 애니 시리즈 + 일본 애니 영화
  ['/discover/tv', { ...POPULAR, with_genres: '16', with_original_language: 'ja', page: 1 }, 'tv'],
  ['/discover/tv', { ...POPULAR, with_genres: '16', with_original_language: 'ja', page: 2 }, 'tv'],
  ['/discover/tv', { ...TOP, with_genres: '16', with_original_language: 'ja', page: 1 }, 'tv'],
  ['/discover/movie', { ...POPULAR, with_genres: '16', with_original_language: 'ja', page: 1 }, 'movie'],
  // 영화: 한국 영화 + 해외 인기·평점
  ['/discover/movie', { ...POPULAR, with_original_language: 'ko', page: 1 }, 'movie'],
  ['/discover/movie', { ...POPULAR, with_original_language: 'ko', page: 2 }, 'movie'],
  ['/discover/movie', { ...POPULAR, without_genres: '16', page: 1 }, 'movie'],
  ['/discover/movie', { ...TOP, page: 1 }, 'movie']
];

/** 요청 여러 개를 한 번에 보내고, 일부가 실패해도 성공한 것만 모아서 작품 목록으로 만든다 */
async function fetchMany(requests) {
  const results = await Promise.allSettled(
    requests.map(([path, params, type]) => tmdb(path, params).then((data) => ({ data, type })))
  );
  const seen = new Set();
  const items = [];
  let firstError = null;
  for (const r of results) {
    if (r.status !== 'fulfilled') { firstError = firstError || r.reason; continue; }
    for (const raw of r.value.data.results || []) {
      const item = normalize(raw, r.value.type);
      if (item && item.poster && !seen.has(item.key)) { seen.add(item.key); items.push(item); }
    }
  }
  if (!items.length) throw firstError || new TmdbError(0, 'empty');
  return items;
}

/** 추천 후보 목록을 한 번에 불러온다 */
export function fetchCatalog() {
  return fetchMany(CATALOG_REQUESTS);
}

// 한 종류(드라마·영화·애니)의 추천이 모자라면 그 종류만 더 불러온다. round가 커질수록 다음 페이지.
const MORE_REQUESTS = {
  drama: (n) => [['/discover/tv', { ...POPULAR, with_original_language: 'ko', without_genres: '16', page: n + 4 }, 'tv'],
    ['/discover/tv', { ...TOP, with_original_language: 'ko', without_genres: '16', 'vote_count.gte': 50, page: n + 1 }, 'tv']],
  movie: (n) => [['/discover/movie', { ...POPULAR, with_original_language: 'ko', page: n + 2 }, 'movie'],
    ['/discover/movie', { ...POPULAR, without_genres: '16', page: n + 1 }, 'movie']],
  anime: (n) => [['/discover/tv', { ...POPULAR, with_genres: '16', with_original_language: 'ja', page: n + 2 }, 'tv'],
    ['/discover/movie', { ...POPULAR, with_genres: '16', with_original_language: 'ja', page: n + 1 }, 'movie']]
};

export function fetchMore(kind, round) {
  return fetchMany(MORE_REQUESTS[kind](round));
}

/** 제목으로 검색 (드라마·영화 함께) */
export async function searchTitles(query) {
  const data = await tmdb('/search/multi', { query, include_adult: 'false', page: 1 });
  return (data.results || []).map((raw) => normalize(raw, null)).filter(Boolean);
}

/** 영상 목록에서 유튜브 예고편 하나 고르기: 공식 예고편 > 예고편 > 티저 순 */
function pickTrailer(results = []) {
  const rank = (v) => (v.type === 'Trailer' ? 0 : 1) + (v.official ? 0 : 0.5);
  const best = results
    .filter((v) => v.site === 'YouTube' && v.key && (v.type === 'Trailer' || v.type === 'Teaser'))
    .sort((a, b) => rank(a) - rank(b))[0];
  return best ? { key: best.key, name: best.name || '예고편' } : null;
}

/** 예고편 찾기: 한국어 영상 먼저, 없으면 영어 영상. 없거나 실패하면 null (예고편 칸을 안 보여 준다) */
async function fetchTrailer(item) {
  try {
    const ko = await tmdb(`/${item.type}/${item.id}/videos`, { language: 'ko-KR' });
    const found = pickTrailer(ko.results);
    if (found) return { ...found, lang: 'ko' };
    const en = await tmdb(`/${item.type}/${item.id}/videos`, { language: 'en-US' });
    const enFound = pickTrailer(en.results);
    return enFound ? { ...enFound, lang: 'en' } : null;
  } catch {
    return null;
  }
}

/** 작품 상세 정보 + 한국에서 볼 수 있는 서비스 + 예고편 */
export async function fetchDetail(item) {
  const [data, providers, trailer] = await Promise.all([
    tmdb(`/${item.type}/${item.id}`),
    tmdb(`/${item.type}/${item.id}/watch/providers`, { language: null }),
    fetchTrailer(item)
  ]);
  return { data, providers: providers.results?.KR ?? null, trailer };
}
