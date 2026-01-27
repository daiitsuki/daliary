import { useState } from 'react';
import PlaceSearch from '../components/PlaceSearch';
import RegionDashboard from '../components/RegionDashboard';
import Wishlist from '../components/Wishlist';
import { Search, Map as MapIcon, Star } from 'lucide-react';
import { Place, PlacesProvider } from '../context/PlacesContext';

export default function Places() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'search' | 'wishlist'>('dashboard');
  const [targetPlace, setTargetPlace] = useState<Place | null>(null);

  const handleShowOnMap = (place: Place) => {
    setTargetPlace(place);
    setActiveTab('search');
  };

  return (
    <PlacesProvider>
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
                setTargetPlace(null);
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
          </div>
        </div>

        {/* 메인 컨텐츠 영역: 남은 공간 모두 차지 */}
        <main className="flex-1 relative min-h-0 overflow-hidden">
          {activeTab === 'dashboard' && <div className="h-full"><RegionDashboard /></div>}
          {activeTab === 'search' && <PlaceSearch targetPlace={targetPlace} />}
          {activeTab === 'wishlist' && <div className="h-full"><Wishlist onShowOnMap={handleShowOnMap} /></div>}
        </main>
      </div>
    </PlacesProvider>
  );
}
