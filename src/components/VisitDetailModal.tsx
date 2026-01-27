import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Edit2, Trash2, Camera, Loader2, ImageIcon } from "lucide-react";
import { supabase } from "../lib/supabase";
import imageCompression from "browser-image-compression";
import { VisitWithPlace } from "../context/PlacesContext";

interface VisitDetailModalProps {
  visit: VisitWithPlace | null;
  onClose: () => void;
  onUpdate: (id: string, data: any) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

const VisitDetailModal: React.FC<VisitDetailModalProps> = ({ visit, onClose, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editComment, setEditComment] = useState("");
  const [editImage, setEditImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visit) {
      setEditDate(visit.visited_at);
      setEditComment(visit.comment || "");
      setEditImage(visit.image_url);
      setIsEditing(false);
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

  const handleSave = async () => {
    setLoading(true);
    const success = await onUpdate(visit.id, {
      visited_at: editDate,
      comment: editComment,
      image_url: editImage,
    });
    if (success) setIsEditing(false);
    setLoading(false);
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
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
            <div className="flex-1">
              <h3 className="text-lg font-black text-gray-800 line-clamp-1">{visit.places?.name}</h3>
              <p className="text-[10px] text-gray-400 font-medium">{visit.places?.address}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <div className="relative aspect-video bg-gray-100 rounded-2xl overflow-hidden group">
              {editImage ? (
                <img src={editImage} className="w-full h-full object-cover" alt="Visit" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <ImageIcon size={48} />
                </div>
              )}
              {isEditing && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera size={32} className="mb-2" />
                  <span className="text-sm font-bold">사진 변경</span>
                </button>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              {loading && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <Loader2 className="animate-spin text-white" size={32} />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">방문 날짜</label>
                <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${isEditing ? 'border-rose-200 bg-white' : 'border-gray-100 bg-gray-50'}`}>
                  <Calendar size={18} className={isEditing ? 'text-rose-400' : 'text-gray-400'} />
                  <input 
                    type="date" value={editDate} disabled={!isEditing} onChange={(e) => setEditDate(e.target.value)}
                    className="bg-transparent text-sm font-bold text-gray-700 w-full focus:outline-none disabled:opacity-100"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">우리의 기록</label>
                <textarea
                  value={editComment} disabled={!isEditing} onChange={(e) => setEditComment(e.target.value)}
                  placeholder={isEditing ? "이곳에서의 추억을 남겨보세요..." : "기록이 없습니다."}
                  className={`w-full p-4 rounded-2xl border transition-all resize-none text-sm leading-relaxed min-h-[100px] focus:outline-none ${isEditing ? 'border-rose-200 bg-white' : 'border-gray-100 bg-gray-50'}`}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} className="flex-1 py-4 bg-white border border-gray-200 text-gray-500 rounded-2xl font-bold text-sm">취소</button>
                <button onClick={handleSave} disabled={loading} className="flex-[2] py-4 bg-rose-500 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : '변경사항 저장'}
                </button>
              </>
            ) : (
              <>
                <button onClick={handleDelete} className="p-4 bg-white border border-red-100 text-red-400 rounded-2xl font-bold hover:bg-red-50 transition-colors"><Trash2 size={20} /></button>
                <button onClick={() => setIsEditing(true)} className="flex-1 py-4 bg-gray-800 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2">
                  <Edit2 size={18} /> 기록 수정하기
                </button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default VisitDetailModal;
