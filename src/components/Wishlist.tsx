import React, { useState, useMemo } from 'react';
import { usePlaces, Place } from '../context/PlacesContext';
import { MapPin, Trash2, CheckCircle, Navigation, Search } from 'lucide-react';
import VisitForm from './VisitForm';
import { motion, Variants } from 'framer-motion';

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const getRegionFromAddress = (address: string | null): string => {
  if (!address) return "기타";
  if (address.includes("서울")) return "서울";
  if (address.includes("부산")) return "부산";
  if (address.includes("대구")) return "대구";
  if (address.includes("인천")) return "인천";
  if (address.includes("광주")) return "광주";
  if (address.includes("대전")) return "대전";
  if (address.includes("울산")) return "울산";
  if (address.includes("세종")) return "세종";
  if (address.includes("경기")) return "경기";
  if (address.includes("강원")) return "강원";
  if (address.includes("충북") || address.includes("충청북도")) return "충북";
  if (address.includes("충남") || address.includes("충청남도")) return "충남";
  if (address.includes("전북") || address.includes("전북") || address.includes("전라북도")) return "전북";
  if (address.includes("전남") || address.includes("전남") || address.includes("전라남도")) return "전남";
  if (address.includes("경북") || address.includes("경북") || address.includes("경상북도")) return "경북";
  if (address.includes("경남") || address.includes("경남") || address.includes("경상남도")) return "경남";
  if (address.includes("제주")) return "제주";
  return "기타";
};

interface WishlistProps {
  onShowOnMap: (place: Place) => void;
}

const Wishlist: React.FC<WishlistProps> = ({ onShowOnMap }) => {
  const { wishlist, loading, deleteWishlistPlace, refresh } = usePlaces();
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isVisitFormOpen, setIsVisitFormOpen] = useState(false);

  const groupedWishlist = useMemo(() => {
    const groups: Record<string, Place[]> = {};
    wishlist.forEach((place) => {
      const region = getRegionFromAddress(place.address);
      if (!groups[region]) groups[region] = [];
      groups[region].push(place);
    });
    
    return Object.keys(groups)
      .sort()
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {} as Record<string, Place[]>);
  }, [wishlist]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('이 장소를 위시리스트에서 삭제할까요?')) {
      await deleteWishlistPlace(id);
    }
  };

  const handleVerifyVisit = (place: Place, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPlace(place);
    setIsVisitFormOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-400"></div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="flex flex-col h-full bg-white"
    >
      {/* Header Section */}
      <motion.div variants={item} className="px-6 py-6 pb-2">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">가고 싶은 곳 ⭐</h1>
        <p className="text-gray-500 text-sm">
          우리 함께 가기로 약속한 <span className="text-rose-500 font-bold">{wishlist.length}곳</span>의 장소들이에요.
        </p>
      </motion.div>

      {/* List Section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar pb-32">
        {wishlist.length === 0 ? (
          <motion.div variants={item} className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 mt-4">
            <Search className="mx-auto text-gray-200 mb-3" size={48} />
            <p className="text-gray-400 text-sm">아직 저장된 장소가 없어요.<br/>'장소 찾기'에서 가고 싶은 곳을 추가해보세요!</p>
          </motion.div>
        ) : (
          Object.entries(groupedWishlist).map(([region, places]) => (
            <motion.div variants={item} key={region} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1 h-3 bg-rose-400 rounded-full"></div>
                <h2 className="text-xs font-black text-gray-600 uppercase tracking-tight">
                  {region} ({places.length})
                </h2>
              </div>
              <div className="space-y-3">
                {places.map((place) => (
                  <div 
                    key={place.id}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 active:scale-[0.98] transition-transform"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0" onClick={() => onShowOnMap(place)}>
                        <h3 className="font-bold text-gray-800 text-sm truncate flex items-center gap-1">
                          <MapPin size={16} className="text-rose-400 shrink-0" />
                          {place.name}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1 truncate">{place.address}</p>
                      </div>
                      <button 
                        onClick={(e) => handleDelete(place.id, e)}
                        className="p-2 text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onShowOnMap(place)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-100 transition-colors"
                      >
                        <Navigation size={14} />
                        위치 보기
                      </button>
                      <button
                        onClick={(e) => handleVerifyVisit(place, e)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition-colors shadow-sm shadow-rose-100"
                      >
                        <CheckCircle size={14} />
                        방문 완료
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {isVisitFormOpen && selectedPlace && (
        <VisitForm
          placeId={selectedPlace.id}
          placeName={selectedPlace.name}
          placeAddress={selectedPlace.address}
          onClose={() => setIsVisitFormOpen(false)}
          onSuccess={() => {
            setIsVisitFormOpen(false);
            refresh();
          }}
        />
      )}
    </motion.div>
  );
};

export default Wishlist;