import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, MapPin, Loader2, Plus, Edit2 } from "lucide-react";
import TimePicker from "../common/TimePicker";
import { TimetableBlock, TimetableBlockInput } from "../../hooks/useTimetable";
import { usePlaceSearch, KakaoPlace } from "../../hooks/usePlaceSearch";
import { useConfirm } from "../../context/ConfirmContext";
import BaseModal from "../common/BaseModal";
import Button from "../common/Button";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

const PRESET_COLORS = [
  "#FDA4AF", // rose-300
  "#FCA5A5", // red-300
  "#FBB679", // orange-300
  "#FCD34D", // yellow-300
  "#86EFAC", // green-300
  "#6EE7B7", // emerald-300
  "#5EEAD4", // teal-300
  "#7DD3FC", // sky-300
  "#93C5FD", // blue-300
  "#A5B4FC", // indigo-300
  "#C4B5FD", // violet-300
  "#F0ABFC", // fuchsia-300
  "#D1D5DB", // gray-300
];

interface TimetableBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  blockToEdit: TimetableBlock | null;
  defaultDay?: number;
  defaultStartTime?: string;
  defaultEndTime?: string;
  onSave: (dataList: TimetableBlockInput[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const TimetableBlockModal = ({
  isOpen,
  onClose,
  blockToEdit,
  defaultDay = 1,
  defaultStartTime = "09:00",
  defaultEndTime = "10:00",
  onSave,
  onDelete,
}: TimetableBlockModalProps) => {
  const [title, setTitle] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([defaultDay]);
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState(defaultEndTime);
  const [placeName, setPlaceName] = useState("");
  const [placeAddress, setPlaceAddress] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [memo, setMemo] = useState("");
  const [showPlaceSearch, setShowPlaceSearch] = useState(false);
  const [placeQuery, setPlaceQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { confirm } = useConfirm();

  const { searchPlaces, results: placeResults, isSearching } = usePlaceSearch();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize state
  useEffect(() => {
    if (isOpen) {
      if (blockToEdit) {
        setTitle(blockToEdit.title);
        setSelectedDays([blockToEdit.day_of_week]);
        setStartTime(blockToEdit.start_time);
        setEndTime(blockToEdit.end_time);
        setPlaceName(blockToEdit.place_name || "");
        setPlaceAddress(blockToEdit.place_address || "");
        setColor(blockToEdit.color);
        setMemo(blockToEdit.memo || "");
        setPlaceQuery(blockToEdit.place_name || "");
      } else {
        setTitle("");
        setSelectedDays([defaultDay]);
        setStartTime(defaultStartTime);
        setEndTime(defaultEndTime);
        setPlaceName("");
        setPlaceAddress("");
        setColor(PRESET_COLORS[0]);
        setMemo("");
        setPlaceQuery("");
      }
      setShowPlaceSearch(false);
      setIsSaving(false);
      setErrorMsg(null);
    }
  }, [isOpen, blockToEdit, defaultDay, defaultStartTime, defaultEndTime]);

  const handlePlaceQueryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setPlaceQuery(query);
      setPlaceName(query);
      setPlaceAddress("");
      setShowPlaceSearch(!!query.trim());

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (query.trim()) searchPlaces(query);
      }, 400);
    },
    [searchPlaces],
  );

  const handleSelectPlace = (place: KakaoPlace) => {
    setPlaceName(place.place_name);
    setPlaceAddress(place.road_address_name || place.address_name);
    setPlaceQuery(place.place_name);
    setShowPlaceSearch(false);
  };

  const handleClearPlace = () => {
    setPlaceName("");
    setPlaceAddress("");
    setPlaceQuery("");
    setShowPlaceSearch(false);
  };

  const toggleDay = (idx: number) => {
    setSelectedDays((prev) => {
      if (prev.includes(idx)) {
        if (prev.length === 1) return prev; // Prevent unselecting the last day
        return prev.filter((d) => d !== idx);
      } else {
        return [...prev, idx].sort();
      }
    });
  };

  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
    // 종료 시간이 시작 시간보다 이르거나 같으면 자동 보정
    if (time >= endTime) {
      const [h, m] = time.split(":").map(Number);
      const totalMinutesNext = h * 60 + m + 60; // 1시간 후
      if (totalMinutesNext <= 24 * 60) {
        // 일반 경우: 1시간 후로 설정 (최대 24:00)
        const nh = Math.floor(totalMinutesNext / 60);
        const nm = totalMinutesNext % 60;
        setEndTime(
          `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`,
        );
      } else {
        // 선택 가능한 최대 시간(24:00)으로 보정
        setEndTime("24:00");
      }
    }
  };

  const handleSubmit = async () => {
    if (isSaving) return;
    if (!title.trim()) return;

    if (startTime >= endTime) {
      setErrorMsg("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }

    setErrorMsg(null);
    setIsSaving(true);
    try {
      const dataList = selectedDays.map((day) => ({
        title: title.trim(),
        day_of_week: day,
        start_time: startTime,
        end_time: endTime,
        place_name: placeName.trim() || null,
        place_address: placeAddress.trim() || null,
        color,
        memo: memo.trim() || null,
      }));
      await onSave(dataList);
      onClose();
    } catch (err) {
      setErrorMsg("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!blockToEdit || isSaving) return;

    const confirmed = await confirm({
      title: "시간표 삭제",
      message: "정말 이 시간표를 삭제할까요?\n이 작업은 되돌릴 수 없습니다.",
      confirmText: "삭제",
      isDanger: true,
    });

    if (confirmed) {
      setIsSaving(true);
      try {
        await onDelete(blockToEdit.id);
        onClose();
      } catch (err) {
        setErrorMsg("삭제 중 오류가 발생했습니다.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const footerContent = (
    <div className="w-full flex gap-3">
      {blockToEdit && (
        <Button
          variant="secondary"
          onClick={handleDeleteClick}
          disabled={isSaving}
          className="!w-auto px-5 shrink-0"
        >
          <Trash2 size={20} className="text-gray-400 transition-colors" />
        </Button>
      )}
      <Button
        variant="primary"
        onClick={handleSubmit}
        disabled={isSaving || !title.trim()}
      >
        {isSaving ? (
          <Loader2 size={16} className="animate-spin" />
        ) : blockToEdit ? (
          "수정 내용 저장"
        ) : (
          "시간표 등록하기"
        )}
      </Button>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={blockToEdit ? "시간표 수정" : "새 시간표 추가"}
      icon={blockToEdit ? Edit2 : Plus}
      maxWidth="lg"
      footer={footerContent}
    >
      <div className="space-y-7">
        {errorMsg && (
          <div className="bg-rose-50 text-rose-500 text-sm font-bold px-4 py-3 rounded-2xl flex items-center gap-2">
            <X size={16} />
            {errorMsg}
          </div>
        )}

        {/* 제목 */}
        <div className="space-y-2">
          <label className="block text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest px-1">
            제목
          </label>
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="수업명, 일정명을 입력하세요"
            className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner focus:ring-2 focus:ring-rose-200 font-bold text-sm sm:text-base outline-none"
            required
          />
        </div>

        {/* 요일 */}
        <div className="space-y-3">
          <label className="block text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest px-1">
            요일 (중복 선택 가능)
          </label>
          <div className="flex gap-2">
            {DAYS.map((day, idx) => {
              const isSelected = selectedDays.includes(idx);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleDay(idx)}
                  className={`flex-1 py-3 rounded-2xl text-xs sm:text-sm font-black transition-all ${
                    isSelected
                      ? "bg-rose-400 text-white shadow-lg shadow-rose-100"
                      : `bg-gray-50 hover:bg-gray-100 ${
                          idx === 0
                            ? "text-red-400"
                            : idx === 6
                              ? "text-blue-400"
                              : "text-gray-400"
                        }`
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* 시간 */}
        <div className="space-y-3">
          <label className="block text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest px-1">
            시간
          </label>
          <div className="grid grid-cols-2 gap-4">
            <TimePicker
              label="시작 시간"
              value={startTime}
              onChange={handleStartTimeChange}
            />
            <TimePicker
              label="종료 시간"
              value={endTime}
              onChange={setEndTime}
              isEndTime
            />
          </div>
        </div>

        {/* 색상 */}
        <div className="space-y-3">
          <label className="block text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest px-1">
            색상
          </label>
          <div className="flex flex-wrap gap-2.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-9 h-9 rounded-full transition-all ${
                  color === c
                    ? "scale-125 ring-2 ring-offset-2 ring-gray-400"
                    : "hover:scale-110"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* 장소 */}
        <div className="space-y-2">
          <label className="block text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest px-1">
            장소 (선택)
          </label>
          <div className="relative">
            <div className="relative flex items-center">
              <MapPin
                size={16}
                className="absolute left-4 text-gray-500 pointer-events-none"
              />
              <input
                type="text"
                value={placeQuery}
                onChange={handlePlaceQueryChange}
                onFocus={() => placeQuery.trim() && setShowPlaceSearch(true)}
                placeholder="어디로 가야하나요?"
                className="w-full pl-10 pr-10 py-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner focus:ring-2 focus:ring-rose-200 font-bold text-sm outline-none"
              />
              {isSearching && (
                <Loader2
                  size={16}
                  className="absolute right-4 text-gray-500 animate-spin"
                />
              )}
              {!isSearching && placeQuery && (
                <button
                  type="button"
                  onClick={handleClearPlace}
                  className="absolute right-4 w-5 h-5 flex items-center justify-center bg-gray-200 text-gray-400 rounded-full hover:bg-rose-100 hover:text-rose-400 transition-all"
                >
                  <X size={10} strokeWidth={3} />
                </button>
              )}
            </div>

            {/* 검색 결과 드롭다운 */}
            <AnimatePresence>
              {showPlaceSearch && placeResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-10 max-h-48 overflow-y-auto custom-scrollbar"
                >
                  {placeResults.slice(0, 5).map((place) => (
                    <button
                      key={place.id}
                      type="button"
                      onClick={() => handleSelectPlace(place)}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-rose-50 transition-colors text-left"
                    >
                      <MapPin
                        size={14}
                        className="text-rose-400 mt-0.5 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">
                          {place.place_name}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">
                          {place.road_address_name || place.address_name}
                        </p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {placeAddress && (
              <p className="mt-1.5 px-2 text-[11px] text-gray-400 font-medium truncate">
                📍 {placeAddress}
              </p>
            )}
          </div>
        </div>

        {/* 메모 */}
        <div className="space-y-2">
          <label className="block text-[10px] sm:text-xs font-black text-gray-500 uppercase tracking-widest px-1">
            메모 (선택)
          </label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="추가 메모를 남겨보세요"
            className="w-full px-6 py-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner focus:ring-2 focus:ring-rose-200 font-bold text-sm sm:text-base h-24 resize-none outline-none"
          />
        </div>
      </div>
    </BaseModal>
  );
};

export default TimetableBlockModal;
