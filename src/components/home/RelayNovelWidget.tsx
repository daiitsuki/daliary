import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight, Library } from "lucide-react";

import RelayNovelModal from "./RelayNovelModal";
import CompletedRelayNovelsModal from "./CompletedRelayNovelsModal";
import { useCompletedRelayNovels } from "../../hooks/features/useCompletedRelayNovels";
import { useHomeData } from "../../hooks";


export default function RelayNovelWidget() {
  const { ongoingRelayNovel, partnerProfile, currentUserId, myProfile } = useHomeData();
  const partnerNickname = partnerProfile?.nickname || "상대방";
  const myProfileId = currentUserId || "";
  const partnerId = partnerProfile?.id;
  const myNickname = myProfile?.nickname || "";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const { novels } = useCompletedRelayNovels();

  return (
    <>
      <section className="mb-6 px-6">
        <div className="flex flex-col gap-2">
          {/* Main Banner */}
          <motion.div
            onClick={() => setIsModalOpen(true)}
            className="group flex cursor-pointer items-center justify-between rounded-[24px] border border-rose-100/50 bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-colors hover:bg-rose-50/30"
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[16px] bg-rose-50 text-rose-400 shadow-sm">
                <BookOpen size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="mb-0.5 text-[11px] font-bold tracking-tight text-rose-400/80">
                  📖{" "}
                  {ongoingRelayNovel
                    ? ongoingRelayNovel.title
                    : "릴레이 소설 이어쓰기"}
                </p>
                {!ongoingRelayNovel ? (
                  <p className="text-[13px] leading-tight font-bold text-gray-700">
                    새로운 이야기를 시작해볼까요?
                  </p>
                ) : (
                  <p className="xs:max-w-[250px] line-clamp-1 max-w-[200px] font-serif text-[13px] leading-tight font-medium text-gray-600 italic sm:max-w-[300px]">
                    {ongoingRelayNovel.last_turn_content
                      ? `"${ongoingRelayNovel.last_turn_content}"`
                      : "첫 문장을 작성해주세요..."}
                  </p>
                )}
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors group-hover:bg-rose-100 group-hover:text-rose-400">
              <ChevronRight
                size={18}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </div>
          </motion.div>

          {/* Completed Novels Button (Only if there are completed novels) */}
          {novels.length > 0 && (
            <div className="flex justify-end px-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCompletedModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-gray-400 transition-colors hover:text-rose-400"
              >
                <Library size={12} />
                완결작 보러가기
              </button>
            </div>
          )}
        </div>
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
