import { useUserStats } from "../../hooks";
import {
  CalendarCheck,
  MessageCircleQuestion,
  MapPin,
  MessageSquare,
  Heart,
  Coins,
  Loader2,
} from "lucide-react";

export default function ActivityStatsSection({
  profileId,
}: {
  profileId?: string;
}) {
  const { data: stats, isLoading, error } = useUserStats(profileId);

  if (!profileId) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-2 mb-3">
        <h2 className="text-lg font-bold text-gray-800 tracking-tight">
          나의 활동 기록
        </h2>
      </div>

      <div className="bg-white rounded-[28px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-rose-100/30">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-6 h-6 text-rose-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-8 text-[11px] text-rose-400 font-bold bg-rose-50/50 rounded-xl">
            기록을 불러오지 못했어요.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard
              icon={<CalendarCheck className="w-4 h-4 text-emerald-500" />}
              label="누적 출석"
              value={`${stats?.attendances || 0}일`}
              bg="bg-emerald-50"
            />
            <StatCard
              icon={<MessageCircleQuestion className="w-4 h-4 text-blue-500" />}
              label="답변한 질문"
              value={`${stats?.answers || 0}개`}
              bg="bg-blue-50"
            />
            <StatCard
              icon={<MapPin className="w-4 h-4 text-rose-500" />}
              label="방문 인증"
              value={`${stats?.visits || 0}곳`}
              bg="bg-rose-50"
            />
            <StatCard
              icon={<MessageSquare className="w-4 h-4 text-indigo-500" />}
              label="댓글"
              value={`${stats?.comments || 0}개`}
              bg="bg-indigo-50"
            />
            <StatCard
              icon={<Heart className="w-4 h-4 text-pink-500" />}
              label="누른 하트"
              value={`${stats?.likes || 0}번`}
              bg="bg-pink-50"
            />
            <StatCard
              icon={<Coins className="w-4 h-4 text-amber-500" />}
              label="총 획득 포인트"
              value={`${(stats?.total_points || 0).toLocaleString()}P`}
              bg="bg-amber-50"
            />
          </div>
        )}
      </div>
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  bg: string;
}) {
  return (
    <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-gray-50/50 border border-gray-100/80 hover:bg-white hover:shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-full ${bg}`}>{icon}</div>
        <span className="text-[11px] font-bold text-gray-500">{label}</span>
      </div>
      <div className="text-sm font-black text-gray-800 ml-1">{value}</div>
    </div>
  );
}
