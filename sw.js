// 서비스 워커: 앱으로 설치할 수 있게 해 주고, 인터넷이 끊겨도 마지막으로 본 화면은 열리게 한다.
// 항상 인터넷에서 먼저 받아오고(새 버전이 바로 보이도록), 실패했을 때만 저장해 둔 것을 쓴다.
const CACHE = 'bombollae-v3';
const SHELL = ['/', '/index.html', '/css/style.css', '/js/app.js', '/js/views.js', '/js/recommend.js', '/js/tmdb.js',
  '/js/config.js', '/js/flowers.js', '/js/storage.js', '/favicon.svg', '/icons/icon-192.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // 우리 사이트의 화면 파일만 다룬다. TMDB 요청(/api)과 포스터 이미지는 그대로 인터넷으로.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); }
        return res;
      })
      .catch(() => caches.match(event.request).then((hit) => hit || caches.match('/')))
  );
});
