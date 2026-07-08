import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PlaceSearch from '../components/map/search/PlaceSearch';
import RegionDashboard from '../components/map/dashboard/RegionDashboard';
import Wishlist from '../components/map/wishlist/Wishlist';
import TravelPlans from '../components/map/plans/TravelPlans';
import MemoryFeed from '../components/map/memory/MemoryFeed';
import { Search, Map as MapIcon, Star, CalendarDays, Camera, Loader2 } from 'lucide-react';
import { Place } from '../context/PlacesContext';
import { motion, Variants } from 'framer-motion';
import { useKakaoLoader } from "react-kakao-maps-sdk";

const LAST_VIEWED_TAB_KEY = 'daliary_last_map_tab';

export default function Places() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [targetPlace, setTargetPlace] = useState<Place | null>(null);
  
  const [kakaoLoading, kakaoError] = useKakaoLoader({
    appkey: import.meta.env.VITE_KAKAO_MAP_API_KEY,
    libraries: ["services", "clusterer", "drawing"],
  });

  const activeTab = (searchParams.get('tab') as 'dashboard' | 'search' | 'wishlist' | 'plans' | 'memory') || null;

  // 초기 탭 설정: URL에 없으면 localStorage에서 가져옴
  const renderContent = () => {
    if (kakaoLoading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/30">
          <Loader2 className="w-8 h-8 animate-spin text-rose-400 mb-4" />
          <p className="text-sm text-gray-500 font-medium tracking-tight animate-pulse">지도를 불러오는 중입니다...</p>
        </div>
      );
    }
    if (kakaoError) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50/30 text-rose-500 font-medium">
          지도를 불러오는데 실패했습니다.
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <motion.div 
            key="dashboard"
            variants={containerVariants} 
            initial="hidden" 
            animate="visible" 
            className="h-full"
          >
            <motion.div variants={itemVariants} className="h-full">
              <RegionDashboard />
            </motion.div>
          </motion.div>
        );
      case 'memory':
        return (
          <motion.div 
            key="memory"
            variants={containerVariants} 
            initial="hidden" 
            animate="visible" 
            className="h-full"
          >
            <motion.div variants={itemVariants} className="h-full">
              <MemoryFeed />
            </motion.div>
          </motion.div>
        );
      case 'search':
        return <PlaceSearch targetPlace={targetPlace} />;
      case 'wishlist':
        return <Wishlist onShowOnMap={handleShowOnMap} />;
      case 'plans':
        return <TravelPlans />;
      default:
        return null;
    }
  };

  useEffect(() => {
    if (!activeTab) {
      // visitId가 있으면 memory 탭으로 우선 설정
      if (searchParams.get('visitId')) {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('tab', 'memory');
        setSearchParams(newParams, { replace: true });
        return;
      }

      const savedTab = localStorage.getItem(LAST_VIEWED_TAB_KEY);
      const initialTab = savedTab || 'dashboard';
      const newParams = new URLSearchParams(searchParams);
      newParams.set('tab', initialTab);
      setSearchParams(newParams, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  const setActiveTab = (tab: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tab);
    // 탭 이동 시 지역 선택 해제
    if (tab !== 'dashboard') {
      newParams.delete('region');
      newParams.delete('subRegion');
    }
    setTargetPlace(null);
    setSearchParams(newParams);
    
    // 마지막 탭 저장
    localStorage.setItem(LAST_VIEWED_TAB_KEY, tab);
  };

  const handleShowOnMap = (place: Place) => {
    setTargetPlace(place);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', 'search');
    setSearchParams(newParams);
    localStorage.setItem(LAST_VIEWED_TAB_KEY, 'search');
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  if (!activeTab) return null; // 초기 탭 설정 중에는 렌더링 방지

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* 상단 탭 스위처: 고정 높이 */}
      <div className="bg-white shrink-0 z-30 pt-2 pb-2 px-2">
        <div className="flex w-full sm:max-w-xl sm:mx-auto bg-gray-100/80 rounded-2xl p-1 relative">
          {[
            { id: 'dashboard', label: '여행 지도', icon: MapIcon },
            { id: 'memory', label: '추억 피드', icon: Camera },
            { id: 'search', label: '장소 찾기', icon: Search },
            { id: 'wishlist', label: '가고 싶은 곳', icon: Star },
            { id: 'plans', label: '여행 계획', icon: CalendarDays },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileTap={{ scale: 0.95 }}
                className={`flex-1 relative flex flex-col items-center justify-center py-2 rounded-xl z-10 transition-colors outline-none
                  ${isActive ? 'text-rose-500' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="placesTabPill"
                    className="absolute inset-0 bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-100"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex flex-col items-center gap-1">
                  <Icon size={18} className="sm:w-[20px] sm:h-[20px]" />
                  <span className="text-[10px] sm:text-xs font-bold leading-none">{tab.label}</span>
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <main className="flex-1 relative min-h-0 overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
}
