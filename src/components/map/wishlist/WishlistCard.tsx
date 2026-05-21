import React from "react";
import { Trash2, MapPin, Navigation, CheckCircle } from "lucide-react";
import { Place } from "../../../context/PlacesContext";
import { extractCityCounty } from "../../../lib/address";
import { motion } from "framer-motion";

interface WishlistCardProps {
  place: Place;
  onShowOnMap: (place: Place) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onVerifyVisit: (place: Place, e: React.MouseEvent) => void;
  variants?: any;
}

const CATEGORY_COLORS: Record<string, string> = {
  맛집: "text-orange-500 bg-orange-50",
  카페: "text-amber-500 bg-amber-50",
  숙소: "text-indigo-500 bg-indigo-50",
  관광지: "text-rose-500 bg-rose-50",
  쇼핑: "text-blue-500 bg-blue-50",
  기타: "text-gray-500 bg-gray-50",
};

const WishlistCard: React.FC<WishlistCardProps> = ({
  place,
  onShowOnMap,
  onDelete,
  onVerifyVisit,
  variants,
}) => {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      animate="visible"
      whileTap={{ scale: 0.98 }}
      className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between aspect-square relative transition-shadow duration-200 overflow-hidden cursor-pointer"
    >
      {/* Delete Button - Top Right */}
      <button
        onClick={(e) => onDelete(place.id, e)}
        className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-400 transition-colors z-10"
      >
        <Trash2 size={18} />
      </button>

      {/* Top Section - Name & City/County */}
      <div
        className="flex flex-col gap-1.5 mt-1 cursor-pointer"
        onClick={() => onShowOnMap(place)}
      >
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter ${
              CATEGORY_COLORS[place.category || "기타"] ||
              "text-gray-400 bg-gray-100"
            }`}
          >
            {place.category || "기타"}
          </span>
        </div>
        <h3 className="font-bold text-gray-800 text-[13px] line-clamp-2 leading-snug pr-8">
          {place.name}
        </h3>
        <div className="flex items-center gap-1 text-gray-400">
          <MapPin size={10} strokeWidth={3} />
          <p className="text-[10px] font-bold">
            {extractCityCounty(place.address)}
          </p>
        </div>
      </div>

      {/* Bottom Section - Action Icons */}
      <div className="flex items-center justify-between gap-2 mt-auto">
        <button
          onClick={() => onShowOnMap(place)}
          className="flex-1 flex items-center justify-center p-2.5 bg-gray-50 text-gray-400 rounded-2xl hover:bg-gray-100 hover:text-gray-600 transition-colors"
          title="위치 보기"
        >
          <Navigation size={18} />
        </button>
        <button
          onClick={(e) => onVerifyVisit(place, e)}
          className="flex-1 flex items-center justify-center p-2.5 bg-rose-50 text-rose-400 rounded-2xl hover:bg-rose-100 hover:text-rose-600 transition-colors"
          title="방문 완료"
        >
          <CheckCircle size={18} />
        </button>
      </div>
    </motion.div>
  );
};

export default WishlistCard;
