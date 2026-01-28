import { useState, useMemo } from "react";
import { usePlaces, VisitWithPlace } from "../context/PlacesContext";
import { MapPin, ArrowLeft, ImageIcon, HelpCircle, X } from "lucide-react";
import KoreaMap from "./KoreaMap";
import { motion } from "framer-motion";
import VisitDetailModal from "./VisitDetailModal";

/**
 * 0. 도움말 모달 컴포넌트
 */
const HelpModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-800">여행 지도 가이드</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
        >
          <X size={20} />
        </button>
      </div>
      <div className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="bg-rose-50 p-2 rounded-full text-rose-500 mt-0.5">
            <MapPin size={16} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-800 mb-1">
              지역을 클릭해보세요
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              지도의 각 지역을 클릭하면 해당 지역의{" "}
              <strong>방문 인증 사진</strong>을 모아서 볼 수 있어요.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="bg-rose-50 p-2 rounded-full text-rose-500 mt-0.5">
            <div className="w-4 h-4 rounded-full bg-rose-400 border-2 border-white shadow-sm"></div>
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-800 mb-1">색상 의미</h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              방문 횟수가 많을수록 지역의 색상이{" "}
              <span className="text-rose-500 font-bold">진한 장미색</span>으로
              변해요. 전국의 모든 지역을 채워보세요!
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-2 bg-gray-800 text-white py-3 rounded-xl font-bold text-sm hover:bg-gray-700 transition-colors"
        >
          알겠어요!
        </button>
      </div>
    </motion.div>
  </div>
);

/**
 * 1. 대시보드 헤더 컴포넌트
 */
const DashboardHeader = ({
  visitedRegionsCount,
  totalVisits,
  onHelpClick,
}: {
  visitedRegionsCount: number;
  totalVisits: number;
  onHelpClick: () => void;
}) => (
  <div className="px-6 pt-4 pb-2 shrink-0">
    <div className="flex items-center gap-2 mb-1">
      <h1 className="text-xl font-bold text-gray-800">우리의 여행 지도 🗺️</h1>
      <button
        onClick={onHelpClick}
        className="text-gray-400 hover:text-rose-400 transition-colors p-1"
        aria-label="도움말 보기"
      >
        <HelpCircle size={18} />
      </button>
    </div>
    <p className="text-gray-600 text-xs font-medium">
      지금까지{" "}
      <span className="text-rose-500 font-bold">{visitedRegionsCount}개</span>{" "}
      지역, 총 <span className="text-rose-500 font-bold">{totalVisits}곳</span>
      을 함께 다녀왔어요.
    </p>
  </div>
);

/**
 * 2. 지역 상세 뷰 컴포넌트
 */
const RegionDetailView = ({
  region,
  visits,
  onBack,
  onVisitClick,
}: {
  region: string;
  visits: VisitWithPlace[];
  onBack: () => void;
  onVisitClick: (v: VisitWithPlace) => void;
}) => {
  const groupedVisits = useMemo(() => {
    return visits.reduce(
      (acc, v) => {
        const date = new Date(v.visited_at);
        const key = `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(v);
        return acc;
      },
      {} as Record<string, VisitWithPlace[]>,
    );
  }, [visits]);

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      <div className="bg-white px-4 py-4 border-b border-gray-100 shrink-0 flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-gray-800">{region}</h2>
          <p className="text-[10px] text-gray-500 font-medium">
            방문 {visits.length}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-10 custom-scrollbar pb-32">
        {/* 방문 인증 섹션 */}
        {visits.length > 0 && (
          <div className="space-y-6">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest px-1">
              방문 인증
            </h3>
            <div className="space-y-8">
              {Object.entries(groupedVisits).map(([monthKey, monthVisits]) => (
                <div key={monthKey} className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-1 h-3 bg-rose-400 rounded-full"></div>
                    <h4 className="text-[11px] font-black text-gray-600 uppercase tracking-tight">
                      {monthKey}
                    </h4>
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
                          <img
                            src={v.image_url}
                            className="w-full h-full object-cover"
                            alt={v.places?.name}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-rose-200 bg-rose-50/30">
                            <ImageIcon size={24} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2 text-center">
                          <p className="text-[10px] text-white font-black leading-tight drop-shadow-md">
                            {v.places?.name}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {visits.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="text-gray-200" size={32} />
            </div>
            <p className="text-sm text-gray-400">
              아직 이 지역의 추억이 없습니다.
            </p>
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
  const { stats, visits, updateVisit, deleteVisit } = usePlaces();
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<VisitWithPlace | null>(
    null,
  );
  const [showHelp, setShowHelp] = useState(false);

  const totalVisits = visits.length;
  const visitedRegionsCount = useMemo(
    () => Object.values(stats).filter((count) => count > 0).length,
    [stats],
  );

  const filteredVisits = useMemo(
    () =>
      visits
        .filter((v) => v.region === selectedRegion)
        .sort(
          (a, b) =>
            new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime(),
        ),
    [visits, selectedRegion],
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {selectedRegion ? (
        <RegionDetailView
          region={selectedRegion}
          visits={filteredVisits}
          onBack={() => setSelectedRegion(null)}
          onVisitClick={setSelectedVisit}
        />
      ) : (
        <>
          <DashboardHeader
            visitedRegionsCount={visitedRegionsCount}
            totalVisits={totalVisits}
            onHelpClick={() => setShowHelp(true)}
          />
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

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
};

export default RegionDashboard;
