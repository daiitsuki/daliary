import { motion } from "framer-motion";
import { 
  YachtScore, 
  YachtCategory, 
  YACHT_CATEGORIES, 
  calculateCategoryScore, 
  getUpperTotal, 
  getTotalScore 
} from "../../../hooks";
import { useConfirm } from "../../../context/ConfirmContext";

interface YachtDiceScoreBoardProps {
  myScore: YachtScore;
  partnerScore: YachtScore;
  dice: number[];
  rollsLeft: number;
  isMyTurn: boolean;
  myName: string;
  partnerName: string;
  onRecordScore: (category: YachtCategory) => void;
  isRolling?: boolean;
}

export default function YachtDiceScoreBoard({
  myScore,
  partnerScore,
  dice,
  rollsLeft,
  isMyTurn,
  myName,
  partnerName,
  onRecordScore,
  isRolling
}: YachtDiceScoreBoardProps) {
  const { confirm } = useConfirm();
  const canRecord = isMyTurn && rollsLeft < 3 && !isRolling; // 한 번이라도 굴려야 기록 가능하며, 주사위가 구르는 중엔 기록 불가

  const handleRecord = async (category: YachtCategory, score: number, name: string) => {
    const isConfirmed = await confirm({
      title: "점수 기록",
      message: `'${name}' ${score}점을 기록할까요?`,
      confirmText: "기록하기",
    });
    if (isConfirmed) {
      onRecordScore(category);
    }
  };

  const myUpperTotal = getUpperTotal(myScore);
  const partnerUpperTotal = getUpperTotal(partnerScore);
  const myBonus = myUpperTotal >= 63 ? 35 : 0;
  const partnerBonus = partnerUpperTotal >= 63 ? 35 : 0;
  const myTotal = getTotalScore(myScore);
  const partnerTotal = getTotalScore(partnerScore);

  let maxPreviewScore = -1;
  if (canRecord) {
    YACHT_CATEGORIES.forEach(c => {
      if (myScore[c.id] === undefined) {
        const score = calculateCategoryScore(dice, c.id);
        if (score > maxPreviewScore) maxPreviewScore = score;
      }
    });
  }

  const renderRow = (
    label: string, 
    category: YachtCategory | null, 
    isUpperSubtotal = false,
    isBonus = false,
    isTotal = false
  ) => {
    let myVal: number | string = '';
    let partnerVal: number | string = '';
    let isClickable = false;
    let previewScore: number | null = null;

    if (category) {
      myVal = myScore[category] ?? '';
      partnerVal = partnerScore[category] ?? '';
      
      if (canRecord && myScore[category] === undefined) {
        isClickable = true;
        previewScore = calculateCategoryScore(dice, category);
      }
    } else if (isUpperSubtotal) {
      myVal = `${myUpperTotal}/63`;
      partnerVal = `${partnerUpperTotal}/63`;
    } else if (isBonus) {
      myVal = myBonus > 0 ? '+35' : (Object.keys(myScore).filter(k => YACHT_CATEGORIES.find(c => c.id === k)?.type === 'upper').length === 6 && myUpperTotal < 63 ? '0' : '');
      partnerVal = partnerBonus > 0 ? '+35' : (Object.keys(partnerScore).filter(k => YACHT_CATEGORIES.find(c => c.id === k)?.type === 'upper').length === 6 && partnerUpperTotal < 63 ? '0' : '');
    } else if (isTotal) {
      myVal = myTotal;
      partnerVal = partnerTotal;
    }

    const isHighest = isClickable && previewScore !== null && previewScore > 0 && previewScore === maxPreviewScore;

    return (
      <div 
        key={category || label} 
        className={`flex border-b border-gray-100 last:border-b-0 ${isTotal ? 'bg-rose-50 font-black' : isUpperSubtotal || isBonus ? 'bg-gray-50/50 font-bold text-gray-500' : 'text-gray-700'}`}
      >
        <div className="flex-1 py-1 px-1 text-center text-[12px] border-r border-gray-100 relative">
          {category ? (
            <button
              onClick={() => isClickable && previewScore !== null && handleRecord(category, previewScore, label)}
              disabled={!isClickable}
              className={`w-full h-full min-h-[20px] rounded flex items-center justify-center transition-all duration-300
                ${isClickable && !isHighest ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : ''}
                ${isHighest ? 'ring-2 ring-amber-400 bg-amber-100 text-amber-600 font-black shadow-sm relative overflow-hidden' : ''}
              `}
            >
              {isHighest && (
                <motion.div 
                  className="absolute inset-0 bg-white/40"
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
              <span className="relative z-10">
                {myScore[category] !== undefined ? (
                  myVal
                ) : isClickable && previewScore !== null ? (
                  <span className={isHighest ? "text-amber-600" : "text-amber-500/50"}>{previewScore}</span>
                ) : null}
              </span>
            </button>
          ) : (
            <span>{myVal}</span>
          )}
        </div>
        <div className="w-[90px] flex-shrink-0 py-1 px-1 text-center text-[11px] font-bold text-gray-500 border-r border-gray-100 bg-white flex items-center justify-center">
          {label}
        </div>
        <div className="flex-1 py-1 px-1 text-center text-[12px] text-gray-400 relative">
          <div className="w-full h-full min-h-[20px] flex items-center justify-center">
            {partnerVal}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex bg-gray-50 border-b border-gray-100">
        <div className="flex-1 py-1.5 text-center text-[12px] font-black text-rose-500 truncate px-1">
          {myName}
        </div>
        <div className="w-[90px] flex-shrink-0 py-1.5 text-center text-[10px] font-bold text-gray-400 border-x border-gray-100 flex items-center justify-center">
          항목
        </div>
        <div className="flex-1 py-1.5 text-center text-[12px] font-black text-amber-500 truncate px-1">
          {partnerName}
        </div>
      </div>
      
      {/* Upper Section */}
      <div className="flex flex-col">
        {YACHT_CATEGORIES.filter(c => c.type === 'upper').map(c => 
          renderRow(c.name, c.id)
        )}
        {renderRow('상단 합계', null, true, false, false)}
        {renderRow('보너스 (+35)', null, false, true, false)}
      </div>
      
      <div className="h-2 bg-gray-50 border-y border-gray-100"></div>

      {/* Lower Section */}
      <div className="flex flex-col">
        {YACHT_CATEGORIES.filter(c => c.type === 'lower').map(c => 
          renderRow(c.name, c.id)
        )}
      </div>

      <div className="h-[2px] bg-gray-100"></div>

      {/* Total */}
      {renderRow('총점', null, false, false, true)}
    </div>
  );
}
