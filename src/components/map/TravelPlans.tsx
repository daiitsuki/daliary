import { useState } from 'react';
import { useTrips } from '../../hooks/useTrips';
import { Plus, Calendar, ChevronRight, Trash2, Edit2 } from 'lucide-react';
import { Trip } from '../../types';
import TripModal from './TripModal';
import TripDetail from './TripDetail';
import { motion } from 'framer-motion';

export default function TravelPlans() {
  const { trips, isTripsLoading, deleteTrip } = useTrips();
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const handleAddTrip = () => {
    setEditingTrip(null);
    setIsTripModalOpen(true);
  };

  const handleEditTrip = (e: React.MouseEvent, trip: Trip) => {
    e.stopPropagation();
    setEditingTrip(trip);
    setIsTripModalOpen(true);
  };

  const handleDeleteTrip = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('여행 계획을 삭제하시겠습니까?')) {
      await deleteTrip.mutateAsync(id);
    }
  };

  if (selectedTrip) {
    return <TripDetail trip={selectedTrip} onBack={() => setSelectedTrip(null)} />;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50/50">
      <div className="p-4 flex justify-between items-center bg-white border-b border-gray-100">
        <div>
          <h2 className="text-lg font-black text-gray-800">여행 계획</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Travel Planning</p>
        </div>
        <button
          onClick={handleAddTrip}
          className="p-2.5 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-100 active:scale-95 transition-all"
        >
          <Plus size={20} strokeWidth={3} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4 custom-scrollbar">
        {isTripsLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-rose-100 border-t-rose-500 mb-4"></div>
            <p className="text-xs font-bold text-gray-400">여행 계획을 불러오고 있어요...</p>
          </div>
        ) : trips?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-4 border border-gray-100">
              <Calendar className="text-gray-200" size={32} />
            </div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">등록된 여행이 없어요</h3>
            <p className="text-[10px] text-gray-400 font-medium">새로운 여행 계획을 세워보세요!</p>
          </div>
        ) : (
          trips?.map((trip) => (
            <motion.div
              layout
              key={trip.id}
              onClick={() => setSelectedTrip(trip)}
              className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 hover:shadow-md transition-all group cursor-pointer active:scale-[0.98]"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-black text-gray-800 text-base mb-1 group-hover:text-rose-500 transition-colors">
                    {trip.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Calendar size={12} className="text-rose-400" />
                    <span className="text-[11px] font-bold">
                      {trip.start_date} ~ {trip.end_date}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => handleEditTrip(e, trip)}
                    className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteTrip(e, trip.id)}
                    className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                <div className="flex -space-x-2">
                </div>
                <div className="flex items-center text-[10px] font-black text-rose-500 bg-rose-50 px-3 py-1 rounded-full uppercase tracking-wider">
                  자세히 보기 <ChevronRight size={12} strokeWidth={3} className="ml-0.5" />
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <TripModal
        trip={editingTrip}
        onClose={() => setIsTripModalOpen(false)}
        isOpen={isTripModalOpen}
      />
    </div>
  );
}
