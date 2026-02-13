import { useState, useEffect, useCallback, useRef } from 'react';

interface VersionData {
  version: string;
  builtAt: string;
}

export const useAppUpdate = () => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const lastCheckTime = useRef<number>(0);
  const isChecking = useRef<boolean>(false);
  const CHECK_INTERVAL = 1000 * 60 * 10; // 10분 간격

  const checkVersion = useCallback(async () => {
    const now = Date.now();
    // 마지막 확인 후 10분이 지나지 않았거나 이미 체크 중이면 요청 생략
    if (now - lastCheckTime.current < CHECK_INTERVAL || isChecking.current) return;

    isChecking.current = true;
    try {
      // 캐시를 방지하기 위해 타임스탬프 쿼리 추가
      const response = await fetch(`/version.json?t=${now}`, {
        cache: 'no-store',
      });
      
      if (!response.ok) return;
      
      // 요청 성공 시 마지막 확인 시간 갱신
      lastCheckTime.current = now;

      const serverData: VersionData = await response.json();
      const currentVersion = localStorage.getItem('app_version');

      // 첫 방문이거나 버전이 없으면 현재 버전 저장하고 종료
      if (!currentVersion) {
        localStorage.setItem('app_version', serverData.version);
        // Also set last_seen_changelog_version to current version on first visit 
        // to avoid showing changelog immediately on first ever load
        localStorage.setItem('last_seen_changelog_version', serverData.version);
        return;
      }

      // 서버 버전과 로컬 버전이 다르면 업데이트 필요
      if (serverData.version !== currentVersion) {
        setHasUpdate(true);
      }
    } catch (error) {
      console.error('Failed to check version:', error);
    } finally {
      isChecking.current = false;
    }
  }, []);

  const updateApp = () => {
    // 확실한 방법: 최신 버전을 저장하고 리로드
    fetch(`/version.json?t=${new Date().getTime()}`, { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error('Version file not found');
        return res.json();
      })
      .then((data: VersionData) => {
        localStorage.setItem('app_version', data.version);
        
        // 캐시 삭제 및 서비스 워커 업데이트
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(registrations => {
            for (let registration of registrations) {
              registration.unregister(); // 업데이트를 위해 기존 SW 해제
            }
          });
        }
        
        // 하드 리로드 (브라우저 캐시 무시 시도)
        window.location.href = window.location.origin + '?u=' + data.version;
      })
      .catch(err => {
        console.error('Update failed:', err);
        // 실패하더라도 리로드는 시도
        window.location.reload();
      });
  };

  useEffect(() => {
    // 1. 초기 로드 시 체크
    checkVersion();

    // 2. 창이 다시 포커스될 때 체크 (사용자가 다른 앱 갔다 왔을 때)
    const onFocus = () => checkVersion();
    window.addEventListener('focus', onFocus);
    
    // 3. 페이지 가시성 변경 시 체크 (탭 이동 후 복귀)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVersion();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [checkVersion]);

  return { hasUpdate, updateApp };
};
