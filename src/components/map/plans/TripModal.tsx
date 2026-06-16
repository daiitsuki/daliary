import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Plane, Tent, Map, Heart, Palmtree, Building } from "lucide-react";
import DatePicker from "../../common/DatePicker";
import { useTrips } from "../../../hooks/useTrips";
import { Trip } from "../../../types";
import { createPortal } from "react-dom";
import { useToast } from "../../../context/ToastContext";
import {
  parseTripTitle,
  serializeTripTitle,
  TRIP_ICONS,
} from "../../../utils/tripHelpers";

interface TripModalProps {
  isOpen: boolean;
  trip: Trip | null;
  onClose: () => void;
}

const ICON_COMPONENTS: Record<string, any> = {
  plane: Plane,
  tent: Tent,
  map: Map,
  heart: Heart,
  palmtree: Palmtree,
  building: Building,
};

export default function TripModal({ isOpen, trip, onClose }: TripModalProps) {
  const { showToast } = useToast();
  const { createTrip, updateTrip } = useTrips();
  const [title, setTitle] = useState("");
  const [iconIndex, setIconIndex] = useState(0);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (trip) {
      const parsed = parseTripTitle(trip.title);
      setTitle(parsed.rawTitle);
      setIconIndex(parsed.iconIndex);
      setStartDate(trip.start_date);
      setEndDate(trip.end_date);
    } else {
      setTitle("");
      setIconIndex(0);
      setStartDate(new Date().toISOString().split("T")[0]);
      setEndDate(new Date().toISOString().split("T")[0]);
    }
  }, [trip, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast("여행 제목을 입력해주세요.", "error");
      return;
    }

    try {
      const serializedTitle = serializeTripTitle(title.trim(), iconIndex);
      if (trip) {
        await updateTrip.mutateAsync({
          id: trip.id,
          title: serializedTitle,
          start_date: startDate,
          end_date: endDate,
        });
      } else {
        await createTrip.mutateAsync({
          title: serializedTitle,
          start_date: startDate,
          end_date: endDate,
        });
      }
      onClose();
    } catch (err: any) {
      showToast(err.message || "오류가 발생했어요.", "error");
    }
  };

  // 브라우저 뒤로가기 대응
  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ modal: "trip-modal" }, "");
      const handlePopState = (event: PopStateEvent) => {
        if (event.state?.modal !== "trip-modal") {
          onClose();
        }
      };
      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
        if (window.history.state?.modal === "trip-modal") {
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
            className={`relative w-full ${isMobile ? "max-w-none mt-auto rounded-t-[32px]" : "max-w-md rounded-[32px] mx-4"} bg-white shadow-2xl overflow-hidden transform-gpu border border-white/50`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-gray-800">
                  {trip ? "여행 계획 수정" : "새로운 여행 계획"}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 bg-gray-50/50 text-gray-400 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                    여행 제목
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="어디로 떠나시나요?"
                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-rose-200 outline-none text-sm font-bold transition-all placeholder:text-gray-300"
                  />
                </div>

                {/* 아이콘 선택 */}
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                    아이콘 선택
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {TRIP_ICONS.map((ico, idx) => {
                      const IconComponent = ICON_COMPONENTS[ico.id];
                      const isActive = iconIndex === idx;
                      return (
                        <button
                          key={ico.id}
                          type="button"
                          onClick={() => setIconIndex(idx)}
                          className={`h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer border ${
                            isActive
                              ? "bg-rose-500 border-transparent text-white shadow-lg shadow-rose-100"
                              : "bg-gray-50 border-gray-100 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                          }`}
                          title={ico.label}
                        >
                          {IconComponent && (
                            <IconComponent
                              size={18}
                              strokeWidth={isActive ? 3 : 2}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <DatePicker
                      label="시작일"
                      value={startDate}
                      onChange={(date) => {
                        setStartDate(date);
                        if (date > endDate) setEndDate(date);
                      }}
                    />
                  </div>
                  <div>
                    <DatePicker
                      label="종료일"
                      value={endDate}
                      onChange={(date) => {
                        setEndDate(date);
                        if (date < startDate) setStartDate(date);
                      }}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={createTrip.isPending || updateTrip.isPending}
                    className="w-full py-4 bg-rose-500 text-white text-sm font-black rounded-2xl shadow-xl shadow-rose-100 flex items-center justify-center gap-2 hover:bg-rose-600 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <Check size={18} strokeWidth={3} />
                    {trip ? "수정 완료" : "계획 시작하기"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
