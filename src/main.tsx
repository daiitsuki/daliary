import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// 서비스 워커 등록
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // 캐시 방지를 위해 타임스탬프 추가
    navigator.serviceWorker.register(`/sw.js?v=${Date.now()}`).then(registration => {
      console.log('SW registration successful with scope: ', registration.scope);
      
      // 즉시 업데이트 체크
      registration.update();
      
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              if (confirm('새로운 버전의 앱이 준비되었습니다. 새로고침하시겠습니까?')) {
                window.location.reload();
              }
            }
          });
        }
      });
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
