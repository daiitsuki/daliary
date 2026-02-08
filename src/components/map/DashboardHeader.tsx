import React from 'react';
import { HelpCircle, Map as MapIcon } from 'lucide-react';

interface DashboardHeaderProps {
  visitedRegionsCount: number;
  totalVisits: number;
  onHelpClick: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  visitedRegionsCount, 
  totalVisits, 
  onHelpClick 
}) => {
  return (
    <div className="bg-white px-6 pt-8 pb-4 shrink-0">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            여행 지도 <MapIcon className="text-rose-500" size={24} />
          </h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
            Our Adventure footprint
          </p>
        </div>
        <button 
          onClick={onHelpClick}
          className="p-2.5 bg-gray-50 text-gray-400 rounded-full hover:bg-rose-50 hover:text-rose-500 transition-all"
        >
          <HelpCircle size={20} />
        </button>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 bg-rose-50/50 rounded-2xl p-4 border border-rose-100/50">
          <span className="text-[9px] font-black text-rose-300 uppercase tracking-tight block mb-1">Visited Regions</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-rose-500">{visitedRegionsCount}</span>
            <span className="text-[10px] font-bold text-rose-300">/ 17</span>
          </div>
        </div>
        <div className="flex-1 bg-gray-50 rounded-2xl p-4 border border-gray-100/50">
          <span className="text-[9px] font-black text-gray-300 uppercase tracking-tight block mb-1">Total Visits</span>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-gray-700">{totalVisits}</span>
            <span className="text-[10px] font-bold text-gray-400">Records</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;