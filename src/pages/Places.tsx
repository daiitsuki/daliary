import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PlaceSearch from '../components/PlaceSearch';
import RegionDashboard from '../components/RegionDashboard';
import Wishlist from '../components/Wishlist';
import TravelPlans from '../components/map/TravelPlans';
import { Search, Map as MapIcon, Star, CalendarDays } from 'lucide-react';
import { Place } from '../context/PlacesContext';
import { motion, Variants } from 'framer-motion';

export default function Places() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [targetPlace, setTargetPlace] = useState<Place | null>(null);
  
  const activeTab = (searchParams.get('tab') as 'dashboard' | 'search' | 'wishlist' | 'plans') || 'dashboard';

  const setActiveTab = (tab: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tab);
    // 탭 이동 시 지역 선택 해제 (원할 경우 유지할 수도 있음)
    if (tab !== 'dashboard') {
      newParams.delete('region');
      newParams.delete('subRegion');
    }
    // 직접 탭 클릭 시에는 targetPlace 초기화
    setTargetPlace(null);
    setSearchParams(newParams);
  };

  const handleShowOnMap = (place: Place) => {
    setTargetPlace(place);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', 'search');
    setSearchParams(newParams);
  };

  // Stagger Animation Variants (홈 탭과 동일한 스타일)
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

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* 상단 탭 스위처: 고정 높이 */}
      <div className="bg-white border-b border-gray-100 shrink-0 z-30">
        <div className="flex max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 py-4 text-xs font-bold flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'dashboard' ? 'text-rose-500 border-b-2 border-rose-500' : 'text-gray-400'
            }`}
          >
            <MapIcon size={18} />
            여행 지도
          </button>
          <button
            onClick={() => {
              setActiveTab('search');
            }}
            className={`flex-1 py-4 text-xs font-bold flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'search' ? 'text-rose-500 border-b-2 border-rose-500' : 'text-gray-400'
            }`}
          >
            <Search size={18} />
            장소 찾기
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`flex-1 py-4 text-xs font-bold flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'wishlist' ? 'text-rose-500 border-b-2 border-rose-500' : 'text-gray-400'
            }`}
          >
            <Star size={18} />
            가고 싶은 곳
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`flex-1 py-4 text-xs font-bold flex flex-col items-center gap-1 transition-colors ${
              activeTab === 'plans' ? 'text-rose-500 border-b-2 border-rose-500' : 'text-gray-400'
            }`}
          >
            <CalendarDays size={18} />
            여행 계획
          </button>
        </div>
      </div>

      {/* 메인 컨텐츠 영역: 남은 공간 모두 차지 */}
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
