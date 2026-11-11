// PWA 설치 조건을 만족시키기 위한 최소 서비스워커 — 캐싱은 하지 않고 그대로 네트워크로 흘려보낸다.
// (이 프로젝트는 place.csv/데이터 캐시 문제를 여러 번 겪어서, 여기서 또 캐싱을 추가하면 혼란만 커진다.)
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => event.respondWith(fetch(event.request)));
