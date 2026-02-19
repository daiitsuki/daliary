import { useMemo, useEffect } from "react";
import { ArrowLeft, ImageIcon, MapPin, Calendar, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { VisitWithPlace } from "../../context/PlacesContext";

interface RegionDetailOverlayProps {
  region: string;
  visits: VisitWithPlace[];
  onBack: () => void;
  onVisitClick: (v: VisitWithPlace) => void;
}

const RegionDetailOverlay = ({
  region,
  visits,
  onBack,
  onVisitClick,
}: RegionDetailOverlayProps) => {
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
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-40 bg-white flex flex-col"
    >
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-100 shrink-0 flex items-center justify-between shadow-sm z-10">
        <button
          onClick={onBack}
          className="p-2.5 hover:bg-gray-50 rounded-full transition-colors text-gray-800 -ml-2"
        >
          <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-black text-gray-800">{region}</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            {visits.length} Memories
          </p>
        </div>
        <div className="w-10"></div> {/* Spacer for alignment */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-1 pb-32 bg-gray-50/50">
        {visits.length > 0 ? (
          <div className="max-w-3xl mx-auto w-full p-4 md:p-6 space-y-8">
            {Object.entries(groupedVisits).map(([monthKey, monthVisits]) => (
              <div key={monthKey} className="space-y-3">
                <div className="sticky top-0 z-10 py-2 bg-gray-50/95 backdrop-blur-sm flex items-center gap-2 px-1">
                  <Calendar size={14} className="text-rose-400" />
                  <h4 className="text-xs font-black text-gray-600 uppercase tracking-tight">
                    {monthKey}
                  </h4>
                </div>
                <div className="grid grid-cols-3 gap-1 md:gap-3">
                  {monthVisits.map((v) => (
                    <motion.div
                      key={v.id}
                      layoutId={`visit-${v.id}`}
                      onClick={() => onVisitClick(v)}
                      className="group relative aspect-square overflow-hidden bg-gray-100 cursor-pointer rounded-lg"
                    >
                      {v.image_url ? (
                        <img
                          src={v.image_url}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          alt={v.places?.name}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-100 gap-2">
                          <ImageIcon size={20} />
                        </div>
                      )}
                      {/* Always visible gradient & text for mobile accessibility */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-[11px] text-white font-black line-clamp-1 leading-tight drop-shadow-sm flex-1">
                            {v.places?.name}
                          </p>
                          {v.visit_comments && v.visit_comments[0]?.count > 0 && (
                            <div className="flex items-center gap-0.5 text-white/90 drop-shadow-sm">
                              <MessageCircle size={10} fill="currentColor" />
                              <span className="text-[10px] font-bold">{v.visit_comments[0].count}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 animate-pulse">
              <MapPin className="text-gray-300" size={32} />
            </div>
            <h3 className="text-sm font-black text-gray-800 mb-1">아직 기록이 없어요</h3>
            <p className="text-xs text-gray-400 font-medium">
              이 지역을 여행하고 첫 번째 추억을 남겨보세요!
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default RegionDetailOverlay;
