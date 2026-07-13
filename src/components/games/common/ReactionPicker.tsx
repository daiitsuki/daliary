import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SmilePlus, ThumbsUp, Heart, Smile, Frown, Flame, X } from 'lucide-react';
import { ReactionIconName } from '../../../hooks/games/useGameReactions';

interface ReactionPickerProps {
  onSelect: (iconName: ReactionIconName) => void;
  className?: string;
  inline?: boolean;
}

const REACTIONS: { name: ReactionIconName; icon: React.ReactNode; color: string }[] = [
  { name: 'ThumbsUp', icon: <ThumbsUp size={24} className="fill-blue-500" />, color: 'text-blue-500 hover:bg-blue-50' },
  { name: 'Heart', icon: <Heart size={24} className="fill-rose-500" />, color: 'text-rose-500 hover:bg-rose-50' },
  { name: 'Smile', icon: <Smile size={24} />, color: 'text-yellow-500 hover:bg-yellow-50' },
  { name: 'Frown', icon: <Frown size={24} />, color: 'text-blue-400 hover:bg-blue-50' },
  { name: 'Flame', icon: <Flame size={24} className="fill-orange-500" />, color: 'text-orange-500 hover:bg-orange-50' },
  { name: 'Surprise', icon: <span className="text-2xl leading-none">😲</span>, color: 'text-gray-700 hover:bg-gray-100' },
];

export default function ReactionPicker({ onSelect, className = '', inline = false }: ReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (name: ReactionIconName) => {
    onSelect(name);
    if (!inline) setIsOpen(false);
  };

  if (inline) {
    return (
      <div className={`flex flex-wrap items-center justify-center gap-2 rounded-3xl bg-white p-3 shadow-sm border border-gray-100 ${className}`}>
        {REACTIONS.map((reaction) => (
          <button
            key={reaction.name}
            onClick={() => handleSelect(reaction.name)}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition-all active:scale-90 ${reaction.color}`}
          >
            {reaction.icon}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Reaction Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-500 shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all hover:bg-gray-50 hover:text-gray-700 active:scale-95"
      >
        {isOpen ? <X size={24} /> : <SmilePlus size={24} />}
      </button>

      {/* Popover Picker */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10, originX: 1, originY: 1 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute bottom-full mb-3 right-0 flex flex-wrap items-center justify-end gap-2 w-[220px] rounded-3xl bg-white/90 p-3 shadow-xl backdrop-blur-md border border-gray-100/50"
          >
            {REACTIONS.map((reaction) => (
              <button
                key={reaction.name}
                onClick={() => handleSelect(reaction.name)}
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-all active:scale-90 ${reaction.color}`}
              >
                {reaction.icon}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
