import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  MoreVertical,
  Trash2,
  Loader2,
  ImageIcon,
  Send,
  MapPin,
  Edit2,
  Check,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import imageCompression from "browser-image-compression";
import { VisitWithPlace } from "../../../context/PlacesContext";
import { useVisitComments } from "../../../hooks/useVisitComments";
import { useCouple } from "../../../hooks/useCouple";
import {
  KOREA_REGIONS,
  SUB_REGIONS,
} from "../../../constants/regions";
import ImageViewerModal from "../../common/ImageViewerModal";
import DatePicker from "../../common/DatePicker";

interface VisitDetailModalProps {
  visit: VisitWithPlace | null;
  onClose: () => void;
  onUpdate: (id: string, data: any) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

const VisitDetailModal: React.FC<VisitDetailModalProps> = ({
  visit,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [isFullEditing, setIsFullEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editImage, setEditImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editRegion, setEditRegion] = useState("");
  const [editSubRegion, setEditSubRegion] = useState<string | null>(null);
  const [newCommentInput, setNewCommentInput] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile } = useCouple();
  const {
    comments,
    addComment,
    deleteComment,
    loading: commentsLoading,
  } = useVisitComments(visit?.id);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- 히스토리 관리 (중복 방지 강화) ---
  const hasPushedState = useRef(false);

  const handleCloseInternal = useCallback(() => {
    // 직접 닫기 버튼을 누른 경우: 현재 히스토리가 이 모달의 상태일 때만 뒤로가기 실행
    if (
      window.history.state?.modal === "visit-detail" &&
      window.history.state?.id === visit?.id
    ) {
      window.history.back();
    }
    onClose();
  }, [onClose, visit?.id]);

  useEffect(() => {
    if (!visit) return;

    // 중복 Push 방지: 전역 history state를 직접 확인
    const currentState = window.history.state;
    if (
      currentState?.modal === "visit-detail" &&
      currentState?.id === visit.id
    ) {
      hasPushedState.current = true;
    }

    if (!hasPushedState.current) {
      window.history.pushState({ modal: "visit-detail", id: visit.id }, "");
      hasPushedState.current = true;
    }

    const handlePopState = (event: PopStateEvent) => {
      // 뒤로가기 버튼을 눌러서 상태가 변했을 때, 이 모달의 상태가 아니면 닫기
      if (
        event.state?.modal !== "visit-detail" ||
        event.state?.id !== visit.id
      ) {
        onClose();
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      // cleanup에서 history.back() 호출은 하지 않음 (이미 handleCloseInternal에서 처리하거나 popstate에서 처리됨)
    };
  }, [onClose, visit?.id]);

  useEffect(() => {
    if (visit) {
      setEditDate(visit.visited_at);
      setEditImage(visit.image_url);
      setEditRegion(visit.region || "");
      setEditSubRegion(visit.sub_region);
      setSelectedFile(null);
      setNewCommentInput("");
      setIsFullEditing(false);
      setShowMenu(false);
    }
  }, [visit]);

  if (!visit) return null;

  const handleRegionChange = (newRegion: string) => {
    setEditRegion(newRegion);
    setEditSubRegion(null);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setEditImage(previewUrl);
    setSelectedFile(file);
  };

  const handleFullSave = async () => {
    const isDateChanged = editDate !== visit.visited_at;
    const isImageChanged = selectedFile !== null;
    const isRegionChanged =
      editRegion !== visit.region || editSubRegion !== visit.sub_region;

    if (!isDateChanged && !isImageChanged && !isRegionChanged) {
      setIsFullEditing(false);
      return;
    }

    if (!editRegion) {
      alert("행정구역을 선택해주세요.");
      return;
    }

    if (SUB_REGIONS[editRegion] && !editSubRegion) {
      alert("상세 지역을 선택해주세요.");
      return;
    }

    try {
      setLoading(true);
      let finalImageUrl = visit.image_url;
      if (selectedFile) {
        const options = {
          maxSizeMB: 0.3,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
          initialQuality: 0.7,
        };
        const compressedFile = await imageCompression(selectedFile, options);
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("visit-photos")
          .upload(fileName, compressedFile);
        if (uploadError) throw uploadError;
        const {
          data: { publicUrl },
        } = supabase.storage.from("visit-photos").getPublicUrl(fileName);
        finalImageUrl = publicUrl;
      }
      const success = await onUpdate(visit.id, {
        visited_at: editDate,
        image_url: finalImageUrl,
        region: editRegion,
        sub_region: editSubRegion,
      });
      if (success) {
        setIsFullEditing(false);
        setSelectedFile(null);
      }
    } catch (err) {
      alert("저장 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newCommentInput.trim()) return;
    const success = await addComment(newCommentInput);
    if (success) setNewCommentInput("");
  };

  const handleDelete = async () => {
    if (!confirm("삭제하시겠습니까?")) return;
    try {
      setLoading(true);
      const success = await onDelete(visit.id);
      if (success) handleCloseInternal();
    } catch (err) {
      alert("삭제 실패");
    } finally {
      setLoading(false);
    }
  };

  const modalVariants = {
    initial: isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 },
    animate: isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 },
    exit: isMobile ? { y: "100%" } : { opacity: 0, scale: 0.95, y: 20 },
  };

  const modalContent = (
    <div
      key={`modal-wrapper-${visit.id}`}
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 overflow-hidden"
    >
      <motion.div
        key={`backdrop-${visit.id}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => !loading && handleCloseInternal()}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      <motion.div
        key={`content-${visit.id}`}
        variants={modalVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-lg bg-white rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10"
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(false);
        }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10 shrink-0">
          <div className="flex-1 min-w-0 mr-4">
            <h3 className="text-lg font-black text-gray-800 line-clamp-1">
              {visit.places?.name}
            </h3>
            <p className="text-[10px] text-gray-400 font-medium truncate">
              {visit.places?.address}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {!isFullEditing && (
              <div className="relative z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(!showMenu);
                  }}
                  className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors"
                >
                  <MoreVertical size={20} />
                </button>
                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      key="visit-menu-dropdown"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1"
                    >
                      <button
                        onClick={() => {
                          setIsFullEditing(true);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-3 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit2 size={14} /> 수정
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full px-4 py-3 text-left text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 size={14} /> 삭제
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            <button
              onClick={handleCloseInternal}
              className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white pb-6">
          <div
            className="relative aspect-video bg-gray-100 group cursor-pointer"
            onClick={() =>
              !isFullEditing && editImage && setIsImageViewerOpen(true)
            }
          >
            {editImage ? (
              <img
                src={editImage}
                className="w-full h-full object-cover"
                alt=""
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <ImageIcon size={48} />
              </div>
            )}
            {isFullEditing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 text-white font-bold flex items-center justify-center"
              >
                사진 변경
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>

          <div className="px-6 py-4">
            {isFullEditing ? (
              <div className="space-y-6">
                {/* Edit Date */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-rose-400" /> 방문 날짜
                  </label>
                  <DatePicker
                    value={editDate}
                    onChange={setEditDate}
                    variant="calendar"
                  />
                </div>

                {/* Edit Region (Chips) */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5 justify-between">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-rose-400" /> 행정구역 선택
                    </span>
                    {!editRegion && (
                      <span className="text-[10px] text-rose-500 font-medium">
                        * 필수 선택
                      </span>
                    )}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {KOREA_REGIONS.map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => handleRegionChange(r)}
                        className={`py-2.5 rounded-xl text-[10px] font-bold transition-all border ${
                          editRegion === r
                            ? "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-200"
                            : "bg-white border-gray-100 text-gray-400 hover:border-rose-200 hover:text-rose-500"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Edit Sub-Region (Chips) */}
                {editRegion && SUB_REGIONS[editRegion] && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5 justify-between">
                      <span className="flex items-center gap-1.5">
                        <ChevronRight className="w-4 h-4 text-rose-400" /> 상세
                        지역 선택
                      </span>
                      {!editSubRegion && (
                        <span className="text-[10px] text-rose-500 font-medium">
                          * 필수 선택
                        </span>
                      )}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {SUB_REGIONS[editRegion].map((sr) => (
                        <button
                          type="button"
                          key={sr}
                          onClick={() => setEditSubRegion(sr)}
                          className={`py-2 rounded-xl text-[10px] font-bold transition-all border ${
                            editSubRegion === sr
                              ? "bg-rose-400 border-rose-400 text-white shadow-md"
                              : "bg-white border-gray-100 text-gray-400 hover:border-rose-200 hover:text-rose-400"
                          }`}
                        >
                          {sr}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-rose-400" />
                    <span className="text-sm font-bold text-gray-500">
                      {new Date(visit.visited_at).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-400">
                      {visit.region} {visit.sub_region || ""}
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="space-y-4">
                    {comments.length > 0 ? (
                      comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 group">
                          <div className="shrink-0">
                            {comment.writer?.avatar_url ? (
                              <img
                                src={comment.writer.avatar_url}
                                className="w-8 h-8 rounded-full object-cover"
                                alt=""
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-300 font-bold text-xs">
                                {comment.writer?.nickname?.charAt(0) || "?"}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-gray-800">
                                {comment.writer?.nickname}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {new Date(
                                  comment.created_at,
                                ).toLocaleDateString("ko-KR", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed mt-0.5">
                              {comment.content}
                            </p>
                            {profile?.id === comment.writer_id && (
                              <button
                                onClick={() => deleteComment(comment.id)}
                                className="text-[11px] text-gray-400 hover:text-red-500 mt-1 transition-colors"
                              >
                                삭제
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-center text-gray-400 py-4">
                        아직 댓글이 없습니다.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer Area */}
        {isFullEditing ? (
          <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0 shrink-0 flex gap-2">
            <button
              onClick={() => setIsFullEditing(false)}
              className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold text-base hover:bg-gray-200 transition-all"
            >
              취소
            </button>
            <button
              onClick={handleFullSave}
              disabled={
                loading ||
                !editRegion ||
                (SUB_REGIONS[editRegion] && !editSubRegion)
              }
              className="flex-[2] py-4 bg-rose-500 text-white rounded-2xl font-bold text-base hover:bg-rose-600 active:scale-[0.98] transition-all disabled:bg-gray-200 disabled:text-gray-400 shadow-lg shadow-rose-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Check size={20} /> 수정 완료
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0 shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCommentInput}
                onChange={(e) => setNewCommentInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
                placeholder="댓글 작성..."
                className="flex-1 bg-gray-50 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-100"
              />
              <button
                onClick={handleAddComment}
                disabled={!newCommentInput.trim() || commentsLoading}
                className="p-2 bg-rose-500 text-white rounded-xl disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      <ImageViewerModal
        key={`viewer-${visit.id}`}
        isOpen={isImageViewerOpen}
        onClose={() => setIsImageViewerOpen(false)}
        imageUrl={editImage}
        title={visit.places?.name}
      />
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default VisitDetailModal;
