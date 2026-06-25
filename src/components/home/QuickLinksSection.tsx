import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Map, Heart, Camera, Settings, ShoppingBag, Calendar } from "lucide-react";
import { motion, Reorder, useDragControls } from "framer-motion";
import AnniversaryModal from "../common/AnniversaryModal";
import PointHistoryModal from "./PointHistoryModal";
import { useCouplePoints } from "../../hooks/useCouplePoints";


const DEFAULT_ORDER = ["plans", "memory", "timetable", "anniversary", "shop", "settings"];

function DraggableLinkItem({ id, link }: { id: string; link: any }) {
  const controls = useDragControls();
  const IconComponent = link.icon;

  return (
    <Reorder.Item
      value={id}
      dragListener={false}
      dragControls={controls}
      className="flex flex-col items-center flex-shrink-0 w-[72px] cursor-grab active:cursor-grabbing touch-pan-x"
      whileDrag={{ scale: 1.05, zIndex: 50 }}
      onPointerDown={(e) => {
        const startX = e.clientX;
        const startY = e.clientY;
        const timeout = setTimeout(() => {
          controls.start(e);
          if (navigator.vibrate) navigator.vibrate(50);
        }, 300);

        const onMove = (moveEvent: PointerEvent) => {
          const dx = Math.abs(moveEvent.clientX - startX);
          const dy = Math.abs(moveEvent.clientY - startY);
          if (dx > 10 || dy > 10) {
            clearTimeout(timeout);
            cleanup();
          }
        };

        const onUp = () => {
          clearTimeout(timeout);
          cleanup();
        };

        const cleanup = () => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("pointercancel", onUp);
        };

        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
        window.addEventListener("pointercancel", onUp);
      }}
    >
      <button
        onClick={link.onClick}
        className="w-13 h-13 rounded-[22px] flex items-center justify-center shadow-sm border transition-all hover:shadow-md bg-white border-gray-50 pointer-events-auto"
      >
        <IconComponent size={20} className={link.color} />
      </button>

      <span className="mt-3 text-[11px] font-bold text-center text-gray-500 whitespace-nowrap pointer-events-none">
        {link.title}
      </span>
    </Reorder.Item>
  );
}

export default function QuickLinksSection() {
  const navigate = useNavigate();

  const [isAnniversaryModalOpen, setIsAnniversaryModalOpen] = useState(false);
  const [isPointShopModalOpen, setIsPointShopModalOpen] = useState(false);
  const { currentPoints, history } = useCouplePoints();

  const [order, setOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem("quickLinksOrder");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const missing = DEFAULT_ORDER.filter(id => !parsed.includes(id));
        return [...parsed, ...missing];
      } catch (e) {}
    }
    return DEFAULT_ORDER;
  });

  useEffect(() => {
    localStorage.setItem("quickLinksOrder", JSON.stringify(order));
  }, [order]);

  const linksConfig: Record<string, any> = {
    plans: {
      title: "여행계획",
      icon: Map,
      onClick: () => navigate("/places?tab=plans"),
      color: "text-rose-500",
    },
    memory: {
      title: "추억피드",
      icon: Camera,
      onClick: () => navigate("/places?tab=memory"),
      color: "text-rose-500",
    },
    timetable: {
      title: "시간표",
      icon: Calendar,
      onClick: () => navigate("/calendar?tab=timetable"),
      color: "text-rose-500",
    },
    anniversary: {
      title: "기념일",
      icon: Heart,
      onClick: () => setIsAnniversaryModalOpen(true),
      color: "text-rose-500",
    },
    shop: {
      title: "상점",
      icon: ShoppingBag,
      onClick: () => setIsPointShopModalOpen(true),
      color: "text-rose-500",
    },
    settings: {
      title: "설정",
      icon: Settings,
      onClick: () => navigate("/settings"),
      color: "text-rose-500",
    },
  };

  return (
    <section className="px-6 mb-6">
      <motion.div className="bg-white rounded-[32px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-rose-50/50 relative overflow-hidden group">
        {/* Tools Content */}
        <Reorder.Group
          axis="x"
          values={order}
          onReorder={setOrder}
          className="relative z-10 flex items-start gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth"
        >
          {order.map((id) => {
            const link = linksConfig[id];
            if (!link) return null;
            return <DraggableLinkItem key={id} id={id} link={link} />;
          })}
        </Reorder.Group>
      </motion.div>

      <AnniversaryModal
        isOpen={isAnniversaryModalOpen}
        onClose={() => setIsAnniversaryModalOpen(false)}
      />

      <PointHistoryModal
        isOpen={isPointShopModalOpen}
        onClose={() => setIsPointShopModalOpen(false)}
        currentPoints={currentPoints}
        history={history}
        initialTab="shop"
      />
    </section>
  );
}
