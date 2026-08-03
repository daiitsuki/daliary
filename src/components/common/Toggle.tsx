import React from "react";

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
  className?: string;
}

const Toggle = ({ checked, onChange, label, className = "" }: ToggleProps) => (
  <div 
    className={`flex items-center justify-between px-4 py-3.5 cursor-pointer select-none transition-colors ${className}`} 
    onClick={onChange}
  >
    {label && <span className="text-[13px] font-bold text-gray-700">{label}</span>}
    <button
      type="button"
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all active:scale-90 ${
        checked ? "bg-rose-400" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-6" : "translate-x-1.5"
        }`}
      />
    </button>
  </div>
);

export default Toggle;
