import React, { useMemo } from "react";
import { MapPin, ChevronRight, Clock } from "lucide-react";
import { VisitWithPlace } from "../../../../context/PlacesContext";
import { differenceInDays, parseISO, startOfDay } from "date-fns";
import BaseModal from "../../../common/BaseModal";

interface RecentVisitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProvince: string | null;
  visits: VisitWithPlace[];
  onSelectVisit: (
    province: string,
    subRegion?: string,
    visitId?: string,
  ) => void;
}

// Relative elapsed time formatting helper
const getRelativeTimeBadge = (dateString: string) => {
  const today = startOfDay(new Date());
  const targetDate = startOfDay(parseISO(dateString));
  const diff = differenceInDays(today, targetDate);

  if (diff < 0) {
    return {
      text: "방문 예정",
      className: "bg-amber-50 text-amber-600 border border-amber-100/50",
    };
  }
  if (diff === 0) {
    return {
      text: "오늘",
      className:
        "bg-emerald-50 text-emerald-600 border border-emerald-100/50 font-black",
    };
  }
  if (diff < 7) {
    return {
      text: `${diff}일 전`,
      className: "bg-emerald-50 text-emerald-600 border border-emerald-100/50",
    };
  }
  if (diff < 30) {
    const weeks = Math.floor(diff / 7);
    return {
      text: `${weeks}주일 전`,
      className: "bg-sky-50 text-sky-600 border border-sky-100/50",
    };
  }
  if (diff < 365) {
    const months = Math.floor(diff / 30);
    return {
      text: `${months}개월 전`,
      className: "bg-rose-50 text-rose-600 border border-rose-100/50",
    };
  }

  const years = Math.floor(diff / 365);
  if (years >= 3) {
    return {
      text: "오래전",
      className: "bg-gray-100 text-gray-500 border border-gray-200/50",
    };
  }
  return {
    text: `${years}년 전`,
    className: "bg-gray-100 text-gray-500 border border-gray-200/50",
  };
};

const RecentVisitsModal: React.FC<RecentVisitsModalProps> = ({
  isOpen,
  onClose,
  selectedProvince,
  visits,
  onSelectVisit,
}) => {
  // Filter and limit to recent 15 visits
  const recentVisits = useMemo(() => {
    const filtered = selectedProvince
      ? visits.filter((v) => v.region === selectedProvince)
      : visits;
    return filtered.slice(0, 15);
  }, [selectedProvince, visits]);

  const handleItemClick = (visit: VisitWithPlace) => {
    onSelectVisit(visit.region, visit.sub_region || undefined, visit.id);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedProvince ? `${selectedProvince} 최근 방문 기록` : "최근 방문 기록"}
      subtitle={`최근 ${recentVisits.length}곳의 장소를 표시합니다.`}
      icon={Clock}
      contentClassName="bg-white p-5 sm:p-6 space-y-3"
    >
      {recentVisits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center text-sky-300 mb-3">
            <MapPin size={20} />
          </div>
          <p className="text-sm font-bold text-gray-500">
            아직 방문 기록이 없습니다.
          </p>
          <p className="text-xs text-gray-300 mt-1">
            지도를 클릭해 첫 방문을 기록해보세요!
          </p>
        </div>
      ) : (
        recentVisits.map((visit) => {
          const badge = getRelativeTimeBadge(visit.visited_at);
          const displayTitle = visit.places?.name || "장소명 없음";
          const displayRegion = visit.sub_region
            ? `${visit.region} ${visit.sub_region}`
            : visit.region;

          return (
            <button
              key={visit.id}
              onClick={() => handleItemClick(visit)}
              className="w-full text-left flex items-center justify-between p-4 rounded-[24px] bg-gray-50/60 border border-gray-100/50 transition-all active:scale-[0.98] active:bg-rose-50/20 group"
            >
              <div className="flex-1 mr-4 min-w-0">
                <p className="text-[10px] font-bold text-gray-400 mb-0.5">
                  {displayRegion}
                </p>
                <h4 className="text-sm font-bold text-gray-800 truncate">
                  {displayTitle}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${badge.className}`}
                >
                  {badge.text}
                </span>
                <ChevronRight
                  size={14}
                  className="text-gray-300 flex-shrink-0"
                />
              </div>
            </button>
          );
        })
      )}
    </BaseModal>
  );
};

export default RecentVisitsModal;
