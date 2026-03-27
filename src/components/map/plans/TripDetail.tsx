import { useState, useMemo } from 'react';
import { useTripPlans } from '../../../hooks/useTrips';
import { Trip, TripPlan } from '../../../types';
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  MapPin, 
  Calendar,
  Utensils,
  Car,
  Coffee,
  Bed,
  MoreHorizontal,
  Camera,
  Map as MapIcon,
  Navigation
} from 'lucide-react';
import PlanItemModal from './PlanItemModal';
import TripMapModal from './TripMapModal';
import { motion, AnimatePresence } from 'framer-motion';

interface TripDetailProps {
  trip: Trip;
  onBack: () => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  restaurant: Utensils,
  transport: Car,
  cafe: Coffee,
  accommodation: Bed,
  activity: Camera,
  etc: MoreHorizontal,
};

const CATEGORY_LABELS: Record<string, string> = {
  restaurant: '식당',
  transport: '이동',
  cafe: '카페',
  accommodation: '숙소',
  activity: '체험',
  etc: '기타',
};

const CATEGORY_COLORS: Record<string, string> = {
  restaurant: 'text-orange-500 bg-orange-50',
  transport: 'text-blue-500 bg-blue-50',
  cafe: 'text-amber-500 bg-amber-50',
  accommodation: 'text-indigo-500 bg-indigo-50',
  activity: 'text-rose-500 bg-rose-50',
  etc: 'text-gray-500 bg-gray-50',
};

export default function TripDetail({ trip, onBack }: TripDetailProps) {
  const { plans, isPlansLoading, deletePlan } = useTripPlans(trip.id);
  const [activeDay, setActiveDay] = useState(1);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TripPlan | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const daysCount = useMemo(() => {
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  }, [trip.start_date, trip.end_date]);

  const plansByDay = useMemo(() => {
    const grouped: Record<number, TripPlan[]> = {};
    for (let i = 1; i <= daysCount; i++) {
      const dayPlans = plans?.filter((p) => p.day_number === i) || [];
      grouped[i] = [...dayPlans].sort((a, b) => {
        const timeA = a.start_time || '99:99';
        const timeB = b.start_time || '99:99';
        if (timeA !== timeB) return timeA.localeCompare(timeB);
        return (a.order_index || 0) - (b.order_index || 0);
      });
    }
    return grouped;
  }, [plans, daysCount]);

  const handleAddPlan = () => {
    setEditingPlan(null);
    setIsPlanModalOpen(true);
  };

  const handleEditPlan = (plan: TripPlan) => {
    // 드래그 중이 아닐 때만 수정 모달 오픈
    if (!isDragging) {
      setEditingPlan(plan);
      setIsPlanModalOpen(true);
    }
  };

  const handleDeletePlan = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    if (confirm('계획을 삭제하시겠습니까?')) {
      await deletePlan.mutateAsync(id);
    }
  };

  const handleOpenNavigation = (e: React.MouseEvent, plan: TripPlan) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    if (!plan.place_name) return;
    
    // 네이버 지도 길찾기 URL (현재위치 -> 장소명)
    const query = encodeURIComponent(plan.place_name);
    window.open(`https://map.naver.com/v5/search/${query}`, '_blank');
  };

  // 스와이프 전환 핸들러
  const handleDragEnd = (event: any, info: any) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold && activeDay < daysCount) {
      setActiveDay(prev => prev + 1);
    } else if (info.offset.x > swipeThreshold && activeDay > 1) {
      setActiveDay(prev => prev - 1);
    }
    // 드래그 종료 후 약간의 지연을 주어 클릭 이벤트 오작동 방지
    setTimeout(() => setIsDragging(false), 50);
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shrink-0 z-20">
        <div className="p-4 flex items-center gap-3">
          <button onClick={onBack} className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-all">
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-gray-800 truncate">{trip.title}</h2>
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">
              {trip.start_date} ~ {trip.end_date}
            </p>
          </div>
        </div>

        {/* Day Selector */}
        <div className="flex overflow-x-auto no-scrollbar px-4 pb-3 gap-2">
          {Array.from({ length: daysCount }).map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setActiveDay(i + 1)}
              className={`shrink-0 px-5 py-2 rounded-2xl text-xs font-black transition-all ${
                activeDay === i + 1 
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' 
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              Day {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Plans List Area with Swipe Support */}
      <div className="flex-1 overflow-hidden bg-gray-50/30 relative">
        <motion.div
          key={activeDay}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          className="h-full overflow-y-auto p-4 pb-32 space-y-6 custom-scrollbar touch-pan-y"
        >
          {isPlansLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-rose-100 border-t-rose-500 mb-4"></div>
            </div>
          ) : (plansByDay[activeDay] || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-4 border border-gray-100">
                <Calendar className="text-gray-200" size={32} />
              </div>
              <h3 className="text-sm font-bold text-gray-800 mb-1">계획이 비어있어요</h3>
              <p className="text-[10px] text-gray-400 font-medium">이 날의 멋진 계획을 세워보세요!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(plansByDay[activeDay] || []).map((plan) => {
                const Icon = CATEGORY_ICONS[plan.category] || MoreHorizontal;
                const isUndecided = !plan.place_name || plan.place_name === '미정';
                
                return (
                  <motion.div
                    key={plan.id}
                    layoutId={plan.id}
                    onClick={() => handleEditPlan(plan)}
                    className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative group cursor-pointer active:scale-[0.98] transition-all select-none"
                  >
                    <div className="flex">
                      {/* Time & Icon */}
                      <div className="w-16 shrink-0 flex flex-col items-center justify-center border-r border-gray-50 py-4 gap-2">
                        <div className={`p-2 rounded-xl ${CATEGORY_COLORS[plan.category]}`}>
                          <Icon size={18} />
                        </div>
                        <div className="text-center">
                          <span className="block text-[10px] font-black text-gray-700">{plan.start_time?.slice(0, 5) || '--:--'}</span>
                          <span className="block text-[8px] font-bold text-gray-300">~</span>
                          <span className="block text-[10px] font-black text-gray-400">{plan.end_time?.slice(0, 5) || '--:--'}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-4 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${CATEGORY_COLORS[plan.category]}`}>
                            {CATEGORY_LABELS[plan.category]}
                          </span>
                        </div>
                        {(() => {
                          return (
                            <h3 className={`font-black text-sm mb-1 truncate ${isUndecided ? 'text-gray-300' : 'text-gray-800'}`}>
                              {plan.place_name || '미정'}
                            </h3>
                          );
                        })()}
                        {plan.address && (
                          <div className="flex items-center gap-1 text-gray-400 mb-2">
                            <MapPin size={10} />
                            <p className="text-[10px] font-medium truncate">{plan.address}</p>
                          </div>
                        )}
                        {plan.memo && (
                          <div className="p-2.5 bg-gray-50 rounded-xl">
                            <p className="text-[11px] font-bold text-gray-500 line-clamp-2">{plan.memo}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions: Navigation & Delete */}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      {!isUndecided && (
                        <button
                          onClick={(e) => handleOpenNavigation(e, plan)}
                          className="p-2 bg-white/80 backdrop-blur-sm shadow-sm border border-gray-100 text-gray-400 hover:text-rose-500 transition-all active:scale-90 rounded-xl"
                          title="길찾기"
                        >
                          <Navigation size={14} fill="currentColor" fillOpacity={0.1} />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDeletePlan(e, plan.id)}
                        className="p-2 bg-white/80 backdrop-blur-sm shadow-sm border border-gray-100 text-gray-400 rounded-xl hover:text-rose-500 transition-all active:scale-90"
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute bottom-28 right-6 flex items-center gap-3 z-30">
        <button
          onClick={() => setIsMapModalOpen(true)}
          className="w-14 h-14 bg-white text-rose-500 rounded-2xl shadow-xl border border-rose-100 flex items-center justify-center active:scale-95 transition-all hover:bg-rose-50"
        >
          <MapIcon size={28} />
        </button>
        <button
          onClick={handleAddPlan}
          className="w-14 h-14 bg-rose-500 text-white rounded-2xl shadow-2xl shadow-rose-200 flex items-center justify-center active:scale-95 transition-all hover:bg-rose-600"
        >
          <Plus size={28} strokeWidth={3} />
        </button>
      </div>

      <PlanItemModal
        isOpen={isPlanModalOpen}
        tripId={trip.id}
        dayNumber={activeDay}
        plan={editingPlan}
        onClose={() => setIsPlanModalOpen(false)}
      />

      <TripMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        plans={plans || []} // Pass all plans for day switching in map
        daysCount={daysCount}
        activeDay={activeDay}
        setActiveDay={setActiveDay}
      />
    </div>
  );
}
