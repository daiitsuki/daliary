import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  PlusCircle,
  CheckCircle2,
  MapPin,
  MessageSquare,
  Heart,
  ShoppingBag,
  Ticket,
} from "lucide-react";
import { PointLog, useCouplePointsContext } from "../../context/CouplePointsContext";

interface PointHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPoints: number;
  history: PointLog[];
  initialTab?: "history" | "guide" | "shop";
}

const PointHistoryModal: React.FC<PointHistoryModalProps> = ({
  isOpen,
  onClose,
  currentPoints,
  history,
  initialTab = "history",
}) => {
  const [activeTab, setActiveTab] = useState<"history" | "guide" | "shop">(
    initialTab,
  );
  const { purchaseItem } = useCouplePointsContext();
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      window.history.pushState({ modal: "point-history" }, "");

      const handlePopState = (event: PopStateEvent) => {
        if (event.state?.modal !== "point-history") {
          onClose();
        }
      };

      window.addEventListener("popstate", handlePopState);

      return () => {
        window.removeEventListener("popstate", handlePopState);
        if (window.history.state?.modal === "point-history") {
          window.history.back();
        }
      };
    }
  }, [isOpen, initialTab, onClose]);

  const pointRules = [
    {
      icon: <CheckCircle2 size={18} className="text-rose-400" />,
      title: "일일 출석체크",
      points: 50,
      desc: "매일 한 번 출석 버튼 클릭",
    },
    {
      icon: <MapPin size={18} className="text-rose-400" />,
      title: "장소 방문 인증",
      points: 30,
      desc: "가고 싶던 장소 방문 후 인증",
    },
    {
      icon: <Heart size={18} className="text-rose-400" />,
      title: "오늘의 질문 답변",
      points: 30,
      desc: "서로에게 답하는 매일의 질문",
    },
    {
      icon: <PlusCircle size={18} className="text-rose-400" />,
      title: "위시리스트 저장",
      points: 5,
      desc: "함께 가고 싶은 곳 위시리스트 추가",
    },
    {
      icon: <MessageSquare size={18} className="text-rose-400" />,
      title: "방문 기록 댓글",
      points: 3,
      desc: "상대방의 방문 인증에 댓글 작성",
    },
  ];

  const shopItems = [
    {
      id: "past_question_ticket",
      name: "지난 질문 답변 티켓",
      price: 230,
      description: "답변하지 못한 지난 질문에 답변할 수 있습니다.",
      icon: <Ticket className="text-rose-400" />,
    },
  ];

  const handlePurchase = async (itemId: string, price: number, name: string) => {
    if (currentPoints < price) {
      alert("포인트가 부족합니다.");
      return;
    }

    if (!confirm(`'${name}'을(를) ${price}PT에 구매하시겠습니까?`)) {
      return;
    }

    setIsPurchasing(itemId);
    try {
      const result = await purchaseItem(itemId, price, `'${name}' 구매`);
      if (result.success) {
        alert("구매가 완료되었습니다! 설정 > 보관함에서 확인하실 수 있습니다.");
      } else {
        alert(result.error || "구매 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      alert("구매 중 오류가 발생했습니다.");
    } finally {
      setIsPurchasing(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={
              window.innerWidth < 768
                ? { y: "100%" }
                : { opacity: 0, scale: 0.95, y: 20 }
            }
            animate={
              window.innerWidth < 768
                ? { y: 0 }
                : { opacity: 1, scale: 1, y: 0 }
            }
            exit={
              window.innerWidth < 768
                ? { y: "100%" }
                : { opacity: 0, scale: 0.95, y: 20 }
            }
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white rounded-t-[32px] md:rounded-[32px] shadow-2xl flex flex-col max-h-[85vh] md:max-h-[70vh] overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-gray-50 bg-white sticky top-0 z-10">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">
                    Memory Points
                  </h3>
                  <p className="text-[11px] text-gray-500 font-bold mt-0.5">
                    함께 만든 소중한 기록들
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl">
                <button
                  onClick={() => setActiveTab("history")}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                    activeTab === "history"
                      ? "bg-white text-rose-500 shadow-sm"
                      : "text-gray-400"
                  }`}
                >
                  적립 내역
                </button>
                <button
                  onClick={() => setActiveTab("guide")}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                    activeTab === "guide"
                      ? "bg-white text-rose-500 shadow-sm"
                      : "text-gray-400"
                  }`}
                >
                  획득 방법
                </button>
                <button
                  onClick={() => setActiveTab("shop")}
                  className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
                    activeTab === "shop"
                      ? "bg-white text-rose-500 shadow-sm"
                      : "text-gray-400"
                  }`}
                >
                  포인트 상점
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pt-0 custom-scrollbar">
              {activeTab === "history" ? (
                <div className="space-y-4 pt-4">
                  {history.length === 0 ? (
                    <div className="py-24 text-center">
                      <p className="text-gray-400 text-sm font-bold italic">
                        아직 포인트 내역이 없습니다.
                      </p>
                    </div>
                  ) : (
                    history.map((log, index) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 border border-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-white p-2.5 rounded-xl shadow-sm">
                            <PlusCircle size={18} className="text-rose-400" />
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-gray-800 mb-0.5">
                              {log.description}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                              {new Date(log.created_at).toLocaleDateString(
                                "ko-KR",
                                {
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`text-sm font-black ${log.points > 0 ? "text-rose-500" : "text-gray-400"}`}
                        >
                          {log.points > 0 ? `+${log.points}` : log.points}
                        </span>
                      </motion.div>
                    ))
                  )}
                </div>
              ) : activeTab === "guide" ? (
                <div className="space-y-6 pt-4">
                  <div className="bg-gray-50/50 rounded-[32px] border border-gray-100/50 overflow-hidden">
                    {pointRules.map((rule, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center justify-between p-5 transition-colors hover:bg-white/50 ${
                          index !== pointRules.length - 1
                            ? "border-b border-gray-100/50"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-gray-50">
                            {rule.icon}
                          </div>
                          <div>
                            <p className="text-[13px] font-black text-gray-800 mb-0.5">
                              {rule.title}
                            </p>
                            <p className="text-[10px] text-gray-400 font-bold leading-none">
                              {rule.desc}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-sm font-black text-rose-500">
                            +{rule.points}
                          </span>
                          <span className="text-[8px] font-black text-rose-200 uppercase tracking-tighter">
                            Points
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Point Shop Tab */
                <div className="space-y-6 pt-4">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-gradient-to-br from-rose-400 to-rose-500 rounded-[28px] p-6 text-white shadow-lg shadow-rose-100 relative overflow-hidden"
                  >
                    <div className="absolute right-[-10%] bottom-[-20%] opacity-10">
                      <ShoppingBag size={120} />
                    </div>
                    <div className="relative z-10">
                      <p className="text-[11px] font-black uppercase tracking-widest opacity-80 mb-1">
                        현재 포인트
                      </p>
                      <h4 className="text-3xl font-black flex items-baseline gap-1">
                        {currentPoints}{" "}
                        <span className="text-sm opacity-90">PT</span>
                      </h4>
                    </div>
                  </motion.div>

                  <div className="grid grid-cols-1 gap-4">
                    {shopItems.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + index * 0.05 }}
                        className="bg-white rounded-[28px] border border-gray-100 p-5 flex items-center justify-between shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-400">
                            {item.icon}
                          </div>
                          <div>
                            <h4 className="text-[14px] font-black text-gray-800">
                              {item.name}
                            </h4>
                            <p className="text-[11px] text-gray-400 font-bold">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handlePurchase(item.id, item.price, item.name)}
                          disabled={isPurchasing === item.id}
                          className={`px-4 py-2 rounded-xl text-xs font-black transition-all active:scale-95 ${
                            currentPoints >= item.price
                              ? "bg-rose-500 text-white shadow-md shadow-rose-100 hover:bg-rose-600"
                              : "bg-gray-100 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          {isPurchasing === item.id ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            `${item.price} PT`
                          )}
                        </button>
                      </motion.div>
                    ))}

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="py-8 text-center bg-gray-50/50 rounded-[32px] border border-dashed border-gray-200"
                    >
                      <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                        새로운 아이템들이 곧 추가될 예정이에요!
                      </p>
                    </motion.div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PointHistoryModal;
