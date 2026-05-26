import { useState, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useSwipe } from "../../../hooks/useSwipe";
import { useTrips } from "../../../hooks/useTrips";
import {
  Plus,
  Calendar,
  ChevronRight,
  Trash2,
  Edit2,
  MapPin,
  Loader2,
  Plane,
  Tent,
  Map,
  Heart,
  Palmtree,
  Building,
} from "lucide-react";
import { Trip } from "../../../types";
import TripModal from "./TripModal";
import TripDetail from "./TripDetail";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { parseTripTitle, TRIP_ICONS } from "../../../utils/tripHelpers";

const ICON_COMPONENTS: Record<string, any> = {
  plane: Plane,
  tent: Tent,
  map: Map,
  heart: Heart,
  palmtree: Palmtree,
  building: Building,
};

// Wishlist와 동일한 컨테이너 설정
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

// 홈탭 섹션들과 동일한 아이템 설정 (y: 20 -> 0)
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

export default function TravelPlans() {
  const { trips, isTripsLoading, deleteTrip } = useTrips();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [activeFilter, setActiveFilter] = useState<
    "all" | "upcoming" | "ongoing" | "past"
  >("all");

  const filterOrder: Array<"all" | "upcoming" | "ongoing" | "past"> = [
    "all",
    "upcoming",
    "ongoing",
    "past",
  ];

  const handleSwipeLeft = useCallback(() => {
    const currentIndex = filterOrder.indexOf(activeFilter);
    if (currentIndex !== -1 && currentIndex < filterOrder.length - 1) {
      setActiveFilter(filterOrder[currentIndex + 1]);
    }
  }, [activeFilter]);

  const handleSwipeRight = useCallback(() => {
    const currentIndex = filterOrder.indexOf(activeFilter);
    if (currentIndex > 0) {
      setActiveFilter(filterOrder[currentIndex - 1]);
    }
  }, [activeFilter]);

  const swipeHandlers = useSwipe(handleSwipeLeft, handleSwipeRight);

  const selectedTripId = searchParams.get("tripId");
  const selectedTrip = useMemo(() => {
    return trips?.find((t) => t.id === selectedTripId) || null;
  }, [trips, selectedTripId]);

  const handleAddTrip = () => {
    setEditingTrip(null);
    setIsTripModalOpen(true);
  };

  const handleEditTrip = (e: React.MouseEvent, trip: Trip) => {
    e.stopPropagation();
    setEditingTrip(trip);
    setIsTripModalOpen(true);
  };

  const handleDeleteTrip = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("이 여행 계획을 삭제하시겠습니까?")) {
      await deleteTrip.mutateAsync(id);
    }
  };

  const handleSelectTrip = (trip: Trip) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tripId", trip.id);
    setSearchParams(newParams);
  };

  const handleBack = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("tripId");
    setSearchParams(newParams);
  };

  // D-Day 및 여행 상태 계산
  const getTripStatus = (startDateStr: string, endDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);

    if (today >= start && today <= end) {
      return {
        type: "ongoing",
        label: "진행 중",
        colorClass: "bg-emerald-50 text-emerald-600 border border-emerald-100",
      };
    } else if (today < start) {
      const diffTime = start.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        type: "upcoming",
        label: `D-${diffDays}`,
        colorClass: "bg-rose-50 text-rose-600 border border-rose-100",
      };
    } else {
      return {
        type: "past",
        label: "지난 여행",
        colorClass: "bg-gray-50 text-gray-500 border border-gray-150",
      };
    }
  };

  // 여행 기간 계산 (N박 M일)
  const getDurationText = (startDateStr: string, endDateStr: string) => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    if (days === 1) return "당일치기";
    return `${days - 1}박 ${days}일`;
  };

  // 필터별 개수 계산
  const counts = useMemo(() => {
    const res = { all: 0, upcoming: 0, ongoing: 0, past: 0 };
    if (!trips) return res;
    res.all = trips.length;
    trips.forEach((t) => {
      const status = getTripStatus(t.start_date, t.end_date).type;
      if (status === "ongoing") res.ongoing++;
      else if (status === "upcoming") res.upcoming++;
      else if (status === "past") res.past++;
    });
    return res;
  }, [trips]);

  // 필터링된 여행 목록
  const filteredTrips = useMemo(() => {
    if (!trips) return [];
    if (activeFilter === "all") return trips;
    return trips.filter((t) => {
      const status = getTripStatus(t.start_date, t.end_date).type;
      return status === activeFilter;
    });
  }, [trips, activeFilter]);

  if (selectedTrip) {
    return <TripDetail trip={selectedTrip} onBack={handleBack} />;
  }

  if (isTripsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-rose-400" size={32} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Filter Tabs Row */}
      {trips && trips.length > 0 && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="px-4 py-4 flex items-center justify-between gap-3 shrink-0"
        >
          <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            {[
              {
                id: "all",
                label: "전체",
                count: counts.all,
                activeClass: "bg-rose-500 text-white shadow-rose-100",
              },
              {
                id: "upcoming",
                label: "예정",
                count: counts.upcoming,
                activeClass: "bg-rose-500 text-white shadow-rose-100",
              },
              {
                id: "ongoing",
                label: "진행 중",
                count: counts.ongoing,
                activeClass: "bg-emerald-500 text-white shadow-emerald-100",
              },
              {
                id: "past",
                label: "지난 여행",
                count: counts.past,
                activeClass: "bg-gray-500 text-white shadow-gray-100",
              },
            ].map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`px-4 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                    isActive
                      ? tab.activeClass
                      : "bg-gray-50 text-gray-400 shadow-transparent"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-black/5 text-current opacity-60"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleAddTrip}
            className="w-9 h-9 bg-rose-500 hover:bg-rose-600 text-white rounded-xl flex items-center justify-center active:scale-95 transition-all shadow-sm shrink-0"
            title="새 계획"
          >
            <Plus size={16} strokeWidth={3} />
          </button>
        </motion.div>
      )}

      <div
        {...swipeHandlers}
        className="flex-1 overflow-y-auto p-4 pt-2 custom-scrollbar pb-32"
      >
        <AnimatePresence mode="wait">
          {!trips || trips.length === 0 ? (
            <motion.div
              key="empty-all"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="text-center py-20 bg-gray-50/30 rounded-[32px] border border-dashed border-gray-200 mt-4 p-8 flex flex-col items-center justify-center"
            >
              <div className="w-20 h-20 bg-rose-50 rounded-[28px] flex items-center justify-center text-rose-400 mb-4 animate-float">
                <Calendar size={36} strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-black text-gray-800 mb-1">
                아직 등록된 여행이 없어요
              </h3>
              <p className="text-gray-400 text-xs leading-relaxed max-w-[200px] mb-6">
                새롭고 설레는 우리 둘만의 여행 계획을 세워보세요!
              </p>
              <button
                onClick={handleAddTrip}
                className="px-5 py-3 bg-rose-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-rose-100 hover:bg-rose-600 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} strokeWidth={3} />첫 계획 세우기
              </button>
            </motion.div>
          ) : filteredTrips.length === 0 ? (
            <motion.div
              key={`empty-${activeFilter}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="text-center py-20 bg-gray-50/10 rounded-[32px] border border-dashed border-gray-200 p-8 flex flex-col items-center justify-center"
            >
              <div className="w-16 h-16 bg-gray-50 rounded-[24px] flex items-center justify-center text-gray-400 mb-4">
                <Calendar size={28} strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-black text-gray-800 mb-1">
                {activeFilter === "upcoming"
                  ? "예정된 여행 계획이 없어요"
                  : activeFilter === "ongoing"
                    ? "현재 진행 중인 여행이 없어요"
                    : "지난 여행 계획이 없어요"}
              </h3>
              <p className="text-gray-400 text-[11px]">
                필터를 변경하거나 새로운 계획을 추가해 보세요!
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={activeFilter}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-4"
            >
              {filteredTrips.map((trip) => {
                const { rawTitle, iconIndex } = parseTripTitle(trip.title);
                const status = getTripStatus(trip.start_date, trip.end_date);
                const duration = getDurationText(
                  trip.start_date,
                  trip.end_date,
                );
                const IconComponent =
                  ICON_COMPONENTS[TRIP_ICONS[iconIndex]?.id] || MapPin;

                const cardClasses = status.type === "ongoing"
                  ? "relative overflow-hidden bg-gradient-to-br from-emerald-50/20 via-white to-white p-5 rounded-[20px] border border-emerald-100/50 flex flex-col gap-4 cursor-pointer shadow-[0_2px_8px_rgba(16,185,129,0.03)] hover:shadow-[0_4px_12px_rgba(16,185,129,0.06)] transition-all duration-200"
                  : status.type === "past"
                    ? "relative overflow-hidden bg-gray-50/40 p-5 rounded-[20px] border border-gray-200/50 flex flex-col gap-4 cursor-pointer shadow-none hover:bg-gray-50/80 transition-all duration-200"
                    : "relative overflow-hidden bg-white p-5 rounded-[20px] border border-gray-100 flex flex-col gap-4 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition-all duration-200";

                const iconBgClass = status.type === "ongoing"
                  ? "bg-emerald-50 text-emerald-500"
                  : status.type === "past"
                    ? "bg-gray-100 text-gray-400"
                    : "bg-rose-50 text-rose-500";

                const titleColorClass = status.type === "past"
                  ? "font-bold text-gray-500 text-sm truncate"
                  : "font-black text-gray-800 text-sm truncate";

                return (
                  <motion.div
                    key={trip.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectTrip(trip)}
                    className={cardClasses}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Minimalist Icon Badge */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBgClass}`}>
                          <IconComponent size={20} strokeWidth={2} />
                        </div>

                        <div className="min-w-0">
                          {/* Status + Duration Badges */}
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span
                              className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${status.colorClass}`}
                            >
                              {status.label}
                            </span>
                            <span className="text-[9px] font-black text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
                              {duration}
                            </span>
                          </div>

                          <h3 className={titleColorClass}>
                            {rawTitle}
                          </h3>
                        </div>
                      </div>

                      {/* Actions in card */}
                      <div className="flex gap-1 shrink-0 bg-gray-50/80 p-1 rounded-xl border border-gray-100/50">
                        <button
                          type="button"
                          onClick={(e) => handleEditTrip(e, trip)}
                          className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-white rounded-lg transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteTrip(e, trip.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-white rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Dates and Detail Button */}
                    <div className="flex items-center justify-between pt-3.5 border-t border-gray-50 mt-1">
                      <div className="flex items-center gap-1.5 text-gray-400">
                        <Calendar size={12} className="text-gray-300" />
                        <span className="text-[10px] font-bold">
                          {trip.start_date.replace(/-/g, ".")} ~{" "}
                          {trip.end_date.replace(/-/g, ".")}
                        </span>
                      </div>

                      {status.type === "ongoing" ? (
                        <div className="flex items-center text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                          일정 보기{" "}
                          <ChevronRight
                            size={10}
                            strokeWidth={3}
                            className="ml-0.5"
                          />
                        </div>
                      ) : status.type === "past" ? (
                        <div className="flex items-center text-[10px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
                          기록 보기{" "}
                          <ChevronRight
                            size={10}
                            strokeWidth={3}
                            className="ml-0.5"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center text-[10px] font-black text-rose-500 bg-rose-50/50 px-2.5 py-1 rounded-lg">
                          일정 보기{" "}
                          <ChevronRight
                            size={10}
                            strokeWidth={3}
                            className="ml-0.5"
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <TripModal
        trip={editingTrip}
        onClose={() => setIsTripModalOpen(false)}
        isOpen={isTripModalOpen}
      />
    </div>
  );
}
