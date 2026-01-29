import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, MoreVertical, Trash2, Camera, Loader2, ImageIcon, Send, Image as ImageIconLucide, MessageCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import imageCompression from "browser-image-compression";
import { VisitWithPlace } from "../context/PlacesContext";
import { useVisitComments } from "../hooks/useVisitComments";
import { useCouple } from "../hooks/useCouple";

interface VisitDetailModalProps {
  visit: VisitWithPlace | null;
  onClose: () => void;
  onUpdate: (id: string, data: any) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

const VisitDetailModal: React.FC<VisitDetailModalProps> = ({ visit, onClose, onUpdate, onDelete }) => {
  const [isFullEditing, setIsFullEditing] = useState(false); // Photo & Date editing
  const [showMenu, setShowMenu] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editImage, setEditImage] = useState<string | null>(null);
  const [newCommentInput, setNewCommentInput] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { profile } = useCouple();
  const { comments, addComment, deleteComment, loading: commentsLoading } = useVisitComments(visit?.id);

  useEffect(() => {
    if (visit) {
      setEditDate(visit.visited_at);
      setEditImage(visit.image_url);
      setNewCommentInput("");
      setIsFullEditing(false);
      setShowMenu(false);
    }
  }, [visit]);

  if (!visit) return null;

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 800, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      const fileExt = file.name.split(".").pop();
      const fileName = `visits/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from("diary-images").upload(fileName, compressedFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("diary-images").getPublicUrl(fileName);
      setEditImage(publicUrl);
    } catch (err) {
      alert("이미지 업로드 실패");
    } finally {
      setLoading(false);
    }
  };

  // Save Full Edit (Photo/Date)
  const handleFullSave = async () => {
    setLoading(true);
    const success = await onUpdate(visit.id, {
      visited_at: editDate,
      image_url: editImage,
    });
    if (success) setIsFullEditing(false);
    setLoading(false);
  };

  const handleAddComment = async () => {
    if (!newCommentInput.trim()) return;
    const success = await addComment(newCommentInput);
    if (success) setNewCommentInput("");
  };

  const handleDelete = async () => {
    if (!confirm("이 방문 기록을 삭제하시겠습니까?")) return;
    setLoading(true);
    const success = await onDelete(visit.id);
    if (success) onClose();
    setLoading(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !loading && onClose()}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-lg bg-white rounded-t-[32px] md:rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          onClick={() => setShowMenu(false)} // Close menu on bg click
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10 shrink-0">
            <div className="flex-1 min-w-0 mr-4">
              <h3 className="text-lg font-black text-gray-800 line-clamp-1">{visit.places?.name}</h3>
              <p className="text-[10px] text-gray-400 font-medium truncate">{visit.places?.address}</p>
            </div>
            
            <div className="flex items-center gap-1">
              {/* Menu Trigger */}
              <div className="relative z-20">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                  className="p-2 hover:bg-gray-50 rounded-full text-gray-400 transition-colors"
                >
                  <MoreVertical size={20} />
                </button>
                
                <AnimatePresence>
                  {showMenu && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1"
                    >
                      <button 
                        onClick={() => { setIsFullEditing(true); setShowMenu(false); }}
                        className="w-full px-4 py-3 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <ImageIconLucide size={14} /> 사진/날짜 수정
                      </button>
                      <div className="h-px bg-gray-50 my-1" />
                      <button 
                        onClick={handleDelete}
                        className="w-full px-4 py-3 text-left text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 size={14} /> 기록 삭제
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-white pb-6">
            
            {/* Image Section */}
            <div className="relative aspect-video bg-gray-100 group">
              {editImage ? (
                <img src={editImage} className="w-full h-full object-cover" alt="Visit" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <ImageIcon size={48} />
                </div>
              )}
              
              {isFullEditing && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white cursor-pointer"
                >
                  <Camera size={32} className="mb-2" />
                  <span className="text-sm font-bold">사진 변경</span>
                </button>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              
              {loading && isFullEditing && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <Loader2 className="animate-spin text-white" size={32} />
                </div>
              )}
            </div>

            {/* Date Section */}
            <div className="px-6 py-4">
              <div className="flex items-center gap-2 mb-6">
                <Calendar size={14} className="text-rose-400" />
                {isFullEditing ? (
                  <input 
                    type="date" 
                    value={editDate} 
                    onChange={(e) => setEditDate(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-rose-200"
                  />
                ) : (
                  <span className="text-sm font-bold text-gray-500">
                    {new Date(visit.visited_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                )}
              </div>

              {/* Comments Section */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle size={14} className="text-gray-400" />
                  <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest">Comments</h4>
                  <span className="text-[11px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{comments.length}</span>
                </div>

                <div className="space-y-4">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment.id} className="flex gap-3 group">
                        <div className="shrink-0">
                          {comment.writer?.avatar_url ? (
                            <img src={comment.writer.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-300 font-bold text-xs">
                              {comment.writer?.nickname?.charAt(0) || '?'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-gray-800">{comment.writer?.nickname}</span>
                            <span className="text-[11px] text-gray-400">
                              {new Date(comment.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-0.5 leading-relaxed break-words">{comment.content}</p>
                          {profile?.id === comment.writer_id && (
                            <button 
                              onClick={() => { if(confirm('댓글을 삭제하시겠습니까?')) deleteComment(comment.id); }}
                              className="text-[11px] text-gray-400 hover:text-red-500 mt-1 font-medium transition-colors opacity-0 group-hover:opacity-100"
                            >
                              삭제
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-xs text-gray-400 font-medium">첫 번째 댓글을 남겨보세요!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Full Edit Footer (Only visible when Full Editing) */}
          {isFullEditing && (
            <div className="p-4 border-t border-gray-100 bg-white flex gap-3 animate-in slide-in-from-bottom duration-200">
              <button 
                onClick={() => { setIsFullEditing(false); setEditDate(visit.visited_at); setEditImage(visit.image_url); }} 
                className="flex-1 py-3 bg-white border border-gray-200 text-gray-500 rounded-xl font-bold text-sm"
              >
                취소
              </button>
              <button 
                onClick={handleFullSave} 
                disabled={loading} 
                className="flex-[2] py-3 bg-gray-800 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : '수정사항 저장'}
              </button>
            </div>
          )}

          {/* Comment Input Footer */}
          {!isFullEditing && (
            <div className="p-4 pb-8 md:pb-4 border-t border-gray-100 bg-white sticky bottom-0 z-10">
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={newCommentInput}
                  onChange={(e) => setNewCommentInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="댓글을 남겨주세요..."
                  className="flex-1 bg-gray-50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-rose-200 placeholder:text-gray-400"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newCommentInput.trim() || commentsLoading}
                  className="p-3 bg-rose-500 text-white rounded-xl disabled:opacity-30 disabled:bg-gray-300 transition-all shadow-lg shadow-rose-100"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default VisitDetailModal;
