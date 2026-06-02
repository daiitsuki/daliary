import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useVisitVerification } from "../../../hooks/useVisitVerification";
import {
  KOREA_REGIONS,
  SUB_REGIONS,
  METROPOLITAN_CITIES,
} from "../../../constants/regions";
import {
  Camera,
  X,
  MapPin,
  Check,
  ChevronRight,
  Calendar,
  InfoIcon,
} from "lucide-react";
import DatePicker from "../../common/DatePicker";
import { usePlaceSearch, KakaoPlace } from "../../../hooks/usePlaceSearch";
import { useCouple } from "../../../hooks/useCouple";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";
import { parseTripTitle } from "../../../utils/tripHelpers";

interface VisitFormProps {
  placeId?: string;
  kakaoPlace?: KakaoPlace;
  placeName: string;
  placeAddress?: string;
  onClose: () => void;
  onSuccess: () => void;
  initialDate?: string;
}

const VisitForm = ({
  placeId: initialPlaceId,
  kakaoPlace,
  placeName,
  placeAddress,
  onClose,
  onSuccess,
  initialDate,
}: VisitFormProps) => {
  const { verifyVisit, isSubmitting, error } = useVisitVerification();
  const { savePlace } = usePlaceSearch();
  const { couple } = useCouple();

  // Fetch all trips with plans for this couple
  const { data: tripsWithPlans = [] } = useQuery({
    queryKey: ["trips_with_plans", couple?.id],
    queryFn: async () => {
      if (!couple?.id) return [];
      const { data, error } = await supabase
        .from("trips")
        .select(
          `id, 
           title, 
           start_date, 
           end_date, 
           trip_plans (
             id, 
             day_number, 
             place_name, 
             address,
             order_index
           )`,
        )
        .eq("couple_id", couple.id)
        .order("start_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!couple?.id,
  });

  // Extract smart recommendations for the current placeName
  const matchedSuggestions = useMemo(() => {
    if (!placeName || tripsWithPlans.length === 0) return [];

    const suggestions: Array<{
      tripTitle: string;
      dayNumber: number;
      dateStr: string;
      placeNameInPlan: string;
    }> = [];

    tripsWithPlans.forEach((trip: any) => {
      const plans = trip.trip_plans || [];
      plans.forEach((plan: any) => {
        if (
          plan.place_name &&
          (plan.place_name.toLowerCase().includes(placeName.toLowerCase()) ||
            placeName.toLowerCase().includes(plan.place_name.toLowerCase()))
        ) {
          const startDate = new Date(trip.start_date);
          const targetDate = new Date(startDate);
          targetDate.setDate(startDate.getDate() + (plan.day_number - 1));
          const dateStr = targetDate.toISOString().split("T")[0];

          suggestions.push({
            tripTitle: trip.title,
            dayNumber: plan.day_number,
            dateStr,
            placeNameInPlan: plan.place_name,
          });
        }
      });
    });

    // Deduplicate suggestions by dateStr
    const seen = new Set();
    return suggestions.filter((s) => {
      if (seen.has(s.dateStr)) return false;
      seen.add(s.dateStr);
      return true;
    });
  }, [placeName, tripsWithPlans]);

  const [region, setRegion] = useState("");
  const [subRegion, setSubRegion] = useState("");
  const [date, setDate] = useState<string>(
    initialDate || new Date().toISOString().split("T")[0],
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showRegionSelection, setShowRegionSelection] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevUrlRef = useRef<string | null>(null);

  // Cleanup for object URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (placeAddress) {
      const parts = placeAddress.split(" ");
      if (parts.length >= 1) {
        const firstPart = parts[0];
        let matchedRegion = "";
        if (firstPart.includes("서울")) matchedRegion = "서울";
        else if (firstPart.includes("부산")) matchedRegion = "부산";
        else if (firstPart.includes("대구")) matchedRegion = "대구";
        else if (firstPart.includes("인천")) matchedRegion = "인천";
        else if (firstPart.includes("광주")) matchedRegion = "광주";
        else if (firstPart.includes("대전")) matchedRegion = "대전";
        else if (firstPart.includes("울산")) matchedRegion = "울산";
        else if (firstPart.includes("세종")) matchedRegion = "세종";
        else if (firstPart.includes("경기")) matchedRegion = "경기";
        else if (firstPart.includes("강원")) matchedRegion = "강원";
        else if (firstPart.includes("충북") || firstPart.includes("충청북도"))
          matchedRegion = "충북";
        else if (firstPart.includes("충남") || firstPart.includes("충청남도"))
          matchedRegion = "충남";
        else if (
          firstPart.includes("전북") ||
          (firstPart.includes("전라북") && !firstPart.includes("특별자치도"))
        )
          matchedRegion = "전북";
        else if (firstPart.includes("전북특별자치도")) matchedRegion = "전북";
        else if (firstPart.includes("전남") || firstPart.includes("전라남도"))
          matchedRegion = "전남";
        else if (firstPart.includes("경북") || firstPart.includes("경상북도"))
          matchedRegion = "경북";
        else if (firstPart.includes("경남") || firstPart.includes("경상남도"))
          matchedRegion = "경남";
        else if (firstPart.includes("제주")) matchedRegion = "제주";

        if (matchedRegion && KOREA_REGIONS.includes(matchedRegion)) {
          setRegion(matchedRegion);
          setShowRegionSelection(false);
          if (
            !METROPOLITAN_CITIES.includes(matchedRegion) &&
            parts.length >= 2
          ) {
            const secondPart = parts[1];
            const subRegions = SUB_REGIONS[matchedRegion] || [];
            const matchedSubRegion = subRegions.find(
              (sr) => secondPart.includes(sr) || sr.includes(secondPart),
            );
            if (matchedSubRegion) {
              setSubRegion(matchedSubRegion);
            }
          }
        } else {
          setShowRegionSelection(true);
        }
      } else {
        setShowRegionSelection(true);
      }
    } else {
      setShowRegionSelection(true);
    }
  }, [placeAddress]);

  // --- 히스토리 관리 (중복 방지 강화) ---
  const hasPushedState = useRef(false);

  const handleCloseInternal = useCallback(() => {
    // 직접 닫기 버튼을 누른 경우: 현재 히스토리가 이 모달의 상태일 때만 뒤로가기 실행
    if (window.history.state?.modal === "visit-form") {
      window.history.back();
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    // 중복 Push 방지: 전역 history state를 직접 확인
    const currentState = window.history.state;
    if (currentState?.modal === "visit-form") {
      hasPushedState.current = true;
    }

    if (!hasPushedState.current) {
      window.history.pushState({ modal: "visit-form" }, "");
      hasPushedState.current = true;
    }

    const handlePopState = (event: PopStateEvent) => {
      // 뒤로가기 버튼을 눌러서 상태가 변했을 때, 이 모달의 상태가 아니면 닫기
      if (event.state?.modal !== "visit-form") {
        onClose();
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      // cleanup에서 history.back() 호출은 하지 않음 (이미 handleCloseInternal에서 처리하거나 popstate에서 처리됨)
    };
  }, [onClose]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // 새 이미지 로드가 성공한 뒤에 해제하기 위해 이전 URL 저장
      prevUrlRef.current = previewUrl;

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let targetPlaceId = initialPlaceId;

    try {
      if (!selectedFile) {
        throw new Error("인증 사진을 업로드해주세요.");
      }

      // If no placeId but we have kakaoPlace, save it first
      if (!targetPlaceId && kakaoPlace) {
        const savedPlace = await savePlace(kakaoPlace, "visited");
        targetPlaceId = savedPlace.id;
      }

      if (!targetPlaceId) {
        throw new Error("장소 정보가 없습니다.");
      }

      const success = await verifyVisit({
        placeId: targetPlaceId,
        date: new Date(date),
        file: selectedFile,
        region,
        subRegion: subRegion || undefined,
      });

      if (success) {
        alert("방문 인증이 완료되었습니다!");
        onSuccess();
      }
    } catch (err: any) {
      alert(err.message || "인증 처리 중 오류가 발생했습니다.");
    }
  };

  const handleRegionSelect = (r: string) => {
    setRegion(r);
    setSubRegion("");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full h-[90vh] md:h-auto md:max-h-[85vh] md:max-w-lg md:rounded-[32px] rounded-t-[32px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-50 flex justify-between items-center bg-white shrink-0">
          <div>
            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-rose-500" />
              방문 인증하기
            </h2>
            <p className="text-xs text-gray-400 font-medium mt-1">
              {placeName}
            </p>
          </div>
          <button
            onClick={handleCloseInternal}
            className="p-2 -mr-2 rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 overscroll-contain">
          <form id="visit-form" onSubmit={handleSubmit} className="space-y-8">
            {/* 1. Date Selection */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-rose-400" /> 방문 날짜
              </label>
              <DatePicker value={date} onChange={setDate} variant="calendar" />

              {/* Smart Recommendations */}
              {matchedSuggestions.length > 0 && (
                <div className="mt-2 bg-rose-50/30 border border-rose-100/40 rounded-2xl p-4 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center gap-1.5 text-rose-500 text-[11px] font-black">
                    <InfoIcon className="w-3.5 h-3.5" />
                    <span>여행 계획표에서 해당 장소를 찾았어요.</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {matchedSuggestions.map((suggestion, idx) => {
                      const { rawTitle } = parseTripTitle(suggestion.tripTitle);
                      const isSelected = date === suggestion.dateStr;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setDate(suggestion.dateStr)}
                          className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                            isSelected
                              ? "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-200"
                              : "bg-white border-gray-100 text-gray-700 hover:border-rose-200"
                          }`}
                        >
                          <div className="flex flex-col min-w-0">
                            <span
                              className={`text-[10px] font-bold truncate ${
                                isSelected ? "text-rose-100" : "text-gray-400"
                              }`}
                            >
                              {rawTitle} · {suggestion.dayNumber}일차
                            </span>
                            <span className="text-xs font-black mt-0.5 truncate">
                              {suggestion.placeNameInPlan}
                            </span>
                          </div>
                          <span
                            className={`text-xs font-black shrink-0 ml-3 ${
                              isSelected ? "text-white" : "text-rose-500"
                            }`}
                          >
                            {suggestion.dateStr.replace(/-/g, ".")}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Photo Upload */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5 justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-rose-400" /> 인증 사진
                </span>
                {!selectedFile && (
                  <span className="text-[10px] text-rose-500 font-medium">
                    * 필수
                  </span>
                )}
              </label>
              <div
                className={`group relative w-full aspect-video bg-gray-50 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                  previewUrl
                    ? "border-rose-200 bg-rose-50/30"
                    : "border-gray-200 hover:border-rose-300 hover:bg-rose-50/10"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      onLoad={() => {
                        // 새 이미지가 화면에 로드 완료되면 이전 Object URL을 파괴
                        if (prevUrlRef.current) {
                          URL.revokeObjectURL(prevUrlRef.current);
                          prevUrlRef.current = null;
                        }
                      }}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="bg-white/90 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                        사진 변경하기
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-rose-400 transition-colors">
                    <div className="p-3 bg-white rounded-full shadow-sm">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold">
                      터치하여 사진 업로드
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* 3. Region Selection (Chips) */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-800 flex items-center gap-1.5 justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-400" /> 행정구역 선택
                </span>
                {region && !showRegionSelection && (
                  <button
                    type="button"
                    onClick={() => setShowRegionSelection(true)}
                    className="text-[10px] text-rose-500 font-bold hover:underline"
                  >
                    지역 수정하기
                  </button>
                )}
                {!region && (
                  <span className="text-[10px] text-rose-500 font-medium">
                    * 필수 선택
                  </span>
                )}
              </label>

              {!showRegionSelection && region ? (
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <MapPin size={14} className="text-rose-500" />
                    </div>
                    <span className="text-sm font-black text-gray-700">
                      {region} {subRegion}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded-lg border border-gray-100">
                    자동 인식됨
                  </span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-2">
                    {KOREA_REGIONS.map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => handleRegionSelect(r)}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                          region === r
                            ? "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-200"
                            : "bg-white border-gray-100 text-gray-400 hover:border-rose-200 hover:text-rose-500"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>

                  {/* 4. Sub-Region Selection (if applicable) */}
                  {region && SUB_REGIONS[region] && (
                    <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="text-xs font-bold text-gray-500 flex items-center gap-1.5 justify-between">
                        <span className="flex items-center gap-1.5">
                          <ChevronRight className="w-3 h-3 text-rose-400" />{" "}
                          상세 지역 선택
                        </span>
                        {!subRegion && (
                          <span className="text-[10px] text-rose-500 font-medium">
                            * 필수 선택
                          </span>
                        )}
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {SUB_REGIONS[region].map((sr) => (
                          <button
                            type="button"
                            key={sr}
                            onClick={() => setSubRegion(sr)}
                            className={`py-2 rounded-xl text-[10px] font-bold transition-all border ${
                              subRegion === sr
                                ? "bg-rose-400 border-rose-400 text-white shadow-md"
                                : "bg-white border-gray-100 text-gray-400 hover:border-rose-200 hover:text-rose-400"
                            }`}
                          >
                            {sr}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-rose-50 rounded-xl text-xs font-bold text-rose-500 text-center animate-pulse">
                {error}
              </div>
            )}
          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-6 border-t border-gray-50 bg-white shrink-0 safe-area-bottom">
          <button
            form="visit-form"
            type="submit"
            disabled={
              isSubmitting ||
              !selectedFile ||
              !region ||
              (SUB_REGIONS[region] && !subRegion)
            }
            className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold text-base hover:bg-rose-600 active:scale-[0.98] transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed shadow-lg shadow-rose-100 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5" strokeWidth={2.5} />
                방문 인증 완료
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisitForm;
