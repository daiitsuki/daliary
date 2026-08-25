import { useState, useEffect } from "react";
import { PlayerToken, DIRECTIONS } from "../../../hooks/games/useAbalone";
import { ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AbaloneBoardProps {
  board: Record<string, PlayerToken>;
  isMyTurn: boolean;
  playerToken: PlayerToken;
  validMoves: { dirIndex: number }[];
  onSquareClick: (q: number, r: number) => void;
  onMoveClick: (dirIndex: number) => void;
  selectedTail: { q: number; r: number } | null;
  lastMoveDir: { q: number; r: number } | null;
}

interface MarbleData {
  id: string;
  q: number;
  r: number;
  token: PlayerToken;
}

export default function AbaloneBoard({
  board,
  isMyTurn,
  playerToken,
  validMoves,
  onSquareClick,
  onMoveClick,
  selectedTail,
  lastMoveDir,
}: AbaloneBoardProps) {
  const HEX_SIZE = 18;
  const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
  const HEX_HEIGHT = 2 * HEX_SIZE;
  const Y_OFFSET = (3 / 4) * HEX_HEIGHT;

  const [marbles, setMarbles] = useState<MarbleData[]>([]);

  useEffect(() => {
    setMarbles((prev) => {
      if (prev.length === 0) {
        const initialMarbles: MarbleData[] = [];
        Object.entries(board).forEach(([key, token]) => {
          const [qStr, rStr] = key.split(",");
          initialMarbles.push({ q: parseInt(qStr), r: parseInt(rStr), token, id: Math.random().toString() });
        });
        return initialMarbles;
      }

      const newBoardMarbles: { q: number; r: number; token: PlayerToken }[] = [];
      Object.entries(board).forEach(([key, token]) => {
        const [qStr, rStr] = key.split(",");
        newBoardMarbles.push({ q: parseInt(qStr), r: parseInt(rStr), token });
      });

      const prevMap = new Map(prev.map(p => [`${p.q},${p.r}`, p]));
      const newMap = new Map(newBoardMarbles.map(n => [`${n.q},${n.r}`, n]));
      
      const removed: MarbleData[] = [];
      prev.forEach(p => {
        const n = newMap.get(`${p.q},${p.r}`);
        if (!n || n.token !== p.token) {
          removed.push(p);
        }
      });
      
      const added: typeof newBoardMarbles = [];
      newBoardMarbles.forEach(n => {
        const p = prevMap.get(`${n.q},${n.r}`);
        if (!p || p.token !== n.token) {
          added.push(n);
        }
      });

      const nextMarbles: MarbleData[] = [];
      const usedPrev = new Set<string>();

      for (const token of [1, 2]) {
        const tRemoved = removed.filter(m => m.token === token);
        const tAdded = added.filter(m => m.token === token);
        
        if (tRemoved.length === 1 && tAdded.length === 1) {
          const r = tRemoved[0];
          const a = tAdded[0];
          const dq = a.q - r.q;
          const dr = a.r - r.r;
          const dist = (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
          
          if (dist > 0 && dist <= 5) {
            const dirQ = dq / dist;
            const dirR = dr / dist;
            
            for (let k = 0; k < dist; k++) {
              const oldQ = r.q + k * dirQ;
              const oldR = r.r + k * dirR;
              const newQ = oldQ + dirQ;
              const newR = oldR + dirR;
              
              const oldMarble = prevMap.get(`${oldQ},${oldR}`);
              const newMarble = newMap.get(`${newQ},${newR}`);
              
              if (oldMarble && newMarble && oldMarble.token === token && newMarble.token === token) {
                usedPrev.add(oldMarble.id);
                nextMarbles.push({ ...newMarble, id: oldMarble.id });
              }
            }
          }
        }
      }
      
      newBoardMarbles.forEach(n => {
        if (!nextMarbles.find(nm => nm.q === n.q && nm.r === n.r)) {
          const oldMarble = prevMap.get(`${n.q},${n.r}`);
          if (oldMarble && oldMarble.token === n.token && !usedPrev.has(oldMarble.id)) {
            usedPrev.add(oldMarble.id);
            nextMarbles.push({ ...n, id: oldMarble.id });
          } else {
            nextMarbles.push({ ...n, id: Math.random().toString() });
          }
        }
      });
      
      return nextMarbles;
    });
  }, [board]);

  const hexes: { q: number; r: number }[] = [];
  for (let q = -4; q <= 4; q++) {
    for (let r = -4; r <= 4; r++) {
      if (Math.abs(q + r) <= 4) {
        hexes.push({ q, r });
      }
    }
  }

  const getPos = (q: number, r: number) => {
    const isRotated = playerToken === 2;
    const effectiveQ = isRotated ? -q : q;
    const effectiveR = isRotated ? -r : r;
    const x = HEX_WIDTH * (effectiveQ + effectiveR / 2);
    const y = Y_OFFSET * effectiveR;
    return { x, y };
  };

  const getRotationForDir = (dirIndex: number) => {
    // 0: Right (0deg)
    // 1: Bottom Right (60deg)
    // 2: Bottom Left (120deg)
    // 3: Left (180deg)
    // 4: Top Left (240deg)
    // 5: Top Right (300deg)
    const baseRotation = dirIndex * 60;
    return playerToken === 2 ? baseRotation + 180 : baseRotation;
  };

  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[340px] items-center justify-center overflow-hidden rounded-[32px] border border-gray-100 bg-[#F8F9FA] shadow-inner">
      <div className="relative h-full w-full">
        {/* Holes */}
        {hexes.map(({ q, r }) => {
          const { x, y } = getPos(q, r);
          
          return (
            <div
              key={`${q},${r}`}
              className="absolute left-1/2 top-1/2 flex items-center justify-center"
              style={{
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                width: `${HEX_WIDTH * 0.95}px`,
                height: `${HEX_HEIGHT * 0.95}px`,
              }}
            >
              <div 
                className="absolute rounded-full bg-gray-200/40 transition-colors cursor-pointer"
                style={{ width: `${HEX_WIDTH * 0.85}px`, height: `${HEX_WIDTH * 0.85}px` }}
                onClick={() => onSquareClick(q, r)}
              />
            </div>
          );
        })}

        {/* Marbles */}
        <AnimatePresence>
          {marbles.map((m) => {
            const { x, y } = getPos(m.q, m.r);
            const isSelected = selectedTail?.q === m.q && selectedTail?.r === m.r;

            return (
              <motion.div
                key={m.id}
                initial={false}
                custom={{ x, y, dir: lastMoveDir }}
                variants={{
                  active: (custom) => ({ x: custom.x, y: custom.y, opacity: 1, scale: 1 }),
                  exit: (custom) => {
                    const dir = custom.dir || { q: 0, r: 0 };
                    // If no direction (e.g. game reset), just fade out in place
                    if (!dir.q && !dir.r) {
                      return { opacity: 0, scale: 0.5 };
                    }
                    const isRotated = playerToken === 2;
                    const effDirQ = isRotated ? -dir.q : dir.q;
                    const effDirR = isRotated ? -dir.r : dir.r;
                    // Move 1 hex in the pushed direction and fall down
                    const outX = custom.x + HEX_WIDTH * (effDirQ + effDirR / 2);
                    const outY = custom.y + Y_OFFSET * effDirR;
                    return {
                      x: outX,
                      y: outY + 30, // Drop down slightly
                      opacity: 0,
                      scale: 0.5,
                      filter: "brightness(0.5)",
                      transition: { duration: 0.4, type: "spring", stiffness: 300, damping: 30 }
                    };
                  }
                }}
                animate="active"
                exit="exit"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
                className="absolute left-1/2 top-1/2 flex items-center justify-center pointer-events-none"
                style={{
                  marginLeft: `-${HEX_WIDTH * 0.5}px`,
                  marginTop: `-${HEX_HEIGHT * 0.5}px`,
                  width: `${HEX_WIDTH}px`,
                  height: `${HEX_HEIGHT}px`,
                  zIndex: isSelected ? 5 : 2,
                }}
              >
                <div
                  onClick={() => onSquareClick(m.q, m.r)}
                  className={`pointer-events-auto absolute rounded-full cursor-pointer transition-all active:scale-95 ${
                    m.token === 1
                      ? "bg-rose-400 shadow-sm"
                      : "bg-sky-400 shadow-sm"
                  } ${isSelected ? "ring-4 ring-purple-400 ring-offset-2 ring-offset-[#F8F9FA]" : ""}`}
                  style={{ width: `${HEX_WIDTH * 0.8}px`, height: `${HEX_WIDTH * 0.8}px` }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Direction Arrows */}
        {selectedTail && isMyTurn && validMoves.map((move) => {
          const dir = DIRECTIONS[move.dirIndex];
          
          // Count marbles in group to place the arrow at the head
          let myMarbles = 0;
          let currQ = selectedTail.q;
          let currR = selectedTail.r;
          while (
            Math.abs(currQ) <= 4 &&
            Math.abs(currR) <= 4 &&
            Math.abs(currQ + currR) <= 4 &&
            board[`${currQ},${currR}`] === playerToken &&
            myMarbles < 3
          ) {
            myMarbles++;
            currQ += dir.q;
            currR += dir.r;
          }
          
          // Arrow position is right outside the head
          const arrowQ = currQ;
          const arrowR = currR;
          
          const { x, y } = getPos(arrowQ, arrowR);
          const rotation = getRotationForDir(move.dirIndex);

          return (
            <div
              key={move.dirIndex}
              className="absolute left-1/2 top-1/2 flex items-center justify-center z-10"
              style={{
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                width: `${HEX_WIDTH}px`,
                height: `${HEX_HEIGHT}px`,
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveClick(move.dirIndex);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/80 text-white shadow-lg backdrop-blur-sm transition-transform hover:scale-110 active:scale-95"
                style={{ transform: `rotate(${rotation}deg)` }}
              >
                <ChevronRight size={20} strokeWidth={3} className="ml-0.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
