import React, { memo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
} from "react-simple-maps";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ImageIcon, Palette, Type } from "lucide-react";
import { DetailedKoreaMapProps } from "./types";
import { useKoreaMap } from "./useKoreaMap";
import MapGeography from "./MapGeography";
import FloatingStatsCard from "./FloatingStatsCard";
import StatsDetailModal from "./StatsDetailModal";
import RecentVisitsModal from "./RecentVisitsModal";
import PhotoClipGeography from "./PhotoClipGeography";
import { useMapDisplayMode } from "../../../../hooks/map/useMapDisplayMode";
import { usePlaces } from "../../../../context/PlacesContext";

const DetailedKoreaMap: React.FC<DetailedKoreaMapProps> = (props) => {
  const { stats, subRegionStats, visits } = props;
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isRecentModalOpen, setIsRecentModalOpen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const { mode, toggleMode } = useMapDisplayMode();
  const { regionPhotos, subRegionPhotos } = usePlaces();
  const {
    mapData,
    loading,
    zoom,
    center,
    selectedProvince,
    currentStats,
    provinceLabels,
    zoomConfig,
    recentVisit,
    handleMoveEnd,
    handleRegionClick,
    handleTopRegionClick,
    zoomToProvince,
    resetSelection,
  } = useKoreaMap(props);

  if (loading || !mapData) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <div className="w-10 h-10 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin" />
        <p className="text-xs font-black text-gray-400">
          지도 데이터를 불러오는 중...
        </p>
      </div>
    );
  }

  const getColor = (province: string, name: string, isMetro: boolean) => {
    let count = isMetro ? stats[province] || 0 : subRegionStats[province]?.[name] || 0;
    if (count === 0) return "#f9fafb";

    let intensity = count <= 10 
      ? 0.3 + (count - 1) * (0.2 / 9) 
      : Math.min(0.5 + (count - 10) * (0.5 / 90), 1.0);
    
    return `rgba(251, 113, 133, ${intensity})`;
  };

  return (
    <div 
      className="w-full h-full relative bg-white flex items-center justify-center overflow-hidden"
      style={{ touchAction: "none" }}
    >
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [127.5, 36], scale: 5000 }}
        className="w-full h-full"
      >
        <ZoomableGroup
          center={center}
          zoom={zoom}
          minZoom={1.5}
          maxZoom={selectedProvince ? zoomConfig.detailed : zoomConfig.threshold}
          onMoveEnd={handleMoveEnd}
          translateExtent={[[0, 0], [800, 600]]}
        >
          {/* Detailed Geographies */}
          <Geographies geography={{ type: "FeatureCollection", features: mapData.detailed }}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const { province, name, isMetro } = geo.properties;
                const isDeactivated = selectedProvince !== null && province !== selectedProvince;
                const photoUrl = isMetro
                  ? regionPhotos[province]
                  : subRegionPhotos[province]?.[name];

                if (mode === 'photo' && photoUrl) {
                  return (
                    <PhotoClipGeography
                      key={geo.rsmKey}
                      geo={geo}
                      photoUrl={photoUrl}
                      isDeactivated={isDeactivated}
                      onClick={() => handleRegionClick(geo)}
                    />
                  );
                }
                return (
                  <MapGeography
                    key={geo.rsmKey}
                    geo={geo}
                    onClick={() => handleRegionClick(geo)}
                    fillColor={getColor(province, name, isMetro)}
                    isDeactivated={isDeactivated}
                  />
                );
              })
            }
          </Geographies>

          {/* Province Outlines */}
          <Geographies geography={{ type: "FeatureCollection", features: mapData.provinceOutlines }}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const isDeactivated = selectedProvince !== null && geo.properties.name !== selectedProvince;
                return (
                  <Geography
                    key={`outline-${geo.rsmKey}`}
                    geography={geo}
                    style={{
                      default: {
                        fill: "none",
                        stroke: isDeactivated ? "#e5e7eb" : "#9ca3af",
                        strokeWidth: 0.7,
                        pointerEvents: "none",
                        transition: "all 0.6s ease",
                        strokeOpacity: isDeactivated ? 0.1 : 1,
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {/* Region Labels */}
          {showLabels && mapData.detailed.map((f: any) => {
            const isVisible = (f.properties.isMetro && zoom <= zoomConfig.threshold) ||
              (zoom > zoomConfig.threshold && f.properties.province === selectedProvince);
            if (!f.labelCoord || !isVisible) return null;

            return (
              <Marker key={`label-detailed-${f.properties.province}-${f.properties.name}`} coordinates={f.labelCoord}>
                <text
                  textAnchor="middle"
                  style={{
                    fontFamily: "Pretendard, system-ui, sans-serif",
                    fontSize: f.properties.isMetro ? `${12 / Math.sqrt(zoom)}px` : `${10 / Math.sqrt(zoom)}px`,
                    fill: "#111827",
                    fontWeight: "800",
                    pointerEvents: "none",
                    paintOrder: "stroke",
                    stroke: "#ffffff",
                    strokeWidth: "1.5px",
                  }}
                >
                  {f.properties.name}
                </text>
              </Marker>
            );
          })}

          {/* Province Labels */}
          {showLabels && zoom <= zoomConfig.threshold &&
            provinceLabels.map((p) => (
              <Marker key={`label-province-${p.name}`} coordinates={p.coord}>
                <text
                  textAnchor="middle"
                  style={{
                    fontFamily: "Pretendard, system-ui, sans-serif",
                    fontSize: `${14 / Math.sqrt(zoom)}px`,
                    fill: "#111827",
                    fontWeight: "900",
                    pointerEvents: "none",
                    paintOrder: "stroke",
                    stroke: "#ffffff",
                    strokeWidth: "2px",
                  }}
                >
                  {p.name}
                </text>
              </Marker>
            ))}
        </ZoomableGroup>
      </ComposableMap>

      {/* Floating Stats Card */}
      <FloatingStatsCard
        selectedProvince={selectedProvince}
        currentStats={currentStats}
        recentVisit={recentVisit}
        onTopRegionClick={handleTopRegionClick}
        onStatsClick={() => setIsStatsModalOpen(true)}
        onRecentVisitClick={() => setIsRecentModalOpen(true)}
      />

      {/* Stats Detail Modal */}
      <StatsDetailModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        selectedProvince={selectedProvince}
        stats={stats}
        subRegionStats={subRegionStats}
        onSelectRegion={(province, subRegion) => {
          if (subRegion) {
            props.onRegionSelect(province, subRegion);
          } else {
            zoomToProvince(province);
          }
        }}
      />

      {/* Recent Visits Modal */}
      <RecentVisitsModal
        isOpen={isRecentModalOpen}
        onClose={() => setIsRecentModalOpen(false)}
        selectedProvince={selectedProvince}
        visits={visits}
        onSelectVisit={(province, subRegion, visitId) => {
          props.onRegionSelect(province, subRegion, visitId);
        }}
      />

      {/* Back Button */}
      <AnimatePresence>
        {selectedProvince && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={resetSelection}
            className="absolute top-6 left-6 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full border border-gray-100 shadow-xl text-rose-500 hover:bg-rose-50 transition-all z-20 flex items-center justify-center group"
          >
            <ArrowLeft size={20} strokeWidth={3} />
          </motion.button>
        )}
      </AnimatePresence>
      {/* 좌하단 버튼 그룹 — 라벨 토글 위, 사진/색상 토글 아래 */}
      <div className="absolute bottom-20 left-4 z-20 flex flex-col gap-2">
        <button
          onClick={() => setShowLabels((prev) => !prev)}
          className="w-10 h-10 bg-white/90 backdrop-blur-md border border-gray-100 shadow-xl rounded-full flex items-center justify-center text-gray-500 hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-95"
          title={showLabels ? '지역명 숨기기' : '지역명 보이기'}
        >
          <div className="relative">
            <Type size={16} />
            {!showLabels && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-5 h-0.5 bg-current rotate-45 rounded-full" />
              </div>
            )}
          </div>
        </button>
        <button
          onClick={toggleMode}
          className="w-10 h-10 bg-white/90 backdrop-blur-md border border-gray-100 shadow-xl rounded-full flex items-center justify-center text-gray-500 hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-95"
          title={mode === 'photo' ? '색상 모드로 전환' : '사진 모드로 전환'}
        >
          {mode === 'photo' ? <Palette size={16} /> : <ImageIcon size={16} />}
        </button>
      </div>
    </div>
  );
};

export default memo(DetailedKoreaMap);
