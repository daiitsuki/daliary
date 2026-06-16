import React, { useState, useCallback, useRef } from "react";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  MapPin,
  Share2,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MemoryFeedItem } from "../../../hooks/useMemoryFeed";
import { supabase } from "../../../lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { useHomeData } from "../../../hooks/useHomeData";
import { useConfirm } from "../../../context/ConfirmContext";
import { shareContent, ShareTemplates } from "../../../utils/shareUtils";
import { useToast } from "../../../context/ToastContext";

interface Props {
  item: MemoryFeedItem;
  onOpenDetail: () => void;
}

export default function MemoryCard({ item, onOpenDetail }: Props) {
  const queryClient = useQueryClient();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const { couple, myProfile } = useHomeData();
  const isOwner = item.writer_id == null || item.writer_id === myProfile?.id;
  const [showMenu, setShowMenu] = useState(false);
  const [showHeartAnim, setShowHeartAnim] = useState(false);

  // Optimistic UI states
  const [localLiked, setLocalLiked] = useState(item.is_liked);
  const [localLikeCount, setLocalLikeCount] = useState(item.like_count);

  const likeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const writerName = item.writer?.nickname || "우리의 추억";
  const writerAvatar = item.writer?.avatar_url || null;

  const handleToggleLike = useCallback(async () => {
    const newLikedStatus = !localLiked;
    const newCount = newLikedStatus ? localLikeCount + 1 : localLikeCount - 1;

    setLocalLiked(newLikedStatus);
    setLocalLikeCount(newCount);

    if (newLikedStatus) {
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 1000);
    }

    if (likeTimerRef.current) clearTimeout(likeTimerRef.current);

    likeTimerRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase.rpc("toggle_visit_like", {
          p_visit_id: item.id,
        });
        if (error) throw error;

        queryClient.setQueryData(
          ["memory_feed", couple?.id],
          (oldData: any) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page: any) => ({
                ...page,
                data: page.data.map((v: any) =>
                  v.id === item.id
                    ? { ...v, is_liked: newLikedStatus, like_count: newCount }
                    : v,
                ),
              })),
            };
          },
        );
      } catch (err) {
        console.error("Like toggle failed:", err);
        setLocalLiked(item.is_liked);
        setLocalLikeCount(item.like_count);
      }
    }, 400);
  }, [localLiked, localLikeCount, item.id, queryClient, couple?.id]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!localLiked) {
      handleToggleLike();
    } else {
      setShowHeartAnim(true);
      setTimeout(() => setShowHeartAnim(false), 1000);
    }
  };

  const handleShare = async () => {
    const template = ShareTemplates.memory(item.place.name, item.id);
    const result = await shareContent(template.title, template.text, template.url);
    if (result === 'copied') {
      showToast("클립보드에 복사되었어요. 메신저에 붙여넣기 해주세요!", "success");
    } else if (result === 'failed') {
      showToast("링크 복사에 실패했어요.", "error");
    }
    setShowMenu(false);
  };

  const handleDeleteVisit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const isConfirmed = await confirm({
      title: "방문 인증 삭제",
      message: "해당 방문 인증을 삭제할까요?",
      confirmText: "삭제",
      isDanger: true,
    });
    if (!isConfirmed) return;
    try {
      const { error } = await supabase
        .from("visits")
        .delete()
        .eq("id", item.id);
      if (error) throw error;

      // Storage 파일 정리
      if (item.image_url) {
        try {
          let bucket: string | null = null;
          let filePath: string | null = null;
          if (item.image_url.includes("/visit-photos/")) {
            bucket = "visit-photos";
            filePath = decodeURIComponent(item.image_url.split("/visit-photos/")[1].split("?")[0]);
          } else if (item.image_url.includes("/diary-images/")) {
            bucket = "diary-images";
            filePath = decodeURIComponent(item.image_url.split("/diary-images/")[1].split("?")[0]);
          }
          if (bucket && filePath) {
            await supabase.storage.from(bucket).remove([filePath]);
          }
        } catch (deleteErr) {
          console.error("방문 사진 Storage 삭제 실패 (무시됨):", deleteErr);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["memory_feed"] });
      queryClient.invalidateQueries({ queryKey: ["places_data"] });
    } catch (err) {
      console.error("Delete failed:", err);
      showToast("삭제 중 오류가 발생했습니다.", "error");
    }
    setShowMenu(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mb-8 bg-white/40 backdrop-blur-[32px] border border-white/50 rounded-[32px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)] shadow-[0_1px_2px_rgba(255,255,255,0.5)_inset]"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 px-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-white/80 overflow-hidden shadow-sm bg-rose-50 flex items-center justify-center">
            {writerAvatar ? (
              <img
                src={writerAvatar}
                alt={writerName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-rose-400 font-bold text-sm">
                {writerName.slice(0, 1)}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black text-gray-900 leading-none">
              {writerName}
            </span>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] font-bold text-gray-400">
                {new Date(item.visited_at).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="text-[10px] text-gray-300">•</span>
              <span className="text-[10px] font-black text-rose-500 flex items-center gap-0.5">
                <MapPin size={10} /> {item.region}
                {item.sub_region ? `, ${item.sub_region}` : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="text-gray-400 p-2 hover:bg-black/5 rounded-full transition-colors active:scale-95"
          >
            <MoreHorizontal size={20} />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                  }}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl z-20 overflow-hidden py-1"
                >
                  <button
                    onClick={handleShare}
                    className="w-full px-4 py-3 text-left text-xs font-bold text-gray-700 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                  >
                    <Share2 size={14} /> 공유하기
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDetail();
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-3 text-left text-xs font-bold text-gray-700 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                  >
                    <ExternalLink size={14} /> 상세 정보
                  </button>
                  {isOwner && (
                    <>
                      <div className="h-px bg-black/5 my-1" />
                      <button
                        onClick={handleDeleteVisit}
                        className="w-full px-4 py-3 text-left text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"
                      >
                        <Trash2 size={14} /> 삭제하기
                      </button>
                    </>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Image Container */}
      <div
        className="relative aspect-square w-full bg-gray-100 flex items-center justify-center cursor-pointer overflow-hidden"
        onClick={onOpenDetail}
        onDoubleClick={handleDoubleClick}
      >
        <img
          src={item.image_url}
          alt={item.place.name}
          className="w-full h-full object-cover"
        />

        {/* Heart Animation Overlay */}
        <AnimatePresence>
          {showHeartAnim && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.2, 1],
                opacity: [0, 1, 1],
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
            >
              <div className="bg-white/10 backdrop-blur-md p-10 rounded-full border border-white/20 shadow-2xl">
                <Heart
                  size={100}
                  fill="#f43f5e"
                  className="text-rose-500 filter drop-shadow-[0_0_30px_rgba(244,63,94,0.6)]"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action Bar */}
      <div className="p-4 px-5">
        <div className="flex items-center gap-4 mb-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleLike();
            }}
            className={`transition-all active:scale-75 ${localLiked ? "text-rose-500" : "text-gray-900"}`}
          >
            <Heart
              size={28}
              fill={localLiked ? "currentColor" : "none"}
              strokeWidth={localLiked ? 0 : 2}
            />
          </button>
          <button
            onClick={onOpenDetail}
            className="text-gray-900 transition-all active:scale-75 hover:text-rose-500"
          >
            <MessageCircle size={28} />
          </button>
        </div>

        {/* Likes Count */}
        <div className="mb-2">
          <span className="text-sm font-black text-gray-900">
            좋아요 {localLikeCount.toLocaleString()}개
          </span>
        </div>

        {/* Caption */}
        <div className="mb-3">
          <span className="text-sm font-black text-gray-900 mr-2">
            {writerName}
          </span>
          <span className="text-sm text-gray-600 leading-relaxed font-medium">
            <span className="text-rose-500 font-black">@{item.place.name}</span>{" "}
            {item.comment}
          </span>
        </div>

        {/* Comments Preview */}
        {item.comment_count > 0 && (
          <div className="space-y-1 mt-3 pt-3 border-t border-black/5">
            <button
              onClick={onOpenDetail}
              className="text-xs font-bold text-gray-400 mb-2 block hover:text-rose-500 transition-colors"
            >
              {item.comment_count > 2
                ? `댓글 ${item.comment_count}개 모두 보기`
                : "댓글 상세 보기"}
            </button>
            {item.preview_comments.map((comment) => (
              <div key={comment.id} className="flex items-center gap-2">
                <span className="text-xs font-black text-gray-800 shrink-0">
                  {comment.writer.nickname}
                </span>
                <span className="text-xs text-gray-500 truncate">
                  {comment.content}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
