import React from "react";
import { motion } from "framer-motion";
import { Smile } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RecentDiarySectionProps {
  recentDiary: any;
}

const RecentDiarySection: React.FC<RecentDiarySectionProps> = ({ recentDiary }) => {
  const navigate = useNavigate();

  return (
    <section>
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">우리의 최근 기록</h2>
        <button
          onClick={() => navigate("/timeline")}
          className="text-[10px] text-gray-300 font-bold hover:text-rose-400 transition-colors"
        >
          VIEW ALL
        </button>
      </div>

      {recentDiary ? (
        <motion.div
          whileHover={{ y: -2 }}
          onClick={() => navigate("/timeline")}
          className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 flex items-start space-x-4 cursor-pointer group"
        >
          <div className="bg-orange-50/50 w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-orange-100/50 transition-colors">
            <Smile className="text-orange-300" size={24} />
          </div>
          <div className="flex-1 overflow-hidden pt-0.5">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">
                {new Date(recentDiary.created_at).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
              </span>
              {recentDiary.mood && (
                <span className="text-[9px] text-rose-300 font-bold uppercase">
                  {recentDiary.mood}
                </span>
              )}
            </div>
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-1 font-medium tracking-tight">
              {recentDiary.content}
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="bg-white p-10 rounded-[28px] border border-dashed border-gray-100 text-center">
          <p className="text-gray-300 text-xs font-medium">아직 기록이 없습니다.</p>
        </div>
      )}
    </section>
  );
};

export default RecentDiarySection;
