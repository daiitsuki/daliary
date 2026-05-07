import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTrips } from "../../../hooks/useTrips";
import {
  Plus,
  Calendar,
  ChevronRight,
  Trash2,
  Edit2,
  MapPin,
  Loader2,
} from "lucide-react";
import { Trip } from "../../../types";
import TripModal from "./TripModal";
import TripDetail from "./TripDetail";
import { motion, Variants } from "framer-motion";

// Wishlist와 동일한 컨테이너 설정
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Wishlist와 동일한 아이템 설정 (y: 20 -> 0)
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export default function TravelPlans() {
  const { trips, isTripsLoading, deleteTrip } = useTrips();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const selectedTripId = searchParams.get("tripId");
  const selectedTrip = useMemo(() => {
    return trips?.find((t) => t.id === selectedTripId) || null;
  }, [trips, selectedTripId]);

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
    if (confirm("이 여행 계획을 삭제하시겠습니까?")) {
      await deleteTrip.mutateAsync(id);
    }
  };

  const handleSelectTrip = (trip: Trip) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tripId", trip.id);
    setSearchParams(newParams);
  };

  const handleBack = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete("tripId");
    setSearchParams(newParams);
  };

  if (selectedTrip) {
    return <TripDetail trip={selectedTrip} onBack={handleBack} />;
  }

  if (isTripsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-rose-400" size={32} />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col h-full bg-white"
    >
      {/* Header Section */}
      <motion.div
        variants={itemVariants}
        className="px-6 py-6 pb-2 flex justify-between items-start"
      >
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">여행 계획</h1>
          <p className="text-gray-500 text-sm">
            <span className="text-rose-500 font-bold">
              {trips?.length || 0}개
            </span>
            의 여행 계획이 있어요.
          </p>
        </div>
        <button
          onClick={handleAddTrip}
          className="p-3 bg-rose-500 text-white rounded-2xl shadow-lg shadow-rose-100 active:scale-95 transition-all"
        >
          <Plus size={20} strokeWidth={3} />
        </button>
      </motion.div>

      {/* List Section */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar pb-32">
        {!trips || trips.length === 0 ? (
          <motion.div
            variants={itemVariants}
            className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 mt-4"
          >
            <Calendar className="mx-auto text-gray-200 mb-3" size={48} />
            <p className="text-gray-400 text-sm">
              아직 계획된 여행이 없어요.
              <br />
              새로운 여행 계획을 세워보세요!
            </p>
          </motion.div>
        ) : (
          <motion.div variants={itemVariants} className="space-y-4">
            <div className="space-y-4">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  onClick={() => handleSelectTrip(trip)}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 active:scale-[0.98] transition-transform group cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 text-base truncate flex items-center gap-1.5 group-hover:text-rose-500 transition-colors">
                        <MapPin size={18} className="text-rose-400 shrink-0" />
                        {trip.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-gray-400 mt-1.5">
                        <Calendar size={12} className="text-rose-300" />
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
                    <div className="flex items-center text-[10px] font-black text-rose-500 bg-rose-50 px-3 py-1.5 rounded-full uppercase tracking-wider">
                      자세히 보기{" "}
                      <ChevronRight
                        size={12}
                        strokeWidth={3}
                        className="ml-0.5"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <TripModal
        trip={editingTrip}
        onClose={() => setIsTripModalOpen(false)}
        isOpen={isTripModalOpen}
      />
    </motion.div>
  );
}
