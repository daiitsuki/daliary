import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Check } from "lucide-react";

interface TimePickerProps {
  value: string; // HH:mm
  onChange: (time: string) => void;
  label?: string;
}

const TimePicker = ({ value, onChange, label }: TimePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const [selectedHour, setSelectedHour] = useState(parseInt(value?.split(":")[0] || "12"));
  const [selectedMinute, setSelectedMinute] = useState(parseInt(value?.split(":")[1] || "00"));

  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":").map(Number);
      setSelectedHour(h);
      setSelectedMinute(m);
    }
  }, [value, isOpen]);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = useMemo(() => Array.from({ length: 12 }, (_, i) => i * 5), []); // 5-minute intervals

  useEffect(() => {
    if (isOpen) {
      const scroll = (ref: React.RefObject<HTMLDivElement | null>, index: number) => {
        if (ref.current) {
          ref.current.scrollTop = index * 40;
        }
      };

      setTimeout(() => {
        const hIndex = hours.indexOf(selectedHour);
        const mIndex = minutes.indexOf(selectedMinute);
        scroll(hourRef, hIndex !== -1 ? hIndex : 0);
        scroll(minuteRef, mIndex !== -1 ? mIndex : 0);
      }, 0);
    }
  }, [isOpen]);

  const handleSave = () => {
    const formatted = `${String(selectedHour).padStart(2, "0")}:${String(selectedMinute).padStart(2, "0")}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const ITEM_HEIGHT = 40;
  const VISIBLE_ITEMS = 5;
  const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
  const PADDING_Y = (WHEEL_HEIGHT - ITEM_HEIGHT) / 2;

  const handleScroll = (
    e: React.UIEvent<HTMLDivElement>,
    items: number[],
    setState: (val: number) => void,
  ) => {
    const scrollTop = e.currentTarget.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    if (items[index] !== undefined) {
      setState(items[index]);
    }
  };

  const scrollToItem = (
    ref: React.RefObject<HTMLDivElement | null>,
    index: number,
  ) => {
    if (ref.current) {
      ref.current.scrollTo({
        top: index * ITEM_HEIGHT,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative w-full">
      {label && (
        <label className="block text-[10px] sm:text-xs font-black text-gray-300 uppercase tracking-widest px-1 mb-2">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 rounded-2xl border-none hover:bg-gray-100/80 transition-all text-sm font-bold text-gray-700"
      >
        <span>{value || "시간 선택"}</span>
        <Clock size={18} className="text-gray-300" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[110] bg-black/20 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[120] w-[90%] max-w-[280px] bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden p-6"
            >
              <h3 className="text-center text-sm font-black text-gray-800 mb-6 uppercase tracking-widest">
                시간 선택
              </h3>

              <div className="flex gap-2 relative overflow-hidden touch-pan-y" style={{ height: WHEEL_HEIGHT }}>
                <div className="absolute top-1/2 left-0 right-0 h-10 -translate-y-1/2 bg-rose-50 rounded-xl pointer-events-none border border-rose-100 z-0" />

                <div 
                  ref={hourRef}
                  onScroll={(e) => handleScroll(e, hours, setSelectedHour)}
                  className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar text-center snap-y snap-mandatory relative z-10"
                  style={{ paddingBlock: PADDING_Y }}
                >
                  {hours.map((h, i) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => {
                        setSelectedHour(h);
                        scrollToItem(hourRef, i);
                      }}
                      className={`w-full h-10 flex items-center justify-center text-sm font-bold snap-center transition-all duration-200 ${selectedHour === h ? "text-rose-500 scale-110 opacity-100" : "text-gray-300 scale-95"}`}
                    >
                      {String(h).padStart(2, "0")}시
                    </button>
                  ))}
                </div>

                <div 
                  ref={minuteRef}
                  onScroll={(e) => handleScroll(e, minutes, setSelectedMinute)}
                  className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar text-center snap-y snap-mandatory relative z-10"
                  style={{ paddingBlock: PADDING_Y }}
                >
                  {minutes.map((m, i) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setSelectedMinute(m);
                        scrollToItem(minuteRef, i);
                      }}
                      className={`w-full h-10 flex items-center justify-center text-sm font-bold snap-center transition-all duration-200 ${selectedMinute === m ? "text-rose-500 scale-110 opacity-100" : "text-gray-300 scale-95"}`}
                    >
                      {String(m).padStart(2, "0")}분
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSave}
                className="mt-6 w-full py-3 bg-rose-400 text-white text-sm font-black rounded-2xl shadow-lg shadow-rose-100 hover:bg-rose-500 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Check size={16} strokeWidth={3} />
                선택 완료
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TimePicker;
