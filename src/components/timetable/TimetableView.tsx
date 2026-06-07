import { useState, useCallback, useRef } from "react";
import { toPng } from "html-to-image";
import { motion } from "framer-motion";
import { useTimetable, TimetableBlock, TimetableBlockInput } from "../../hooks/useTimetable";
import { useHomeData } from "../../hooks/useHomeData";
import { useToast } from "../../context/ToastContext";
import TimetableHeader from "./TimetableHeader";
import TimetableGrid from "./TimetableGrid";
import TimetableBlockModal from "./TimetableBlockModal";
import TimetableSettingsModal from "./TimetableSettingsModal";
import PartnerBlockModal from "./PartnerBlockModal";

const STORAGE_KEY_START = "timetable_start_hour";
const STORAGE_KEY_END = "timetable_end_hour";
const STORAGE_KEY_COMPRESSION = "timetable_compression_mode";
const STORAGE_KEY_WEEK_START = "timetable_week_start";
const STORAGE_KEY_VISIBLE_DAYS = "timetable_visible_days";
const STORAGE_KEY_SHOW_TIME = "timetable_show_time";
const STORAGE_KEY_SHOW_PLACE = "timetable_show_place";
const STORAGE_KEY_SHOW_MEMO = "timetable_show_memo";
const STORAGE_KEY_FIT_TO_SCREEN = "timetable_fit_to_screen";

const TimetableView = () => {
  const { myBlocks, partnerBlocks, addBlock, updateBlock, deleteBlock, deleteAllBlocks, loading } = useTimetable();
  const { partnerProfile } = useHomeData();
  const { showToast } = useToast();

  const [viewMode, setViewMode] = useState<"my" | "partner">("my");
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [editingBlock, setEditingBlock] = useState<TimetableBlock | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const [showPartnerBlockModal, setShowPartnerBlockModal] = useState(false);
  const [viewingPartnerBlock, setViewingPartnerBlock] = useState<TimetableBlock | null>(null);

  const [defaultDay, setDefaultDay] = useState(1); // 기본 월요일
  const [defaultStartTime, setDefaultStartTime] = useState<string>("09:00");
  const [defaultEndTime, setDefaultEndTime] = useState<string>("10:00");
  const [showSettings, setShowSettings] = useState(false);
  
  const gridRef = useRef<HTMLDivElement>(null);

  const [startHour, setStartHour] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY_START);
    return stored ? parseInt(stored) : 8;
  });
  const [endHour, setEndHour] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY_END);
    return stored ? parseInt(stored) : 22;
  });
  const [compressionMode, setCompressionMode] = useState<"none" | "compact" | "more_compact">(() => {
    return (localStorage.getItem(STORAGE_KEY_COMPRESSION) as any) || "compact";
  });
  const [weekStart, setWeekStart] = useState<"sunday" | "monday">(() => {
    return (localStorage.getItem(STORAGE_KEY_WEEK_START) as any) || "monday";
  });
  const [visibleDays, setVisibleDays] = useState<number[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_VISIBLE_DAYS);
    return stored ? JSON.parse(stored) : [0, 1, 2, 3, 4, 5, 6];
  });
  const [showTime, setShowTime] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_SHOW_TIME);
    return stored ? JSON.parse(stored) : true;
  });
  const [showPlace, setShowPlace] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_SHOW_PLACE);
    return stored ? JSON.parse(stored) : true;
  });
  const [showMemo, setShowMemo] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_SHOW_MEMO);
    return stored ? JSON.parse(stored) : false;
  });
  const [fitToScreen, setFitToScreen] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_FIT_TO_SCREEN);
    return stored ? JSON.parse(stored) : false;
  });

  const handleAddBlock = useCallback((dayOfWeek?: number, defaultHour?: number) => {
    setEditingBlock(null);
    setDefaultDay(dayOfWeek ?? 1);
    
    if (defaultHour !== undefined) {
      const validStartHour = Math.max(0, Math.min(23, defaultHour));
      const validEndHour = Math.min(24, validStartHour + 1);
      
      const formatTime = (h: number) => {
        if (h >= 24) return "23:55";
        return `${String(h).padStart(2, "0")}:00`;
      };
      
      setDefaultStartTime(formatTime(validStartHour));
      setDefaultEndTime(formatTime(validEndHour));
    } else {
      setDefaultStartTime("09:00");
      setDefaultEndTime("10:00");
    }
    
    setShowBlockModal(true);
  }, []);

  const handleBlockClick = useCallback((block: TimetableBlock) => {
    if (viewMode === "partner") {
      setViewingPartnerBlock(block);
      setShowPartnerBlockModal(true);
      return;
    }
    setEditingBlock(block);
    setShowBlockModal(true);
  }, [viewMode]);

  const handleSave = async (dataList: TimetableBlockInput[]) => {
    try {
      if (editingBlock) {
        await updateBlock(editingBlock.id, dataList[0]);
        for (let i = 1; i < dataList.length; i++) {
          await addBlock(dataList[i]);
        }
        showToast("시간표가 수정되었습니다.", "success");
      } else {
        for (const data of dataList) {
          await addBlock(data);
        }
        showToast("새 시간표가 추가되었습니다.", "success");
      }
    } catch (error) {
      showToast("저장에 실패했습니다.", "error");
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBlock(id);
      showToast("시간표가 삭제되었습니다.", "success");
    } catch (error) {
      showToast("삭제에 실패했습니다.", "error");
      console.error(error);
    }
  };

  const handleSettingsSave = (
    start: number, 
    end: number, 
    mode: "none" | "compact" | "more_compact",
    ws: "sunday" | "monday",
    vd: number[],
    sTime: boolean,
    sPlace: boolean,
    sMemo: boolean,
    sFitToScreen: boolean
  ) => {
    setStartHour(start);
    setEndHour(end);
    setCompressionMode(mode);
    setWeekStart(ws);
    setVisibleDays(vd);
    setShowTime(sTime);
    setShowPlace(sPlace);
    setShowMemo(sMemo);
    setFitToScreen(sFitToScreen);
    localStorage.setItem(STORAGE_KEY_START, start.toString());
    localStorage.setItem(STORAGE_KEY_END, end.toString());
    localStorage.setItem(STORAGE_KEY_COMPRESSION, mode);
    localStorage.setItem(STORAGE_KEY_WEEK_START, ws);
    localStorage.setItem(STORAGE_KEY_VISIBLE_DAYS, JSON.stringify(vd));
    localStorage.setItem(STORAGE_KEY_SHOW_TIME, JSON.stringify(sTime));
    localStorage.setItem(STORAGE_KEY_SHOW_PLACE, JSON.stringify(sPlace));
    localStorage.setItem(STORAGE_KEY_SHOW_MEMO, JSON.stringify(sMemo));
    localStorage.setItem(STORAGE_KEY_FIT_TO_SCREEN, JSON.stringify(sFitToScreen));
  };

  const handleExport = async () => {
    if (!gridRef.current) return;
    try {
      setIsExporting(true);
      showToast("시간표 이미지를 생성 중입니다...", "success");
      await new Promise(r => setTimeout(r, 50)); // let React re-render today indicator out
      
      const el = gridRef.current;
      const scrollableEl = el.querySelector('.custom-scrollbar') as HTMLDivElement;
      
      let originalElHeight = '';
      let originalElWidth = '';
      let originalScrollHeight = '';
      let originalScrollOverflow = '';
      let originalElMaxHeight = '';
      
      if (scrollableEl) {
        originalElHeight = el.style.height;
        originalElWidth = el.style.width;
        originalElMaxHeight = el.style.maxHeight;
        originalScrollHeight = scrollableEl.style.height;
        originalScrollOverflow = scrollableEl.style.overflow;
        
        // Remove height restrictions so the container expands to fit the entire grid
        el.style.height = 'auto';
        el.style.width = `${scrollableEl.scrollWidth}px`;
        el.style.maxHeight = 'none';
        scrollableEl.style.height = 'auto';
        scrollableEl.style.overflow = 'visible';
      }
      
      // Wait a moment for DOM to repaint
      await new Promise(r => setTimeout(r, 150));

      const dataUrl = await toPng(el, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        filter: (node) => {
          if (node.classList?.contains('export-hide')) {
            return false;
          }
          return true;
        },
        style: {
          borderRadius: '28px', // keep corners looking good
        }
      });
      
      // Restore original styles
      if (scrollableEl) {
        el.style.height = originalElHeight;
        el.style.width = originalElWidth;
        el.style.maxHeight = originalElMaxHeight;
        scrollableEl.style.height = originalScrollHeight;
        scrollableEl.style.overflow = originalScrollOverflow;
      }
      
      const link = document.createElement("a");
      const filename = `시간표_${viewMode === "my" ? "내_시간표" : `${partnerProfile?.nickname || '상대방'}님의_시간표`}.png`;
      link.download = filename;
      link.href = dataUrl;
      link.click();
      
      showToast("시간표가 저장되었습니다.", "success");
    } catch (err) {
      console.error("Export error", err);
      showToast("이미지 저장에 실패했습니다.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto animate-pulse">
            <div className="w-6 h-6 rounded-full bg-rose-200" />
          </div>
          <p className="text-xs font-bold text-gray-300">시간표 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-full min-h-0"
    >
      <TimetableHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddBlock={() => handleAddBlock()}
        onOpenSettings={() => setShowSettings(true)}
        partnerProfile={partnerProfile}
        onExport={handleExport}
      />

      <div className="flex-1 min-h-0 relative">
        {viewMode === "partner" && !partnerProfile ? (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/95 backdrop-blur-md p-8 rounded-[24px] shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 text-center flex flex-col items-center gap-3"
            >
              <div className="text-4xl mb-1">💌</div>
              <div>
                <p className="font-black text-gray-700 text-lg">
                  아직 커플 연결이 안 됐어요
                </p>
                <p className="text-sm font-bold text-gray-400 mt-1.5">
                  초대 코드를 통해 상대방을 연결해보세요
                </p>
              </div>
            </motion.div>
          </div>
        ) : null}

        <TimetableGrid
          myBlocks={myBlocks}
          partnerBlocks={partnerBlocks}
          viewMode={viewMode}
          onBlockClick={handleBlockClick}
          onAddBlock={handleAddBlock}
          isPartnerView={viewMode === "partner"}
          partnerName={partnerProfile?.nickname || "상대방"}
          startHour={startHour}
          endHour={endHour}
          compressionMode={compressionMode}
          weekStart={weekStart}
          visibleDays={visibleDays}
          isExporting={isExporting}
          gridRef={gridRef}
          showTime={showTime}
          showPlace={showPlace}
          showMemo={showMemo}
          fitToScreen={fitToScreen}
        />
      </div>

      <PartnerBlockModal
        isOpen={showPartnerBlockModal}
        onClose={() => setShowPartnerBlockModal(false)}
        block={viewingPartnerBlock}
      />

      <TimetableBlockModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        blockToEdit={editingBlock}
        defaultDay={defaultDay}
        defaultStartTime={defaultStartTime}
        defaultEndTime={defaultEndTime}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      <TimetableSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        startHour={startHour}
        endHour={endHour}
        compressionMode={compressionMode}
        weekStart={weekStart}
        visibleDays={visibleDays}
        showTime={showTime}
        showPlace={showPlace}
        showMemo={showMemo}
        fitToScreen={fitToScreen}
        onSave={handleSettingsSave}
        onResetAll={async () => {
          try {
            await deleteAllBlocks();
            showToast("모든 시간표가 초기화되었습니다.", "success");
          } catch (error) {
            showToast("초기화에 실패했습니다.", "error");
            console.error(error);
          }
        }}
      />
    </motion.div>
  );
};

export default TimetableView;
