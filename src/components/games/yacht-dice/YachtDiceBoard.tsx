import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../../common/Button";

interface YachtDiceBoardProps {
  dice: number[];
  kept: boolean[];
  rollsLeft: number;
  isMyTurn: boolean;
  onRoll: () => void;
  onToggleKeep: (index: number) => void;
  partnerName: string;
  onRollingStateChange?: (isRolling: boolean) => void;
}

const DiceIcon = ({ value }: { value: number }) => {
  // 간단한 주사위 점 렌더링
  const dotPositions: Record<number, string[]> = {
    1: ["col-start-2 row-start-2"],
    2: ["col-start-1 row-start-1", "col-start-3 row-start-3"],
    3: [
      "col-start-1 row-start-1",
      "col-start-2 row-start-2",
      "col-start-3 row-start-3",
    ],
    4: [
      "col-start-1 row-start-1",
      "col-start-3 row-start-1",
      "col-start-1 row-start-3",
      "col-start-3 row-start-3",
    ],
    5: [
      "col-start-1 row-start-1",
      "col-start-3 row-start-1",
      "col-start-2 row-start-2",
      "col-start-1 row-start-3",
      "col-start-3 row-start-3",
    ],
    6: [
      "col-start-1 row-start-1",
      "col-start-1 row-start-2",
      "col-start-1 row-start-3",
      "col-start-3 row-start-1",
      "col-start-3 row-start-2",
      "col-start-3 row-start-3",
    ],
  };

  return (
    <div className="grid h-12 w-12 grid-cols-3 grid-rows-3 gap-[2px] rounded-xl border border-gray-100 bg-white p-2 shadow-sm">
      {dotPositions[value]?.map((pos, i) => (
        <div
          key={i}
          className={`h-full w-full rounded-full bg-gray-800 ${pos}`}
        />
      ))}
    </div>
  );
};

export default function YachtDiceBoard({
  dice,
  kept,
  rollsLeft,
  isMyTurn,
  onRoll,
  onToggleKeep,
  partnerName,
  onRollingStateChange,
}: YachtDiceBoardProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [displayDice, setDisplayDice] = useState<number[]>(dice);

  useEffect(() => {
    if (!isRolling) {
      setDisplayDice(dice);
    }
  }, [dice, isRolling]);

  const canRoll = isMyTurn && rollsLeft > 0 && !isRolling;
  const hasRolled = rollsLeft < 3; // 한 번이라도 굴렸는지 여부
  const canToggle = isMyTurn && hasRolled && rollsLeft > 0 && !isRolling;

  const handleRoll = () => {
    setIsRolling(true);
    onRollingStateChange?.(true);

    // 1.2초 동안 80ms 간격으로 킵하지 않은 주사위 눈금을 무작위로 변경
    const interval = setInterval(() => {
      setDisplayDice((prev) =>
        prev.map((d, i) => (kept[i] ? d : Math.floor(Math.random() * 6) + 1)),
      );
    }, 80);

    setTimeout(() => {
      clearInterval(interval);
      onRoll();
      setIsRolling(false);
      onRollingStateChange?.(false);
    }, 1200);
  };

  return (
    <div className="flex w-full flex-col items-center gap-6 rounded-[32px] border border-gray-100 bg-gray-50/50 p-6">
      {/* Dice Container */}
      <div className="flex w-full justify-center gap-3">
        <AnimatePresence mode="popLayout">
          {dice.map((d, i) => (
            <motion.button
              key={i}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{
                scale:
                  isRolling && !kept[i]
                    ? [1, 1.1, 0.9, 1.1, 0.9, 1.1, 0.9, 1.05, 1]
                    : 1,
                rotate:
                  isRolling && !kept[i]
                    ? [0, -15, 15, -15, 15, -15, 15, -10, 10, 0]
                    : 0,
                opacity: 1,
                y: kept[i] && rollsLeft > 0 ? -10 : 0,
              }}
              transition={
                isRolling && !kept[i]
                  ? { duration: 1.2 }
                  : { type: "spring", stiffness: 500, damping: 30 }
              }
              whileTap={canToggle ? { scale: 0.9 } : undefined}
              onClick={() => canToggle && onToggleKeep(i)}
              className={`relative rounded-xl transition-all ${!hasRolled ? "pointer-events-none" : ""} ${kept[i] && rollsLeft > 0 ? "shadow-md ring-2 ring-rose-400" : "hover:shadow-sm"} ${!canToggle && hasRolled ? "cursor-default" : ""}`}
              disabled={!canToggle}
            >
              <DiceIcon value={hasRolled || isRolling ? displayDice[i] : 0} />
              {kept[i] && rollsLeft > 0 && (
                <div className="absolute -bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  KEEP
                </div>
              )}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Roll Button & Info */}
      <div className="flex w-full flex-col items-center gap-2">
        <Button
          onClick={handleRoll}
          disabled={!canRoll}
          variant="primary"
          size="lg"
          className="w-full max-w-[200px]"
        >
          {rollsLeft === 3
            ? "주사위 굴리기 (시작)"
            : `다시 굴리기 (${rollsLeft}/3)`}
        </Button>
        <p className="h-4 text-center text-[12px] font-bold text-gray-400">
          {isMyTurn
            ? rollsLeft === 0
              ? "점수판에서 기록할 항목을 선택하세요."
              : hasRolled
                ? "유지할 주사위를 선택하거나 점수를 기록하세요."
                : "버튼을 눌러 턴을 시작하세요."
            : `${partnerName}님이 플레이 중입니다...`}
        </p>
      </div>
    </div>
  );
}
