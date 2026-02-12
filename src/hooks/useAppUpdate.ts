import { useState, useEffect, useCallback, useRef } from 'react';

interface VersionData {
  version: string;
  builtAt: string;
}

export const useAppUpdate = () => {
  const [hasUpdate, setHasUpdate] = useState(false);
  const lastCheckTime = useRef<number>(0);
  const CHECK_INTERVAL = 1000 * 60 * 10; // 10분 간격

  const checkVersion = useCallback(async () => {
    const now = Date.now();
    // 마지막 확인 후 10분이 지나지 않았으면 요청 생략
    if (now - lastCheckTime.current < CHECK_INTERVAL) return;

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
    }
  }, []);

  const updateApp = () => {
    // 새 버전을 로컬 스토리지에 저장하는 것은 
    // 페이지가 새로고침되고 다시 checkVersion이 돌 때 처리하거나,
    // 여기서 미리 fetch해서 저장할 수도 있지만,
    // 가장 확실한 건 캐시를 날리고 리로드하는 것입니다.
    
    // 1. 버전 정보 갱신을 위해 fetch를 한번 더 하거나 그냥 리로드
    // 리로드하면 다시 checkVersion이 돌면서 currentVersion을 갱신해야 하는데,
    // 문제는 리로드 해도 구버전 JS가 로드될 수 있음.
    
    // 확실한 방법: 최신 버전을 저장하고 리로드
    fetch(`/version.json?t=${new Date().getTime()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then((data: VersionData) => {
        localStorage.setItem('app_version', data.version);
        
        // PWA 캐시 삭제 시도 (선택적)
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(registrations => {
            for (let registration of registrations) {
              registration.update();
            }
          });
        }
        
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
