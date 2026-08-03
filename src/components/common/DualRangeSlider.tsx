import React from "react";

interface DualRangeSliderProps {
  min?: number;
  max?: number;
  startValue: number;
  endValue: number;
  onChange: (start: number, end: number) => void;
  minGap?: number;
}

const DualRangeSlider = ({
  min = 0,
  max = 24,
  startValue,
  endValue,
  onChange,
  minGap = 4,
}: DualRangeSliderProps) => {
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), endValue - minGap);
    onChange(value, endValue);
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), startValue + minGap);
    onChange(startValue, value);
  };

  const percentStart = ((startValue - min) / (max - min)) * 100;
  const percentEnd = ((endValue - min) / (max - min)) * 100;

  return (
    <div className="relative h-16 w-full flex items-center px-3">
      {/* Background Track */}
      <div className="absolute left-3 right-3 h-2.5 rounded-full bg-gray-100" />
      
      {/* Active Track */}
      <div
        className="absolute h-2.5 rounded-full bg-rose-400"
        style={{
          left: `calc(12px + (100% - 24px) * ${percentStart / 100})`,
          width: `calc((100% - 24px) * ${(percentEnd - percentStart) / 100})`,
        }}
      />

      {/* Start Thumb Label */}
      <div 
        className="absolute top-11 text-[11px] font-bold text-gray-500 whitespace-nowrap"
        style={{
          left: `calc(12px + (100% - 24px) * ${percentStart / 100})`,
          transform: "translateX(-50%)"
        }}
      >
        {String(startValue).padStart(2, "0")}:00
      </div>

      {/* End Thumb Label */}
      <div 
        className="absolute top-11 text-[11px] font-bold text-gray-500 whitespace-nowrap"
        style={{
          left: `calc(12px + (100% - 24px) * ${percentEnd / 100})`,
          transform: "translateX(-50%)"
        }}
      >
        {String(endValue).padStart(2, "0")}:00
      </div>

      {/* Range inputs */}
      <input
        type="range"
        min={min}
        max={max}
        value={startValue}
        onChange={handleStartChange}
        className="pointer-events-none absolute left-0 h-2 w-full cursor-pointer touch-pan-x appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-rose-400 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
        style={{ zIndex: startValue > max - 5 ? 3 : 4 }}
      />
      <input
        type="range"
        min={min}
        max={max}
        value={endValue}
        onChange={handleEndChange}
        className="pointer-events-none absolute left-0 h-2 w-full cursor-pointer touch-pan-x appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-rose-400 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-md"
        style={{ zIndex: 4 }}
      />
    </div>
  );
};

export default DualRangeSlider;
