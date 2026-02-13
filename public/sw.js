self.addEventListener('push', function(event) {
  console.log('[ServiceWorker] Push event received');
  
  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
      console.log('[ServiceWorker] Push data parsed:', data);
    } else {
      console.warn('[ServiceWorker] Push event has no data');
    }
  } catch (err) {
    console.error('[ServiceWorker] Failed to parse push data:', err);
    return;
  }

  const options = {
    body: data.body || '새로운 알림이 도착했습니다.',
    icon: '/logo.png',
    badge: '/logo.png',
    data: data.data || { url: '/' },
    tag: data.tag || 'default',
    renotify: true,
    vibrate: [100, 50, 100],
  };

  console.log('[ServiceWorker] Attempting to show notification:', data.title);

  event.waitUntil(
    self.registration.showNotification(data.title || 'Daliary', options)
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
