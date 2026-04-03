// Service Worker - 오프라인 지원 및 캐싱

const CACHE_NAME = 'launchup-v1';
const urlsToCache = [
  '/index.html',
  '/manifest.json',
  '/',
];

// 설치 이벤트
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// 활성화 이벤트
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 페치 이벤트 (네트워크 우선, 캐시 폴백)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 네트워크 응답을 캐시에 저장
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // 네트워크 실패 시 캐시에서 가져오기
        return caches.match(event.request).then(response => {
          return response || caches.match('/index.html');
        });
      })
  );
});

// 푸시 알림
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'LaunchUP';
  const options = {
    body: data.body || '새로운 알림이 있습니다',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%234CAF50" width="192" height="192"/><text x="50%" y="50%" font-size="100" font-weight="bold" fill="white" text-anchor="middle" dy=".3em">UP</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><text x="48" y="48" font-size="60" text-anchor="middle" dy=".3em">📋</text></svg>',
    ...data.options,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 백그라운드 동기화
self.addEventListener('sync', event => {
  if (event.tag === 'sync-bookmarks') {
    event.waitUntil(syncBookmarks());
  }
  if (event.tag === 'check-deadlines') {
    event.waitUntil(checkDeadlines());
  }
});

async function syncBookmarks() {
  try {
    console.log('북마크 동기화 중...');
  } catch (error) {
    console.error('동기화 실패:', error);
  }
}

async function checkDeadlines() {
  try {
    console.log('마감 기한 확인 중...');
    // Supabase에서 마감일 임박 북마크 확인
    // 알림 전송
  } catch (error) {
    console.error('마감 확인 실패:', error);
  }
}

// 정기 작업 (매일)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-deadlines') {
    event.waitUntil(checkDeadlines());
  }
});
