self.addEventListener('install', function(event) {
  console.log('[ServiceWorker] Install event');
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('[ServiceWorker] Activate event');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', function(event) {
  console.log('[ServiceWorker] Push event received!!');
  
  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
      console.log('[ServiceWorker] Push data parsed:', data);
    } else {
      console.warn('[ServiceWorker] Push event has no data');
      data = { title: 'Daliary', body: '새로운 소식이 있습니다.' };
    }
  } catch (err) {
    console.error('[ServiceWorker] Failed to parse push data:', err);
    data = { title: 'Daliary', body: '새로운 소식이 있습니다.' };
  }

  const options = {
    body: data.body,
    icon: '/logo.png',
    badge: '/logo.png',
    data: data.data || { url: '/' },
    tag: data.tag || 'default',
    renotify: true,
    vibrate: [100, 50, 100],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => {
        console.log('[ServiceWorker] Notification displayed successfully');
      })
      .catch(err => {
        console.error('[ServiceWorker] Critical error showing notification:', err);
      })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
