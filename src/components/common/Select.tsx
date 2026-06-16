import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function Select({ options, value, onChange, className = '' }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 bg-gray-50 border px-3 py-1.5 rounded-xl transition-all w-full justify-between
          ${isOpen ? 'border-rose-200 bg-white shadow-sm ring-2 ring-rose-50' : 'border-gray-100 hover:border-gray-200'}
        `}
      >
        <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">{selectedOption?.label}</span>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1.5 min-w-[120px] right-0 bg-white/95 backdrop-blur-xl border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-[16px] overflow-hidden py-1.5"
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors flex items-center justify-between
                  ${value === option.value ? 'text-rose-500 bg-rose-50/50 font-bold' : 'text-gray-600 hover:bg-gray-50 font-medium'}
                `}
              >
                <span className="whitespace-nowrap">{option.label}</span>
                {value === option.value && <Check size={14} className="text-rose-400 shrink-0 ml-2" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
