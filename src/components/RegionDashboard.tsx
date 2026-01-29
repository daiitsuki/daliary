import { useState, useMemo } from "react";
import { usePlaces, VisitWithPlace } from "../context/PlacesContext";
import { AnimatePresence } from "framer-motion";
import VisitDetailModal from "./VisitDetailModal";

// Map related components
import KoreaMap from "./map/KoreaMap";
import DashboardHeader from "./map/DashboardHeader";
import RegionDetailOverlay from "./map/RegionDetailOverlay";
import HelpModal from "./map/HelpModal";

/**
 * 메인 RegionDashboard 컴포넌트
 */
const RegionDashboard = () => {
  const { stats, visits, updateVisit, deleteVisit } = usePlaces();
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<VisitWithPlace | null>(
    null,
  );
  const [showHelp, setShowHelp] = useState(false);

  const totalVisits = visits.length;
  const visitedRegionsCount = useMemo(
    () => Object.values(stats).filter((count) => count > 0).length,
    [stats],
  );

  const filteredVisits = useMemo(
    () =>
      selectedRegion
        ? visits
            .filter((v) => v.region === selectedRegion)
            .sort(
              (a, b) =>
                new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime(),
            )
        : [],
    [visits, selectedRegion],
  );

  return (
    <div className="relative flex flex-col h-full bg-white overflow-hidden">
      {/* Background Layer: Map & Header */}
      <div className="absolute inset-0 flex flex-col">
        <DashboardHeader
          visitedRegionsCount={visitedRegionsCount}
          totalVisits={totalVisits}
          onHelpClick={() => setShowHelp(true)}
        />
        <div className="flex-1 w-full max-w-lg mx-auto flex items-center justify-center min-h-0 overflow-hidden relative">
          <KoreaMap stats={stats} onRegionClick={setSelectedRegion} />
        </div>
      </div>

      {/* Overlay Layer: Region Detail */}
      <AnimatePresence>
        {selectedRegion && (
          <RegionDetailOverlay
            region={selectedRegion}
            visits={filteredVisits}
            onBack={() => setSelectedRegion(null)}
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

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
};

export default RegionDashboard;