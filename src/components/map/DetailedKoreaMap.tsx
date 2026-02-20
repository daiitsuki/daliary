import React, { useEffect, useState, useMemo, memo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
} from "react-simple-maps";
import { merge } from "topojson-client";
import { geoCentroid } from "d3-geo";

interface DetailedKoreaMapProps {
  stats: Record<string, number>;
  subRegionStats: Record<string, Record<string, number>>;
  onRegionSelect: (region: string, subRegion?: string) => void;
}

const TOPOJSON_URL =
  "https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-municipalities-2018-topo.json";

const CODE_TO_PROVINCE: Record<string, string> = {
  "11": "서울",
  "21": "부산",
  "22": "대구",
  "23": "인천",
  "24": "광주",
  "25": "대전",
  "26": "울산",
  "29": "세종",
  "31": "경기",
  "32": "강원",
  "33": "충북",
  "34": "충남",
  "35": "전북",
  "36": "전남",
  "37": "경북",
  "38": "경남",
  "39": "제주",
};

const METRO_CODES = ["11", "21", "22", "23", "24", "25", "26", "29"];

let cachedTopoData: any = null;
let cachedMapData: { detailed: any[]; provinceOutlines: any[] } | null = null;

const MapGeography = memo(
  ({
    geo,
    onClick,
    fillColor,
  }: {
    geo: any;
    onClick: () => void;
    fillColor: string;
  }) => {
    return (
      <Geography
        geography={geo}
        onClick={onClick}
        style={{
          default: {
            fill: fillColor,
            stroke: "#d1d5db",
            strokeWidth: 0.4,
            outline: "none",
            transition: "fill 0.2s ease",
          },
          hover: {
            fill: fillColor,
            stroke: "#f43f5e",
            strokeWidth: 1.0,
            outline: "none",
            cursor: "pointer",
          },
          pressed: {
            fill: fillColor,
            stroke: "#f43f5e",
            strokeWidth: 1.2,
            outline: "none",
          },
        }}
      />
    );
  },
);

const DetailedKoreaMap: React.FC<DetailedKoreaMapProps> = ({
  stats,
  subRegionStats,
  onRegionSelect,
}) => {
  const [topoData, setTopoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const loadData = async () => {
      if (cachedTopoData) {
        setTopoData(cachedTopoData);
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(TOPOJSON_URL);
        const data = await response.json();
        cachedTopoData = data;
        setTopoData(data);
      } catch (error) {
        console.error("Failed to load TopoJSON:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 전체 데이터 처리 (시/군 단위 & 도 단위 경계선)
  const mapData = useMemo(() => {
    if (!topoData) return { detailed: [], provinceOutlines: [] };

    // 이미 계산된 전체 맵 데이터가 있다면 반환
    if (cachedMapData) return cachedMapData;

    const objectName = "skorea_municipalities_2018_geo";
    const geometries = topoData.objects[objectName].geometries;

    // 1. 시/군 단위 그룹화
    const detailedGroups: Record<
      string,
      { geoms: any[]; province: string; code: string; isMetro: boolean }
    > = {};
    // 2. 도 단위 그룹화 (경계선용)
    const provinceGroups: Record<string, { geoms: any[] }> = {};

    geometries.forEach((g: any) => {
      const codePrefix = g.properties.code.substring(0, 2);
      const province = CODE_TO_PROVINCE[codePrefix] || "기타";
      const isMetro = METRO_CODES.includes(codePrefix);

      // 시/군 단위 키
      let detailedKey: string;
      if (isMetro) {
        detailedKey = province;
      } else {
        const fullName = g.properties.name;
        const match = fullName.match(/^(.+?[시군])/);
        const siGunName = match ? match[1] : fullName;
        detailedKey = `${province}_${siGunName}`;
      }

      if (!detailedGroups[detailedKey]) {
        detailedGroups[detailedKey] = {
          geoms: [],
          province,
          code: g.properties.code,
          isMetro,
        };
      }
      detailedGroups[detailedKey].geoms.push(g);

      // 도 단위 그룹
      if (!provinceGroups[province]) {
        provinceGroups[province] = { geoms: [] };
      }
      provinceGroups[province].geoms.push(g);
    });

    // 상세 피처 생성
    const detailed = Object.entries(detailedGroups).map(([key, data]) => {
      const province = data.province;
      const name = key.includes("_") ? key.split("_")[1] : province;
      const mergedGeom = merge(topoData, data.geoms);
      const feature = {
        type: "Feature",
        properties: { name, province, isMetro: data.isMetro },
        geometry: mergedGeom,
      };

      let labelCoord: [number, number] | null = null;
      try {
        const centroid = geoCentroid(feature as any);
        if (!isNaN(centroid[0]) && !isNaN(centroid[1])) {
          labelCoord = centroid as [number, number];
        }
      } catch (e) {}

      return { ...feature, labelCoord };
    });

    // 도 단위 외곽선 피처 생성
    const provinceOutlines = Object.entries(provinceGroups).map(
      ([name, data]) => {
        return {
          type: "Feature",
          properties: { name },
          geometry: merge(topoData, data.geoms),
        };
      },
    );

    const result = { detailed, provinceOutlines };
    cachedMapData = result;
    return result;
  }, [topoData]);

  // 도 단위 중심점 계산 (줌 아웃 상태에서 표시용)
  const provinceLabels = useMemo(() => {
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
      const avgLon =
        p.coords.reduce((sum, c) => sum + c[0], 0) / p.coords.length;
      const avgLat =
        p.coords.reduce((sum, c) => sum + c[1], 0) / p.coords.length;
      return { name: p.name, coord: [avgLon, avgLat] as [number, number] };
    });
  }, [mapData.detailed]);

  const getColor = (province: string, name: string, isMetro: boolean) => {
    let count = 0;
    if (isMetro) {
      count = stats[province] || 0;
    } else {
      count = subRegionStats[province]?.[name] || 0;
    }

    if (count === 0) return "#f9fafb";

    const intensity = count <= 10 ? 0.1 : Math.min(count / 100, 1.0);

    return `rgba(251, 113, 133, ${intensity})`;
  };

  const handleMoveEnd = (position: { x: number; y: number; zoom: number }) => {
    setZoom(position.zoom);
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
        <div className="w-10 h-10 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin" />
        <p className="text-xs font-black text-gray-400">
          전체 지도 데이터를 로딩 중...
        </p>
      </div>
    );

  return (
    <div className="w-full h-full relative bg-white flex items-center justify-center">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [127.5, 36], scale: 5000 }}
        className="w-full h-full max-h-[600px]"
      >
        <ZoomableGroup
          center={[127.5, 36]}
          zoom={1}
          minZoom={1}
          maxZoom={12}
          onMoveEnd={handleMoveEnd}
        >
          {/* 1. 시/군 단위 배경 및 클릭 레이어 */}
          <Geographies
            geography={{
              type: "FeatureCollection",
              features: mapData.detailed,
            }}
          >
            {({ geographies }) =>
              geographies.map((geo) => {
                const { province, name, isMetro } = geo.properties;
                return (
                  <MapGeography
                    key={geo.rsmKey}
                    geo={geo}
                    onClick={() =>
                      onRegionSelect(province, isMetro ? undefined : name)
                    }
                    fillColor={getColor(province, name, isMetro)}
                  />
                );
              })
            }
          </Geographies>

          {/* 2. 도 단위 굵은 경계선 레이어 (배경 위에 덮어씌움) */}
          <Geographies
            geography={{
              type: "FeatureCollection",
              features: mapData.provinceOutlines,
            }}
          >
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={`outline-${geo.rsmKey}`}
                  geography={geo}
                  style={{
                    default: {
                      fill: "none",
                      stroke: "#9ca3af",
                      strokeWidth: 0.7,
                      pointerEvents: "none",
                    },
                    hover: {
                      fill: "none",
                      stroke: "#9ca3af",
                      strokeWidth: 0.7,
                      pointerEvents: "none",
                    },
                    pressed: {
                      fill: "none",
                      stroke: "#9ca3af",
                      strokeWidth: 0.7,
                      pointerEvents: "none",
                    },
                  }}
                />
              ))
            }
          </Geographies>

          {/* Labels - Detailed */}
          {mapData.detailed.map((f: any) => {
            const isVisible =
              f.properties.isMetro || (zoom > 2.5 && !f.properties.isMetro);
            if (!f.labelCoord || !isVisible) return null;

            return (
              <Marker
                key={`label-detailed-${f.properties.province}-${f.properties.name}`}
                coordinates={f.labelCoord}
              >
                <text
                  textAnchor="middle"
                  style={{
                    fontFamily: "Pretendard, system-ui, sans-serif",
                    fontSize: f.properties.isMetro
                      ? `${12 / Math.sqrt(zoom)}px`
                      : `${10 / Math.sqrt(zoom)}px`,
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

          {/* Labels - Provinces */}
          {zoom <= 2.5 &&
            provinceLabels.map((p) => (
              <Marker key={`label-province-${p.name}`} coordinates={p.coord}>
                <text
                  textAnchor="middle"
                  style={{
                    fontFamily: "Pretendard, system-ui, sans-serif",
                    fontSize: `${12 / Math.sqrt(zoom)}px`,
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

      {/* Legend & Controls */}
      <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-md p-3 rounded-[24px] border border-gray-100 flex flex-col gap-2 shadow-xl z-10">
        <div className="flex flex-col gap-1.5 border-b border-gray-100 pb-2 mb-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-tight">
              Visited
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-100 border border-gray-200" />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">
              Not Visited
            </span>
          </div>
        </div>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em] text-center">
          Zoom: {zoom.toFixed(1)}x
        </p>
      </div>

      {/* Help Hint */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none w-full flex justify-center px-4">
        <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-gray-100 shadow-sm">
          <p className="text-[10px] font-black text-gray-500">
            ⓘ 지도를 움직이거나 확대/축소하여 지역을 선택하세요
          </p>
        </div>
      </div>
    </div>
  );
};

export default memo(DetailedKoreaMap);
