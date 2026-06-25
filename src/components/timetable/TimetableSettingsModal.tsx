import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Trash2, Settings2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import Select from "../common/Select";
import BaseModal from "../common/BaseModal";
import Button from "../common/Button";

interface TimetableSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  startHour: number;
  endHour: number;
  compressionMode: "none" | "compact" | "more_compact";
  weekStart: "sunday" | "monday";
  visibleDays: number[];
  showTime: boolean;
  showPlace: boolean;
  showMemo: boolean;
  fitToScreen: boolean;
  blockHeightMode: "narrow" | "normal" | "wide";
  onSave: (
    startHour: number,
    endHour: number,
    compressionMode: "none" | "compact" | "more_compact",
    weekStart: "sunday" | "monday",
    visibleDays: number[],
    showTime: boolean,
    showPlace: boolean,
    showMemo: boolean,
    fitToScreen: boolean,
    blockHeightMode: "narrow" | "normal" | "wide",
  ) => void;
  onResetAll: () => Promise<void>;
}

const HOUR_OPTIONS = Array.from({ length: 25 }, (_, i) => i); // 0 ~ 24

const TimetableSettingsModal = ({
  isOpen,
  onClose,
  startHour,
  endHour,
  compressionMode,
  weekStart,
  visibleDays,
  showTime,
  showPlace,
  showMemo,
  fitToScreen,
  blockHeightMode,
  onSave,
  onResetAll,
}: TimetableSettingsModalProps) => {
  const { showToast } = useToast();
  const [localStart, setLocalStart] = useState(startHour);
  const [localEnd, setLocalEnd] = useState(endHour);
  const [localCompressionMode, setLocalCompressionMode] =
    useState(compressionMode);
  const [localWeekStart, setLocalWeekStart] = useState(weekStart);
  const [localVisibleDays, setLocalVisibleDays] = useState(visibleDays);
  const [localShowTime, setLocalShowTime] = useState(showTime);
  const [localShowPlace, setLocalShowPlace] = useState(showPlace);
  const [localShowMemo, setLocalShowMemo] = useState(showMemo);
  const [localFitToScreen, setLocalFitToScreen] = useState(fitToScreen);
  const [localBlockHeightMode, setLocalBlockHeightMode] =
    useState(blockHeightMode);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLocalStart(startHour);
      setLocalEnd(endHour);
      setLocalCompressionMode(compressionMode);
      setLocalWeekStart(weekStart);
      setLocalVisibleDays(visibleDays);
      setLocalShowTime(showTime);
      setLocalShowPlace(showPlace);
      setLocalShowMemo(showMemo);
      setLocalFitToScreen(fitToScreen);
      setLocalBlockHeightMode(blockHeightMode);
    }
  }, [
    isOpen,
    startHour,
    endHour,
    compressionMode,
    weekStart,
    visibleDays,
    showTime,
    showPlace,
    showMemo,
    fitToScreen,
    blockHeightMode,
  ]);

  const toggleDay = (d: number) => {
    setLocalVisibleDays((prev) => {
      if (prev.includes(d)) {
        if (prev.length === 1) return prev;
        return prev.filter((x) => x !== d);
      }
      return [...prev, d];
    });
  };

  const DAYS_ORDER =
    localWeekStart === "monday" ? [1, 2, 3, 4, 5, 6, 0] : [0, 1, 2, 3, 4, 5, 6];
  const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

  const handleSave = () => {
    if (localStart >= localEnd) {
      showToast("종료 시간은 시작 시간보다 빠를 수 없어요.", "error");
      return;
    }
    if (localEnd - localStart < 2) {
      showToast("최소 2시간 이상은 표시해야해요.", "error");
      return;
    }
    onSave(
      localStart,
      localEnd,
      localCompressionMode,
      localWeekStart,
      localVisibleDays,
      localShowTime,
      localShowPlace,
      localShowMemo,
      localFitToScreen,
      localBlockHeightMode,
    );
    showToast("시간표 설정이 저장되었습니다.", "success");
    onClose();
  };

  const handleReset = async () => {
    if (isResetting) return;
    setIsResetting(true);
    try {
      await onResetAll();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsResetting(false);
      setIsConfirmingReset(false);
    }
  };

  const footerContent = (
    <Button
      variant="primary"
      onClick={handleSave}
      icon={<Check size={16} strokeWidth={3} />}
    >
      설정 저장
    </Button>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="시간표 설정"
      icon={Settings2}
      footer={footerContent}
      maxWidth="md"
    >
      {/* 그룹 1: 시간 설정 */}
      <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 space-y-5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 bg-rose-400 rounded-full" />
          <h4 className="text-sm font-black text-gray-800">표시 시간</h4>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest px-1">
              시작
            </label>
            <Select
              value={String(localStart)}
              onChange={(val) => setLocalStart(Number(val))}
              className="w-full"
              options={HOUR_OPTIONS.filter((h) => h < localEnd).map((h) => ({
                value: String(h),
                label: `${String(h).padStart(2, "0")}:00`,
              }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest px-1">
              종료
            </label>
            <Select
              value={String(localEnd)}
              onChange={(val) => setLocalEnd(Number(val))}
              className="w-full"
              options={HOUR_OPTIONS.filter((h) => h > localStart).map((h) => ({
                value: String(h),
                label: `${String(h).padStart(2, "0")}:00`,
              }))}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-50 space-y-2">
          <label className="block text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest px-1">
            빈 시간 압축
          </label>
          <div className="flex bg-gray-50 p-1 rounded-[16px]">
            {[
              { value: "none", label: "안 함" },
              { value: "compact", label: "조금" },
              { value: "more_compact", label: "많이" },
            ].map((mode) => (
              <button
                key={mode.value}
                onClick={() => setLocalCompressionMode(mode.value as any)}
                className={`flex-1 py-2.5 rounded-[12px] text-xs font-black transition-all ${
                  localCompressionMode === mode.value
                    ? "bg-white text-rose-500 shadow-sm"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100/50"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-50 space-y-2">
          <label className="block text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest px-1">
            일정 높이
          </label>
          <div className="flex bg-gray-50 p-1 rounded-[16px]">
            {[
              { value: "narrow", label: "좁게" },
              { value: "normal", label: "보통" },
              { value: "wide", label: "넓게" },
            ].map((mode) => (
              <button
                key={mode.value}
                onClick={() => setLocalBlockHeightMode(mode.value as any)}
                className={`flex-1 py-2.5 rounded-[12px] text-xs font-black transition-all ${
                  localBlockHeightMode === mode.value
                    ? "bg-white text-rose-500 shadow-sm"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-100/50"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 그룹 2: 요일 설정 */}
      <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 space-y-5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 bg-indigo-400 rounded-full" />
          <h4 className="text-sm font-black text-gray-800">표시 요일</h4>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest px-1">
            시작 요일
          </label>
          <div className="flex bg-gray-50 p-1 rounded-[16px]">
            <button
              onClick={() => setLocalWeekStart("monday")}
              className={`flex-1 py-2.5 rounded-[12px] text-xs font-black transition-all ${
                localWeekStart === "monday"
                  ? "bg-white text-indigo-500 shadow-sm"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100/50"
              }`}
            >
              월요일부터
            </button>
            <button
              onClick={() => setLocalWeekStart("sunday")}
              className={`flex-1 py-2.5 rounded-[12px] text-xs font-black transition-all ${
                localWeekStart === "sunday"
                  ? "bg-white text-indigo-500 shadow-sm"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100/50"
              }`}
            >
              일요일부터
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-50 space-y-2">
          <label className="block text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest px-1">
            표시할 요일
          </label>
          <div className="flex justify-between gap-1.5">
            {DAYS_ORDER.map((d) => {
              const isSelected = localVisibleDays.includes(d);
              return (
                <button
                  key={d}
                  onClick={() => toggleDay(d)}
                  className={`flex-1 h-11 rounded-[14px] text-[11px] sm:text-xs font-black transition-all flex items-center justify-center ${
                    isSelected
                      ? "bg-indigo-50 text-indigo-500 border border-indigo-100/50 shadow-sm"
                      : "bg-gray-50 text-gray-300 border border-transparent hover:bg-gray-100"
                  }`}
                >
                  {DAY_NAMES[d]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 그룹 3: 표시 항목 */}
      <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 space-y-5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 bg-emerald-400 rounded-full" />
          <h4 className="text-sm font-black text-gray-800">표시 항목</h4>
        </div>

        <div className="flex gap-2 bg-gray-50 p-1.5 rounded-[16px]">
          <button
            type="button"
            onClick={() => setLocalShowTime((prev) => !prev)}
            className={`flex-1 py-3 rounded-[12px] text-xs font-black transition-all flex flex-col items-center justify-center gap-1 ${
              localShowTime
                ? "bg-white text-emerald-500 shadow-sm border border-emerald-100"
                : "text-gray-400 hover:bg-gray-100/50"
            }`}
          >
            <span>시간</span>
          </button>
          <button
            type="button"
            onClick={() => setLocalShowPlace((prev) => !prev)}
            className={`flex-1 py-3 rounded-[12px] text-xs font-black transition-all flex flex-col items-center justify-center gap-1 ${
              localShowPlace
                ? "bg-white text-emerald-500 shadow-sm border border-emerald-100"
                : "text-gray-400 hover:bg-gray-100/50"
            }`}
          >
            <span>장소</span>
          </button>
          <button
            type="button"
            onClick={() => setLocalShowMemo((prev) => !prev)}
            className={`flex-1 py-3 rounded-[12px] text-xs font-black transition-all flex flex-col items-center justify-center gap-1 ${
              localShowMemo
                ? "bg-white text-emerald-500 shadow-sm border border-emerald-100"
                : "text-gray-400 hover:bg-gray-100/50"
            }`}
          >
            <span>메모</span>
          </button>
        </div>

        <div className="pt-4 border-t border-gray-50 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest px-1">
                한눈에 보기
              </h4>
              <p className="text-[9px] font-bold text-gray-400 px-1 mt-0.5">
                화면 너비에 맞춰 시간표를 한 번에 보여줍니다
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLocalFitToScreen((prev) => !prev)}
              className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all active:scale-90 ${
                localFitToScreen ? "bg-emerald-400" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${
                  localFitToScreen ? "translate-x-5.5" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 그룹 4: 데이터 관리 (위험) */}
      <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 space-y-5">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 bg-red-400 rounded-full" />
          <h4 className="text-sm font-black text-gray-800">데이터 관리</h4>
        </div>

        <AnimatePresence mode="wait">
          {isConfirmingReset ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-3"
            >
              <p className="text-[11px] sm:text-xs font-bold text-red-500/90 leading-tight">
                모든 시간표 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
                정말 초기화하시겠습니까?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmingReset(false)}
                  disabled={isResetting}
                  className="flex-1 py-3 bg-white text-gray-500 text-xs font-black rounded-[14px] border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isResetting}
                  className="flex-1 py-3 bg-red-500 text-white text-xs font-black rounded-[14px] shadow-lg shadow-red-200 flex items-center justify-center"
                >
                  {isResetting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "네, 모두 삭제합니다"
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <button
                type="button"
                onClick={() => setIsConfirmingReset(true)}
                className="w-full py-3.5 bg-white text-red-500 text-xs font-black rounded-[14px] border border-red-100 shadow-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                모든 시간표 초기화
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </BaseModal>
  );
};

export default TimetableSettingsModal;
