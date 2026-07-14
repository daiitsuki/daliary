import { motion, AnimatePresence } from "framer-motion";
import { OthelloBoard as BoardType } from "../../../hooks/games/useOthello";

interface OthelloBoardProps {
  board: BoardType;
  isMyTurn: boolean;
  validMoves: { r: number; c: number }[];
  showGuide: boolean;
  onSquareClick: (row: number, col: number) => void;
}

export default function OthelloBoard({
  board,
  isMyTurn,
  validMoves,
  showGuide,
  onSquareClick,
}: OthelloBoardProps) {
  const isValidMove = (r: number, c: number) => {
    return validMoves.some((move) => move.r === r && move.c === c);
  };

  return (
    <div className="bg-white p-2 sm:p-3 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 mx-auto w-full max-w-[400px] aspect-square flex flex-col">
      <div className="flex-1 grid grid-rows-8 gap-[1px] bg-gray-200 border border-gray-200 rounded-2xl overflow-hidden">
        {board.map((row, r) => (
          <div key={`row-${r}`} className="grid grid-cols-8 gap-[1px]">
            {row.map((cell, c) => {
              const isValid = isMyTurn && showGuide && isValidMove(r, c);
              return (
                <div
                  key={`cell-${r}-${c}`}
                  onClick={() => {
                    if (isMyTurn && isValidMove(r, c)) onSquareClick(r, c);
                  }}
                  className={`bg-gray-50 w-full h-full relative cursor-pointer flex items-center justify-center transition-colors duration-200
                    ${isValid ? "hover:bg-gray-100" : ""}
                  `}
                >
                  <AnimatePresence>
                    {cell !== null && (
                      <motion.div
                        key={`${r}-${c}-${cell}`}
                        initial={{ rotateY: 90, scale: 0.8 }}
                        animate={{ rotateY: 0, scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className={`absolute w-[80%] h-[80%] rounded-full shadow-sm ${
                          cell === 1 ? "bg-sky-400" : "bg-rose-400"
                        }`}
                        style={{
                          boxShadow: "inset -2px -2px 4px rgba(0,0,0,0.05), 2px 2px 4px rgba(0,0,0,0.1)"
                        }}
                      />
                    )}
                  </AnimatePresence>
                  
                  {/* Guide Dot */}
                  {isValid && cell === null && (
                    <div className="w-[20%] h-[20%] rounded-full bg-gray-300/60" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
