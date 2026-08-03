import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Trash2, Settings2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import BaseModal from "../common/BaseModal";
import Button from "../common/Button";
import DualRangeSlider from "../common/DualRangeSlider";
import Toggle from "../common/Toggle";

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


const HeightIcon = ({ mode, active }: { mode: string; active: boolean }) => {
  const color = active ? "bg-white" : "bg-gray-300";
  return (
    <div className="mb-1 flex h-6 items-center justify-center opacity-90">
      {mode === "narrow" && (
        <div className={`h-1.5 w-5 rounded-sm ${color} shadow-sm`} />
      )}
      {mode === "normal" && (
        <div className={`h-3 w-5 rounded-sm ${color} shadow-sm`} />
      )}
      {mode === "wide" && (
        <div className={`h-4.5 w-5 rounded-sm ${color} shadow-sm`} />
      )}
    </div>
  );
};

const CompressionIcon = ({
  mode,
  active,
}: {
  mode: string;
  active: boolean;
}) => {
  const color = active ? "bg-white" : "bg-gray-300";
  return (
    <div className="mb-1 flex h-6 flex-col items-center justify-center opacity-90">
      {mode === "none" && (
        <div className="flex w-5 flex-col gap-2">
          <div className={`h-1.5 w-full rounded-[2px] ${color} shadow-sm`} />
          <div className={`h-1.5 w-full rounded-[2px] ${color} shadow-sm`} />
        </div>
      )}
      {mode === "compact" && (
        <div className="flex w-5 flex-col gap-1">
          <div className={`h-1.5 w-full rounded-[2px] ${color} shadow-sm`} />
          <div className={`h-1.5 w-full rounded-[2px] ${color} shadow-sm`} />
        </div>
      )}
      {mode === "more_compact" && (
        <div className="flex w-5 flex-col gap-px">
          <div className={`h-1.5 w-full rounded-[2px] ${color} shadow-sm`} />
          <div className={`h-1.5 w-full rounded-[2px] ${color} shadow-sm`} />
        </div>
      )}
    </div>
  );
};

const VisualSegmentedControl = ({
  options,
  value,
  onChange,
  iconRenderer,
}: {
  options: { label: string; value: any }[];
  value: any;
  onChange: (val: any) => void;
  iconRenderer: (mode: string, active: boolean) => React.ReactNode;
}) => (
  <div className="flex rounded-2xl border border-gray-100 bg-gray-50/80 p-1.5">
    {options.map((opt) => {
      const isActive = value === opt.value;
      return (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex flex-1 flex-col items-center justify-center rounded-xl py-3 transition-all ${
            isActive
              ? "bg-rose-400 text-white shadow-md shadow-rose-200"
              : "text-gray-400 hover:bg-gray-100/50 hover:text-gray-500"
          }`}
        >
          {iconRenderer(opt.value, isActive)}
          <span className="text-[11px] font-black">{opt.label}</span>
        </button>
      );
    })}
  </div>
);

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
      setIsConfirmingReset(false);
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
    if (localEnd - localStart < 4) {
      showToast("최소 4시간 이상은 표시해야해요.", "error");
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
      className="bg-rose-400 shadow-rose-200 hover:bg-rose-500"
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
      <div className="space-y-8 px-1 py-2">
        {/* 요일 설정 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold tracking-widest text-gray-500 uppercase">
              표시 요일
            </h4>
            <button
              onClick={() =>
                setLocalWeekStart(
                  localWeekStart === "monday" ? "sunday" : "monday",
                )
              }
              className="flex items-center gap-1 text-[11px] font-bold text-gray-400 transition-colors hover:text-gray-600"
            >
              {localWeekStart === "monday"
                ? "월요일부터 시작"
                : "일요일부터 시작"}{" "}
              ⇄
            </button>
          </div>
          <div className="flex justify-between gap-1.5">
            {DAYS_ORDER.map((d) => {
              const isSelected = localVisibleDays.includes(d);
              return (
                <button
                  key={d}
                  onClick={() => toggleDay(d)}
                  className={`flex h-11 flex-1 items-center justify-center rounded-xl border text-xs font-black transition-all ${
                    isSelected
                      ? "border-rose-400 bg-rose-400 text-white shadow-md shadow-rose-200"
                      : "border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                  }`}
                >
                  {DAY_NAMES[d]}
                </button>
              );
            })}
          </div>
        </div>

        {/* 시간 설정 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold tracking-widest text-gray-500 uppercase">
              표시 시간 범위
            </h4>
            <span className="rounded-full border border-gray-100 bg-gray-50 px-2 py-0.5 text-[11px] font-bold text-gray-500">
              {String(localStart).padStart(2, "0")}:00 ~{" "}
              {String(localEnd).padStart(2, "0")}:00
            </span>
          </div>
          <div className="pt-2 pb-4">
            <DualRangeSlider
              min={0}
              max={24}
              startValue={localStart}
              endValue={localEnd}
              onChange={(start, end) => {
                setLocalStart(start);
                setLocalEnd(end);
              }}
            />
          </div>
        </div>

        {/* 디스플레이 설정 (Always open) */}
        <div className="space-y-6">
          <h4 className="text-xs font-bold tracking-widest text-gray-500 uppercase">
            화면 표시 상세 설정
          </h4>

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50/50">
            <Toggle
              checked={localShowTime}
              onChange={() => setLocalShowTime(!localShowTime)}
              label="시간 표시"
            />
            <Toggle
              checked={localShowPlace}
              onChange={() => setLocalShowPlace(!localShowPlace)}
              label="장소 표시"
            />
            <Toggle
              checked={localShowMemo}
              onChange={() => setLocalShowMemo(!localShowMemo)}
              label="메모 표시"
            />
            <Toggle
              checked={localFitToScreen}
              onChange={() => setLocalFitToScreen(!localFitToScreen)}
              label="너비 한눈에 보기"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="px-1 text-center text-[11px] font-bold text-gray-500">
                빈 시간 압축
              </h4>
              <VisualSegmentedControl
                options={[
                  { value: "none", label: "안 함" },
                  { value: "compact", label: "조금" },
                  { value: "more_compact", label: "많이" },
                ]}
                value={localCompressionMode}
                onChange={setLocalCompressionMode}
                iconRenderer={(mode, active) => (
                  <CompressionIcon mode={mode} active={active} />
                )}
              />
            </div>
            <div className="space-y-3">
              <h4 className="px-1 text-center text-[11px] font-bold text-gray-500">
                일정 블록 높이
              </h4>
              <VisualSegmentedControl
                options={[
                  { value: "narrow", label: "좁게" },
                  { value: "normal", label: "보통" },
                  { value: "wide", label: "넓게" },
                ]}
                value={localBlockHeightMode}
                onChange={setLocalBlockHeightMode}
                iconRenderer={(mode, active) => (
                  <HeightIcon mode={mode} active={active} />
                )}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dangerous Zone */}
      <div className="mt-4 flex justify-center">
        <AnimatePresence mode="wait">
          {isConfirmingReset ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full rounded-2xl border border-red-100 bg-red-50 p-4 shadow-sm"
            >
              <p className="mb-3 text-center text-[11px] font-bold text-red-600">
                정말 모든 시간표를 지우시겠습니까? 복구할 수 없습니다.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsConfirmingReset(false)}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-2 text-xs font-black text-gray-500"
                >
                  취소
                </button>
                <button
                  onClick={handleReset}
                  disabled={isResetting}
                  className="flex flex-1 items-center justify-center rounded-xl bg-red-500 py-2 text-xs font-black text-white shadow-md shadow-red-200"
                >
                  {isResetting ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : (
                    "네, 지울게요"
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="reset-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfirmingReset(true)}
              className="flex items-center gap-1 p-2 text-[11px] font-bold text-gray-400 transition-colors hover:text-red-400"
            >
              <Trash2 size={12} />
              모든 데이터 초기화
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </BaseModal>
  );
};

export default TimetableSettingsModal;
