import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusCircle,
  MinusCircle,
  CheckCircle2,
  MapPin,
  MessageSquare,
  Heart,
  ShoppingBag,
  Ticket,
  Clock,
  Loader2,
} from "lucide-react";
import {
  PointLog,
  useCouplePointsContext,
} from "../../context/CouplePointsContext";
import { useConfirm } from "../../context/ConfirmContext";
import { useToast } from "../../context/ToastContext";
import { supabase } from "../../lib/supabase";
import BaseModal from "../common/BaseModal";
import Button from "../common/Button";

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
  const tabs = ["history", "guide", "shop"] as const;
  const [activeTab, setActiveTab] = useState<"history" | "guide" | "shop">(
    initialTab,
  );
  const { purchaseItem } = useCouplePointsContext();
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });
  }, []);

  const handleTabChange = (newTab: "history" | "guide" | "shop") => {
    const currentIndex = tabs.indexOf(activeTab);
    const nextIndex = tabs.indexOf(newTab);
    setDirection(nextIndex > currentIndex ? 1 : -1);
    setActiveTab(newTab);
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number }; velocity: { x: number } },
  ) => {
    const swipeThreshold = 50;
    const velocityThreshold = 500;

    if (
      info.offset.x < -swipeThreshold ||
      info.velocity.x < -velocityThreshold
    ) {
      // Swipe left -> Next tab
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex < tabs.length - 1) {
        handleTabChange(tabs[currentIndex + 1]);
      }
    } else if (
      info.offset.x > swipeThreshold ||
      info.velocity.x > velocityThreshold
    ) {
      // Swipe right -> Previous tab
      const currentIndex = tabs.indexOf(activeTab);
      if (currentIndex > 0) {
        handleTabChange(tabs[currentIndex - 1]);
      }
    }
  };

  // Removed old popstate logic because BaseModal handles it automatically

  // Check if ticket was purchased today by current user
  const isTicketPurchasedToday = useMemo(() => {
    if (!currentUserId) return false;
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Seoul",
    }); // YYYY-MM-DD

    return history.some((log) => {
      const logDate = new Date(log.created_at).toLocaleDateString("en-CA", {
        timeZone: "Asia/Seoul",
      });
      return (
        log.type === "purchase_blind_timer_ticket" &&
        logDate === today &&
        (log as any).user_id === currentUserId
      );
    });
  }, [history, currentUserId]);

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
      limit: null,
    },
    {
      id: "blind_timer_ticket",
      name: "블라인드 타이머 입장권",
      price: 100,
      description: "블라인드 타이머 게임에 입장할 수 있습니다.",
      icon: <Ticket className="text-violet-400" />,
      limit: "1일 1매",
      isSoldOut: isTicketPurchasedToday,
    },
  ];

  const handlePurchase = async (
    itemId: string,
    price: number,
    name: string,
  ) => {
    if (currentPoints < price) {
      showToast("포인트가 부족해요.", "error");
      return;
    }

    const isConfirmed = await confirm({
      title: "상품 구매",
      message: `'${name}'을(를) ${price}PT에 구매할까요?`,
      confirmText: "구매",
      isDanger: true,
    });

    if (!isConfirmed) {
      return;
    }

    setIsPurchasing(itemId);
    try {
      const result = await purchaseItem(itemId, price, `'${name}' 구매`);
      if (result.success) {
        showToast("구매 성공! 내 정보 탭에서 확인해보세요.", "success");
      } else {
        if (result.error === "DAILY_LIMIT_REACHED") {
          showToast("이 아이템은 하루에 한 번만 구매할 수 있어요.", "error");
        } else {
          showToast(result.error || "구매 중 오류가 발생했어요.", "error");
        }
      }
    } catch (error) {
      console.error("Purchase error:", error);
      showToast("구매 중 오류가 발생했어요.", "error");
    } finally {
      setIsPurchasing(null);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "20%" : "-20%",
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? "20%" : "-20%",
      opacity: 0,
    }),
  };

  const tabsContent = (
    <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl mt-3">
      <button
        onClick={() => handleTabChange("history")}
        className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
          activeTab === "history"
            ? "bg-white text-rose-500 shadow-sm"
            : "text-gray-400 hover:text-gray-500 hover:bg-gray-100/50"
        }`}
      >
        적립 내역
      </button>
      <button
        onClick={() => handleTabChange("guide")}
        className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
          activeTab === "guide"
            ? "bg-white text-rose-500 shadow-sm"
            : "text-gray-400 hover:text-gray-500 hover:bg-gray-100/50"
        }`}
      >
        획득 방법
      </button>
      <button
        onClick={() => handleTabChange("shop")}
        className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
          activeTab === "shop"
            ? "bg-white text-rose-500 shadow-sm"
            : "text-gray-400 hover:text-gray-500 hover:bg-gray-100/50"
        }`}
      >
        포인트 상점
      </button>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="MEMORY POINTS"
      subtitle="함께 만든 소중한 기록들"
      headerContent={tabsContent}
      maxWidth="lg"
      contentClassName="p-0 h-[75vh] md:h-[65vh] flex flex-col relative bg-gray-50/30"
    >
      <div className="flex-1 relative overflow-hidden">
              <AnimatePresence initial={false} custom={direction} mode="popLayout">
                <motion.div
                  key={activeTab}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 500, damping: 45, mass: 0.8 },
                    opacity: { duration: 0.1 },
                  }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={handleDragEnd}
                  className="w-full h-full overflow-y-auto p-6 pt-0 custom-scrollbar"
                >
                  {activeTab === "history" ? (
                    <div className="space-y-4 pt-4 pb-10">
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
                                {log.points > 0 ? (
                                  <PlusCircle
                                    size={18}
                                    className="text-rose-400"
                                  />
                                ) : (
                                  <MinusCircle
                                    size={18}
                                    className="text-gray-400"
                                  />
                                )}
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
                    <div className="space-y-6 pt-4 pb-10">
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
                    /* Point Shop Tab - Reverted to Original Layout with Synced Animation */
                    <div className="space-y-6 pt-4 pb-10">
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0 }}
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
                            {currentPoints.toLocaleString()}{" "}
                            <span className="text-sm opacity-90 font-bold">
                              PT
                            </span>
                          </h4>
                        </div>
                      </motion.div>

                      <div className="grid grid-cols-1 gap-4">
                        {shopItems.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: (index + 1) * 0.05 }}
                            className="bg-white rounded-[32px] border border-gray-100 p-5 flex flex-col gap-5 shadow-sm relative overflow-hidden"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-400 shrink-0">
                                {item.icon}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <h4 className="text-[14px] font-black text-gray-800">
                                    {item.name}
                                  </h4>
                                  {item.limit && (
                                    <span className="bg-amber-100 text-amber-600 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">
                                      {item.limit}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-400 font-bold leading-tight">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant={
                                item.isSoldOut || currentPoints < item.price
                                  ? "secondary"
                                  : "primary"
                              }
                              onClick={() =>
                                handlePurchase(item.id, item.price, item.name)
                              }
                              disabled={
                                isPurchasing === item.id ||
                                item.isSoldOut ||
                                currentPoints < item.price
                              }
                            >
                              {isPurchasing === item.id ? (
                                <Loader2 className="animate-spin text-gray-400" size={16} />
                              ) : item.isSoldOut ? (
                                <span className="flex items-center gap-1.5 text-gray-400">
                                  <Clock size={14} /> 구매 완료
                                </span>
                              ) : (
                                `${item.price.toLocaleString()} PT  |  구매하기`
                              )}
                            </Button>
                          </motion.div>
                        ))}

                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (shopItems.length + 1) * 0.05 }}
                          className="py-10 text-center bg-gray-50/50 rounded-[32px] border border-dashed border-gray-200"
                        >
                          <p className="text-[11px] text-gray-400 font-bold leading-relaxed">
                            새로운 아이템들이 곧 추가될 예정이에요!
                          </p>
                        </motion.div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
    </BaseModal>
  );
};

export default PointHistoryModal;
