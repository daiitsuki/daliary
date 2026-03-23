import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Map, Heart, Image as Box, Camera, Settings } from "lucide-react";
import { motion } from "framer-motion";
import AnniversaryModal from "../common/AnniversaryModal";

export default function QuickLinksSection() {
  const navigate = useNavigate();
  const [isAnniversaryModalOpen, setIsAnniversaryModalOpen] = useState(false);

  const quickLinks = [
    {
      id: "plans",
      title: "여행계획",
      icon: Map,
      onClick: () => navigate("/places?tab=plans"),
      color: "text-blue-500",
    },

    {
      id: "memory",
      title: "추억피드",
      icon: Camera,
      onClick: () => navigate("/places?tab=memory"),
      color: "text-amber-500",
    },
    {
      id: "anniversary",
      title: "기념일 계산기",
      icon: Heart,
      onClick: () => setIsAnniversaryModalOpen(true),
      color: "text-rose-500",
    },
    {
      id: "settings",
      title: "설정",
      icon: Settings,
      onClick: () => navigate("/settings"),
      color: "text-slate-500",
    },
  ];

  return (
    <section className="px-6 mb-6">
      <motion.div className="bg-white rounded-[32px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-rose-50/50 relative overflow-hidden group">
        {/* Tools Content */}
        <div className="relative z-10 flex items-start gap-6 overflow-x-auto pb-2 no-scrollbar snap-x scroll-smooth">
          {quickLinks.map((link) => {
            const IconComponent = link.icon;
            return (
              <div
                key={link.id}
                className="flex flex-col items-center flex-shrink-0 snap-start w-[72px]"
              >
                <button
                  onClick={link.onClick}
                  className={`w-13 h-13 rounded-[22px] flex items-center justify-center shadow-sm border transition-all hover:shadow-md hover:scale-105 active:scale-95 bg-white border-gray-50`}
                >
                  <IconComponent size={20} className={link.color} />
                </button>

                <span className="mt-3 text-[11px] font-bold text-center text-gray-500 whitespace-nowrap">
                  {link.title}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>

      <AnniversaryModal
        isOpen={isAnniversaryModalOpen}
        onClose={() => setIsAnniversaryModalOpen(false)}
      />
    </section>
  );
}
