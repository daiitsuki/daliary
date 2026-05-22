import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Check,
  Search,
  MapPin,
  Utensils,
  Car,
  Coffee,
  Bed,
  MoreHorizontal,
  Camera,
  Clock,
  AlignLeft,
  Flag,
  Equal,
} from "lucide-react";
import TimePicker from "../../common/TimePicker";
import { useTripPlans } from "../../../hooks/useTrips";
import { TripPlan } from "../../../types";
import { usePlaceSearch, KakaoPlace } from "../../../hooks/usePlaceSearch";
import { createPortal } from "react-dom";

interface PlanItemModalProps {
  isOpen: boolean;
  tripId: string;
  dayNumber: number;
  daysCount: number;
  dayPlans: TripPlan[];
  plan: TripPlan | null;
  onClose: () => void;
}

const CATEGORIES = [
  { id: "restaurant", label: "식당", icon: Utensils },
  { id: "transport", label: "이동", icon: Car },
  { id: "cafe", label: "카페", icon: Coffee },
  { id: "accommodation", label: "숙소", icon: Bed },
  { id: "activity", label: "체험", icon: Camera },
  { id: "etc", label: "기타", icon: MoreHorizontal },
];

const CATEGORY_STYLES: Record<string, string> = {
  restaurant: "text-orange-500 bg-orange-50 border-orange-200 ring-orange-50",
  transport: "text-blue-500 bg-blue-50 border-blue-200 ring-blue-50",
  cafe: "text-amber-500 bg-amber-50 border-amber-200 ring-amber-50",
  accommodation:
    "text-indigo-500 bg-indigo-50 border-indigo-200 ring-indigo-50",
  activity: "text-rose-500 bg-rose-50 border-rose-200 ring-rose-50",
  etc: "text-gray-500 bg-gray-50 border-gray-200 ring-gray-50",
};

const CATEGORY_ACTIVE_COLORS: Record<string, string> = {
  restaurant: "bg-orange-500",
  transport: "bg-blue-500",
  cafe: "bg-amber-500",
  accommodation: "bg-indigo-500",
  activity: "bg-rose-500",
  etc: "bg-gray-500",
};

export default function PlanItemModal({
  isOpen,
  tripId,
  dayNumber,
  daysCount,
  dayPlans,
  plan,
  onClose,
}: PlanItemModalProps) {
  const { createPlan, updatePlan } = useTripPlans(tripId);
  const isSubmitting = createPlan.isPending || updatePlan.isPending;
  const { searchPlaces, results, isSearching } = usePlaceSearch();

  const [category, setCategory] = useState(plan?.category || "restaurant");
  const [startTime, setStartTime] = useState<string | null>(
    plan?.start_time || "12:00",
  );
  const [endTime, setEndTime] = useState<string | null>(
    plan?.end_time || "13:00",
  );
  const [memo, setMemo] = useState(plan?.memo || "");
  const [placeName, setPlaceName] = useState(plan?.place_name || "");
  const [address, setAddress] = useState(plan?.address || "");
  const [lat, setLat] = useState(plan?.lat || 0);
  const [lng, setLng] = useState(plan?.lng || 0);
  const [selectedDayNumber, setSelectedDayNumber] = useState(dayNumber);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const calculateDefaultTimes = () => {
    const timedPlans = [...dayPlans]
      .filter((p) => p.end_time)
      .sort((a, b) => (a.end_time || "").localeCompare(b.end_time || ""));

    if (timedPlans.length > 0) {
      const lastPlan = timedPlans[timedPlans.length - 1];
      const lastEndTime = lastPlan.end_time!;

      const [hours, minutes] = lastEndTime.split(":").map(Number);
      const newEndHours = (hours + 1) % 24;
      const formattedEndTime = `${String(newEndHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;

      return { start: lastEndTime, end: formattedEndTime };
    }

    return { start: "12:00", end: "13:00" };
  };

  useEffect(() => {
    if (plan) {
      setCategory(plan.category);
      setStartTime(plan.start_time?.slice(0, 5) || null);
      setEndTime(plan.end_time?.slice(0, 5) || null);
      setMemo(plan.memo || "");
      setPlaceName(plan.place_name || "");
      setAddress(plan.address || "");
      setLat(plan.lat || 0);
      setLng(plan.lng || 0);
      setSelectedDayNumber(plan.day_number);
    } else {
      const defaults = calculateDefaultTimes();
      setCategory("restaurant");
      setStartTime(defaults.start.slice(0, 5));
      setEndTime(defaults.end.slice(0, 5));
      setMemo("");
      setPlaceName("");
      setAddress("");
      setLat(0);
      setLng(0);
      setSelectedDayNumber(dayNumber);
    }
  }, [plan, isOpen, dayNumber, dayPlans]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchKeyword.trim()) return;
    searchPlaces(searchKeyword);
    setShowSearchResults(true);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleSelectPlace = (place: KakaoPlace) => {
    setPlaceName(place.place_name);
    setAddress(place.road_address_name || place.address_name);
    setLat(parseFloat(place.y));
    setLng(parseFloat(place.x));
    setShowSearchResults(false);
    setSearchKeyword("");
  };

  const handleClearPlace = () => {
    setPlaceName("");
    setAddress("");
    setLat(0);
    setLng(0);
  };

  const setPlaceUndecided = () => {
    setPlaceName("미정");
    setAddress("");
    setLat(0);
    setLng(0);
    setSearchKeyword("");
    setShowSearchResults(false);
  };

  const setTimeUndecided = () => {
    setStartTime(null);
    setEndTime(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalPlaceName = placeName.trim() || "미정";

    try {
      const payload = {
        trip_id: tripId,
        day_number: selectedDayNumber,
        category,
        start_time: startTime,
        end_time: endTime,
        memo,
        place_name: finalPlaceName,
        address,
        lat,
        lng,
        order_index: plan?.order_index || 0,
      };

      if (plan) {
        await updatePlan.mutateAsync({ id: plan.id, ...payload });
      } else {
        await createPlan.mutateAsync(payload);
      }
      onClose();
    } catch (err: any) {
      alert(err.message || "오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ modal: "plan-item-modal" }, "");
      const handlePopState = (event: PopStateEvent) => {
        if (event.state?.modal !== "plan-item-modal") {
          onClose();
        }
      };
      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
        if (window.history.state?.modal === "plan-item-modal") {
          window.history.back();
        }
      };
    }
  }, [isOpen, onClose]);

  const modalVariants = {
    initial: isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 },
    animate: isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 },
    exit: isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 },
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          <motion.div
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "tween", ease: "easeOut", duration: 0.25 }}
            className={`relative w-full ${isMobile ? "max-w-none mt-auto rounded-t-[32px] h-[90vh]" : "max-w-md rounded-[32px] mx-4 max-h-[90vh]"} bg-white shadow-2xl overflow-hidden flex flex-col transform-gpu border border-white/50`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-5 bg-white border-b border-gray-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-rose-50 p-2 rounded-xl">
                  <Flag className="text-rose-400" size={16} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-800 tracking-tight">
                    {plan ? "계획 수정" : "새로운 계획"}
                  </h2>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 rounded-2xl hover:bg-white/60 text-gray-400 transition-all active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar pb-10"
            >
              {/* Day Selection */}
              <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
                {Array.from({ length: daysCount }).map((_, i) => (
                  <button
                    key={i + 1}
                    type="button"
                    onClick={() => setSelectedDayNumber(i + 1)}
                    className={`shrink-0 px-5 py-2.5 rounded-2xl text-[12px] font-black transition-all ${
                      selectedDayNumber === i + 1
                        ? "bg-rose-500 text-white shadow-lg shadow-rose-100"
                        : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                    }`}
                  >
                    Day {i + 1}
                  </button>
                ))}
              </div>

              {/* Category Grid */}
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const active = category === cat.id;
                  const style = CATEGORY_STYLES[cat.id];
                  const activeColor = CATEGORY_ACTIVE_COLORS[cat.id];

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${
                        active
                          ? `bg-white ${style} shadow-sm ring-2`
                          : "bg-gray-50 border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shadow-sm transition-colors ${
                          active
                            ? `${activeColor} text-white`
                            : "bg-white text-gray-400"
                        }`}
                      >
                        <Icon size={14} />
                      </div>
                      <span className="text-[10px] font-black text-gray-700">
                        {cat.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Time Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[11px] font-black text-gray-400 tracking-wider"></span>
                  <div className="flex items-center gap-3">
                    {startTime && startTime !== endTime ? (
                      <button
                        type="button"
                        onClick={() => setEndTime(startTime)}
                        className="text-[10px] font-bold text-gray-400 hover:text-rose-500 transition-colors flex items-center gap-1"
                      >
                        <Equal size={10} />
                        시작시간과 같게
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={setTimeUndecided}
                      className="text-[10px] font-bold text-gray-400 hover:text-rose-500 transition-colors flex items-center gap-1"
                    >
                      <Clock size={10} />
                      나중에 정하기
                    </button>
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <TimePicker
                      value={startTime || ""}
                      onChange={(time) => {
                        setStartTime(time);
                        if (endTime && time > endTime) setEndTime(time);
                      }}
                    />
                  </div>
                  <span className="text-gray-500 font-extrabold px-1 pb-4 self-end text-sm">
                    →
                  </span>
                  <div className="flex-1">
                    <TimePicker
                      value={endTime || ""}
                      onChange={(time) => {
                        setEndTime(time);
                        if (startTime && time < startTime)
                          setEndTime(startTime);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Place Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[11px] font-black text-gray-400 tracking-wider"></span>
                  {!placeName && (
                    <button
                      type="button"
                      onClick={setPlaceUndecided}
                      className="text-[10px] font-bold text-gray-400 hover:text-rose-500 transition-colors flex items-center gap-1"
                    >
                      <MapPin size={10} />
                      장소 미정
                    </button>
                  )}
                </div>

                {!placeName ? (
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        onFocus={() => {
                          if (results.length > 0) setShowSearchResults(true);
                        }}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="어디로 가시나요?"
                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-rose-100 outline-none text-sm font-bold transition-all placeholder:text-gray-300"
                      />
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSearch()}
                      disabled={isSearching}
                      className="px-5 bg-gray-800 text-white rounded-2xl text-xs font-black active:scale-95 transition-all shadow-md shadow-gray-100"
                    >
                      검색
                    </button>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 bg-gray-50 rounded-[20px] border border-gray-100/50 relative group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-white rounded-xl shadow-sm text-rose-500">
                        <MapPin size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-gray-800 text-[13px] mb-0.5">
                          {placeName}
                        </h4>
                        <p className="text-[10px] font-bold text-gray-400 truncate">
                          {address || "상세 주소 정보 없음"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearPlace}
                        className="px-3 py-1.5 text-[10px] font-bold text-gray-400 hover:text-rose-500 bg-white rounded-xl shadow-sm transition-colors border border-gray-100 self-center"
                      >
                        재검색
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Search Results */}
                <AnimatePresence>
                  {!placeName && showSearchResults && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-white rounded-[24px] border border-gray-100 overflow-hidden shadow-xl mt-2 max-h-[280px] flex flex-col"
                    >
                      <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {isSearching ? (
                          <div className="p-10 text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-rose-50 border-t-rose-500 mx-auto"></div>
                          </div>
                        ) : results.length > 0 ? (
                          <ul className="divide-y divide-gray-50">
                            {results.map((r) => (
                              <li
                                key={r.id}
                                onClick={() => handleSelectPlace(r)}
                                className="p-5 hover:bg-rose-50/50 cursor-pointer transition-colors"
                              >
                                <h5 className="font-black text-xs text-gray-800">
                                  {r.place_name}
                                </h5>
                                <p className="text-[10px] font-bold text-gray-400 truncate mt-1">
                                  {r.road_address_name || r.address_name}
                                </p>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="p-10 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">
                            검색 결과가 없습니다
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSearchResults(false)}
                        className="w-full py-3 bg-gray-50 text-[10px] font-black text-gray-400 hover:text-gray-600 transition-colors border-t border-gray-100 uppercase tracking-tighter"
                      >
                        닫기
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Memo Section */}
              <div className="relative">
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="간단한 메모를 남겨주세요"
                  className="w-full px-6 py-5 bg-gray-50 rounded-[28px] border-none focus:ring-2 focus:ring-rose-100 outline-none text-sm font-bold transition-all placeholder:text-gray-300 min-h-[120px] resize-none"
                />
                <div className="absolute right-5 bottom-5 text-gray-200">
                  <AlignLeft size={20} />
                </div>
              </div>
            </form>

            {/* Footer Action */}
            <div className="p-6 shrink-0 border-t border-gray-50 bg-white">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-5 bg-rose-500 text-white text-[15px] font-black rounded-[24px] shadow-2xl shadow-rose-100 flex items-center justify-center gap-2 hover:bg-rose-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white" />
                ) : (
                  <Check size={20} strokeWidth={3} />
                )}
                {plan ? "일정 수정하기" : "일정 저장하기"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
