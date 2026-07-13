import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, Heart, Smile, Frown, Flame } from 'lucide-react';
import { ReactionEvent } from '../../../hooks/games/useGameReactions';

interface ReactionLayerProps {
  reactions: ReactionEvent[];
  myProfileId?: string;
  // If true, my reactions show on right, partner's on left. If false, just center them.
  splitSides?: boolean;
}

const getIconComponent = (name: string) => {
  switch (name) {
    case 'ThumbsUp': return <ThumbsUp size={28} className="text-blue-500 fill-blue-500" />;
    case 'Heart': return <Heart size={28} className="text-rose-500 fill-rose-500" />;
    case 'Smile': return <Smile size={28} className="text-yellow-500" />;
    case 'Frown': return <Frown size={28} className="text-blue-400" />;
    case 'Flame': return <Flame size={28} className="text-orange-500 fill-orange-500" />;
    case 'Surprise': return <span className="text-3xl leading-none">😲</span>;
    default: return <Heart size={28} className="text-rose-500" />;
  }
};

export default function ReactionLayer({ reactions, myProfileId, splitSides = true }: ReactionLayerProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {reactions.map((reaction) => {
          const isMe = reaction.senderId === myProfileId;
          
          // Determine horizontal starting position
          let leftPos = '50%';
          if (splitSides) {
            // My Profile is on the left side of the screen, Partner on the right
            leftPos = isMe ? '25%' : '75%';
          }

          return (
            <motion.div
              key={reaction.id}
              initial={{ 
                opacity: 0, 
                y: 0, 
                x: `calc(-50% + ${reaction.xOffset}px)`, 
                scale: 0.5,
                rotate: reaction.xOffset
              }}
              animate={{ 
                opacity: [0, 1, 1, 0], 
                y: -120, // Float upwards from the face
                x: `calc(-50% + ${reaction.xOffset * 1.5}px)`, 
                scale: 1.2,
                rotate: reaction.xOffset * -1 
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="absolute top-[120px]"
              style={{ left: leftPos }}
            >
              <div className="rounded-full bg-white/80 p-2 shadow-lg backdrop-blur-sm border border-white/40">
                {getIconComponent(reaction.iconName)}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
