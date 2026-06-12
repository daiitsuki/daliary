import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  useMemoryFeed,
  useVisitById,
  MemoryFeedItem,
} from "../../../hooks/useMemoryFeed";
import MemoryCard from "./MemoryCard";
import { Camera, Loader2, ArrowLeft, Heart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import VisitDetailModal from "../dashboard/VisitDetailModal";
import { useQueryClient } from "@tanstack/react-query";
import { usePlaces } from "../../../context/PlacesContext";

export default function MemoryFeed() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { updateVisit, deleteVisit } = usePlaces();
  const [searchParams, setSearchParams] = useSearchParams();
  const observerTarget = useRef<HTMLDivElement>(null);
  const [selectedVisit, setSelectedVisit] = useState<MemoryFeedItem | null>(
    null,
  );
  const hasHandledUrlVisit = useRef(false);
  const [likedOnly, setLikedOnly] = useState(false);

  const visitIdFromUrl = searchParams.get("visitId");
  const regionFilter = searchParams.get("region");
  const subRegionFilter = searchParams.get("subRegion");

  const { data: sharedVisit, isLoading: isSharedVisitLoading } =
    useVisitById(visitIdFromUrl);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useMemoryFeed(regionFilter, subRegionFilter, likedOnly);

  const allItems: MemoryFeedItem[] = useMemo(() => {
    return (data as any)?.pages.flatMap((page: any) => page.data) || [];
  }, [data]);

  // Reset handled flag if visitId changes
  useEffect(() => {
    hasHandledUrlVisit.current = false;
  }, [visitIdFromUrl]);

  // Reset likedOnly when entering a region filter
  useEffect(() => {
    if (regionFilter) {
      setLikedOnly(false);
    }
  }, [regionFilter]);

  // Handle shared visit from URL
  useEffect(() => {
    if (sharedVisit && !hasHandledUrlVisit.current) {
      setSelectedVisit(sharedVisit);
      hasHandledUrlVisit.current = true;
    }
  }, [sharedVisit]);

  useEffect(() => {
    if (!observerTarget.current || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(observerTarget.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // CRITICAL: Stable visit object for the modal
  const modalVisit = useMemo(() => {
    if (!selectedVisit) return null;
    
    // Find the latest state from either allItems or sharedVisit
    const upToDateVisit = allItems.find((item) => item.id === selectedVisit.id) || 
                          (sharedVisit?.id === selectedVisit.id ? sharedVisit : null) || 
                          selectedVisit;

    return {
      ...upToDateVisit,
      places: upToDateVisit.place,
    };
  }, [selectedVisit?.id, allItems, sharedVisit]);

  const handleCloseModal = useCallback(() => {
    setSelectedVisit(null);
    if (searchParams.get("visitId")) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("visitId");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleUpdate = useCallback(
    async (visitId: string, updateData: any) => {
      const success = await updateVisit(visitId, updateData);
      if (success) {
        queryClient.invalidateQueries({ queryKey: ["memory_feed"] });
        queryClient.invalidateQueries({ queryKey: ["places_data"] });
        if (visitIdFromUrl) {
          queryClient.invalidateQueries({
            queryKey: ["visit_detail", visitIdFromUrl],
          });
        }
      }
      return success;
    },
    [updateVisit, queryClient, visitIdFromUrl],
  );

  const handleDelete = useCallback(
    async (visitId: string, imageUrl?: string | null) => {
      const success = await deleteVisit(visitId, imageUrl);
      if (success) {
        queryClient.invalidateQueries({ queryKey: ["memory_feed"] });
        queryClient.invalidateQueries({ queryKey: ["places_data"] });
        if (visitIdFromUrl) {
          queryClient.invalidateQueries({
            queryKey: ["visit_detail", visitIdFromUrl],
          });
        }
      }
      return success;
    },
    [deleteVisit, queryClient, visitIdFromUrl],
  );

  const handleBack = useCallback(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", "dashboard");
    // We keep region/subRegion so the map can show the selected state
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  if (status === "pending" || (visitIdFromUrl && isSharedVisitLoading)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="animate-spin text-rose-500" size={32} />
        <p className="text-gray-400 text-sm font-bold">
          우리의 추억을 불러오는 중...
        </p>
      </div>
    );
  }

  return (
    <div className="h-full relative overflow-hidden flex flex-col bg-white">
      {/* Filter Header */}
      <AnimatePresence>
        {regionFilter && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white border-b border-gray-100 px-4 py-3 shrink-0"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleBack}
                  className="p-1.5 hover:bg-gray-50 rounded-full transition-colors text-gray-500"
                >
                  <ArrowLeft size={20} />
                </button>
                <h2 className="text-sm font-black text-gray-800">
                  {subRegionFilter
                    ? `${regionFilter} ${subRegionFilter}`
                    : regionFilter}
                  의 추억
                </h2>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SINGLE MODAL INSTANCE */}
      <AnimatePresence>
        {selectedVisit && (
          <VisitDetailModal
            key={`modal-${selectedVisit.id}`}
            visit={modalVisit as any}
            onClose={handleCloseModal}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-32 pt-4 px-4">
        <div className="max-w-md mx-auto">
          {!regionFilter && (
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setLikedOnly(!likedOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  likedOnly 
                    ? "bg-rose-50 text-rose-500 border border-rose-200 shadow-sm" 
                    : "bg-white text-gray-400 border border-gray-200"
                }`}
              >
                <Heart size={14} className={likedOnly ? "fill-rose-500" : ""} />
                좋아요한 피드
              </button>
            </div>
          )}
          
          <div className="space-y-6">
            {allItems.length === 0 && !sharedVisit ? (
              <div className="flex flex-col items-center justify-center py-20 px-10 text-center gap-6">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                <Camera size={40} className="text-gray-200" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 mb-2">
                  아직 {subRegionFilter ? subRegionFilter : regionFilter} 지역을
                  방문하지 않았어요.
                </h3>
                <p className="text-sm text-gray-400 font-medium leading-relaxed">
                  방문 인증을 통해
                  <br />첫 번째 추억 피드를 장식해보세요!
                </p>
              </div>
              {regionFilter && (
                <button
                  onClick={() => navigate("/places?tab=search")}
                  className="px-6 py-2.5 bg-rose-50 text-rose-500 rounded-2xl text-xs font-bold hover:bg-rose-100 transition-colors"
                >
                  방문 인증 하기
                </button>
              )}
            </div>
          ) : (
            <>
              {allItems.map((item: MemoryFeedItem) => (
                <MemoryCard
                  key={item.id}
                  item={item}
                  onOpenDetail={() => setSelectedVisit(item)}
                />
              ))}

              <div ref={observerTarget} className="py-8 flex justify-center">
                {isFetchingNextPage && (
                  <Loader2 className="animate-spin text-rose-500" size={24} />
                )}
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
