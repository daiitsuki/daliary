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
  CheckCircle,
  Share2,
} from "lucide-react";
import PlanItemModal from "./PlanItemModal";
import TripMapModal from "./TripMapModal";
import VisitForm from "../shared/VisitForm";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { parseTripTitle } from "../../../utils/tripHelpers";
import { shareContent, ShareTemplates } from "../../../utils/shareUtils";
import { useConfirm } from "../../../context/ConfirmContext";
import { useToast } from "../../../context/ToastContext";

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

// 홈탭 및 여행 계획과 통일된 애니메이션 설정 적용
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

export default function TripDetail({ trip, onBack }: TripDetailProps) {
  const { plans, isPlansLoading, deletePlan } = useTripPlans(trip.id);
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const { rawTitle } = useMemo(() => parseTripTitle(trip.title), [trip.title]);
  const [activeDay, setActiveDay] = useState(1);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TripPlan | null>(null);
  const [isVisitFormOpen, setIsVisitFormOpen] = useState(false);
  const [selectedPlanForCert, setSelectedPlanForCert] =
    useState<TripPlan | null>(null);
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
    const isConfirmed = await confirm({
      title: "스케줄 삭제",
      message: "이 스케줄을 삭제할까요?",
      confirmText: "삭제",
      isDanger: true,
    });
    if (isConfirmed) {
      await deletePlan.mutateAsync(id);
    }
  };

  const handleOpenNavigation = (e: React.MouseEvent, plan: TripPlan) => {
    e.stopPropagation();
    if (!plan.place_name) return;
    const query = encodeURIComponent(plan.place_name);
    window.open(`https://map.naver.com/v5/search/${query}`, "_blank");
  };

  const handleOpenVisitForm = (e: React.MouseEvent, plan: TripPlan) => {
    e.stopPropagation();
    setSelectedPlanForCert(plan);
    setIsVisitFormOpen(true);
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

  const handleShareTrip = async () => {
    const template = ShareTemplates.trip(rawTitle, trip.id);
    const result = await shareContent(template.title, template.text, template.url);
    if (result === 'copied') {
      showToast("클립보드에 복사되었어요. 메신저에 붙여넣기 해주세요!", "success");
    } else if (result === 'failed') {
      showToast("링크 복사에 실패했어요.", "error");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden relative">
      {/* Header Section */}
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="bg-white shrink-0 z-20 px-4 pt-4 pb-2"
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
              {rawTitle}
            </h2>
            <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mt-0.5">
              {trip.start_date} ~ {trip.end_date}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleShareTrip}
              className="w-9 h-9 bg-gray-50 hover:bg-rose-50 text-gray-500 hover:text-rose-500 rounded-xl flex items-center justify-center active:scale-95 transition-all border border-gray-100"
              title="여행 계획 공유"
            >
              <Share2 size={16} />
            </button>
            <button
              onClick={() => setIsMapModalOpen(true)}
              className="w-9 h-9 bg-gray-50 hover:bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center active:scale-95 transition-all border border-gray-100"
              title="지도 보기"
            >
              <MapIcon size={16} />
            </button>
            <button
              onClick={handleAddPlan}
              className="w-9 h-9 bg-rose-500 hover:bg-rose-600 text-white rounded-xl flex items-center justify-center active:scale-95 transition-all shadow-sm"
              title="계획 추가"
            >
              <Plus size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Day Selector */}
        <div className="flex overflow-x-auto no-scrollbar gap-2">
          {Array.from({ length: daysCount }).map((_, i) => (
            <button
              key={i + 1}
              onClick={() => setActiveDay(i + 1)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                activeDay === i + 1
                  ? "bg-rose-500 text-white shadow-rose-100"
                  : "bg-gray-50 text-gray-400/80 shadow-transparent hover:bg-gray-100/80"
              }`}
            >
              Day {i + 1}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Plans List Area */}
      <div className="flex-1 overflow-hidden relative">
        {isPlansLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-rose-400" size={32} />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDay}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
              className="h-full overflow-y-auto p-4 pb-32 space-y-4 custom-scrollbar touch-pan-y"
            >
              {(plansByDay[activeDay] || []).length === 0 ? (
                <motion.div
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
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
                  <div className="space-y-4">
                    {(plansByDay[activeDay] || []).map((plan) => {
                      const Icon =
                        CATEGORY_ICONS[plan.category] || MoreHorizontal;
                      const isUndecided =
                        !plan.place_name || plan.place_name === "미정";

                      return (
                        <motion.div
                          key={plan.id}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleEditPlan(plan)}
                          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group cursor-pointer select-none"
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

                          <div className="absolute top-2 right-2 flex gap-1 bg-gray-50/80 p-1 rounded-xl border border-gray-100/50">
                            {!isUndecided && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenVisitForm(e, plan)}
                                  className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-white rounded-lg transition-all"
                                  title="방문 인증하기"
                                >
                                  <CheckCircle size={14} strokeWidth={2.5} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenNavigation(e, plan)}
                                  className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-white rounded-lg transition-all"
                                  title="네이버 지도로 이동"
                                >
                                  <Navigation
                                    size={14}
                                    fill="currentColor"
                                    fillOpacity={0.1}
                                  />
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={(e) => handleDeletePlan(e, plan.id)}
                              className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-white rounded-lg transition-all"
                              title="삭제"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

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

      <VisitForm
        isOpen={isVisitFormOpen}
        placeName={selectedPlanForCert?.place_name || ""}
        placeAddress={selectedPlanForCert?.address || ""}
        kakaoPlace={selectedPlanForCert ? {
          id: `plan_${selectedPlanForCert.id}`,
          place_name: selectedPlanForCert.place_name || "",
          address_name: selectedPlanForCert.address || "",
          road_address_name: selectedPlanForCert.address || "",
          x: String(selectedPlanForCert.lng || 0),
          y: String(selectedPlanForCert.lat || 0),
          category_group_name: selectedPlanForCert.category || "",
          category_name: selectedPlanForCert.category || "",
          category_group_code: "",
          phone: "",
          place_url: "",
          distance: "",
        } : undefined}
        initialDate={(() => {
          if (!selectedPlanForCert) return undefined;
          const start = new Date(trip.start_date);
          const dateObj = new Date(start);
          dateObj.setDate(start.getDate() + (activeDay - 1));
          return dateObj.toISOString().split("T")[0];
        })()}
        onClose={() => {
          setIsVisitFormOpen(false);
          setSelectedPlanForCert(null);
        }}
        onSuccess={() => {
          setIsVisitFormOpen(false);
          setSelectedPlanForCert(null);
        }}
      />
    </div>
  );
}
