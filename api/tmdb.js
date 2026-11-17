// Vercel 서버 함수: 브라우저 대신 TMDB에 요청을 보내 주는 "중간 다리(프록시)".
//
// 왜 필요한가?
//   TMDB 키를 브라우저 코드에 넣으면 누구나 개발자 도구로 키를 볼 수 있다.
//   키는 Vercel 환경 변수(TMDB_TOKEN)에만 두고, 이 함수가 서버에서 키를 붙여 대신 요청한다.
//
// 지켜야 할 것
//   - 정해 둔 TMDB 주소만 통과시킨다 (아무 요청이나 대신 보내 주는 통로가 되지 않도록)
//   - GET 요청만 받는다
//   - 결과를 Vercel 캐시에 잠시 저장해서 TMDB 요청 횟수를 줄인다

const ALLOWED_PATHS = [
  /^\/trending\/all\/week$/,
  /^\/discover\/(tv|movie)$/,
  /^\/(tv|movie)\/top_rated$/,
  /^\/search\/multi$/,
  /^\/(tv|movie)\/\d+$/,
  /^\/(tv|movie)\/\d+\/watch\/providers$/,
  /^\/(tv|movie)\/\d+\/videos$/
];

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const token = (process.env.TMDB_TOKEN || '').trim();
  if (!token) {
    return res.status(500).json({ error: 'missing_token' });
  }

  const { path, ...params } = req.query || {};
  if (typeof path !== 'string' || !ALLOWED_PATHS.some((re) => re.test(path))) {
    return res.status(400).json({ error: 'path_not_allowed' });
  }

  const url = new URL(`https://api.themoviedb.org/3${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (key === 'api_key') continue; // 키는 서버에서만 붙인다
    if (typeof value === 'string' && value.length <= 200) url.searchParams.set(key, value);
  }

  // 긴 "읽기 액세스 토큰"이면 Authorization 헤더로, 짧은 "API 키"면 주소에 붙여 보낸다
  const headers = { accept: 'application/json' };
  if (token.length > 40) headers.Authorization = `Bearer ${token}`;
  else url.searchParams.set('api_key', token);

  try {
    const upstream = await fetch(url, { headers });
    const body = await upstream.text();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    if (upstream.ok) {
      const ttl = path.startsWith('/search') ? 600 : 3600;
      res.setHeader('Cache-Control', `public, s-maxage=${ttl}, stale-while-revalidate=86400`);
    }
    return res.status(upstream.status).send(body);
  } catch (err) {
    return res.status(502).json({ error: 'upstream_unreachable' });
  }
};
