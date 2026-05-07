import { useState, useMemo } from "react";
import { useTripPlans } from "../../../hooks/useTrips";
import { Trip, TripPlan } from "../../../types";
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
  Navigation,
  Loader2,
} from "lucide-react";
import PlanItemModal from "./PlanItemModal";
import TripMapModal from "./TripMapModal";
import { motion, AnimatePresence, Variants } from "framer-motion";

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
  restaurant: "식당",
  transport: "이동",
  cafe: "카페",
  accommodation: "숙소",
  activity: "체험",
  etc: "기타",
};

const CATEGORY_COLORS: Record<string, string> = {
  restaurant: "text-orange-500 bg-orange-50",
  transport: "text-blue-500 bg-blue-50",
  cafe: "text-amber-500 bg-amber-50",
  accommodation: "text-indigo-500 bg-indigo-50",
  activity: "text-rose-500 bg-rose-50",
  etc: "text-gray-500 bg-gray-50",
};

// Wishlist와 완전히 동일한 애니메이션 설정 적용
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
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }, [trip.start_date, trip.end_date]);

  const plansByDay = useMemo(() => {
    const grouped: Record<number, TripPlan[]> = {};
    for (let i = 1; i <= daysCount; i++) {
      const dayPlans = plans?.filter((p) => p.day_number === i) || [];
      grouped[i] = [...dayPlans].sort((a, b) => {
        const timeA = a.start_time || "99:99";
        const timeB = b.start_time || "99:99";
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
    if (!isDragging) {
      setEditingPlan(plan);
      setIsPlanModalOpen(true);
    }
  };

  const handleDeletePlan = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("계획을 삭제하시겠습니까?")) {
      await deletePlan.mutateAsync(id);
    }
  };

  const handleOpenNavigation = (e: React.MouseEvent, plan: TripPlan) => {
    e.stopPropagation();
    if (!plan.place_name) return;
    const query = encodeURIComponent(plan.place_name);
    window.open(`https://map.naver.com/v5/search/${query}`, "_blank");
  };

  const handleDragEnd = (_: any, info: any) => {
    const swipeThreshold = 50;
    if (info.offset.x < -swipeThreshold && activeDay < daysCount) {
      setActiveDay((prev) => prev + 1);
    } else if (info.offset.x > swipeThreshold && activeDay > 1) {
      setActiveDay((prev) => prev - 1);
    }
    setTimeout(() => setIsDragging(false), 50);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col h-full bg-white overflow-hidden relative"
    >
      {/* Header Section */}
      <motion.div
        variants={itemVariants}
        className="bg-white shrink-0 z-20 px-6 py-6 pb-2"
      >
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-800 truncate">
              {trip.title}
            </h2>
            <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mt-0.5">
              {trip.start_date} ~ {trip.end_date}
            </p>
          </div>
        </div>

        {/* Day Selector */}
        <div className="flex overflow-x-auto no-scrollbar pb-1 gap-2">
          {Array.from({ length: daysCount }).map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setActiveDay(i + 1)}
              className={`shrink-0 px-5 py-2 rounded-2xl text-xs font-black transition-all ${
                activeDay === i + 1
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-100"
                  : "bg-gray-50 text-gray-400 hover:bg-gray-100"
              }`}
            >
              Day {i + 1}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Plans List Area */}
      <div className="flex-1 overflow-hidden relative">
        <motion.div
          key={activeDay}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          className="h-full overflow-y-auto p-4 pb-32 space-y-4 custom-scrollbar touch-pan-y"
        >
          {isPlansLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin text-rose-400" size={32} />
            </div>
          ) : (plansByDay[activeDay] || []).length === 0 ? (
            <motion.div
              variants={itemVariants}
              className="flex flex-col items-center justify-center py-20 text-center bg-gray-50/30 rounded-3xl border border-dashed border-gray-200"
            >
              <Calendar className="text-gray-200 mb-3" size={48} />
              <h3 className="text-sm font-bold text-gray-800 mb-1">
                계획이 비어있어요
              </h3>
              <p className="text-[10px] text-gray-400 font-medium">
                이 날의 멋진 계획을 세워보세요!
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {/* 리스트 아이템들 */}
              <motion.div className="space-y-4" variants={itemVariants}>
                {(plansByDay[activeDay] || []).map((plan) => {
                  const Icon = CATEGORY_ICONS[plan.category] || MoreHorizontal;
                  const isUndecided =
                    !plan.place_name || plan.place_name === "미정";

                  return (
                    <div
                      key={plan.id}
                      onClick={() => handleEditPlan(plan)}
                      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group cursor-pointer active:scale-[0.98] transition-transform select-none"
                    >
                      <div className="flex">
                        <div className="w-16 shrink-0 flex flex-col items-center justify-center border-r border-gray-50 py-4 gap-2">
                          <div
                            className={`p-2 rounded-xl ${CATEGORY_COLORS[plan.category]}`}
                          >
                            <Icon size={18} />
                          </div>
                          <div className="text-center">
                            <span className="block text-[10px] font-black text-gray-700">
                              {plan.start_time?.slice(0, 5) || "--:--"}
                            </span>
                            <span className="block text-[8px] font-bold text-gray-300">
                              ~
                            </span>
                            <span className="block text-[10px] font-black text-gray-400">
                              {plan.end_time?.slice(0, 5) || "--:--"}
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 p-4 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <span
                              className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${CATEGORY_COLORS[plan.category]}`}
                            >
                              {CATEGORY_LABELS[plan.category]}
                            </span>
                          </div>
                          <h3
                            className={`font-black text-sm mb-1 truncate ${isUndecided ? "text-gray-300" : "text-gray-800"}`}
                          >
                            {plan.place_name || "미정"}
                          </h3>
                          {plan.address && (
                            <div className="flex items-center gap-1 text-gray-400 mb-2">
                              <MapPin size={10} />
                              <p className="text-[10px] font-medium truncate">
                                {plan.address}
                              </p>
                            </div>
                          )}
                          {plan.memo && (
                            <div className="p-2.5 bg-gray-50 rounded-xl">
                              <p className="text-[11px] font-bold text-gray-500 line-clamp-2">
                                {plan.memo}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="absolute top-2 right-2 flex items-center gap-1">
                        {!isUndecided && (
                          <button
                            onClick={(e) => handleOpenNavigation(e, plan)}
                            className="p-2 bg-white/80 backdrop-blur-sm shadow-sm border border-gray-100 text-gray-400 hover:text-rose-500 transition-all active:scale-90 rounded-xl"
                          >
                            <Navigation
                              size={14}
                              fill="currentColor"
                              fillOpacity={0.1}
                            />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeletePlan(e, plan.id)}
                          className="p-2 bg-white/80 backdrop-blur-sm shadow-sm border border-gray-100 text-gray-400 rounded-xl hover:text-rose-500 transition-all active:scale-90"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Floating Buttons */}
      <motion.div
        variants={itemVariants}
        className="absolute bottom-28 right-6 flex items-center gap-3 z-30"
      >
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
      </motion.div>

      <PlanItemModal
        isOpen={isPlanModalOpen}
        tripId={trip.id}
        dayNumber={activeDay}
        daysCount={daysCount}
        dayPlans={plansByDay[activeDay] || []}
        plan={editingPlan}
        onClose={() => setIsPlanModalOpen(false)}
      />

      <TripMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        plans={plans || []}
        daysCount={daysCount}
        activeDay={activeDay}
        setActiveDay={setActiveDay}
      />
    </motion.div>
  );
}
