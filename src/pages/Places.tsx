import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PlaceSearch from '../components/map/search/PlaceSearch';
import RegionDashboard from '../components/map/dashboard/RegionDashboard';
import Wishlist from '../components/map/wishlist/Wishlist';
import TravelPlans from '../components/map/plans/TravelPlans';
import MemoryFeed from '../components/map/memory/MemoryFeed';
import { Search, Map as MapIcon, Star, CalendarDays, Camera } from 'lucide-react';
import { Place } from '../context/PlacesContext';
import { motion, Variants } from 'framer-motion';

const LAST_VIEWED_TAB_KEY = 'daliary_last_map_tab';

export default function Places() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [targetPlace, setTargetPlace] = useState<Place | null>(null);
  
  const activeTab = (searchParams.get('tab') as 'dashboard' | 'search' | 'wishlist' | 'plans' | 'memory') || null;

  // 초기 탭 설정: URL에 없으면 localStorage에서 가져옴
  useEffect(() => {
    if (!activeTab) {
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
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  if (!activeTab) return null; // 초기 탭 설정 중에는 렌더링 방지

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* 상단 탭 스위처: 고정 높이 */}
      <div className="bg-white border-b border-gray-100 shrink-0 z-30">
        <div className="flex w-full overflow-x-auto no-scrollbar scroll-smooth">
          <div className="flex min-w-full sm:max-w-xl sm:mx-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 min-w-[70px] py-4 text-[10px] sm:text-xs font-bold flex flex-col items-center gap-1 transition-colors ${
                activeTab === 'dashboard' ? 'text-rose-500 border-b-2 border-rose-500' : 'text-gray-400'
              }`}
            >
              <MapIcon size={16} className="sm:w-[18px] sm:h-[18px]" />
              여행 지도
            </button>
            <button
              onClick={() => setActiveTab('memory')}
              className={`flex-1 min-w-[70px] py-4 text-[10px] sm:text-xs font-bold flex flex-col items-center gap-1 transition-colors ${
                activeTab === 'memory' ? 'text-rose-500 border-b-2 border-rose-500' : 'text-gray-400'
              }`}
            >
              <Camera size={16} className="sm:w-[18px] sm:h-[18px]" />
              추억 피드
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 min-w-[70px] py-4 text-[10px] sm:text-xs font-bold flex flex-col items-center gap-1 transition-colors ${
                activeTab === 'search' ? 'text-rose-500 border-b-2 border-rose-500' : 'text-gray-400'
              }`}
            >
              <Search size={16} className="sm:w-[18px] sm:h-[18px]" />
              장소 찾기
            </button>
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`flex-1 min-w-[70px] py-4 text-[10px] sm:text-xs font-bold flex flex-col items-center gap-1 transition-colors ${
                activeTab === 'wishlist' ? 'text-rose-500 border-b-2 border-rose-500' : 'text-gray-400'
              }`}
            >
              <Star size={16} className="sm:w-[18px] sm:h-[18px]" />
              가고 싶은 곳
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`flex-1 min-w-[70px] py-4 text-[10px] sm:text-xs font-bold flex flex-col items-center gap-1 transition-colors ${
                activeTab === 'plans' ? 'text-rose-500 border-b-2 border-rose-500' : 'text-gray-400'
              }`}
            >
              <CalendarDays size={16} className="sm:w-[18px] sm:h-[18px]" />
              여행 계획
            </button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 영역 */}
      <main className="flex-1 relative min-h-0 overflow-hidden">
        {activeTab === 'dashboard' && (
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
        )}

        {activeTab === 'memory' && (
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
        )}
        
        {activeTab === 'search' && (
          <PlaceSearch targetPlace={targetPlace} />
        )}
        
        {activeTab === 'wishlist' && (
          <motion.div 
            key="wishlist"
            variants={containerVariants} 
            initial="hidden" 
            animate="visible" 
            className="h-full"
          >
            <motion.div variants={itemVariants} className="h-full">
              <Wishlist onShowOnMap={handleShowOnMap} />
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'plans' && (
          <motion.div 
            key="plans"
            variants={containerVariants} 
            initial="hidden" 
            animate="visible" 
            className="h-full"
          >
            <motion.div variants={itemVariants} className="h-full">
              <TravelPlans />
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
