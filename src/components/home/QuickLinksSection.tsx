import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Map, Heart, Camera, Settings, ShoppingBag, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import AnniversaryModal from "../common/AnniversaryModal";
import PointHistoryModal from "./PointHistoryModal";
import { useCouplePoints } from "../../hooks";

export default function QuickLinksSection() {
  const navigate = useNavigate();

  const [isAnniversaryModalOpen, setIsAnniversaryModalOpen] = useState(false);
  const [isPointShopModalOpen, setIsPointShopModalOpen] = useState(false);
  const { currentPoints, history } = useCouplePoints();

  const linksConfig = [
    { id: "plans", title: "여행계획", icon: Map, onClick: () => navigate("/places?tab=plans") },
    { id: "memory", title: "추억피드", icon: Camera, onClick: () => navigate("/places?tab=memory") },
    { id: "timetable", title: "시간표", icon: Calendar, onClick: () => navigate("/calendar?tab=timetable") },
    { id: "anniversary", title: "기념일", icon: Heart, onClick: () => setIsAnniversaryModalOpen(true) },
    { id: "shop", title: "상점", icon: ShoppingBag, onClick: () => setIsPointShopModalOpen(true) },
    { id: "settings", title: "설정", icon: Settings, onClick: () => navigate("/settings") },
  ];

  return (
    <section className="px-6 mb-6">
      <motion.div 
        className="bg-white rounded-[32px] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-rose-50/50"
      >
        <div className="grid grid-cols-3 gap-y-5 gap-x-2">
          {linksConfig.map((link, index) => {
            const Icon = link.icon;
            return (
              <motion.button
                key={link.id}
                onClick={link.onClick}
                className="flex flex-col items-center justify-center group outline-none"
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03, duration: 0.2 }}
              >
                <div className="w-12 h-12 rounded-[18px] flex items-center justify-center mb-1.5 transition-all duration-300 bg-slate-50/80 group-hover:bg-rose-50 text-slate-400 group-hover:text-rose-400">
                  <Icon size={20} strokeWidth={1.5} className="transition-colors duration-300" />
                </div>
                <span className="text-[11px] font-medium text-slate-400 group-hover:text-rose-400 transition-colors duration-300">
                  {link.title}
                </span>
              </motion.button>
            );
          })}
        </div>
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
