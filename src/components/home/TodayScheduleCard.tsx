import { useQuery } from "@tanstack/react-query";
import { Calendar, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useCouple, useHomeData } from "../../hooks";
import { getKSTDateString } from "../../utils/dateUtils";
import { CATEGORY_CONFIG } from "../calendar/constants";

interface TodaySchedule {
  id: string;
  title: string;
  category: "me" | "partner" | "couple";
  color: string;
  start_date: string;
  end_date: string;
  writer_id: string;
}

export default function TodayScheduleCard() {
  const { couple, profile } = useCouple();
  const { partnerProfile } = useHomeData();
  const navigate = useNavigate();
  const today = getKSTDateString();

  const partnerName = partnerProfile?.nickname || "파트너";
  const myName = profile?.nickname || "나";

  const { data: todaySchedules = [], isLoading } = useQuery({
    queryKey: ["today_schedules", couple?.id, today],
    queryFn: async () => {
      if (!couple?.id || !profile?.id) return [];

      const { data, error } = await supabase
        .from("schedules")
        .select("id, couple_id, writer_id, title, start_date, end_date, color, category")
        .eq("couple_id", couple.id)
        .lte("start_date", today)
        .gte("end_date", today)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data || []).map((schedule: any) => {
        if (schedule.category === "couple") return schedule;
        const isWriter = schedule.writer_id === profile.id;
        let effectiveCategory = schedule.category;
        if (!isWriter) {
          effectiveCategory = schedule.category === "me" ? "partner" : "me";
        }
        return {
          ...schedule,
          category: effectiveCategory,
          color: CATEGORY_CONFIG[effectiveCategory as keyof typeof CATEGORY_CONFIG]?.color || schedule.color,
        };
      }) as TodaySchedule[];
    },
    enabled: !!couple?.id && !!profile?.id,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) {
    return (
      <div className="px-6 mb-4">
        <div className="h-24 w-full rounded-[24px] bg-white p-4 shadow-xs border border-gray-100 animate-pulse" />
      </div>
    );
  }

  const getCategoryLabel = (category: "me" | "partner" | "couple") => {
    if (category === "couple") return "우리";
    if (category === "me") return myName;
    return partnerName;
  };

  return (
    <section className="px-6 mb-4">
      <div
        onClick={() => navigate("/calendar")}
        className="group cursor-pointer rounded-[24px] border border-gray-100 bg-white p-4 shadow-xs transition-all hover:border-gray-200"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
              <Calendar size={15} />
            </div>
            <h3 className="text-sm font-bold text-gray-900">오늘의 일정</h3>
            {todaySchedules.length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-50 px-1.5 text-[10px] font-bold text-rose-500">
                {todaySchedules.length}
              </span>
            )}
          </div>
          <div className="flex items-center text-xs font-semibold text-gray-400 group-hover:text-rose-500 transition-colors">
            <span>달력</span>
            <ChevronRight size={14} />
          </div>
        </div>

        {todaySchedules.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {todaySchedules.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-xl bg-gray-50/70 px-3 py-2 text-xs"
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[10px] font-bold shrink-0 text-gray-500">
                  {getCategoryLabel(item.category)}
                </span>
                <span className="truncate font-semibold text-gray-800">
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-gray-50/50 px-3 py-3 text-center">
            <p className="text-xs font-medium text-gray-400">등록된 일정이 없어요</p>
          </div>
        )}
      </div>
    </section>
  );
}
