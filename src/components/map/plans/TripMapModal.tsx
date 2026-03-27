import { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Map, Polyline, CustomOverlayMap } from 'react-kakao-maps-sdk';
import { TripPlan } from '../../../types';
import { X, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TripMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: TripPlan[];
  daysCount: number;
  activeDay: number;
  setActiveDay: (day: number) => void;
}

export default function TripMapModal({ 
  isOpen, 
  onClose, 
  plans, 
  daysCount,
  activeDay,
  setActiveDay 
}: TripMapModalProps) {
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  // 반응형 상태 감지
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 마우스 휠 및 드래그 스크롤 조작 (PC)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !isOpen || isMobile) return;

    // 휠 스크롤
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    // 드래그 스크롤 (Grab to scroll)
    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = false; // 리셋
      const startClickX = e.pageX - container.offsetLeft;
      startX.current = startClickX;
      scrollLeft.current = container.scrollLeft;
      
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const x = moveEvent.pageX - container.offsetLeft;
        const walk = (x - startX.current) * 1.5;
        if (Math.abs(x - startClickX) > 5) {
          isDragging.current = true;
        }
        container.scrollLeft = scrollLeft.current - walk;
      };

      const handleMouseUp = () => {
        container.style.cursor = 'grab';
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      container.style.cursor = 'grabbing';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isOpen, isMobile]);

  // 뒤로가기 버튼 지원
  useEffect(() => {
    if (isOpen) {
      window.history.pushState({ modal: 'trip-map' }, '');
      const handlePopState = () => onClose();
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isOpen, onClose]);

  const validPlans = useMemo(() => {
    return plans
      .filter(plan => plan.day_number === activeDay && plan.lat && plan.lng && plan.place_name !== '미정')
      .sort((a, b) => {
        const timeA = a.start_time || '99:99';
        const timeB = b.start_time || '99:99';
        if (timeA !== timeB) return timeA.localeCompare(timeB);
        return (a.order_index || 0) - (b.order_index || 0);
      });
  }, [plans, activeDay]);

  // 지도 중심점
  const mapCenter = useMemo(() => {
    if (validPlans.length === 0) return { lat: 37.566826, lng: 126.9786567 };
    return { lat: validPlans[0].lat!, lng: validPlans[0].lng! };
  }, [validPlans]);

  // 일차 변경 시 지도 이동
  useEffect(() => {
    if (map && validPlans.length > 0) {
      map.panTo(new kakao.maps.LatLng(validPlans[0].lat!, validPlans[0].lng!));
    }
  }, [map, activeDay, validPlans]);

  const linePath = useMemo(() => {
    return validPlans.map(plan => ({ lat: plan.lat!, lng: plan.lng! }));
  }, [validPlans]);

  const handlePlaceClick = useCallback((plan: TripPlan) => {
    // 드래그 중이었다면 클릭 무시
    if (isDragging.current) return;
    if (map && plan.lat && plan.lng) {
      map.panTo(new kakao.maps.LatLng(plan.lat, plan.lng));
    }
  }, [map]);

  const modalVariants = {
    initial: isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, y: 20 },
    animate: isMobile ? { y: 0 } : { opacity: 1, scale: 1, y: 0 },
    exit: isMobile ? { y: '100%' } : { opacity: 0, scale: 0.95, y: 20 }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <motion.div
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "tween", ease: "easeOut", duration: 0.25 }}
            className={`relative w-full max-w-2xl bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl overflow-hidden flex flex-col ${
              isMobile ? 'h-[90vh] rounded-t-[32px]' : 'h-[80vh] rounded-[32px] md:m-4'
            }`}
          >
            {/* Header */}
            <div className="bg-white/40 backdrop-blur-md border-b border-white/20 shrink-0 z-10">
              <div className="p-4 pb-2 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-gray-800">동선 미리보기</h2>
                  <p className="text-xs text-gray-400 font-bold">총 {validPlans.length}개의 장소가 표시됩니다</p>
                </div>
                <button onClick={onClose} className="p-3 bg-gray-50/50 text-gray-400 rounded-2xl hover:bg-gray-100/50 transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="flex overflow-x-auto no-scrollbar px-4 pb-3 gap-2">
                {Array.from({ length: daysCount }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setActiveDay(i + 1)}
                    className={`shrink-0 px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${
                      activeDay === i + 1 ? 'bg-rose-500 text-white shadow-md' : 'bg-white/50 text-gray-400 hover:bg-white'
                    }`}
                  >
                    Day {i + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative min-h-0 touch-none md:touch-auto">
              <Map center={mapCenter} level={5} draggable={true} style={{ width: '100%', height: '100%' }} onCreate={setMap}>
                {validPlans.map((plan, index) => (
                  <CustomOverlayMap key={plan.id} position={{ lat: plan.lat!, lng: plan.lng! }} yAnchor={1}>
                    <div className="relative flex flex-col items-center group cursor-pointer" onClick={() => handlePlaceClick(plan)}>
                      <div className="absolute bottom-full mb-3 px-2 py-1 bg-white/95 backdrop-blur-sm rounded-lg border border-gray-100 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        <p className="text-[10px] font-black text-gray-800">{plan.place_name}</p>
                      </div>
                      <div className="w-8 h-8 bg-white rounded-xl shadow-xl border-2 border-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 relative z-10">
                        <span className="text-xs font-black text-rose-500">{index + 1}</span>
                      </div>
                      <div className="w-2.5 h-2.5 bg-rose-500 rotate-45 -mt-1.5 shadow-lg" />
                    </div>
                  </CustomOverlayMap>
                ))}
                <Polyline path={linePath} strokeWeight={3} strokeColor="#F43F5E" strokeOpacity={0.7} strokeStyle="shortdash" />
              </Map>
              
              {validPlans.length === 0 && (
                <div className="absolute inset-0 bg-gray-50/50 backdrop-blur-[2px] flex items-center justify-center p-8 text-center">
                  <div className="bg-white/80 backdrop-blur-md p-8 rounded-[40px] shadow-xl border border-white/50 max-w-xs">
                    <div className="w-16 h-16 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-4">
                      <MapPin className="text-rose-500" size={32} />
                    </div>
                    <h3 className="text-base font-black text-gray-800 mb-2">표시할 장소가 없어요</h3>
                    <p className="text-xs text-gray-400 font-bold leading-relaxed">이 날은 아직 계획된 장소가 없습니다.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer with PC Wheel/Grab Scroll Support */}
            {validPlans.length > 0 && (
              <div className="p-4 bg-white/40 backdrop-blur-md border-t border-white/20 shrink-0">
                <div 
                  ref={scrollContainerRef}
                  className="flex gap-2 overflow-x-auto no-scrollbar py-1 scroll-smooth cursor-grab active:cursor-grabbing select-none"
                >
                  {validPlans.map((plan, index) => (
                    <button 
                      key={plan.id}
                      onClick={() => handlePlaceClick(plan)}
                      className="shrink-0 flex items-center gap-2 bg-white/80 backdrop-blur-sm px-3 py-2 rounded-xl shadow-sm border border-white/50 hover:bg-white transition-all active:scale-95 pointer-events-auto"
                    >
                      <span className="w-5 h-5 bg-rose-500 text-white text-[10px] font-black rounded-md flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-[11px] font-bold text-gray-700 max-w-[100px] truncate">
                        {plan.place_name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
