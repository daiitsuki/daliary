import { useState, useMemo } from 'react';
import { useTripPlans } from '../../hooks/useTrips';
import { Trip, TripPlan } from '../../types';
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  MapPin, 
  MoreVertical, 
  Calendar,
  Utensils,
  Car,
  Coffee,
  Bed,
  MoreHorizontal
} from 'lucide-react';
import PlanItemModal from './PlanItemModal';
import { motion } from 'framer-motion';

interface TripDetailProps {
  trip: Trip;
  onBack: () => void;
}

const CATEGORY_ICONS: Record<string, any> = {
  restaurant: Utensils,
  transport: Car,
  cafe: Coffee,
  accommodation: Bed,
  etc: MoreHorizontal,
};

const CATEGORY_LABELS: Record<string, string> = {
  restaurant: '식당',
  transport: '이동',
  cafe: '카페',
  accommodation: '숙소',
  etc: '기타',
};

const CATEGORY_COLORS: Record<string, string> = {
  restaurant: 'text-orange-500 bg-orange-50',
  transport: 'text-blue-500 bg-blue-50',
  cafe: 'text-amber-500 bg-amber-50',
  accommodation: 'text-indigo-500 bg-indigo-50',
  etc: 'text-gray-500 bg-gray-50',
};

export default function TripDetail({ trip, onBack }: TripDetailProps) {
  const { plans, isPlansLoading, deletePlan } = useTripPlans(trip.id);
  const [activeDay, setActiveDay] = useState(1);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TripPlan | null>(null);

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
      // Sort by start_time. If no start_time, put it at the end ('99:99').
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
    setEditingPlan(plan);
    setIsPlanModalOpen(true);
  };

  const handleDeletePlan = async (id: string) => {
    if (confirm('계획을 삭제하시겠습니까?')) {
      await deletePlan.mutateAsync(id);
    }
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

      {/* Plans List */}
      <div className="flex-1 overflow-y-auto p-4 pb-32 space-y-6 relative bg-gray-50/30 custom-scrollbar">
        {isPlansLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-rose-100 border-t-rose-500 mb-4"></div>
          </div>
        ) : plansByDay[activeDay]?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-4 border border-gray-100">
              <Calendar className="text-gray-200" size={32} />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">계획이 비어있어요</h3>
            <p className="text-[10px] text-gray-400 font-medium">이 날의 멋진 계획을 세워보세요!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {plansByDay[activeDay].map((plan) => {
              const Icon = CATEGORY_ICONS[plan.category] || MoreHorizontal;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={plan.id}
                  className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative group"
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
                        const isUndecided = !plan.place_name || plan.place_name === '미정';
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

                  {/* Actions */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => handleEditPlan(plan)}
                      className="p-1.5 bg-white shadow-sm border border-gray-100 text-gray-400 rounded-lg hover:text-blue-500 transition-all"
                    >
                      <MoreVertical size={14} />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-1.5 bg-white shadow-sm border border-gray-100 text-gray-400 rounded-lg hover:text-rose-500 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="absolute bottom-28 right-6">
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
    </div>
  );
}
