import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Users, Trash2 } from "lucide-react";
import DatePicker from "../common/DatePicker";
import { CATEGORY_CONFIG, CategoryType } from "./constants";
import { Schedule, ScheduleInput } from "../../hooks/useSchedules";
import { Profile } from "../../types";

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate: string;
  scheduleToEdit: Schedule | null;
  onSave: (data: ScheduleInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  myProfile: Profile | null;
  partnerProfile: Profile | null;
}

const ScheduleModal = ({
  isOpen,
  onClose,
  initialDate,
  scheduleToEdit,
  onSave,
  onDelete,
  myProfile,
  partnerProfile,
}: ScheduleModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(initialDate);
  const [endDate, setEndDate] = useState(initialDate);
  const [category, setCategory] = useState<CategoryType>("couple");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Update state when opening for edit or new
  useEffect(() => {
    if (isOpen) {
      if (scheduleToEdit) {
        setTitle(scheduleToEdit.title);
        setDescription(scheduleToEdit.description || "");
        setStartDate(scheduleToEdit.start_date);
        setEndDate(scheduleToEdit.end_date);
        setCategory(scheduleToEdit.category as CategoryType);
      } else {
        setTitle("");
        setDescription("");
        setStartDate(initialDate);
        setEndDate(initialDate);
        setCategory("couple");
      }
    }
  }, [isOpen, scheduleToEdit, initialDate]);

  // Handle Resize for responsive animation
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 뒤로가기 시 모달 닫기 로직
  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ modal: "schedule" }, "");
      
      const handlePopState = (event: PopStateEvent) => {
        if (event.state?.modal !== "schedule") {
          onClose();
        }
      };
      
      window.addEventListener("popstate", handlePopState);
      
      return () => {
        window.removeEventListener("popstate", handlePopState);
        if (window.history.state?.modal === "schedule") {
          window.history.back();
        }
      };
    }
  }, [isOpen, onClose]);

  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    // 시작일이 종료일보다 늦어지면 종료일을 시작일과 맞춤
    if (new Date(date) > new Date(endDate)) {
      setEndDate(date);
    }
  };

  const handleEndDateChange = (date: string) => {
    // 종료일이 시작일보다 빠르면 무시하거나 시작일로 맞춤
    if (new Date(date) < new Date(startDate)) {
      alert("종료일은 시작일보다 빠를 수 없습니다.");
      setEndDate(startDate);
    } else {
      setEndDate(date);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    // 최종 검증
    if (new Date(startDate) > new Date(endDate)) {
      alert("날짜 설정이 올바르지 않습니다.");
      return;
    }
    
    const data = {
      title,
      description,
      start_date: startDate,
      end_date: endDate,
      category,
      color: CATEGORY_CONFIG[category].color,
    };
    
    await onSave(data);
    onClose();
  };

  const handleDelete = async () => {
    if (scheduleToEdit && confirm("일정을 삭제할까요?")) {
      await onDelete(scheduleToEdit.id);
      onClose();
    }
  };

  const modalVariants = {
    initial: isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 },
    animate: isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 },
    exit: isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50"
          />
          <motion.div
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "tween", ease: "easeOut", duration: 0.25 }}
            className="relative w-full max-w-lg bg-white rounded-t-[32px] md:rounded-[32px] shadow-xl flex flex-col max-h-[90vh] overflow-hidden transform-gpu"
          >
            <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
              <div className="px-6 py-6 border-b border-gray-50 flex items-center justify-between shrink-0">
                <h3 className="text-base sm:text-lg font-black text-gray-800 uppercase tracking-widest">
                  {scheduleToEdit ? "일정 수정" : "새 일정 추가"}
                </h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                <div className="space-y-2">
                  <label className="block text-[10px] sm:text-xs font-black text-gray-300 uppercase tracking-widest px-1">
                    제목
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="제목을 입력하세요"
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-rose-200 font-bold text-sm sm:text-base outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <DatePicker label="시작 날짜" value={startDate} onChange={handleStartDateChange} />
                  <DatePicker label="종료 날짜" value={endDate} onChange={handleEndDateChange} />
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] sm:text-xs font-black text-gray-300 uppercase tracking-widest px-1">
                    누구의 일정인가요?
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["me", "partner", "couple"] as const).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all ${
                          category === cat
                            ? "bg-white border-rose-200 shadow-sm ring-2 ring-rose-50"
                            : "bg-gray-50 border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <div
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-sm"
                          style={{ backgroundColor: CATEGORY_CONFIG[cat].color }}
                        >
                          {cat === "couple" ? (
                            <Users size={14} className="text-white" />
                          ) : (
                            <User size={14} className="text-white" />
                          )}
                        </div>
                        <span className="text-[11px] sm:text-xs font-black text-gray-700 whitespace-nowrap">
                          {cat === "me"
                            ? myProfile?.nickname || "나"
                            : cat === "partner"
                            ? partnerProfile?.nickname || "상대방"
                            : "우리"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] sm:text-xs font-black text-gray-300 uppercase tracking-widest px-1">
                    상세 내용
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="메모를 남겨보세요"
                    className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-rose-200 font-bold text-sm sm:text-base h-32 resize-none outline-none"
                  />
                </div>
              </div>

              <div className="p-6 bg-gray-50/50 flex gap-3 shrink-0">
                {scheduleToEdit && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="p-5 bg-white text-gray-400 rounded-2xl border border-gray-100 hover:text-rose-500 transition-all shadow-sm"
                  >
                    <Trash2 size={22} />
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-5 bg-rose-400 text-white rounded-2xl font-black text-sm sm:text-base shadow-xl shadow-rose-100 hover:bg-rose-500 transition-all active:scale-[0.98]"
                >
                  {scheduleToEdit ? "수정 내용 저장" : "일정 등록하기"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ScheduleModal;
