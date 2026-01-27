import { useState, useMemo } from "react";
import { usePlaces, VisitWithPlace, DiaryWithRegion } from "../context/PlacesContext";
import { MapPin, ArrowLeft, ImageIcon } from "lucide-react";
import KoreaMap from "./KoreaMap";
import { motion } from "framer-motion";
import VisitDetailModal from "./VisitDetailModal";

/**
 * 1. 대시보드 헤더 컴포넌트
 */
const DashboardHeader = ({ visitedRegionsCount, totalVisits }: { visitedRegionsCount: number; totalVisits: number }) => (
  <div className="px-6 pt-4 pb-2 shrink-0">
    <h1 className="text-xl font-bold text-gray-800 mb-1">우리의 여행 지도 🗺️</h1>
    <p className="text-gray-600 text-xs font-medium">
      지금까지 <span className="text-rose-500 font-bold">{visitedRegionsCount}개</span> 지역, 총{" "}
      <span className="text-rose-500 font-bold">{totalVisits}곳</span>을 함께 다녀왔어요.
    </p>
  </div>
);

/**
 * 2. 지역 상세 뷰 컴포넌트
 */
const RegionDetailView = ({ 
  region, 
  visits, 
  diaries, 
  onBack, 
  onVisitClick 
}: { 
  region: string; 
  visits: VisitWithPlace[]; 
  diaries: DiaryWithRegion[]; 
  onBack: () => void;
  onVisitClick: (v: VisitWithPlace) => void;
}) => {
  const groupedVisits = useMemo(() => {
    return visits.reduce((acc, v) => {
      const date = new Date(v.visited_at);
      const key = `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(v);
      return acc;
    }, {} as Record<string, VisitWithPlace[]>);
  }, [visits]);

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      <div className="bg-white px-4 py-4 border-b border-gray-100 shrink-0 flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-gray-800">{region}</h2>
          <p className="text-[10px] text-gray-500 font-medium">방문 {visits.length} · 일기 {diaries.length}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-10 custom-scrollbar pb-32">
        {/* 방문 인증 섹션 */}
        {visits.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest px-1">방문 인증</h3>
            <div className="space-y-8">
              {Object.entries(groupedVisits).map(([monthKey, monthVisits]) => (
                <div key={monthKey} className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-1 h-3 bg-rose-400 rounded-full"></div>
                    <h4 className="text-[11px] font-black text-gray-600 uppercase tracking-tight">{monthKey}</h4>
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
                    {monthVisits.map((v) => (
                      <motion.div
                        key={v.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onVisitClick(v)}
                        className="group relative bg-gray-50 aspect-square overflow-hidden rounded-xl border border-gray-100 shadow-sm transition-all cursor-pointer"
                      >
                        {v.image_url ? (
                          <img src={v.image_url} className="w-full h-full object-cover" alt={v.places?.name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-rose-200 bg-rose-50/30">
                            <ImageIcon size={24} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2 text-center">
                          <p className="text-[10px] text-white font-black leading-tight drop-shadow-md">{v.places?.name}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 다이어리 섹션 */}
        {diaries.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-900 px-1 uppercase tracking-tight">추억 기록</h3>
            <div className="space-y-3">
              {diaries.map((d) => (
                <div key={d.id} className="bg-[#FDFBF7] p-4 rounded-2xl border border-rose-100/50 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-rose-400/30"></div>
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] font-bold text-rose-400">
                      {new Date(d.created_at).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                    {d.mood && <span className="text-[10px] bg-rose-50 text-rose-500 px-2 py-0.5 rounded-full font-medium"># {d.mood}</span>}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{d.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {visits.length === 0 && diaries.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="text-gray-200" size={32} />
            </div>
            <p className="text-sm text-gray-400">아직 이 지역의 추억이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 메인 RegionDashboard 컴포넌트
 */
const RegionDashboard = () => {
  const { stats, visits, diaries, updateVisit, deleteVisit } = usePlaces();
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<VisitWithPlace | null>(null);

  const totalVisits = visits.length;
  const visitedRegionsCount = useMemo(
    () => Object.values(stats).filter((count) => count > 0).length,
    [stats],
  );

  const filteredVisits = useMemo(() => 
    visits.filter((v) => v.region === selectedRegion).sort((a, b) => new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime()),
    [visits, selectedRegion]
  );

  const filteredDiaries = useMemo(() => 
    diaries.filter((d) => d.region === selectedRegion).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [diaries, selectedRegion]
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {selectedRegion ? (
        <RegionDetailView 
          region={selectedRegion}
          visits={filteredVisits}
          diaries={filteredDiaries}
          onBack={() => setSelectedRegion(null)}
          onVisitClick={setSelectedVisit}
        />
      ) : (
        <>
          <DashboardHeader visitedRegionsCount={visitedRegionsCount} totalVisits={totalVisits} />
          <div className="flex-1 w-full max-w-lg mx-auto flex items-center justify-center min-h-0 overflow-hidden">
            <KoreaMap stats={stats} onRegionClick={setSelectedRegion} />
          </div>
        </>
      )}

      {selectedVisit && (
        <VisitDetailModal 
          visit={selectedVisit}
          onClose={() => setSelectedVisit(null)}
          onUpdate={updateVisit}
          onDelete={deleteVisit}
        />
      )}
    </div>
  );
};

export default RegionDashboard;