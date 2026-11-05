import { useState } from "react";
import { MessageCircleQuestion, Palette, CheckCircle2, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useHomeData } from "../../hooks";
import DailyQuestionSection from "./DailyQuestionSection";
import { DrawingAnswerSection } from "./DrawingAnswerSection";

export default function DailyQuestionMiniCard() {
  const {
    todayQuestion,
    myAnswer,
    partnerAnswer,
    myDrawing,
    partnerDrawing,
    drawingQuestion,
    partnerProfile,
  } = useHomeData();

  const [activeTab, setActiveTab] = useState<"question" | "drawing">("question");
  const [isExpanded, setIsExpanded] = useState(false);

  const partnerName = partnerProfile?.nickname || "파트너";

  const isQuestionAnsweredByMe = !!myAnswer;
  const isQuestionAnsweredByPartner = !!partnerAnswer;

  const isDrawingAnsweredByMe = !!myDrawing;
  const isDrawingAnsweredByPartner = !!partnerDrawing;

  return (
    <section className="px-6 mb-4">
      <div className="rounded-[24px] border border-gray-100 bg-white p-4 shadow-xs transition-all">
        {/* Top Header: Simple Tab Switcher */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center bg-gray-100/70 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("question")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === "question"
                  ? "bg-white text-gray-900 shadow-2xs"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <MessageCircleQuestion size={13} className={activeTab === "question" ? "text-rose-500" : ""} />
              <span>오늘의 질문</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("drawing")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === "drawing"
                  ? "bg-white text-gray-900 shadow-2xs"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Palette size={13} className={activeTab === "drawing" ? "text-rose-500" : ""} />
              <span>오늘의 그림</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-900 transition-colors"
          >
            <span>{isExpanded ? "접기" : "펼치기"}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Question Summary Bar (always visible) */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="cursor-pointer rounded-2xl bg-gray-50/70 p-3 hover:bg-gray-100/60 transition-colors"
        >
          {activeTab === "question" ? (
            <div>
              <p className="text-xs font-bold text-gray-800 line-clamp-1 mb-2">
                {todayQuestion?.content || "오늘의 질문"}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-gray-500 font-medium">
                <span className="flex items-center gap-1">
                  {isQuestionAnsweredByMe ? (
                    <CheckCircle2 size={13} className="text-emerald-500" />
                  ) : (
                    <Circle size={13} className="text-gray-300" />
                  )}
                  나 {isQuestionAnsweredByMe ? "완료" : "미작성"}
                </span>
                <span className="flex items-center gap-1">
                  {isQuestionAnsweredByPartner ? (
                    <CheckCircle2 size={13} className="text-emerald-500" />
                  ) : (
                    <Circle size={13} className="text-gray-300" />
                  )}
                  {partnerName} {isQuestionAnsweredByPartner ? "완료" : "대기"}
                </span>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold text-gray-800 line-clamp-1 mb-2">
                주제: {drawingQuestion}
              </p>
              <div className="flex items-center gap-3 text-[11px] text-gray-500 font-medium">
                <span className="flex items-center gap-1">
                  {isDrawingAnsweredByMe ? (
                    <CheckCircle2 size={13} className="text-emerald-500" />
                  ) : (
                    <Circle size={13} className="text-gray-300" />
                  )}
                  나 {isDrawingAnsweredByMe ? "완료" : "미작성"}
                </span>
                <span className="flex items-center gap-1">
                  {isDrawingAnsweredByPartner ? (
                    <CheckCircle2 size={13} className="text-emerald-500" />
                  ) : (
                    <Circle size={13} className="text-gray-300" />
                  )}
                  {partnerName} {isDrawingAnsweredByPartner ? "완료" : "대기"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Inline Expandable Body (No Modal!) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden pt-3 border-t border-gray-100 mt-3"
            >
              {activeTab === "question" ? (
                <DailyQuestionSection />
              ) : (
                <DrawingAnswerSection />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
