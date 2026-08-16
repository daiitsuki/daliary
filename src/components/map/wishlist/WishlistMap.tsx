import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Map, CustomOverlayMap } from "react-kakao-maps-sdk";
import { Place } from "../../../context/PlacesContext";
import {
  Utensils,
  Coffee,
  Map as MapIcon,
  Bed,
  ShoppingBag,
  MapPin,
} from "lucide-react";
import useSupercluster from "use-supercluster";
import type { PointFeature } from "supercluster";

const CATEGORY_COLORS: Record<string, string> = {
  맛집: "bg-orange-500 border-orange-400 text-orange-500",
  카페: "bg-amber-500 border-amber-400 text-amber-500",
  관광지: "bg-rose-500 border-rose-400 text-rose-500",
  숙소: "bg-indigo-500 border-indigo-400 text-indigo-500",
  쇼핑: "bg-blue-500 border-blue-400 text-blue-500",
  기타: "bg-gray-500 border-gray-400 text-gray-500",
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  맛집: Utensils,
  카페: Coffee,
  관광지: MapIcon,
  숙소: Bed,
  쇼핑: ShoppingBag,
  기타: MapPin,
};

const INITIAL_CENTER = { lat: 37.566826, lng: 126.9786567 };

interface WishlistMapProps {
  places: Place[];
}

const WishlistMap: React.FC<WishlistMapProps> = ({ places }) => {
  const [map, setMap] = useState<kakao.maps.Map | null>(null);
  const [bounds, setBounds] = useState<[number, number, number, number] | null>(
    null,
  );
  const [zoom, setZoom] = useState(16); // Mapbox equivalent zoom

  useEffect(() => {
    if (!map || places.length === 0) return;

    const latLngBounds = new kakao.maps.LatLngBounds();
    let hasValidCoords = false;

    places.forEach((place) => {
      if (place.lat && place.lng) {
        latLngBounds.extend(new kakao.maps.LatLng(place.lat, place.lng));
        hasValidCoords = true;
      }
    });

    if (hasValidCoords) {
      map.setBounds(latLngBounds, 50, 50, 50, 50);
    }
  }, [map, places]); // Run once when map or places initially load

  const updateMapStatus = useCallback(() => {
    if (!map) return;

    // 1. Restrict bounds to South Korea
    const center = map.getCenter();
    let lat = center.getLat();
    let lng = center.getLng();
    let outOfBounds = false;

    if (lat < 32.0) {
      lat = 32.0;
      outOfBounds = true;
    }
    if (lat > 39.0) {
      lat = 39.0;
      outOfBounds = true;
    }
    if (lng < 124.0) {
      lng = 124.0;
      outOfBounds = true;
    }
    if (lng > 132.0) {
      lng = 132.0;
      outOfBounds = true;
    }

    if (outOfBounds) {
      map.setCenter(new kakao.maps.LatLng(lat, lng));
      return; // Return early, as setCenter will trigger another idle event
    }

    // 2. Update bounds for clustering
    const b = map.getBounds();
    setBounds([
      b.getSouthWest().getLng(),
      b.getSouthWest().getLat(),
      b.getNorthEast().getLng(),
      b.getNorthEast().getLat(),
    ]);
    setZoom(21 - map.getLevel());
  }, [map]);

  const openNaverMap = (name: string) => {
    const query = encodeURIComponent(name);
    window.open(`https://map.naver.com/p/search/${query}`, "_blank");
  };

  const points: PointFeature<Place>[] = useMemo(() => {
    return places
      .filter((p) => p.lat && p.lng)
      .map((place) => ({
        type: "Feature",
        properties: { cluster: false, placeId: place.id, ...place },
        geometry: { type: "Point", coordinates: [place.lng, place.lat] },
      }));
  }, [places]);

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds: bounds || undefined,
    zoom,
    options: { radius: 60, maxZoom: 20 },
  });

  if (places.length === 0) {
    return (
      <div className="mt-4 flex h-full min-h-[300px] flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50/50">
        <MapIcon className="mb-3 h-12 w-12 text-gray-300" />
        <p className="text-sm font-medium tracking-tight text-gray-400">
          표시할 장소가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="relative z-0 mt-4 min-h-[400px] flex-1 overflow-hidden rounded-xl border border-gray-100 shadow-sm">
      <Map
        center={INITIAL_CENTER}
        style={{ width: "100%", height: "100%" }}
        level={5}
        onCreate={(m) => {
          setMap(m);
        }}
        onIdle={updateMapStatus}
      >
        {clusters.map((cluster) => {
          const [longitude, latitude] = cluster.geometry.coordinates;
          const props = cluster.properties as any;
          const isCluster = props.cluster;
          const pointCount = props.point_count;

          if (isCluster) {
            return (
              <CustomOverlayMap
                key={`cluster-${cluster.id}`}
                position={{ lat: latitude, lng: longitude }}
                yAnchor={0.5}
                xAnchor={0.5}
                zIndex={100}
                clickable={true}
              >
                <div
                  className="bg-opacity-95 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-[3px] border-white bg-rose-500 text-[13px] font-black text-white shadow-lg transition-transform active:scale-95"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!map || !supercluster) return;

                    const leaves = supercluster.getLeaves(
                      cluster.id as number,
                      Infinity,
                    );
                    const expansionZoom = Math.min(
                      supercluster.getClusterExpansionZoom(
                        cluster.id as number,
                      ) || 20,
                      20,
                    );

                    let anchorLatLng = new kakao.maps.LatLng(
                      latitude,
                      longitude,
                    );

                    if (leaves && leaves.length > 0) {
                      const clusterBounds = new kakao.maps.LatLngBounds();
                      leaves.forEach((leaf) => {
                        const [lng, lat] = leaf.geometry.coordinates;
                        clusterBounds.extend(new kakao.maps.LatLng(lat, lng));
                      });

                      const sw = clusterBounds.getSouthWest();
                      const ne = clusterBounds.getNorthEast();
                      anchorLatLng = new kakao.maps.LatLng(
                        (sw.getLat() + ne.getLat()) / 2,
                        (sw.getLng() + ne.getLng()) / 2,
                      );
                    }

                    map.setCenter(anchorLatLng);

                    setTimeout(() => {
                      map.setLevel(21 - expansionZoom, {
                        animate: true,
                        anchor: anchorLatLng,
                      });
                    }, 50);
                  }}
                >
                  +{pointCount}
                </div>
              </CustomOverlayMap>
            );
          }

          const place = cluster.properties as Place;
          const cat = place.category || "기타";
          const colorClasses = CATEGORY_COLORS[cat] || CATEGORY_COLORS["기타"];
          const [bgColor, borderColor, textColor] = colorClasses.split(" ");
          const IconComponent = CATEGORY_ICONS[cat] || CATEGORY_ICONS["기타"];

          return (
            <CustomOverlayMap
              key={`place-${place.id}`}
              position={{ lat: place.lat, lng: place.lng }}
              yAnchor={1}
              zIndex={10}
              clickable={true}
            >
              <div
                className="group animate-float pointer-events-auto relative flex cursor-pointer flex-col items-center transition-all duration-200 active:scale-95"
                onClick={(e) => {
                  e.stopPropagation();
                  if (map) {
                    const currentLevel = map.getLevel();
                    const targetLatLng = new kakao.maps.LatLng(
                      place.lat,
                      place.lng,
                    );

                    if (currentLevel > 3) {
                      // 즉시 중심을 맞춘 후 50ms 뒤 부드럽게 줌인 (카카오맵 투영 엔진 동기화 보장)
                      map.setCenter(targetLatLng);
                      setTimeout(() => {
                        map.setLevel(3, {
                          animate: true,
                          anchor: targetLatLng,
                        });
                      }, 50);
                    } else {
                      // 이미 확대된 상태면 즉시 중심 이동 후 네이버 지도 엶
                      // panTo를 사용하면 이동 애니메이션 도중에 새 탭이 열려 브라우저가 화면 갱신을 멈추므로 어긋나 보입니다.
                      map.setCenter(targetLatLng);
                      openNaverMap(place.name);
                    }
                  }
                }}
              >
                <div
                  className={`mb-[-2px] flex items-center gap-1.5 rounded-xl border-2 bg-white px-2.5 py-1.5 whitespace-nowrap shadow-[0_8px_20px_rgb(0,0,0,0.12)] transition-colors ${borderColor}`}
                >
                  <div className={`rounded-md p-1 ${bgColor} text-white`}>
                    <IconComponent size={12} strokeWidth={2.5} />
                  </div>
                  <span
                    className={`text-[11px] font-black tracking-tight ${textColor}`}
                  >
                    {place.name}
                  </span>
                </div>
                <div
                  className={`h-2.5 w-2.5 rotate-45 border-r-2 border-b-2 bg-white shadow-[4px_4px_10px_rgba(0,0,0,0.05)] ${borderColor}`}
                ></div>
              </div>
            </CustomOverlayMap>
          );
        })}
      </Map>
    </div>
  );
};

export default WishlistMap;
