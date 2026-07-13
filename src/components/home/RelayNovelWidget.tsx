import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Plus, ChevronRight } from "lucide-react";
import { RelayNovel } from "../../types";
import RelayNovelModal from "./RelayNovelModal";
import CompletedRelayNovelsModal from "./CompletedRelayNovelsModal";
import { useCompletedRelayNovels } from "../../hooks/features/useCompletedRelayNovels";

interface RelayNovelWidgetProps {
  ongoingRelayNovel: RelayNovel | null;
  partnerNickname: string;
  myProfileId: string;
  partnerId?: string;
  myNickname?: string;
}

export default function RelayNovelWidget({
  ongoingRelayNovel,
  partnerNickname,
  myProfileId,
  partnerId,
  myNickname,
}: RelayNovelWidgetProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const { novels } = useCompletedRelayNovels();

  return (
    <>
      <section className="px-6 mb-6">
        <motion.div
          onClick={() => setIsModalOpen(true)}
          className="bg-white p-6 rounded-[32px] shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-rose-50/50 relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-50/50 rounded-full blur-2xl transition-colors duration-500" />
          
          <div className="flex items-center gap-3 mb-3 relative z-10">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-400 flex items-center justify-center shrink-0">
              <BookOpen size={16} strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h3 className="text-gray-800 font-bold text-[14px] leading-relaxed tracking-tight flex items-center gap-2">
                릴레이 소설
                {novels.length > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsCompletedModalOpen(true); }}
                    className="text-[10px] font-bold text-rose-400 bg-rose-50 px-2 py-0.5 rounded-full hover:bg-rose-100 transition-colors"
                  >
                    완결작 보기
                  </button>
                )}
              </h3>
            </div>
          </div>

          <div className="relative z-10">
            {!ongoingRelayNovel ? (
              <div className="bg-gray-50/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center border border-gray-100 border-dashed">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-300 mb-2 shadow-sm">
                  <Plus size={20} strokeWidth={2.5} />
                </div>
                <p className="text-gray-500 font-bold text-[13px]">
                  새로운 이야기를 시작해보세요
                </p>
                <p className="text-gray-400 text-[12px] mt-1">
                  100턴을 채워 이야기를 완성해보세요!
                </p>
              </div>
            ) : (
              <div className="bg-rose-50/30 rounded-2xl p-4 border border-rose-100/30">
                <p className="text-[12px] text-gray-800 font-bold mb-1.5 flex items-center gap-1 font-serif">
                  {ongoingRelayNovel.title}
                </p>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-gray-600 text-[13px] font-medium leading-relaxed line-clamp-2 italic font-serif">
                    {ongoingRelayNovel.last_turn_content || "..."}
                  </p>
                  <div className="w-6 h-6 rounded-full bg-white text-rose-300 flex items-center justify-center shadow-sm shrink-0 mt-1">
                    <ChevronRight size={14} strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      <RelayNovelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        novelId={ongoingRelayNovel?.id}
        partnerNickname={partnerNickname}
        myProfileId={myProfileId}
        partnerId={partnerId}
        myNickname={myNickname}
      />
      <CompletedRelayNovelsModal
        isOpen={isCompletedModalOpen}
        onClose={() => setIsCompletedModalOpen(false)}
        partnerNickname={partnerNickname}
        myProfileId={myProfileId}
      />
    </>
  );
}
