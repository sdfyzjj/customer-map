/* 聚能客户标记管理 · Service Worker（PWA）
   策略：网络优先 + 同源资源缓存兜底。
   - 在线时始终请求最新文件并回写缓存（保证每次打开都是新版）
   - 离线时用缓存兜底（页面/图标仍可打开，地图功能需联网） */
var CACHE = 'cust-map-v1';

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(['./index.html', './manifest.json', './icon-192.png', './icon-512.png']);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(function (res) {
      if (res && res.status === 200) {
        try {
          var u = new URL(e.request.url);
          if (u.origin === location.origin) {
            var clone = res.clone();
            caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
          }
        } catch (err) {}
      }
      return res;
    }).catch(function () {
      return caches.match(e.request);
    })
  );
});
