import { motion, AnimatePresence } from "framer-motion";
import { ConnectFourBoard as BoardType } from "../../../hooks";

interface ConnectFourBoardProps {
  board: BoardType;
  isMyTurn: boolean;
  onColumnClick: (colIndex: number) => void;
}

const COLS = 7;

export default function ConnectFourBoard({
  board,
  onColumnClick,
}: ConnectFourBoardProps) {
  return (
    <div className="w-full max-w-md mx-auto aspect-[7/6] bg-gray-100 rounded-[32px] p-3 sm:p-4 relative select-none overflow-hidden">
      <div className="grid grid-cols-7 grid-rows-6 gap-2 sm:gap-2.5 h-full w-full relative z-10">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className="relative w-full h-full rounded-full bg-white flex items-center justify-center cursor-pointer"
              onClick={() => onColumnClick(colIndex)}
            >
              <AnimatePresence>
                {cell !== null && (
                  <motion.div
                    key={`piece-${rowIndex}-${colIndex}`}
                    initial={{ y: -500, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      type: "spring",
                      damping: 18,
                      stiffness: 140,
                      mass: 0.8,
                    }}
                    className={`absolute inset-0.5 rounded-full z-20 ${
                      cell === 1 ? "bg-rose-500" : "bg-amber-400"
                    }`}
                  />
                )}
              </AnimatePresence>
            </div>
          )),
        )}
      </div>

      {/* Hover Column Guide / Touch Area */}
      <div className="absolute inset-x-3 sm:inset-x-4 inset-y-3 sm:inset-y-4 grid grid-cols-7 gap-2 sm:gap-2.5 z-30 pointer-events-none">
        {Array.from({ length: COLS }).map((_, colIndex) => (
          <div
            key={`overlay-${colIndex}`}
            className="h-full w-full pointer-events-auto rounded-full transition-colors hover:bg-black/5 active:bg-black/10 cursor-pointer"
            onClick={() => onColumnClick(colIndex)}
          />
        ))}
      </div>
    </div>
  );
}
