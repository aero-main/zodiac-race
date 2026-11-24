// 오프라인 실행용 서비스 워커: 게임 파일을 저장해 두고, 인터넷이 없으면 저장본으로 실행
// 게임을 고친 뒤 배포할 때는 VERSION 숫자를 올려야 폰에 새 버전이 받아짐
const VERSION = 'zr-v3';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/i192.png', './icons/i512.png', './icons/i180.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 게임 페이지: 인터넷이 되면 최신본, 안 되면 저장본
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // 그 외(아이콘, 글꼴): 저장본 우선, 없으면 받아서 저장
  if (url.origin === location.origin || url.host.endsWith('fonts.googleapis.com') || url.host.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return r; })));
  }
});
