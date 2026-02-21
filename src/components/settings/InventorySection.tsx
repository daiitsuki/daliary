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
    { name: string; icon: React.ReactNode; description: string }
  > = {
    past_question_ticket: {
      name: "지난 질문 답변 티켓",
      icon: <Ticket className="text-rose-400" size={18} />,
      description: "답변하지 못한 지난 질문에 답변할 수 있습니다.",
    },
  };

  const ownedItems = items.filter((item) => item.quantity > 0);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Package className="text-gray-400" size={18} />
          <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">
            보관함
          </h3>
          <div className="relative flex items-center">
            <button
              onClick={() => setShowTooltip(!showTooltip)}
              className={`rounded-full transition-colors ${showTooltip ? "bg-rose-50 text-rose-400" : "text-gray-400 hover:text-gray-500"}`}
            >
              <HelpCircle size={16} />
            </button>

            <AnimatePresence>
              {showTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute left-0 bottom-full mb-3 bg-white/80 backdrop-blur-xl border border-white/50 px-4 py-2.5 rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.08)] z-20 whitespace-nowrap"
                >
                  <p className="text-[11px] font-black text-gray-600">
                    보관함의 모든 아이템은{" "}
                    <span className="text-rose-400">
                      {partnerProfile?.nickname || "상대방"}
                    </span>
                    님과 공유합니다.
                  </p>
                  <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-white/80 border-r border-b border-white/50 rotate-45 backdrop-blur-xl" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-6 h-6 border-2 border-rose-100 border-t-rose-400 rounded-full animate-spin" />
          </div>
        ) : ownedItems.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-xs text-gray-400 font-bold">
              보유 중인 아이템이 없습니다.
            </p>
            <p className="text-[10px] text-gray-300 mt-1">
              포인트 상점에서 아이템을 구매해보세요!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {ownedItems.map((item) => {
              const config = itemConfigs[item.item_type] || {
                name: item.item_type,
                icon: <Package className="text-rose-400" size={18} />,
                description: "",
              };

              return (
                <div
                  key={item.item_type}
                  className="p-5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-rose-50 rounded-2xl flex items-center justify-center">
                      {config.icon}
                    </div>
                    <div>
                      <h4 className="text-[13px] font-black text-gray-800">
                        {config.name}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-bold">
                        {config.description}
                      </p>
                    </div>
                  </div>
                  <div className="bg-rose-50 px-3 py-1 rounded-full">
                    <span className="text-xs font-black text-rose-500">
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
