/* 가계부 서비스 워커 — 오프라인 실행용 (네트워크 우선, 실패 시 캐시) */
const CACHE = "ledger-v12";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  // 우리 사이트 파일만 처리 — Firebase/gstatic 등 외부 요청은 그대로 네트워크로
  if (new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    // cache:"no-cache" — GitHub Pages의 HTTP 캐시(10분)를 건너뛰고 항상 서버에 최신 여부 확인
    fetch(new Request(req.url, { cache: "no-cache" }))
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((r) => r || caches.match("./index.html")))
  );
});
