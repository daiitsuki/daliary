import React, { useMemo } from "react";
import { KOREA_REGIONS } from "../../constants/regions";
import { MapPin } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { VisitWithPlace } from "../../context/PlacesContext";

interface RegionCardListProps {
  stats: Record<string, number>;
  visits: VisitWithPlace[];
  onRegionClick: (region: string) => void;
  sortOption: string;
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      duration: 0.4,
    },
  },
};

const item: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
};

const RegionCardList: React.FC<RegionCardListProps> = ({
  stats,
  visits,
  onRegionClick,
  sortOption,
}) => {
  const sortedRegions = useMemo(() => {
    const regions = [...KOREA_REGIONS];

    switch (sortOption) {
      case "most-visited":
        return regions.sort((a, b) => (stats[b] || 0) - (stats[a] || 0));
      case "least-visited":
        return regions.sort((a, b) => (stats[a] || 0) - (stats[b] || 0));
      case "recent":
        return regions.sort((a, b) => {
          const lastVisitA = visits.find((v) => v.region === a);
          const lastVisitB = visits.find((v) => v.region === b);

          if (!lastVisitA && !lastVisitB) return 0;
          if (!lastVisitA) return 1;
          if (!lastVisitB) return -1;

          return (
            new Date(lastVisitB.visited_at).getTime() -
            new Date(lastVisitA.visited_at).getTime()
          );
        });
      case "default":
      default:
        return regions;
    }
  }, [sortOption, stats, visits]);

  return (
    <motion.div
      key={sortOption}
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-6 overflow-y-auto custom-scrollbar h-full"
    >
      {sortedRegions.map((region) => {
        const count = stats[region] || 0;
        return (
          <motion.button
            key={region}
            variants={item}
            onClick={() => onRegionClick(region)}
            className={`flex flex-col items-center justify-center p-6 rounded-3xl border transition-all duration-300 active:scale-[0.98] group ${
              count > 0
                ? "bg-white border-gray-100 shadow-[0_4px_20px_-4px_rgba(244,63,94,0.06)] hover:shadow-[0_8px_30px_-5px_rgba(244,63,94,0.1)]"
                : "bg-white border-gray-50 text-gray-400 hover:border-gray-200 hover:bg-gray-50/30"
            }`}
          >
            <div
              className={`p-3 rounded-2xl mb-3 transition-all duration-300 ${count > 0 ? "bg-rose-50/50 group-hover:bg-rose-100/50" : "bg-gray-50 group-hover:bg-gray-100"}`}
            >
              <MapPin
                size={24}
                className={`transition-colors duration-300 ${count > 0 ? "text-rose-400" : "text-gray-200"}`}
              />
            </div>
            <span
              className={`text-lg font-black transition-colors duration-300 ${count > 0 ? "text-gray-800" : "text-gray-300 group-hover:text-gray-400"}`}
            >
              {region}
            </span>
            <span
              className={`text-[12px] font-bold mt-1 transition-colors duration-300 ${count > 0 ? "text-rose-400/80" : "text-gray-300 group-hover:text-gray-400"}`}
            >
              {count}개의 방문 기록
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
};

export default RegionCardList;
