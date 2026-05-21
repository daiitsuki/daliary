import React, { useState, useMemo, useCallback, useEffect } from "react";
import { usePlaces, Place } from "../../../context/PlacesContext";
import { Search } from "lucide-react";
import VisitForm from "../shared/VisitForm";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { getRegionFromAddress } from "../../../lib/address";
import WishlistCard from "./WishlistCard";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

const CATEGORY_TAB_STYLES: Record<string, string> = {
  전체: "bg-rose-500 text-white shadow-rose-100",
  맛집: "bg-orange-500 text-white shadow-orange-100",
  카페: "bg-amber-500 text-white shadow-amber-100",
  관광지: "bg-rose-500 text-white shadow-rose-100",
  숙소: "bg-indigo-500 text-white shadow-indigo-100",
  쇼핑: "bg-blue-500 text-white shadow-blue-100",
  기타: "bg-gray-500 text-white shadow-gray-100",
};

const CATEGORY_INACTIVE_TAB_STYLES: Record<string, string> = {
  전체: "bg-rose-50 text-rose-400/80",
  맛집: "bg-orange-50 text-orange-400/80",
  카페: "bg-amber-50 text-amber-400/80",
  관광지: "bg-rose-50 text-rose-400/80",
  숙소: "bg-indigo-50 text-indigo-400/80",
  쇼핑: "bg-blue-50 text-blue-400/80",
  기타: "bg-gray-50 text-gray-400/80",
};

interface WishlistProps {
  onShowOnMap: (place: Place) => void;
}

const Wishlist: React.FC<WishlistProps> = ({ onShowOnMap }) => {
  const { wishlist, loading, deleteWishlistPlace, refresh } = usePlaces();
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [isVisitFormOpen, setIsVisitFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("전체");

  // 카테고리별 개수 계산 및 탭 목록 생성
  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = { 전체: wishlist.length };

    wishlist.forEach((place) => {
      const cat = place.category || "기타";
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const orderedFixed = [
      "전체",
      "맛집",
      "카페",
      "관광지",
      "숙소",
      "쇼핑",
      "기타",
    ];
    const foundCategories = Object.keys(counts);

    const otherCategories = foundCategories
      .filter((cat) => !orderedFixed.includes(cat))
      .sort();

    return [...orderedFixed, ...otherCategories]
      .filter((cat) => cat === "전체" || (counts[cat] && counts[cat] > 0))
      .map((cat) => ({
        name: cat,
        count: counts[cat] || 0,
      }));
  }, [wishlist]);

  useEffect(() => {
    if (
      selectedCategory !== "전체" &&
      !categoriesWithCounts.find((c) => c.name === selectedCategory)
    ) {
      setSelectedCategory("전체");
    }
  }, [categoriesWithCounts, selectedCategory]);

  const filteredWishlist = useMemo(() => {
    if (selectedCategory === "전체") return wishlist;
    return wishlist.filter((place) => {
      const cat = place.category || "기타";
      return cat === selectedCategory;
    });
  }, [wishlist, selectedCategory]);

  const groupedWishlist = useMemo(() => {
    const groups: Record<string, Place[]> = {};
    filteredWishlist.forEach((place) => {
      const region = getRegionFromAddress(place.address);
      if (!groups[region]) groups[region] = [];
      groups[region].push(place);
    });

    return Object.keys(groups)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = groups[key];
          return acc;
        },
        {} as Record<string, Place[]>,
      );
  }, [filteredWishlist]);

  const handleDelete = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm("이 장소를 위시리스트에서 삭제할까요?")) {
        await deleteWishlistPlace(id);
      }
    },
    [deleteWishlistPlace],
  );

  const handleVerifyVisit = useCallback((place: Place, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPlace(place);
    setIsVisitFormOpen(true);
  }, []);

  const handleCloseVisitForm = useCallback(() => {
    setIsVisitFormOpen(false);
  }, []);

  const handleVisitFormSuccess = useCallback(() => {
    setIsVisitFormOpen(false);
    refresh();
  }, [refresh]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-400"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Category Tabs */}
      {wishlist.length > 0 && (
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="px-4 py-4 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth"
        >
          {categoriesWithCounts.map((cat) => {
            const isActive = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 shadow-sm active:scale-95 ${
                  isActive
                    ? CATEGORY_TAB_STYLES[cat.name] ||
                      "bg-rose-500 text-white shadow-rose-100"
                    : CATEGORY_INACTIVE_TAB_STYLES[cat.name] ||
                      "bg-gray-50 text-gray-400 shadow-transparent"
                }`}
              >
                {cat.name}
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-black/5 text-current opacity-60"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </motion.div>
      )}

      {/* List Section */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-32">
        <AnimatePresence mode="wait">
          {wishlist.length === 0 ? (
            <motion.div
              key="empty-total"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 mt-4"
            >
              <Search className="mx-auto text-gray-200 mb-3" size={48} />
              <p className="text-gray-400 text-sm">
                아직 저장된 장소가 없어요.
                <br />
                '장소 찾기'에서 가고 싶은 곳을 추가해보세요!
              </p>
            </motion.div>
          ) : filteredWishlist.length === 0 ? (
            <motion.div
              key="empty-filtered"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <p className="text-gray-400 text-sm">
                '{selectedCategory}' 카테고리에 저장된 장소가 없어요.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={selectedCategory}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-8"
            >
              {Object.entries(groupedWishlist).map(([region, places]) => (
                <div key={region} className="space-y-4">
                  <motion.div variants={itemVariants} initial="hidden" animate="visible" className="flex items-center gap-2 px-1">
                    <div className="w-1 h-3 bg-rose-400 rounded-full"></div>
                    <h2 className="text-xs font-black text-gray-600 uppercase tracking-tight">
                      {region} ({places.length})
                    </h2>
                  </motion.div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {places.map((place) => (
                      <WishlistCard
                        key={place.id}
                        place={place}
                        onShowOnMap={onShowOnMap}
                        onDelete={handleDelete}
                        onVerifyVisit={handleVerifyVisit}
                        variants={itemVariants}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isVisitFormOpen && selectedPlace && (
        <VisitForm
          placeId={selectedPlace.id}
          placeName={selectedPlace.name}
          placeAddress={selectedPlace.address}
          onClose={handleCloseVisitForm}
          onSuccess={handleVisitFormSuccess}
        />
      )}
    </div>
  );
};

export default Wishlist;
