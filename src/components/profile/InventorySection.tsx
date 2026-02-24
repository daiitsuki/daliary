import { Package, Ticket, HelpCircle } from "lucide-react";
import { useCouplePointsContext } from "../../context/CouplePointsContext";
import { useHomeData } from "../../hooks/useHomeData";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function InventorySection() {
  const { items, loading } = useCouplePointsContext();
  const { partnerProfile } = useHomeData();
  const [showTooltip, setShowTooltip] = useState(false);

  const itemConfigs: Record<
    string,
    { name: string; icon: React.ReactNode; description: string; bgColor: string }
  > = {
    past_question_ticket: {
      name: "지난 질문 답변 티켓",
      icon: <Ticket className="text-rose-400" size={16} />,
      description: "놓친 질문에 답변할 수 있어요",
      bgColor: "bg-rose-50/50",
    },
    blind_timer_ticket: {
      name: "블라인드 타이머 입장권",
      icon: <Ticket className="text-violet-400" size={16} />,
      description: "미니게임에 도전해보세요",
      bgColor: "bg-violet-50/50",
    },
  };

  const ownedItems = items.filter((item) => item.quantity > 0);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-4 bg-rose-400/80 rounded-full" />
          <h3 className="text-base sm:text-lg font-black text-gray-800 tracking-tight">
            보관함
          </h3>
          <div className="relative flex items-center">
            <button
              onClick={() => setShowTooltip(!showTooltip)}
              className={`p-1 rounded-full transition-all active:scale-90 ${showTooltip ? "bg-rose-500 text-white shadow-sm shadow-rose-200" : "text-gray-300 hover:text-gray-400 hover:bg-gray-50"}`}
            >
              <HelpCircle size={14} strokeWidth={2.5} />
            </button>

            <AnimatePresence>
              {showTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute left-0 bottom-full mb-3 bg-white/90 backdrop-blur-xl border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] px-4 py-2.5 rounded-[20px] z-20 whitespace-nowrap"
                >
                  <p className="text-[10px] font-black text-gray-600">
                    모든 아이템은{" "}
                    <span className="text-rose-500">
                      {partnerProfile?.nickname || "상대방"}
                    </span>
                    님과 공유합니다.
                  </p>
                  <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-white/90 border-r border-b border-gray-100 rotate-45" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[28px] sm:rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 overflow-hidden">
        {loading ? (
          <div className="p-10 flex justify-center">
            <div className="w-5 h-5 border-2 border-rose-100 border-t-rose-400 rounded-full animate-spin" />
          </div>
        ) : ownedItems.length === 0 ? (
          <div className="p-10 text-center group">
            <div className="bg-gray-50/50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3.5 border border-gray-100/50 group-hover:scale-110 transition-transform">
              <Package size={20} className="text-gray-200" />
            </div>
            <p className="text-gray-400 text-[12px] font-black italic tracking-tight">
              아직은 텅 비어있네요
            </p>
            <p className="text-[9px] font-bold text-gray-300 mt-1">
              포인트 상점에서 보물을 찾아보세요!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50/50">
            {ownedItems.map((item) => {
              const config = itemConfigs[item.item_type] || {
                name: item.item_type,
                icon: <Package className="text-rose-400" size={16} />,
                description: "",
                bgColor: "bg-rose-50/50",
              };

              return (
                <div
                  key={item.item_type}
                  className="p-4 sm:p-5 flex items-center justify-between group hover:bg-gray-50/30 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 ${config.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner`}>
                      {config.icon}
                    </div>
                    <div>
                      <h4 className="text-[13px] font-black text-gray-700">
                        {config.name}
                      </h4>
                      <p className="text-[9px] font-bold text-gray-400">
                        {config.description}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white border border-gray-100 px-3 py-1 rounded-full shadow-sm">
                    <span className="text-[11px] font-black text-rose-500 tabular-nums">
                      {item.quantity}개
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
