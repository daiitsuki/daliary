import { useCallback } from "react";
import { usePlaces } from "../../../context/PlacesContext";
import { motion, Variants } from "framer-motion";
import { useSearchParams } from "react-router-dom";

// Map related components
import DetailedKoreaMap from "./DetailedKoreaMap";

// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5
    },
  },
};

/**
 * 메인 RegionDashboard 컴포넌트 - 지도 전용 뷰
 */
const RegionDashboard = () => {
  const {
    stats,
    subRegionStats,
    loading: placesLoading,
  } = usePlaces();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleMapRegionSelect = useCallback(
    (region: string, subRegion?: string) => {
      const newParams = new URLSearchParams(searchParams);
      newParams.set("tab", "memory");
      newParams.set("region", region);
      if (subRegion) {
        newParams.set("subRegion", subRegion);
      } else {
        newParams.delete("subRegion");
      }
      setSearchParams(newParams);
    },
    [searchParams, setSearchParams],
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative w-full h-full bg-white overflow-hidden"
    >
      {placesLoading ? (
        <div className="h-full flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
            Loading Records...
          </p>
        </div>
      ) : (
        <div className="w-full h-full">
          <DetailedKoreaMap
            stats={stats}
            subRegionStats={subRegionStats}
            onRegionSelect={handleMapRegionSelect}
          />
        </div>
      )}
    </motion.div>
  );
};

export default RegionDashboard;
