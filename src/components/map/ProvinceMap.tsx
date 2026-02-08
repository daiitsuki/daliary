import React, { useEffect, useState, useMemo, memo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from 'react-simple-maps';
import { merge } from 'topojson-client';
import { geoCentroid } from 'd3-geo';

interface ProvinceMapProps {
  region: string;
  stats: Record<string, number>;
  onSubRegionClick: (subRegion: string) => void;
}

const TOPOJSON_URL = 'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-municipalities-2018-topo.json';

const PROVINCE_CODE_MAP: Record<string, string> = {
  '서울': '11', '부산': '21', '대구': '22', '인천': '23', '광주': '24',
  '대전': '25', '울산': '26', '세종': '29', '경기': '31', '강원': '32',
  '충북': '33', '충남': '34', '전북': '35', '전남': '36', '경북': '37',
  '경남': '38', '제주': '39'
};

let cachedTopoData: any = null;
const featureCache: Record<string, any[]> = {};

// 별도 컴포넌트로 분리하여 메모이제이션 적용
const MapGeography = memo(({ 
  geo, 
  onMouseEnter, 
  onMouseLeave, 
  onClick, 
  fillColor 
}: { 
  geo: any; 
  onMouseEnter: () => void; 
  onMouseLeave: () => void; 
  onClick: () => void;
  fillColor: string;
}) => {
  return (
    <Geography
      geography={geo}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      style={{
        default: { 
          fill: fillColor, 
          stroke: "#d1d5db", 
          strokeWidth: 0.5, 
          outline: "none",
          transition: "fill 0.2s ease, stroke 0.2s ease"
        },
        hover: { 
          fill: fillColor, // 배경색 유지 (기존 색상과 겹치지 않게 함)
          stroke: "#f43f5e", // 테두리만 강조
          strokeWidth: 1.2, // 테두리 굵기 증가
          outline: "none",
          cursor: "pointer",
          transition: "stroke 0.2s ease"
        },
        pressed: { 
          fill: fillColor, 
          stroke: "#f43f5e", 
          strokeWidth: 1.5, 
          outline: "none" 
        }
      }}
    />
  );
});

const ProvinceMap: React.FC<ProvinceMapProps> = ({ region, stats, onSubRegionClick }) => {
  const [topoData, setTopoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
        console.error('Failed to load TopoJSON:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const mergedFeatures = useMemo(() => {
    if (!topoData) return [];
    
    // 캐시 확인
    if (featureCache[region]) return featureCache[region];

    const provinceCode = PROVINCE_CODE_MAP[region];
    const objectName = 'skorea_municipalities_2018_geo';
    const geometries = topoData.objects[objectName].geometries;

    const provinceGeoms = geometries.filter((g: any) => g.properties.code.startsWith(provinceCode));

    const groups: Record<string, any[]> = {};
    provinceGeoms.forEach((g: any) => {
      const fullName = g.properties.name;
      const match = fullName.match(/^(.+?[시군])/);
      const siGunName = match ? match[1] : fullName;
      
      if (!groups[siGunName]) groups[siGunName] = [];
      groups[siGunName].push(g);
    });

    const results = Object.entries(groups).map(([name, geoms]) => {
      const mergedGeom = merge(topoData, geoms);
      const feature = { type: "Feature", properties: { name }, geometry: mergedGeom };
      
      let labelCoord: [number, number] | null = null;
      try {
        const centroid = geoCentroid(feature as any);
        if (!isNaN(centroid[0]) && !isNaN(centroid[1])) {
          labelCoord = centroid as [number, number];
        }
      } catch(e) {}

      return {
        ...feature,
        labelCoord
      };
    });

    // 캐시에 저장
    featureCache[region] = results;
    return results;
  }, [topoData, region]);

  const projectionConfig = useMemo(() => ({
    center: getCenter(region),
    scale: getScale(region)
  }), [region]);

  function getCenter(r: string): [number, number] {
    const centers: Record<string, [number, number]> = {
      '제주': [126.55, 33.38], '경기': [127.2, 37.5], '강원': [128.4, 37.8],
      '전남': [126.9, 34.8], '경북': [128.8, 36.3], '경남': [128.4, 35.3],
      '충남': [126.8, 36.6], '충북': [127.7, 36.8], '전북': [127.1, 35.7],
      '세종': [127.28, 36.48], '서울': [126.97, 37.56], '부산': [129.07, 35.17],
      '인천': [126.70, 37.45], '대구': [128.60, 35.87], '광주': [126.85, 35.16],
      '대전': [127.38, 36.35], '울산': [129.31, 35.53]
    };
    return centers[r] || [127.5, 36];
  }

  function getScale(r: string): number {
    const scales: Record<string, number> = {
      '경기': 14000, '강원': 11000, '충북': 16000, '충남': 16000, '전북': 16000,
      '전남': 13000, '경북': 11000, '경남': 13000, '제주': 35000, '세종': 80000,
      '서울': 60000, '부산': 50000, '인천': 35000, '대구': 50000, '광주': 60000,
      '대전': 60000, '울산': 50000
    };
    return scales[r] || 10000;
  }

  const getColor = (name: string) => {
    const count = stats[name] || 0;
    if (count === 0) return '#f9fafb';
    
    // 방문 횟수에 따른 농도 계산 (1회: 0.1, 100회 이상: 1.0)
    // 1회 방문 시 너무 안보이지 않도록 기본 투명도를 0.1(10%)부터 시작하고, 100회까지 1.0(100%)으로 증가
    const intensity = Math.min(0.1 + (count - 1) * (0.9 / 99), 1.0);
    
    // 로즈색(#fb7185)을 기반으로 투명도 적용
    return `rgba(251, 113, 133, ${intensity})`;
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-10 h-10 border-4 border-rose-100 border-t-rose-500 rounded-full animate-spin" />
      <p className="text-xs font-bold text-gray-400">지도 데이터를 구성 중...</p>
    </div>
  );

  return (
    <div className="w-full h-full relative bg-white">
      <ComposableMap projection="geoMercator" projectionConfig={projectionConfig} className="w-full h-full">
        <ZoomableGroup center={projectionConfig.center} zoom={1} minZoom={1} maxZoom={8}>
          <Geographies geography={{ type: 'FeatureCollection', features: mergedFeatures }}>
            {({ geographies }) => geographies.map(geo => {
              const name = geo.properties.name;
              return (
                <MapGeography
                  key={geo.rsmKey}
                  geo={geo}
                  onMouseEnter={() => {}}
                  onMouseLeave={() => {}}
                  onClick={() => onSubRegionClick(name)}
                  fillColor={getColor(name)}
                />
              );
            })}
          </Geographies>

          {mergedFeatures.map((f: any) => (
            f.labelCoord && (
              <Marker key={`label-${f.properties.name}`} coordinates={f.labelCoord}>
                <text
                  textAnchor="middle"
                  style={{
                    fontFamily: "Pretendard, system-ui, sans-serif",
                    fontSize: "10px",
                    fill: "#374151",
                    fontWeight: "800",
                    pointerEvents: "none",
                    paintOrder: "stroke",
                    stroke: "#ffffff",
                    strokeWidth: "2.5px"
                  }}
                >
                  {f.properties.name}
                </text>
              </Marker>
            )
          ))}
        </ZoomableGroup>
      </ComposableMap>

      <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-xl border border-gray-100 flex flex-col gap-1 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-400" />
          <span className="text-[8px] font-bold text-gray-500 uppercase tracking-tight">Visited</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-100 border border-gray-200" />
          <span className="text-[8px] font-bold text-gray-500 uppercase tracking-tight">Not Visited</span>
        </div>
      </div>
    </div>
  );
};

export default ProvinceMap;