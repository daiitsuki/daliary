import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 카카오맵 명시적 로드 (autoload=false 대응)
if (window.kakao && window.kakao.maps) {
  window.kakao.maps.load(() => {
    console.log('Kakao Maps loaded successfully');
  });
}

// 서비스 워커 등록
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('SW registration successful with scope: ', registration.scope);
      
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker) {
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('New content is available; please refresh.');
              } else {
                console.log('Content is cached for offline use.');
              }
            }
          };
        }
      };
    }).catch(error => {
      console.error('SW registration failed: ', error);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
