import { useState, useEffect, useMemo, useCallback } from "react";
import { DetailedKoreaMapProps, MapData, CurrentStats } from "./types";

const OPTIMIZED_MAP_URL = "/data/optimized-korea-map.json";

export const useKoreaMap = ({
  stats,
  subRegionStats,
  onRegionSelect,
}: DetailedKoreaMapProps) => {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  const zoomConfig = useMemo(
    () => ({
      initial: isMobile ? 3 : 2,
      detailed: isMobile ? 8 : 6,
      threshold: isMobile ? 5 : 3,
    }),
    [isMobile],
  );

  const [zoom, setZoom] = useState(zoomConfig.initial);
  const [center, setCenter] = useState<[number, number]>([127.5, 36]);

  // Load Map Data
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(OPTIMIZED_MAP_URL);
        const data = await response.json();
        setMapData(data);
      } catch (error) {
        console.error("Failed to load optimized map data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Resize Handler
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      if (mobile !== isMobile) setIsMobile(mobile);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);

  // Sync zoom when deselected
  useEffect(() => {
    if (!selectedProvince) setZoom(zoomConfig.initial);
  }, [zoomConfig, selectedProvince]);

  // Province Labels Calculation
  const provinceLabels = useMemo(() => {
    if (!mapData) return [];
    const provinces: Record<
      string,
      { coords: [number, number][]; name: string }
    > = {};

    mapData.detailed.forEach((f: any) => {
      if (!f.properties.isMetro && f.labelCoord) {
        if (!provinces[f.properties.province]) {
          provinces[f.properties.province] = {
            coords: [],
            name: f.properties.province,
          };
        }
        provinces[f.properties.province].coords.push(f.labelCoord);
      }
    });

    return Object.values(provinces).map((p) => {
      let avgLon = p.coords.reduce((sum, c) => sum + c[0], 0) / p.coords.length;
      let avgLat = p.coords.reduce((sum, c) => sum + c[1], 0) / p.coords.length;
      if (p.name === "경기") {
        avgLon += 0.25;
        avgLat += 0.05;
      }
      return { name: p.name, coord: [avgLon, avgLat] as [number, number] };
    });
  }, [mapData]);

  // Stats Calculation
  const currentStats = useMemo<CurrentStats>(() => {
    if (selectedProvince) {
      const subStats = subRegionStats[selectedProvince] || {};
      const total = Object.values(subStats).reduce((sum, count) => sum + count, 0);
      let topName = "";
      let maxCount = 0;
      Object.entries(subStats).forEach(([name, count]) => {
        if (count > 0 && count >= maxCount) {
          maxCount = count;
          topName = name;
        }
      });
      return { label: selectedProvince, total, topName };
    } else {
      const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
      let topName = "";
      let maxCount = 0;
      Object.entries(stats).forEach(([name, count]) => {
        if (count > 0 && count >= maxCount) {
          maxCount = count;
          topName = name;
        }
      });
      return { label: "전국", total, topName };
    }
  }, [selectedProvince, stats, subRegionStats]);

  // Interactions
  const handleMoveEnd = (position: { x: number; y: number; zoom: number }) => {
    setZoom(position.zoom);
    if (position.zoom <= zoomConfig.threshold && selectedProvince) {
      setSelectedProvince(null);
      setCenter([127.5, 36]);
    }
  };

  const handleRegionClick = useCallback(
    (geo: any) => {
      const { province, name, isMetro } = geo.properties;
      if (isMetro) {
        onRegionSelect(province);
      } else {
        if (zoom > zoomConfig.threshold && selectedProvince === province) {
          onRegionSelect(province, name);
        } else {
          if (geo.labelCoord) {
            setCenter(geo.labelCoord);
            setZoom(zoomConfig.detailed);
            setSelectedProvince(province);
          }
        }
      }
    },
    [zoom, onRegionSelect, selectedProvince, zoomConfig],
  );

  const handleTopRegionClick = () => {
    if (!currentStats.topName || !mapData) return;

    if (selectedProvince) {
      onRegionSelect(selectedProvince, currentStats.topName);
    } else {
      const targetName = currentStats.topName;
      const targetGeo = mapData.detailed.find(
        (f) => f.properties.province === targetName,
      );

      if (targetGeo) {
        if (targetGeo.properties.isMetro) {
          onRegionSelect(targetName);
        } else {
          if (targetGeo.labelCoord) {
            setCenter(targetGeo.labelCoord);
            setZoom(zoomConfig.detailed);
            setSelectedProvince(targetName);
          }
        }
      }
    }
  };

  const resetSelection = () => {
    setCenter([127.5, 36]);
    setZoom(zoomConfig.initial);
    setSelectedProvince(null);
  };

  return {
    mapData,
    loading,
    zoom,
    center,
    selectedProvince,
    currentStats,
    provinceLabels,
    zoomConfig,
    handleMoveEnd,
    handleRegionClick,
    handleTopRegionClick,
    resetSelection,
  };
};
