
const CACHE_NAME = 'tinnitus-matcher-v1';
const URLS_TO_CACHE = [
  '/',
  'index.html',
  'index.tsx',
  'App.tsx',
  'types.ts',
  'components/Slider.tsx',
  'components/SegmentedControl.tsx',
  'components/ToggleSwitch.tsx',
  'components/ControlSection.tsx',
  'components/SpectrumAnalyzer.tsx',
  'hooks/useAudioEngine.ts',
  'utils/wavUtils.ts',
  'audio/noise-generator-processor.js',
  'https://cdn.tailwindcss.com'
];

// Событие установки: кэшируем основные ресурсы
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Кэш открыт');
        return cache.addAll(URLS_TO_CACHE);
      })
      .catch(err => {
        console.error('Не удалось открыть кэш или добавить файлы во время установки:', err);
      })
  );
});

// Событие активации: очищаем старые кэши
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Событие fetch: отдаем из кэша, если есть, иначе из сети и кэшируем
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        if (response) {
          return response; // Возвращаем из кэша
        }

        // Если в кэше нет, запрашиваем из сети
        return fetch(event.request).then(networkResponse => {
          // Проверяем, что ответ корректный
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
             // Клонируем ответ, чтобы положить его в кэш
             const responseToCache = networkResponse.clone();
             cache.put(event.request, responseToCache);
          }
          return networkResponse;
        }).catch(error => {
            console.error('Ошибка сети; приложение работает в оффлайн-режиме.', error);
            // Можно вернуть специальную оффлайн-страницу, если она есть
        });
      });
    })
  );
});
