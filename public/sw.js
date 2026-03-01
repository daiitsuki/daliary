console.log('[ServiceWorker] Script loaded at top level');

self.addEventListener('install', function(event) {
  console.log('[ServiceWorker] Install event triggered');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('[ServiceWorker] Activate event triggered');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', function(event) {
  console.log('[ServiceWorker] Push event received!!');
  
  let data = { title: 'Daliary', body: '새로운 소식이 있습니다.' };
  try {
    if (event.data) {
      data = event.data.json();
      console.log('[ServiceWorker] Push data parsed:', data);
    }
  } catch (err) {
    console.error('[ServiceWorker] Failed to parse push data, using fallback:', err);
  }

  const options = {
    body: data.body,
    icon: self.location.origin + '/logo.png',
    badge: self.location.origin + '/badge.png',
    data: data.data || { url: '/' },
    tag: data.tag || 'default',
    renotify: true,
    vibrate: [100, 50, 100],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => console.log('[ServiceWorker] Notification displayed'))
      .catch(err => console.error('[ServiceWorker] Error displaying notification:', err))
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data?.url || '/', self.location.origin).href;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // 이미 열려있는 창이 있다면 포커스하고 해당 URL로 이동 시도
      if (clientList.length > 0) {
        const client = clientList[0];
        client.focus();
        if ('navigate' in client) {
          return client.navigate(urlToOpen);
        }
      }
      // 열린 창이 없거나 navigate를 지원하지 않으면 새 창 열기
      if (clients.openWindow) return clients.openWindow(urlToOpen);
    })
  );
});
