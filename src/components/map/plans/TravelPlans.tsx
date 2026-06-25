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
  Share2,
} from "lucide-react";
import { Trip } from "../../../types";
import TripModal from "./TripModal";
import TripDetail from "./TripDetail";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { parseTripTitle, TRIP_ICONS } from "../../../utils/tripHelpers";
import { useConfirm } from "../../../context/ConfirmContext";
import { ShareTemplates } from "../../../utils/shareUtils";
import { useToast } from "../../../context/ToastContext";

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
  const { confirm } = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const { showToast } = useToast();
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
    const isConfirmed = await confirm({
      title: "여행 계획 삭제",
      message:
        "이 여행 계획을 삭제할까요?\n여행 계획 내의 스케줄도 함께 삭제됩니다.",
      confirmText: "삭제",
      isDanger: true,
    });
    if (isConfirmed) {
      await deleteTrip.mutateAsync(id);
    }
  };

  const handleSelectTrip = (trip: Trip) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tripId", trip.id);
    setSearchParams(newParams);
  };

  const handleShareBoardingPass = async (e: React.MouseEvent, trip: Trip) => {
    e.stopPropagation();
    if (isSharing) return;
    setIsSharing(true);
    showToast("보딩 패스를 발권하는 중입니다...", "info");

    try {
      const { rawTitle } = parseTripTitle(trip.title);
      const start = new Date(trip.start_date);
      const end = new Date(trip.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      const width = 1000;
      const height = 480;
      canvas.width = width;
      canvas.height = height;

      // 1. Background
      ctx.fillStyle = "#f3f4f6";
      ctx.fillRect(0, 0, width, height);

      // 2. Ticket Shape
      const ticketX = 40;
      const ticketY = 40;
      const ticketW = width - 80;
      const ticketH = height - 80;
      const r = 24;
      const cutoutY = ticketH / 2 + ticketY;

      ctx.shadowColor = "rgba(0,0,0,0.15)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 10;

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(ticketX + r, ticketY);
      ctx.lineTo(ticketX + ticketW - r, ticketY);
      ctx.arcTo(ticketX + ticketW, ticketY, ticketX + ticketW, ticketY + r, r);
      ctx.lineTo(ticketX + ticketW, cutoutY - 20);
      ctx.arc(ticketX + ticketW, cutoutY, 20, -Math.PI / 2, Math.PI / 2, true);
      ctx.lineTo(ticketX + ticketW, ticketY + ticketH - r);
      ctx.arcTo(
        ticketX + ticketW,
        ticketY + ticketH,
        ticketX + ticketW - r,
        ticketY + ticketH,
        r,
      );
      ctx.lineTo(ticketX + r, ticketY + ticketH);
      ctx.arcTo(ticketX, ticketY + ticketH, ticketX, ticketY + ticketH - r, r);
      ctx.lineTo(ticketX, cutoutY + 20);
      ctx.arc(ticketX, cutoutY, 20, Math.PI / 2, -Math.PI / 2, true);
      ctx.lineTo(ticketX, ticketY + r);
      ctx.arcTo(ticketX, ticketY, ticketX + r, ticketY, r);
      ctx.fill();

      ctx.shadowColor = "transparent";

      // 3. Header
      ctx.fillStyle = "#f43f5e";
      ctx.beginPath();
      ctx.moveTo(ticketX + r, ticketY);
      ctx.lineTo(ticketX + ticketW - r, ticketY);
      ctx.arcTo(ticketX + ticketW, ticketY, ticketX + ticketW, ticketY + r, r);
      ctx.lineTo(ticketX + ticketW, ticketY + 80);
      ctx.lineTo(ticketX, ticketY + 80);
      ctx.lineTo(ticketX, ticketY + r);
      ctx.arcTo(ticketX, ticketY, ticketX + r, ticketY, r);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "900 28px Pretendard, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("BOARDING PASS", ticketX + 40, ticketY + 40);
      ctx.textAlign = "right";
      ctx.fillText("DALIARY AIRLINES", ticketX + ticketW - 40, ticketY + 40);

      // 4. Perforated Line
      ctx.beginPath();
      ctx.setLineDash([12, 12]);
      ctx.moveTo(ticketX + ticketW - 280, ticketY + 80);
      ctx.lineTo(ticketX + ticketW - 280, ticketY + ticketH);
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.setLineDash([]);

      // 5. Content
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";

      ctx.fillStyle = "#111827";
      let titleFont = 64;
      ctx.font = `900 ${titleFont}px Pretendard, sans-serif`;
      const maxTitleWidth = ticketW - 360;
      while (
        ctx.measureText(rawTitle).width > maxTitleWidth &&
        titleFont > 30
      ) {
        titleFont -= 2;
        ctx.font = `900 ${titleFont}px Pretendard, sans-serif`;
      }
      ctx.fillText(rawTitle, ticketX + 40, ticketY + 180);

      ctx.fillStyle = "#9ca3af";
      ctx.font = "bold 18px Pretendard, sans-serif";
      ctx.fillText("DEPARTURE", ticketX + 40, ticketY + 260);
      ctx.fillText("RETURN", ticketX + 280, ticketY + 260);
      ctx.fillText("DURATION", ticketX + 500, ticketY + 260);

      ctx.fillStyle = "#111827";
      ctx.font = "900 32px Pretendard, sans-serif";
      ctx.fillText(trip.start_date, ticketX + 40, ticketY + 300);
      ctx.fillText(trip.end_date, ticketX + 280, ticketY + 300);

      ctx.fillStyle = "#f43f5e";
      ctx.fillText(`${daysCount} Days`, ticketX + 500, ticketY + 300);

      ctx.fillStyle = "#111827";
      ctx.font = "28px sans-serif";
      ctx.fillText("✈️", ticketX + 225, ticketY + 300);

      ctx.fillStyle = "#9ca3af";
      ctx.font = "bold 16px Pretendard, sans-serif";
      ctx.fillText("PASSENGER", ticketX + 40, ticketY + 360);
      ctx.fillText("FLIGHT", ticketX + 280, ticketY + 360);

      ctx.fillStyle = "#111827";
      ctx.font = "bold 24px Pretendard, sans-serif";
      ctx.fillText("V.I.P COUPLE", ticketX + 40, ticketY + 385);
      ctx.fillText(
        `DA-${Math.floor(Math.random() * 9000) + 1000}`,
        ticketX + 280,
        ticketY + 385,
      );

      // 6. Stub
      const stubX = ticketX + ticketW - 240;

      ctx.fillStyle = "#111827";
      ctx.font = "900 28px Pretendard, sans-serif";
      let stubTitle = rawTitle;
      if (ctx.measureText(stubTitle).width > 200) {
        stubTitle = stubTitle.substring(0, 8) + "...";
      }
      ctx.fillText(stubTitle, stubX, ticketY + 140);

      ctx.fillStyle = "#9ca3af";
      ctx.font = "bold 14px Pretendard, sans-serif";
      ctx.fillText("DEPARTURE", stubX, ticketY + 190);
      ctx.fillStyle = "#111827";
      ctx.font = "bold 20px Pretendard, sans-serif";
      ctx.fillText(trip.start_date, stubX, ticketY + 215);

      ctx.fillStyle = "#111827";
      let bx = stubX;
      for (let i = 0; i < 20; i++) {
        const bw = Math.random() * 6 + 2;
        if (bx + bw > ticketX + ticketW - 40) break;
        ctx.fillRect(bx, ticketY + 280, bw, 80);
        bx += bw + (Math.random() * 4 + 2);
      }

      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error("Blob failed");
        const file = new File([blob], "boarding_pass.png", {
          type: "image/png",
        });
        const template = ShareTemplates.trip(rawTitle, trip.id);

        if (
          navigator.share &&
          navigator.canShare &&
          navigator.canShare({ files: [file] })
        ) {
          try {
            await navigator.share({
              title: template.title,
              text: `✈️ 우리의 새로운 여행!\n\n[${rawTitle}]\n${trip.start_date} ~ ${trip.end_date}`,
              files: [file],
            });
            showToast("보딩 패스가 발권 및 공유되었습니다.", "success");
          } catch (e) {
            console.error(e);
          }
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `boarding_pass_${rawTitle}.png`;
          a.click();
          URL.revokeObjectURL(url);
          showToast("기기에 보딩 패스가 저장되었습니다.", "success");
        }
        setIsSharing(false);
      }, "image/png");
    } catch (err) {
      console.error(err);
      showToast("보딩 패스 생성에 실패했습니다.", "error");
      setIsSharing(false);
    }
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
          className="px-4 py-4 pt-2 flex items-center justify-between gap-3 shrink-0"
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

                const cardClasses =
                  status.type === "ongoing"
                    ? "relative overflow-hidden bg-gradient-to-br from-emerald-50/20 via-white to-white p-5 rounded-[20px] border border-emerald-100/50 flex flex-col gap-4 cursor-pointer shadow-[0_2px_8px_rgba(16,185,129,0.03)] hover:shadow-[0_4px_12px_rgba(16,185,129,0.06)] transition-[background-color,border-color,box-shadow] duration-200"
                    : status.type === "past"
                      ? "relative overflow-hidden bg-gray-50/40 p-5 rounded-[20px] border border-gray-200/50 flex flex-col gap-4 cursor-pointer shadow-none hover:bg-gray-50/80 transition-[background-color,border-color,box-shadow] duration-200"
                      : "relative overflow-hidden bg-white p-5 rounded-[20px] border border-gray-100 flex flex-col gap-4 cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)] transition-[background-color,border-color,box-shadow] duration-200";

                const iconBgClass =
                  status.type === "ongoing"
                    ? "bg-emerald-50 text-emerald-500"
                    : status.type === "past"
                      ? "bg-gray-100 text-gray-400"
                      : "bg-rose-50 text-rose-500";

                const titleColorClass =
                  status.type === "past"
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
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBgClass}`}
                        >
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

                          <h3 className={titleColorClass}>{rawTitle}</h3>
                        </div>
                      </div>

                      {/* Actions in card */}
                      <div className="flex gap-1 shrink-0 bg-gray-50/80 p-1 rounded-xl border border-gray-100/50 relative z-10">
                        <button
                          type="button"
                          disabled={isSharing}
                          onClick={(e) => handleShareBoardingPass(e, trip)}
                          className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-white rounded-lg transition-all disabled:opacity-50"
                          title="보딩패스 공유"
                        >
                          <Share2 size={14} />
                        </button>
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
