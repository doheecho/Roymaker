var CACHE_PREFIX = 'eroi-playground-';
// 배포할 때마다 이 버전을 올리면 이전 캐시가 정리되고 새 파일이 받아진다.
var CACHE_NAME = CACHE_PREFIX + 'v5.04';
var BASE = '/Roy-s-world/';

// index.html이 로드하는 모든 스크립트를 빠짐없이 넣는다.
// (하나라도 빠지면 설치 후 첫 오프라인 실행에서 그 게임이 동작하지 않는다.)
var PRECACHE_URLS = [
    BASE,
    BASE + 'index.html',
    BASE + 'manifest.json',
    BASE + 'css/style.css',
    BASE + 'js/main.js',
    BASE + 'js/games/memory.js',
    BASE + 'js/games/spatial.js',
    BASE + 'js/games/hangul.js',
    BASE + 'js/games/hanja.js',
    BASE + 'js/games/proverb.js',
    BASE + 'js/games/worldquiz.js',
    BASE + 'js/games/observation.js',
    BASE + 'js/games/memoryroom.js',
    BASE + 'js/games/melody.js',
    BASE + 'js/games/logic.js',
    BASE + 'js/games/math.js',
    BASE + 'js/games/coding.js',
    BASE + 'js/games/english.js',
    BASE + 'icon-512x512.png'
];

self.addEventListener('install', function (e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(PRECACHE_URLS);
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', function (e) {
    // 주의: Cache Storage는 origin(도메인) 전체에서 공유되며 서비스워커 scope와 무관하다.
    // 접두사(CACHE_PREFIX)로 걸러내지 않으면 같은 도메인의 다른 앱(예: /Teenieping/) 캐시까지
    // 여기서 지워버려 두 앱의 설치/오프라인 캐시가 서로 충돌하게 된다.
    e.waitUntil(
        caches.keys().then(function (keys) {
            return Promise.all(
                keys.filter(function (k) { return k.indexOf(CACHE_PREFIX) === 0 && k !== CACHE_NAME; })
                    .map(function (k) { return caches.delete(k); })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
});

function putInCache(req, res) {
    var clone = res.clone();
    caches.open(CACHE_NAME).then(function (cache) { cache.put(req, clone); });
}

self.addEventListener('fetch', function (e) {
    var req = e.request;
    if (req.method !== 'GET') return;

    var url;
    try { url = new URL(req.url); } catch (err) { return; }
    var sameOrigin = url.origin === self.location.origin;

    // ── 교차 출처 리소스(예: flagcdn.com 국기 이미지) ──
    // 캐시 우선 + 성공 응답(opaque 포함)을 저장해 두 번째부터는 오프라인에서도 뜬다.
    if (!sameOrigin) {
        e.respondWith(
            caches.match(req).then(function (cached) {
                if (cached) return cached;
                return fetch(req).then(function (res) {
                    if (res && (res.ok || res.type === 'opaque')) { putInCache(req, res); }
                    return res;
                }).catch(function () {
                    return cached || Response.error();
                });
            })
        );
        return;
    }

    var isDoc = req.mode === 'navigate';
    var isCode = /\.(?:js|css)$/i.test(url.pathname);

    // ── HTML / JS / CSS: 네트워크 우선 ──
    // 온라인이면 항상 최신 코드를 받고(배포 즉시 반영), 오프라인이면 캐시로 대체한다.
    if (isDoc || isCode) {
        e.respondWith(
            fetch(req).then(function (res) {
                if (res && res.status === 200 && res.type === 'basic') { putInCache(req, res); }
                return res;
            }).catch(function () {
                return caches.match(req).then(function (cached) {
                    if (cached) return cached;
                    return isDoc ? caches.match(BASE + 'index.html') : Response.error();
                });
            })
        );
        return;
    }

    // ── 그 외(이미지 / 아이콘 등): 캐시 우선 ──
    e.respondWith(
        caches.match(req).then(function (cached) {
            if (cached) return cached;
            return fetch(req).then(function (res) {
                if (res && res.status === 200 && res.type === 'basic') { putInCache(req, res); }
                return res;
            }).catch(function () {
                if (req.mode === 'navigate') return caches.match(BASE + 'index.html');
                return Response.error();
            });
        })
    );
});
