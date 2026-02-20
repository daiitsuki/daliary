import { useState, useMemo, useEffect } from "react";
import { usePlaces, VisitWithPlace } from "../context/PlacesContext";
import { AnimatePresence, motion, Variants } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import VisitDetailModal from "./VisitDetailModal";
import { METROPOLITAN_CITIES, PROVINCES } from "../constants/regions";
import { Map as MapIcon, List, ArrowUpDown, ChevronDown, Check } from "lucide-react";

// Map related components
import DashboardHeader from "./map/DashboardHeader";
import RegionDetailOverlay from "./map/RegionDetailOverlay";
import HelpModal from "./map/HelpModal";
import RegionCardList from "./map/RegionCardList";
import SubRegionMapOverlay from "./map/SubRegionMapOverlay";
import DetailedKoreaMap from "./map/DetailedKoreaMap";

// Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { 
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { 
      duration: 0.5, 
      ease: "easeOut"
    }
  }
};

type SortOption = 'default' | 'most-visited' | 'least-visited' | 'recent';

/**
 * 메인 RegionDashboard 컴포넌트
 */
const RegionDashboard = () => {
  const { stats, subRegionStats, visits, updateVisit, deleteVisit, loading: placesLoading } = usePlaces();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const selectedRegion = searchParams.get("region");
  const selectedSubRegion = searchParams.get("subRegion");

  const [selectedVisit, setSelectedVisit] = useState<VisitWithPlace | null>(
    null,
  );
  const [showHelp, setShowHelp] = useState(false);

  // 뷰 모드 관련 상태 및 로컬 스토리지 저장
  const VIEW_MODE_KEY = 'daliary_region_view_mode';
  const [viewMode, setViewMode] = useState<"map" | "list">(() => {
    const saved = localStorage.getItem(VIEW_MODE_KEY);
    return (saved as "map" | "list") || "list";
  });

  // 정렬 관련 상태
  const SORT_STORAGE_KEY = 'daliary_region_sort';
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    const saved = localStorage.getItem(SORT_STORAGE_KEY);
    return (saved as SortOption) || 'default';
  });
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(SORT_STORAGE_KEY, sortOption);
  }, [sortOption]);

  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  const sortOptions = [
    { id: 'default', label: '기본 순' },
    { id: 'most-visited', label: '방문 많은 순' },
    { id: 'least-visited', label: '방문 적은 순' },
    { id: 'recent', label: '최근 다녀온 순' },
  ];

  const totalVisits = visits.length;
  const visitedRegionsCount = useMemo(
    () => Object.values(stats).filter((count) => count > 0).length,
    [stats],
  );

  const filteredVisits = useMemo(() => {
    if (!selectedRegion) return [];

    if (METROPOLITAN_CITIES.includes(selectedRegion)) {
      return visits
        .filter((v) => v.region === selectedRegion)
        .sort(
          (a, b) =>
            new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime(),
        );
    }

    if (selectedSubRegion) {
      return visits
        .filter(
          (v) =>
            v.region === selectedRegion && 
            (selectedSubRegion === "미분류" 
              ? (!v.sub_region || v.sub_region === "") 
              : v.sub_region === selectedSubRegion),
        )
        .sort(
          (a, b) =>
            new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime(),
        );
    }

    return visits.filter((v) => v.region === selectedRegion);
  }, [visits, selectedRegion, selectedSubRegion]);

  const setSelectedRegion = (region: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (region) {
      newParams.set("region", region);
    } else {
      newParams.delete("region");
      newParams.delete("subRegion");
    }
    setSearchParams(newParams);
  };

  const setSelectedSubRegion = (subRegion: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (subRegion) {
      newParams.set("subRegion", subRegion);
    } else {
      newParams.delete("subRegion");
    }
    setSearchParams(newParams);
  };

  const handleMapRegionSelect = (region: string, subRegion?: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("region", region);
    if (subRegion) {
      newParams.set("subRegion", subRegion);
    } else {
      newParams.delete("subRegion");
    }
    setSearchParams(newParams);
  };

  const handleBack = () => {
    if (selectedSubRegion) {
      setSelectedSubRegion(null);
    } else {
      setSelectedRegion(null);
    }
  };

  const currentSortLabel = sortOptions.find(opt => opt.id === sortOption)?.label;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative flex flex-col h-full bg-white overflow-hidden"
    >
      {/* Main Content Area */}
      <div className="absolute inset-0 flex flex-col">
        <motion.div variants={itemVariants}>
          <DashboardHeader
            visitedRegionsCount={visitedRegionsCount}
            totalVisits={totalVisits}
            onHelpClick={() => setShowHelp(true)}
          />
        </motion.div>

        {/* Control Bar (Sort & View Toggle) */}
        <motion.div variants={itemVariants} className="px-6 py-2 flex items-center justify-between bg-white shrink-0 relative z-30">
          {/* Sort Dropdown (Left) - Only visible in list mode */}
          <div className="relative">
            <AnimatePresence>
              {viewMode === "list" && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  <button
                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
                  >
                    <ArrowUpDown size={14} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-700">{currentSortLabel}</span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform ${isSortDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isSortDropdownOpen && viewMode === "list" && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setIsSortDropdownOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 top-full mt-2 w-40 bg-white border border-gray-100 rounded-2xl shadow-xl z-30 overflow-hidden py-1.5"
                  >
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => {
                          setSortOption(opt.id as SortOption);
                          setIsSortDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-bold transition-colors ${
                          sortOption === opt.id ? 'text-rose-500 bg-rose-50' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {opt.label}
                        {sortOption === opt.id && <Check size={14} />}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* View Toggle (Right) */}
          <div className="bg-gray-100 p-1 rounded-xl flex items-center">
            <button
              onClick={() => setViewMode("map")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "map"
                  ? "bg-white text-rose-500 shadow-sm"
                  : "text-gray-400"
              }`}
            >
              <MapIcon size={16} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "list"
                  ? "bg-white text-rose-500 shadow-sm"
                  : "text-gray-400"
              }`}
            >
              <List size={16} />
            </button>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="flex-1 w-full min-h-0 overflow-hidden relative">
          {placesLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className="w-10 h-10 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin" />
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading Records...</p>
            </div>
          ) : viewMode === "map" ? (
            <div className="h-full">
              <DetailedKoreaMap 
                stats={stats}
                subRegionStats={subRegionStats} 
                onRegionSelect={handleMapRegionSelect} 
              />
            </div>
          ) : (
            <RegionCardList stats={stats} visits={visits} onRegionClick={setSelectedRegion} sortOption={sortOption} />
          )}
        </motion.div>
      </div>

      {/* Overlay Layers */}
      <AnimatePresence>
        {selectedRegion &&
          PROVINCES.includes(selectedRegion) &&
          !selectedSubRegion && (
            <SubRegionMapOverlay
              region={selectedRegion}
              onBack={handleBack}
              onSubRegionClick={setSelectedSubRegion}
              onVisitClick={setSelectedVisit}
            />
          )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedRegion &&
          (METROPOLITAN_CITIES.includes(selectedRegion) ||
            selectedSubRegion) && (
            <RegionDetailOverlay
              region={selectedSubRegion || selectedRegion}
              visits={filteredVisits}
              onBack={handleBack}
              onVisitClick={setSelectedVisit}
            />
          )}
      </AnimatePresence>

      {/* Modal Layer: Visit Details & Help */}
      <AnimatePresence>
        {selectedVisit && (
          <div className="relative z-[100]">
            <VisitDetailModal
              visit={selectedVisit}
              onClose={() => setSelectedVisit(null)}
              onUpdate={updateVisit}
              onDelete={deleteVisit}
            />
          </div>
        )}
      </AnimatePresence>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
    </motion.div>
  );
};

export default RegionDashboard;
