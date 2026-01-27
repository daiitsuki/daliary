import React, { useMemo } from 'react';
import { SimpleSouthKoreaMapChart } from 'react-simple-south-korea-map-chart';
import 'react-simple-south-korea-map-chart/dist/map.css';

interface KoreaMapProps {
  stats: Record<string, number>;
  onRegionClick: (region: string) => void;
}

// Mapping from Korean region names (DB) to Library names (for coloring)
const REGION_TO_FULL_NAME: Record<string, string> = {
  '서울': '서울특별시',
  '부산': '부산광역시',
  '대구': '대구광역시',
  '인천': '인천광역시',
  '광주': '광주광역시',
  '대전': '대전광역시',
  '울산': '울산광역시',
  '세종': '세종특별자치시',
  '경기': '경기도',
  '강원': '강원도',
  '충북': '충청북도',
  '충남': '충청남도',
  '전북': '전라북도',
  '전남': '전라남도',
  '경북': '경상북도',
  '경남': '경상남도',
  '제주': '제주특별자치도'
};

// Reverse mapping for click handling
const FULL_NAME_TO_REGION: Record<string, string> = Object.entries(REGION_TO_FULL_NAME).reduce((acc, [k, v]) => {
  acc[v] = k;
  return acc;
}, {} as Record<string, string>);

const KoreaMap: React.FC<KoreaMapProps> = ({ stats, onRegionClick }) => {
  
  const data = useMemo(() => {
    return Object.entries(stats).map(([koreanName, count]) => {
      const fullName = REGION_TO_FULL_NAME[koreanName];
      if (!fullName) return null;
      // The library matches data by the 'name' attribute in SVG, which is the full Korean name
      return { locale: fullName, count };
    }).filter(Boolean) as { locale: string; count: number }[];
  }, [stats]);

  const setColorByCount = (count: number) => {
    if (count === 0) return '#f3f4f6'; // gray-100
    if (count >= 5) return '#f43f5e'; // rose-500
    if (count >= 3) return '#fb7185'; // rose-400
    return '#fda4af'; // rose-300
  };

  // Custom tooltip to prevent empty boxes from showing
  const CustomTooltip = ({ children, tooltipStyle }: any) => {
    if (!children) return null;
    return (
      <div 
        style={{
          ...tooltipStyle,
          borderRadius: "10px",
          color: "#41444a",
          position: "fixed",
          minWidth: "80px",
          padding: "10px",
          border: "1px solid #f5f5f5",
          backgroundColor: "#fff",
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          zIndex: 100,
          pointerEvents: 'none',
          fontSize: '12px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}
      >
        {children}
      </div>
    );
  };

  // The library doesn't pass onClick to its paths correctly, so we use event delegation
  const handleMapClick = (e: React.MouseEvent) => {
    const target = e.target as SVGElement;
    const regionName = target.getAttribute('name');
    
    if (regionName && FULL_NAME_TO_REGION[regionName]) {
      onRegionClick(FULL_NAME_TO_REGION[regionName]);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-2" onClick={handleMapClick}>
      <div className="w-full max-w-[380px] h-full flex items-center justify-center cursor-pointer relative">
        <div className="w-full h-auto flex items-center justify-center">
          <SimpleSouthKoreaMapChart
            data={data}
            setColorByCount={setColorByCount}
            customTooltip={<CustomTooltip />}
          />
        </div>
        
        {/* Legend */}
        <div className="absolute bottom-4 right-0 bg-white/90 backdrop-blur-sm p-2 rounded-xl text-[9px] shadow-sm border border-gray-100 pointer-events-none z-10">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
            <span className="text-gray-600 font-medium">다녀온 지역</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-100 border border-gray-200"></div>
            <span className="text-gray-400 font-medium">아직 안 가본 곳</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KoreaMap;
