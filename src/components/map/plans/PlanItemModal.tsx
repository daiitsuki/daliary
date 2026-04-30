import { useState, useEffect, useMemo } from "react";
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
  Calendar,
  Clock,
  AlignLeft,
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
            <div className="p-6 shrink-0 border-b border-gray-50 bg-white/40 backdrop-blur-md">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-black text-gray-800">
                  {plan ? "계획 수정" : "새로운 계획"}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 bg-gray-50/50 text-gray-400 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto p-6 space-y-7 custom-scrollbar pb-10"
            >
              {/* Day & Category Section (Self-explanatory by design) */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 shrink-0 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                    <Calendar size={18} />
                  </div>
                  <div className="flex overflow-x-auto no-scrollbar gap-2 flex-1">
                    {Array.from({ length: daysCount }).map((_, i) => (
                      <button
                        key={i + 1}
                        type="button"
                        onClick={() => setSelectedDayNumber(i + 1)}
                        className={`shrink-0 px-4 py-2.5 rounded-2xl text-[12px] font-black transition-all ${
                          selectedDayNumber === i + 1
                            ? "bg-gray-800 text-white shadow-md"
                            : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                        }`}
                      >
                        Day {i + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pl-[52px]">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const active = category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black transition-all ${
                          active
                            ? "bg-rose-500 text-white shadow-md shadow-rose-100"
                            : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                        }`}
                      >
                        <Icon size={14} />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="w-full h-px bg-gray-50" />

              {/* Time Section */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 shrink-0 bg-rose-50 rounded-full flex items-center justify-center text-rose-400 mt-1">
                  <Clock size={18} />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={setTimeUndecided}
                      className="text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
                    >
                      나중에 정하기
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <TimePicker
                      label="시작"
                      value={startTime || ""}
                      onChange={(time) => {
                        setStartTime(time);
                        if (endTime && time > endTime) setEndTime(time);
                      }}
                    />
                    <TimePicker
                      label="종료"
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
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 shrink-0 bg-blue-50 rounded-full flex items-center justify-center text-blue-400 mt-1">
                  <MapPin size={18} />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={setPlaceUndecided}
                      className="text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-2"
                    >
                      장소 미정
                    </button>
                  </div>

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
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-blue-200 outline-none text-sm font-bold transition-all placeholder:text-gray-300"
                      />
                      <Search className="absolute left-3.5 top-3.5 text-gray-400 w-4 h-4" />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSearch()}
                      disabled={isSearching}
                      className="px-4 bg-gray-800 text-white rounded-2xl text-xs font-black active:scale-95 transition-all"
                    >
                      검색
                    </button>
                  </div>

                  {/* Search Results */}
                  <AnimatePresence>
                    {showSearchResults && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm mt-2"
                      >
                        {isSearching ? (
                          <div className="p-6 text-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-200 border-t-blue-500 mx-auto"></div>
                          </div>
                        ) : results.length > 0 ? (
                          <div className="max-h-[240px] overflow-y-auto custom-scrollbar">
                            <ul className="divide-y divide-gray-50">
                              {results.map((r) => (
                                <li
                                  key={r.id}
                                  onClick={() => handleSelectPlace(r)}
                                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                                >
                                  <h5 className="font-bold text-xs text-gray-800">
                                    {r.place_name}
                                  </h5>
                                  <p className="text-[10px] text-gray-400 truncate mt-0.5">
                                    {r.road_address_name || r.address_name}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <div className="p-6 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            검색 결과가 없습니다
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowSearchResults(false)}
                          className="w-full py-2 bg-gray-50 text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors border-t border-gray-100"
                        >
                          닫기
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Selected Place Info */}
                  {placeName && (
                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 animate-in fade-in slide-in-from-top-1 duration-300 relative group mt-2">
                      <button
                        type="button"
                        onClick={handleClearPlace}
                        className="absolute top-2 right-2 p-1 text-blue-300 hover:text-blue-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-blue-100 text-blue-500">
                          <MapPin size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-black text-gray-800 text-xs mb-0.5">
                            {placeName}
                          </h4>
                          <p className="text-[10px] font-bold text-gray-400 truncate">
                            {address || "상세 주소 정보 없음"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Memo Section */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 shrink-0 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-400 mt-1">
                  <AlignLeft size={18} />
                </div>
                <div className="flex-1">
                  <textarea
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="이 일정에 대한 간단한 메모를 남겨주세요 (선택)"
                    className="w-full px-4 py-3.5 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-emerald-200 outline-none text-sm font-bold transition-all placeholder:text-gray-300 min-h-[100px] resize-none mt-1"
                  />
                </div>
              </div>
            </form>

            <div className="p-6 shrink-0 border-t border-gray-50 bg-white">
              <button
                onClick={handleSubmit}
                className="w-full py-4 bg-gray-800 text-white text-sm font-black rounded-2xl shadow-xl shadow-gray-200 flex items-center justify-center gap-2 hover:bg-gray-900 active:scale-[0.98] transition-all"
              >
                <Check size={18} strokeWidth={3} />
                {plan ? "수정 완료" : "일정 저장하기"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
