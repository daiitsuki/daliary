import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  Smile,
  Frown,
  Meh,
  Heart,
  Loader2,
  BookHeart,
  MoreVertical,
  Trash,
  Edit3,
  X,
  PenLine,
} from "lucide-react";
import { useDiaries, DiaryEntry } from "../hooks/useDiaries";
import { motion, AnimatePresence } from "framer-motion";

const MoodIcon = ({
  mood,
  size = 16,
}: {
  mood: string | null;
  size?: number;
}) => {
  if (!mood) return null;
  switch (mood) {
    case "happy":
      return <Smile size={size} className="text-yellow-500" />;
    case "sad":
      return <Frown size={size} className="text-blue-500" />;
    case "soso":
      return <Meh size={size} className="text-gray-500" />;
    case "love":
      return <Heart size={size} className="text-pink-500" />;
    default:
      return null;
  }
};

const MOODS = [
  {
    id: "happy",
    icon: Smile,
    label: "행복",
    color: "text-yellow-500 bg-yellow-100",
  },
  { id: "sad", icon: Frown, label: "슬픔", color: "text-blue-500 bg-blue-100" },
  {
    id: "soso",
    icon: Meh,
    label: "그럭저럭",
    color: "text-gray-500 bg-gray-100",
  },
  {
    id: "love",
    icon: Heart,
    label: "설렘",
    color: "text-pink-500 bg-pink-100",
  },
];

export default function Timeline() {
  const navigate = useNavigate();
  const { diaries, loading, deleteDiary, updateDiary, refresh } = useDiaries();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingDiary, setEditingDiary] = useState<DiaryEntry | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editMood, setEditMood] = useState<string | null>(null);
  const [showMenuId, setShowMenuId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  useEffect(() => {
    if (!loading && diaries.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [diaries, loading]);

  const handleDelete = async (id: string) => {
    if (confirm("일기를 정말 삭제할까요?")) {
      const success = await deleteDiary(id);
      if (success) {
        await refresh();
      } else {
        alert("삭제 실패");
      }
      setShowMenuId(null);
    }
  };

  const openEdit = (diary: DiaryEntry) => {
    setEditingDiary(diary);
    setEditContent(diary.content);
    setEditMood(diary.mood);
    setShowMenuId(null);
  };

  const handleUpdate = async () => {
    if (!editingDiary || !editContent.trim()) return;
    setIsUpdating(true);
    const success = await updateDiary(editingDiary.id, editContent, editMood);
    if (success) {
      await refresh();
      setEditingDiary(null);
    } else {
      alert("수정 실패");
    }
    setIsUpdating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-rose-400" size={32} />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white flex flex-col pb-24 overflow-hidden relative">
      <header className="px-6 py-4 border-b border-gray-50 bg-white/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
        <div className="w-8" /> {/* Spacer for centering */}
        <h1 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">
          Our Timeline
        </h1>
        <button
          onClick={() => navigate("/write")}
          className="p-2 text-gray-400 hover:text-rose-400 transition-colors"
        >
          <PenLine size={20} />
        </button>
      </header>

      <main className="flex-1 p-4 md:p-8 space-y-10 overflow-y-auto custom-scrollbar max-w-3xl mx-auto w-full">
        {diaries.length === 0 && (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-gray-50 rounded-[24px] flex items-center justify-center mx-auto mb-6">
              <BookHeart size={28} className="text-rose-200" />
            </div>
            <p className="text-gray-300 text-[13px] font-medium leading-relaxed">
              아직 우리만의 이야기가 없네요.
              <br />첫 페이지를 채워볼까요?
            </p>
          </div>
        )}

        {diaries.map((diary) => {
          const isMe = diary.writer_id === currentUserId;
          const date = new Date(diary.created_at);
          const timeString = date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });

          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={diary.id}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              <div
                className={`flex items-end gap-2.5 max-w-[85%] md:max-w-[75%] ${isMe ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                {!isMe && (
                  <div className="w-9 h-9 rounded-2xl bg-gray-50 overflow-hidden flex-shrink-0 border border-gray-100 mb-4">
                    {diary.profiles.avatar_url ? (
                      <img
                        src={diary.profiles.avatar_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-rose-50 flex items-center justify-center text-rose-300 text-[10px] font-black">
                        {diary.profiles.nickname?.[0] || "?"}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col space-y-1 relative">
                  {!isMe && (
                    <span className="text-[9px] text-gray-400 font-bold ml-1 mb-0.5">
                      {diary.profiles.nickname}
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    {/* Bubble */}
                    <div
                      className={`
                      p-4 rounded-[24px] shadow-sm relative group transition-all
                      ${
                        isMe
                          ? "bg-gray-900 text-white rounded-tr-none"
                          : "bg-white text-gray-600 rounded-tl-none border border-gray-50"
                      }
                    `}
                    >
                      {diary.mood && (
                        <div
                          className={`absolute -top-3 ${isMe ? "-left-2" : "-right-2"} bg-white p-1.5 rounded-full shadow-sm border border-gray-50`}
                        >
                          <MoodIcon mood={diary.mood} size={14} />
                        </div>
                      )}
                      <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium tracking-tight">
                        {diary.content}
                      </p>
                    </div>

                    {/* Options (Only for me) */}
                    {isMe && (
                      <div className="relative">
                        <button
                          onClick={() =>
                            setShowMenuId(
                              showMenuId === diary.id ? null : diary.id,
                            )
                          }
                          className="p-1 text-gray-300 hover:text-gray-500 transition-colors"
                        >
                          <MoreVertical size={14} />
                        </button>

                        <AnimatePresence>
                          {showMenuId === diary.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, x: 10 }}
                              animate={{ opacity: 1, scale: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.9, x: 10 }}
                              className="absolute right-0 top-6 bg-white shadow-xl rounded-xl border border-gray-50 p-1 z-20 min-w-[80px]"
                            >
                              <button
                                onClick={() => openEdit(diary)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                              >
                                <Edit3 size={12} /> 수정
                              </button>
                              <button
                                onClick={() => handleDelete(diary.id)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash size={12} /> 삭제
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  <span
                    className={`text-[9px] text-gray-300 font-bold uppercase tracking-tighter ${isMe ? "text-right mr-1" : "text-left ml-1"}`}
                  >
                    {timeString}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingDiary && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingDiary(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-lg bg-white rounded-t-[32px] md:rounded-[32px] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">
                  일기 수정
                </h3>
                <button
                  onClick={() => setEditingDiary(null)}
                  className="p-2 text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                    오늘의 기분
                  </p>
                  <div className="flex justify-between gap-2">
                    {MOODS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setEditMood(m.id)}
                        className={`flex-1 py-3 rounded-2xl border transition-all flex flex-col items-center gap-1 ${
                          editMood === m.id
                            ? "border-rose-200 bg-white shadow-sm"
                            : "border-transparent bg-gray-50"
                        }`}
                      >
                        <m.icon
                          size={20}
                          className={
                            editMood === m.id
                              ? m.color.split(" ")[0]
                              : "text-gray-300"
                          }
                        />
                        <span
                          className={`text-[10px] font-bold ${editMood === m.id ? "text-gray-800" : "text-gray-300"}`}
                        >
                          {m.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">
                    내용
                  </p>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-gray-50 p-4 rounded-2xl text-sm text-gray-700 min-h-[150px] focus:outline-none focus:ring-1 focus:ring-rose-100 resize-none"
                  />
                </div>
              </div>

              <div className="p-6 pt-0 flex gap-3">
                <button
                  onClick={() => setEditingDiary(null)}
                  className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-xl font-bold text-sm"
                >
                  취소
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="flex-[2] py-4 bg-gray-900 text-white rounded-xl font-bold text-sm shadow-xl"
                >
                  {isUpdating ? (
                    <Loader2 className="animate-spin mx-auto" size={20} />
                  ) : (
                    "수정 완료"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
