import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useMemoryFeed, MemoryFeedItem } from '../../../hooks/useMemoryFeed';
import MemoryCard from './MemoryCard';
import { Camera, Loader2 } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import VisitDetailModal from '../dashboard/VisitDetailModal';
import { useQueryClient } from '@tanstack/react-query';

export default function MemoryFeed() {
  const queryClient = useQueryClient();
  const observerTarget = useRef<HTMLDivElement>(null);
  const [selectedVisit, setSelectedVisit] = useState<MemoryFeedItem | null>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useMemoryFeed();

  useEffect(() => {
    if (!observerTarget.current || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerTarget.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // CRITICAL: Stable visit object for the modal
  const modalVisit = useMemo(() => {
    if (!selectedVisit) return null;
    return {
      ...selectedVisit,
      places: selectedVisit.place
    };
  }, [selectedVisit?.id]); // Only re-create if the ID actually changes

  const handleCloseModal = useCallback(() => {
    setSelectedVisit(null);
  }, []);

  const handleUpdateRefresh = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: ['memory_feed'] });
    return true;
  }, [queryClient]);

  if (status === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="animate-spin text-rose-500" size={32} />
        <p className="text-gray-400 text-sm font-bold">우리의 추억을 불러오는 중...</p>
      </div>
    );
  }

  const allItems = data?.pages.flatMap((page) => page.data) || [];

  if (allItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-10 text-center gap-6">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
          <Camera size={40} className="text-gray-200" />
        </div>
        <div>
          <h3 className="text-lg font-black text-gray-900 mb-2">아직 추억 사진이 없어요</h3>
          <p className="text-sm text-gray-400 font-medium leading-relaxed">
            지도에서 방문 인증을 하고<br />첫 번째 추억 피드를 장식해보세요!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative overflow-hidden flex flex-col">
      {/* SINGLE MODAL INSTANCE - Placed outside scroll area for stability */}
      <AnimatePresence>
        {selectedVisit && (
          <VisitDetailModal 
            key={`modal-${selectedVisit.id}`}
            visit={modalVisit as any}
            onClose={handleCloseModal}
            onUpdate={handleUpdateRefresh}
            onDelete={handleUpdateRefresh}
          />
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-32 pt-4 px-4">
        <div className="max-w-md mx-auto space-y-6">
          {allItems.map((item) => (
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
        </div>
      </div>
    </div>
  );
}
