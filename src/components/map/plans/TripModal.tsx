import { useState, useEffect } from "react";
import {
  Check,
  Plane,
  Tent,
  Map,
  Heart,
  Palmtree,
  Building,
  Edit,
} from "lucide-react";
import DatePicker from "../../common/DatePicker";
import { useTrips } from "../../../hooks";
import { Trip } from "../../../types";
import { useToast } from "../../../context/ToastContext";
import {
  parseTripTitle,
  serializeTripTitle,
  TRIP_ICONS,
} from "../../../utils/tripHelpers";
import BaseModal from "../../common/BaseModal";
import Button from "../../common/Button";
import Input from "../../common/Input";

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
    new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );

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

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={trip ? "여행 계획 수정" : "새로운 여행 계획"}
      icon={trip ? Edit : Plane}
      contentClassName="bg-white p-6"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="여행 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="어디로 떠나시나요?"
          required
        />

        {/* 아이콘 선택 */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-bold text-gray-700 ml-1">
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
                    <IconComponent size={18} strokeWidth={isActive ? 3 : 2} />
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
          <Button
            type="submit"
            variant="primary"
            disabled={createTrip.isPending || updateTrip.isPending}
            icon={<Check size={18} strokeWidth={3} />}
          >
            {trip ? "수정 완료" : "계획 시작하기"}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
}
