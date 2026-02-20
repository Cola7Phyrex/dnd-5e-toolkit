// service-worker.js - DND 工具箱离线缓存
const CACHE_NAME = 'dnd-toolkit-v1';
const urlsToCache = [
    './',
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/dice.js',
    './js/character.js',
    './js/diy.js',
    './data/classes.json',
    './data/races.json',
    './data/spells.json',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Noto+Serif+SC:wght@400;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// 安装：缓存核心资源
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('已打开缓存');
                return cache.addAll(urlsToCache);
            })
            .catch((err) => {
                console.log('缓存失败:', err);
            })
    );
    self.skipWaiting(); // 立即激活
});

// 拦截请求：优先缓存，无缓存则网络请求
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // 命中缓存，直接返回
                if (response) {
                    return response;
                }
                // 未命中，网络请求
                return fetch(event.request)
                    .then((response) => {
                        // 检查是否有效响应
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        // 克隆响应并缓存
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                        return response;
                    })
                    .catch(() => {
                        // 网络失败且缓存没有，返回离线页面（可选）
                        console.log('离线模式：使用缓存');
                    });
            })
    );
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('删除旧缓存:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim(); // 立即控制所有客户端
});