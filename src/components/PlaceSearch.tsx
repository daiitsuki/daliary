import React, { useEffect, useState, useRef, useCallback } from "react";
import { Map, MapMarker, CustomOverlayMap } from "react-kakao-maps-sdk";
import { usePlaceSearch, KakaoPlace } from "../hooks/usePlaceSearch";
import {
  Search,
  MapPin,
  Plus,
  CheckCircle,
  Navigation,
  ExternalLink,
} from "lucide-react";
import VisitForm from "./VisitForm";
import { Place, usePlaces } from "../context/PlacesContext";

interface PlaceSearchProps {
  targetPlace?: Place | null;
}

const PlaceSearch = ({ targetPlace }: PlaceSearchProps) => {
  const { searchPlaces, results, savePlace, isSearching, isSaving } =
    usePlaceSearch();
  const { refresh } = usePlaces();

  const [keyword, setKeyword] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<KakaoPlace | null>(null);
  const [center, setCenter] = useState({ lat: 37.566826, lng: 126.9786567 });
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const [isVisitFormOpen, setIsVisitFormOpen] = useState(false);

  // 모바일 패널 높이 조절을 위한 상태 (기본 45%)
  const [panelHeight, setPanelHeight] = useState(45);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 네이버 지도 열기 함수 (장소명만 검색)
  const openNaverMap = (name: string) => {
    const query = encodeURIComponent(name);
    window.open(`https://map.naver.com/v5/search/${query}`, "_blank");
  };

  // 패널 높이 조절 로직 (모바일용)
  const handleTouchStart = () => {
    isDragging.current = true;
    document.body.style.overflow = "hidden"; // 드래그 중 스크롤 방지
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const touchY = e.touches[0].clientY;
    const relativeY = touchY - containerRect.top;
    const heightPercentage = 100 - (relativeY / containerRect.height) * 100;

    // 최소 40% ~ 최대 85% 사이로 제한
    if (heightPercentage >= 40 && heightPercentage <= 85) {
      setPanelHeight(heightPercentage);
    }
  }, []);

  const handleTouchEnd = () => {
    isDragging.current = false;
    document.body.style.overflow = "";
  };

  useEffect(() => {
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchMove]);

  // 1. 현재 위치 가져오기
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCurrentLocation(loc);
          if (!targetPlace) setCenter(loc);
        },
        (err) => console.error("Geolocation error:", err),
      );
    }
  }, [targetPlace]);

  // 2. 외부 타겟 장소 변경 시 지도 이동
  useEffect(() => {
    if (targetPlace) {
      const loc = { lat: targetPlace.lat, lng: targetPlace.lng };
      setCenter(loc);
      setSelectedPlace(null);
      if (map) map.panTo(new kakao.maps.LatLng(loc.lat, loc.lng));
    }
  }, [targetPlace, map]);

  // 3. 레이아웃 보정
  useEffect(() => {
    if (map) {
      const timer = setTimeout(() => map.relayout(), 300);
      return () => clearTimeout(timer);
    }
  }, [map]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    searchPlaces(keyword);
    setSelectedPlace(null);
  };

  const handleSelectPlace = (place: KakaoPlace) => {
    const loc = { lat: parseFloat(place.y), lng: parseFloat(place.x) };
    setSelectedPlace(place);
    setCenter(loc);
    if (map) map.panTo(new kakao.maps.LatLng(loc.lat, loc.lng));
  };

  const handleCenterToCurrent = () => {
    if (currentLocation) {
      setCenter(currentLocation);
      if (map)
        map.panTo(
          new kakao.maps.LatLng(currentLocation.lat, currentLocation.lng),
        );
    }
  };

  // 지도 드래그/줌 종료 시 상태 동기화 (리렌더링 시 튕김 방지)
  const syncCenter = (m: kakao.maps.Map) => {
    setCenter({
      lat: m.getCenter().getLat(),
      lng: m.getCenter().getLng(),
    });
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col md:flex-row h-full w-full bg-white overflow-hidden relative"
    >
      {/* 지도 영역: 모바일 상단, PC 우측 */}
      <div
        className="order-1 md:order-2 flex-1 relative min-h-0 bg-gray-100 z-10"
        style={{
          height: window.innerWidth < 768 ? `${100 - panelHeight}%` : "100%",
        }}
      >
        <Map
          center={center}
          level={3}
          style={{ width: "100%", height: "100%" }}
          onDragEnd={syncCenter}
          onZoomChanged={syncCenter}
          onCreate={setMap}
        >
          {currentLocation && (
            <MapMarker
              position={currentLocation}
              image={{
                src: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZyBmaWx0ZXI9InVybCgjZmlsdGVyMF9kXzFfMikiPgogICAgPGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iNyIgZmlsbD0id2hpdGUiLz4KICAgIDxjaXJjbGUgY3g9IjEwIiBjeT0iMTAiIHI9IjUiIGZpbGw9IiMzQjg2RjEiLz4KICA8L2c+CiAgPGRlZnM+CiAgICA8ZmlsdGVyIGlkPSJmaWx0ZXIwX2RfMV8yIiB4PSIwIiB5PSIwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbHRlclVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj4KICAgICAgPGZlRmxvb2QgZmxvb2Qtb3BhY2l0eT0iMCIgcmVzdWx0PSJCYWNrZ3JvdW5kSW1hZ2VGaXgiLz4KICAgICAgPGZlQ29sb3JNYXRyaXggaW49IlNvdXJjZUFscGhhIiB0eXBlPSJtYXRyaXgiIHZhbHVlcz0iMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMTI3IDAiIHJlc3VsdD0iaGFyZEFscGhhIi8+CiAgICAgIDxmZU9mZnNldCBkeT0iMSIvPgogICAgICA8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIxLjUiLz4KICAgICAgPGZlQ29sb3JNYXRyaXggdHlwZT0ibWF0cml4IiB2YWx1ZXM9IjAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAgMCAwIDAuMjUgMCIvPgogICAgICA8ZmVCbGVuZCBtb2RlPSJub3JtYWwiIGluMj0iQmFja2dyb3VuZEltYWdlRml4IiByZXN1bHQ9ImVmZmVjdDFfZHJvcFNoYWRvd18xXzIiLz4KICAgICAgPGZlQmxlbmQgbW9kZT0ibm9ybWFsIiBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJlZmZlY3QxX2Ryb3BTaGFkb3dfMV8yIiByZXN1bHQ9InNoYXBlIi8+CiAgICA8L2ZpbHRlcj4KICA8L2RlZnM+Cjwvc3ZnPg==",
                size: { width: 24, height: 24 },
              }}
            />
          )}

          {selectedPlace && (
            <CustomOverlayMap
              position={{
                lat: parseFloat(selectedPlace.y),
                lng: parseFloat(selectedPlace.x),
              }}
              yAnchor={1.2}
            >
              <div
                onClick={() => openNaverMap(selectedPlace.place_name)}
                className="group relative flex flex-col items-center cursor-pointer pointer-events-auto active:scale-95 transition-all duration-200 animate-float"
              >
                {/* Pin Body */}
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.15)] border-2 border-rose-500 mb-[-2px] whitespace-nowrap">
                  <div className="p-1 bg-rose-50 rounded-lg">
                    <MapPin size={12} className="text-rose-500 fill-rose-500" />
                  </div>
                  <span className="text-xs font-black text-rose-500 pr-1">
                    {selectedPlace.place_name}
                  </span>
                  <ExternalLink size={10} className="text-rose-300" />
                </div>
                {/* Pin Tip */}
                <div className="w-3 h-3 bg-white rotate-45 border-r-2 border-b-2 border-rose-500 shadow-[4px_4px_10px_rgba(0,0,0,0.05)]"></div>
              </div>
            </CustomOverlayMap>
          )}

          {targetPlace && !selectedPlace && (
            <CustomOverlayMap
              position={{ lat: targetPlace.lat, lng: targetPlace.lng }}
              yAnchor={1.2}
            >
              <div
                onClick={() => openNaverMap(targetPlace.name)}
                className="group relative flex flex-col items-center cursor-pointer pointer-events-auto active:scale-95 transition-all duration-200 animate-float"
              >
                {/* Pin Body */}
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.15)] border-2 border-rose-500 mb-[-2px] whitespace-nowrap">
                  <div className="p-1 bg-rose-50 rounded-lg">
                    <MapPin size={12} className="text-rose-500 fill-rose-500" />
                  </div>
                  <span className="text-xs font-black text-rose-500 pr-1">
                    {targetPlace.name}
                  </span>
                  <ExternalLink size={10} className="text-rose-300" />
                </div>
                {/* Pin Tip */}
                <div className="w-3 h-3 bg-white rotate-45 border-r-2 border-b-2 border-rose-500 shadow-[4px_4px_10px_rgba(0,0,0,0.05)]"></div>
              </div>
            </CustomOverlayMap>
          )}
        </Map>

        {/* 내 위치 버튼: z-index 50 보장 */}
        <button
          onClick={handleCenterToCurrent}
          className="absolute bottom-6 right-6 z-50 p-3 bg-white text-rose-500 rounded-full shadow-2xl border border-gray-100 hover:bg-rose-50 active:scale-95 transition-all"
          aria-label="현재 위치"
        >
          <Navigation size={20} fill="currentColor" fillOpacity={0.2} />
        </button>
      </div>

      {/* 사이드바 영역: 모바일 하단, PC 좌측 */}
      <div
        className="order-2 md:order-1 w-full md:w-[360px] flex flex-col bg-white border-t md:border-t-0 md:border-r border-gray-100 z-20 min-h-0"
        style={{ height: window.innerWidth < 768 ? `${panelHeight}%` : "100%" }}
      >
        {/* 모바일 전용 드래그 핸들 */}
        <div
          className="md:hidden flex flex-col items-center py-2 cursor-ns-resize shrink-0"
          onTouchStart={handleTouchStart}
        >
          <div className="w-12 h-1 bg-gray-300 rounded-full mb-1"></div>
        </div>

        <div className="p-4 border-b border-gray-50 bg-white shrink-0">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="장소 검색..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl focus:ring-2 focus:ring-rose-200 outline-none text-sm transition-all"
            />
            <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
          </form>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/50 min-h-0 pb-24">
          {isSearching ? (
            <div className="flex flex-col justify-center items-center h-full py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-rose-200 border-t-rose-500 mb-2"></div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Searching
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-black">
              <MapPin className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-xs font-medium text-gray-400">
                함께 가고 싶은 장소나
                <br />
                다녀온 장소를 검색하세요
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50 bg-white">
              {results.map((place) => (
                <li
                  key={place.id}
                  onClick={() => handleSelectPlace(place)}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedPlace?.id === place.id
                      ? "bg-rose-50/50 border-l-4 border-rose-500 shadow-inner"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <h3
                    className={`font-bold text-sm ${selectedPlace?.id === place.id ? "text-rose-600" : "text-gray-800"}`}
                  >
                    {place.place_name}
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">
                    {place.road_address_name || place.address_name}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {selectedPlace && (
          <div className="p-4 pb-24 md:pb-4 bg-white border-t border-gray-100 shrink-0 grid grid-cols-2 gap-2 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
            <button
              onClick={async () => {
                try {
                  await savePlace(selectedPlace);
                  alert("위시리스트에 저장되었습니다!");
                  refresh();
                } catch (e: any) {
                  alert(e.message || "저장 실패");
                }
              }}
              disabled={isSaving}
              className="flex items-center justify-center gap-2 py-3 bg-white border border-rose-200 text-rose-500 rounded-xl text-xs font-black"
            >
              <Plus size={16} /> Wishlist
            </button>
            <button
              onClick={() => {
                setIsVisitFormOpen(true);
              }}
              className="flex items-center justify-center gap-2 py-3 bg-rose-500 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-100"
            >
              <CheckCircle size={16} /> 방문 인증
            </button>
          </div>
        )}
      </div>

      {isVisitFormOpen && selectedPlace && (
        <VisitForm
          kakaoPlace={selectedPlace}
          placeName={selectedPlace.place_name}
          placeAddress={
            selectedPlace.road_address_name || selectedPlace.address_name
          }
          onClose={() => setIsVisitFormOpen(false)}
          onSuccess={() => {
            setIsVisitFormOpen(false);
            refresh();
          }}
        />
      )}
    </div>
  );
};

export default PlaceSearch;
