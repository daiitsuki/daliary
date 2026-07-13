import { useState } from "react";
import { BookOpen, Trash2, ChevronRight, Loader2 } from "lucide-react";
import BaseModal from "../common/BaseModal";
import Button from "../common/Button";
import { useCompletedRelayNovels } from "../../hooks/features/useCompletedRelayNovels";
import { useConfirm } from "../../context/ConfirmContext";
import RelayNovelModal from "./RelayNovelModal";

interface CompletedRelayNovelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerNickname: string;
  myProfileId: string;
}

export default function CompletedRelayNovelsModal({
  isOpen,
  onClose,
  partnerNickname,
  myProfileId,
}: CompletedRelayNovelsModalProps) {
  const { novels, isLoading, deleteNovel } = useCompletedRelayNovels();
  const { confirm } = useConfirm();
  const [selectedNovelId, setSelectedNovelId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const isConfirmed = await confirm({
      title: "소설 삭제",
      message:
        "이 완결된 소설을 삭제하시겠습니까?\n삭제된 소설은 복구할 수 없습니다.",
      confirmText: "삭제",
      cancelText: "취소",
      isDanger: true,
    });

    if (isConfirmed) {
      await deleteNovel(id);
    }
  };

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="완결된 릴레이 소설"
        subtitle="우리가 함께 완성한 이야기들"
        icon={BookOpen}
        contentClassName="p-4 md:p-6 bg-gray-50/50 min-h-[40vh] max-h-[70vh] overflow-y-auto custom-scrollbar"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="animate-spin text-rose-300" size={32} />
          </div>
        ) : novels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-300 mb-3 shadow-sm">
              <BookOpen size={24} />
            </div>
            <p className="text-gray-500 font-bold text-[14px]">
              아직 완결된 소설이 없습니다.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {novels.map((novel) => (
              <div
                key={novel.id}
                onClick={() => setSelectedNovelId(novel.id)}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:border-rose-200 transition-colors group flex items-start justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-gray-800 font-bold text-[15px] truncate mb-1 font-serif">
                    {novel.title}
                  </h4>
                  <p className="text-gray-500 text-[13px] line-clamp-2 leading-relaxed font-serif break-keep break-words">
                    {novel.last_turn_content}
                  </p>
                  <p className="text-gray-400 text-[10px] font-medium mt-2">
                    {new Date(novel.updated_at).toLocaleDateString()} 완결
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Button
                    variant="danger-ghost"
                    size="sm"
                    fullWidth={false}
                    onClick={(e) => handleDelete(e, novel.id)}
                    className="p-1.5 opacity-50 hover:opacity-100"
                    icon={<Trash2 size={16} />}
                  />
                  <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-300 flex items-center justify-center group-hover:bg-rose-100 group-hover:text-rose-400 transition-colors">
                    <ChevronRight size={14} strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </BaseModal>

      <RelayNovelModal
        isOpen={!!selectedNovelId}
        onClose={() => setSelectedNovelId(null)}
        novelId={selectedNovelId || undefined}
        partnerNickname={partnerNickname}
        myProfileId={myProfileId}
        partnerId="" // Not needed for completed viewing
        myNickname="" // Not needed for completed viewing
      />
    </>
  );
}
