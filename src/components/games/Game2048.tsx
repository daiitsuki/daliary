import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Trophy, Star, ChevronLeft, User, Lightbulb, Info } from "lucide-react";
import { useGameScore } from "../../hooks/useGameScore";
import { useHomeData } from "../../hooks/useHomeData";

type Tile = {
  id: string;
  value: number;
  x: number;
  y: number;
};

interface Game2048Props {
  onBack: () => void;
}

const GRID_SIZE = 4;
const SAVE_KEY = "daliary_2048_state_v1";
const ENCRYPTION_SALT = "dal_game_2048";

export default function Game2048({ onBack }: Game2048Props) {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [reached2048, setReached2048] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number, y: number } | null>(null);
  
  const { myProfile, partnerProfile } = useHomeData();
  const { scores, myScore, recordResult } = useGameScore("2048");
  
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Seoul'
  }).replace(/\. /g, '-').replace(/\./g, '');
  
  const isMeRewarded = myScore?.last_reward_date === today;
  const partnerScore = scores?.find(s => s.user_id === partnerProfile?.id);
  const isPartnerRewarded = !!partnerProfile && partnerScore?.last_reward_date === today;

  useEffect(() => {
    if (myScore) setBestScore(myScore.high_score);
  }, [myScore]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const encrypt = (data: any) => {
    const str = JSON.stringify(data);
    return btoa(encodeURIComponent(ENCRYPTION_SALT + str));
  };

  const decrypt = (encoded: string) => {
    try {
      const decoded = decodeURIComponent(atob(encoded));
      if (decoded.startsWith(ENCRYPTION_SALT)) {
        return JSON.parse(decoded.substring(ENCRYPTION_SALT.length));
      }
    } catch (e) { return null; }
    return null;
  };

  const loadGameState = useCallback(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      const parsed = decrypt(saved);
      if (parsed && parsed.date === today && parsed.tiles.length > 0) {
        setTiles(parsed.tiles);
        setScore(parsed.score);
        setReached2048(parsed.reached2048 || false);
        setHintUsed(parsed.hintUsed || false);
        return true;
      }
    }
    return false;
  }, [today]);

  const initGame = useCallback((isReset = true) => {
    if (isReset) localStorage.removeItem(SAVE_KEY);
    setScore(0);
    setGameOver(false);
    setWin(false);
    setReached2048(false);
    setIsMoving(false);
    setHintUsed(false);
    
    const initialTiles: Tile[] = [];
    const positions = Array.from({ length: 16 }, (_, i) => ({ x: i % 4, y: Math.floor(i / 4) }));
    for (let i = 0; i < 2; i++) {
      const idx = Math.floor(Math.random() * positions.length);
      const pos = positions.splice(idx, 1)[0];
      initialTiles.push({ id: generateId(), value: Math.random() < 0.9 ? 2 : 4, x: pos.x, y: pos.y });
    }
    setTiles(initialTiles);
  }, []);

  useEffect(() => {
    const loaded = loadGameState();
    if (!loaded) initGame(false);
  }, [loadGameState, initGame]);

  useEffect(() => {
    if (tiles.length > 0 && !gameOver) {
      const state = { tiles, score, reached2048, hintUsed, date: today };
      localStorage.setItem(SAVE_KEY, encrypt(state));
    }
  }, [tiles, score, reached2048, hintUsed, today, gameOver]);

  const move = useCallback((direction: "up" | "down" | "left" | "right") => {
    if (gameOver || isMoving) return;

    let hasMoved = false;
    let scoreGain = 0;
    let newlyHit2048 = false;
    const nextTiles: Tile[] = [];
    const mergedIds = new Set<string>();

    const isVertical = direction === "up" || direction === "down";
    const isReverse = direction === "down" || direction === "right";

    for (let i = 0; i < GRID_SIZE; i++) {
      let line = tiles.filter(t => (isVertical ? t.x === i : t.y === i));
      line.sort((a, b) => (isVertical ? a.y - b.y : a.x - b.x));
      if (isReverse) line.reverse();

      const processedLine: Tile[] = [];
      for (let j = 0; j < line.length; j++) {
        const current = { ...line[j] };
        if (processedLine.length > 0) {
          const last = processedLine[processedLine.length - 1];
          if (last.value === current.value && !mergedIds.has(last.id)) {
            processedLine[processedLine.length - 1] = { ...last, value: last.value * 2 };
            mergedIds.add(last.id);
            scoreGain += last.value * 2;
            if (last.value * 2 === 2048) newlyHit2048 = true;
            hasMoved = true;
            continue;
          }
        }
        processedLine.push(current);
      }

      processedLine.forEach((tile, idx) => {
        const newPos = isReverse ? GRID_SIZE - 1 - idx : idx;
        const oldPos = isVertical ? tile.y : tile.x;
        if (oldPos !== newPos) hasMoved = true;
        nextTiles.push({ ...tile, [isVertical ? "y" : "x"]: newPos });
      });
    }

    if (!hasMoved) return;

    const occupied = new Set(nextTiles.map(t => `${t.x},${t.y}`));
    const empty = [];
    for (let x = 0; x < 4; x++) {
      for (let y = 0; y < 4; y++) {
        if (!occupied.has(`${x},${y}`)) empty.push({ x, y });
      }
    }
    if (empty.length > 0) {
      const pos = empty[Math.floor(Math.random() * empty.length)];
      nextTiles.push({ id: generateId(), value: Math.random() < 0.9 ? 2 : 4, x: pos.x, y: pos.y });
    }

    setIsMoving(true);
    const newScore = score + scoreGain;
    setScore(newScore);
    setTiles(nextTiles);

    if (newlyHit2048 && !reached2048) {
      setReached2048(true);
      const todayKST = new Date().toISOString().split('T')[0];
      const alreadyRewarded = myScore?.last_reward_date === todayKST;
      if (!alreadyRewarded) {
        setWin(true);
        recordResult.mutate({ score: newScore, reachedTarget: true });
      } else {
        recordResult.mutate({ score: newScore, reachedTarget: false });
      }
    }

    const isGameOver = nextTiles.length === 16 && !nextTiles.some(t => {
      return nextTiles.some(n => n.value === t.value && ((Math.abs(n.x - t.x) === 1 && n.y === t.y) || (Math.abs(n.y - t.y) === 1 && n.x === t.x)));
    });

    if (isGameOver) {
      setGameOver(true);
      localStorage.removeItem(SAVE_KEY);
      recordResult.mutate({ score: newScore, reachedTarget: reached2048 || newlyHit2048 });
    }

    setTimeout(() => setIsMoving(false), 150);
  }, [tiles, score, gameOver, isMoving, reached2048, recordResult, myScore, today]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const keys: Record<string, "up" | "down" | "left" | "right"> = {
        ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right"
      };
      if (keys[e.key]) {
        e.preventDefault();
        move(keys[e.key]);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [move]);

  const handleHintUse = () => {
    if (hintUsed) return;
    if (confirm("이번 게임의 유일한 힌트를 사용하시겠습니까? 1024 타일을 하나 생성합니다.")) {
      setTiles(prev => {
        const occupied = new Set(prev.map(t => `${t.x},${t.y}`));
        const empty = [];
        for (let x = 0; x < 4; x++) {
          for (let y = 0; y < 4; y++) {
            if (!occupied.has(`${x},${y}`)) empty.push({ x, y });
          }
        }
        if (empty.length === 0) {
          alert("빈 공간이 없어 힌트를 사용할 수 없습니다!");
          return prev;
        }
        const pos = empty[Math.floor(Math.random() * empty.length)];
        setHintUsed(true);
        return [...prev, { id: generateId(), value: 1024, x: pos.x, y: pos.y }];
      });
    }
  };

  const handleRestart = () => {
    if (confirm("현재 진행 중인 게임을 초기화하고 새 게임을 시작할까요?")) {
      initGame(true);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };

    const dx = touchEnd.x - touchStart.x;
    const dy = touchEnd.y - touchStart.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) > 30) {
      if (absDx > absDy) {
        move(dx > 0 ? "right" : "left");
      } else {
        move(dy > 0 ? "down" : "up");
      }
    }

    setTouchStart(null);
  };

  return (
    <div className="flex-1 bg-gray-50/30 flex flex-col relative lg:h-full lg:overflow-hidden overflow-y-auto custom-scrollbar pb-24 lg:pb-0">
      <div className="w-full max-w-[1600px] mx-auto px-4 py-6 lg:py-10 lg:h-full lg:flex lg:flex-col">
        
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-3 bg-white border border-rose-100 rounded-2xl text-gray-400 hover:text-rose-500 shadow-sm transition-all active:scale-95">
              <ChevronLeft size={24} />
            </button>
            <div>
              <h2 className="text-xl lg:text-2xl font-black text-gray-900 tracking-tight">2048 Challenge</h2>
              <p className="text-gray-400 text-xs font-medium">타일을 합쳐서 2048을 완성하세요!</p>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-2">
            <div className="bg-white border border-rose-50 px-4 py-2 rounded-2xl shadow-sm text-center">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Current Score</p>
              <p className="text-lg font-black text-rose-500 leading-none mt-1">{score}</p>
            </div>
            <div className="bg-rose-500 px-4 py-2 rounded-2xl shadow-md text-center border border-rose-400">
              <p className="text-[10px] text-rose-100 font-black uppercase tracking-widest">High Score</p>
              <p className="text-lg font-black text-white leading-none mt-1">{Math.max(score, bestScore)}</p>
            </div>
          </div>
        </div>

        {/* Layout Split like Calendar.tsx */}
        <div className="flex flex-col lg:flex-row gap-10 items-start lg:flex-1 lg:min-h-0 mt-2">
          
          {/* Main Content (Left): Game Board Area */}
          <div className="w-full lg:flex-1 flex flex-col items-center justify-center lg:h-full">
            {/* Mobile Header Overlay: Rewards (Left) & Actions/Scores (Right) */}
            <div className="flex sm:hidden items-center justify-between w-full max-w-[340px] md:max-w-[380px] mb-4 px-2">
              {/* Left: Reward Status with Avatars */}
              <div className="flex items-center gap-2.5">
                <div className={`relative w-9 h-9 rounded-full border-2 transition-all ${isMeRewarded ? 'border-rose-500 bg-rose-50' : 'border-gray-200 bg-white'}`}>
                  {myProfile?.avatar_url ? (
                    <img src={myProfile.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-400">
                      {myProfile?.nickname?.slice(0, 1)}
                    </div>
                  )}
                  {isMeRewarded && (
                    <div className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 shadow-sm">
                      <Star size={8} fill="currentColor" />
                    </div>
                  )}
                </div>
                <div className={`relative w-9 h-9 rounded-full border-2 transition-all ${isPartnerRewarded ? 'border-rose-500 bg-rose-50' : 'border-gray-200 bg-white'}`}>
                  {partnerProfile?.avatar_url ? (
                    <img src={partnerProfile.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-gray-400">
                      {partnerProfile?.nickname?.slice(0, 1) || "P"}
                    </div>
                  )}
                  {isPartnerRewarded && (
                    <div className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-0.5 shadow-sm">
                      <Star size={8} fill="currentColor" />
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Actions and Compact Scores */}
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5 mr-1">
                  <button onClick={handleRestart} className="p-2 bg-gray-900 text-white rounded-xl shadow-sm active:scale-95 transition-all">
                    <RotateCcw size={16} />
                  </button>
                  <button 
                    onClick={handleHintUse} 
                    disabled={hintUsed} 
                    className={`p-2 rounded-xl shadow-sm active:scale-95 transition-all ${hintUsed ? 'bg-gray-100 text-gray-300 grayscale cursor-not-allowed' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'}`}
                  >
                    <Lightbulb size={16} />
                  </button>
                </div>
                <div className="flex flex-col items-end leading-tight">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Score</span>
                    <span className="text-base font-black text-rose-500">{score.toLocaleString()}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Best</span>
                    <span className="text-sm font-black text-gray-700">{Math.max(score, bestScore).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div 
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="relative p-3 bg-rose-100/20 rounded-[42px] border-[6px] border-white shadow-2xl w-full max-w-[340px] md:max-w-[380px] aspect-square overflow-hidden group touch-none"
            >
              <div className="grid grid-cols-4 grid-rows-4 gap-2.5 w-full h-full">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="bg-white/40 rounded-[22px] border border-white/20" />
                ))}
              </div>
              <div className="absolute inset-3 pointer-events-none">
                <AnimatePresence>
                  {tiles.map(tile => (
                    <motion.div
                      key={tile.id}
                      layout
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1, left: `${tile.x * 25}%`, top: `${tile.y * 25}%` }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 40, mass: 1 }}
                      className="absolute w-1/4 h-1/4 p-1"
                    >
                      <div className={`w-full h-full rounded-[20px] md:rounded-[24px] flex items-center justify-center font-black text-xl md:text-2xl border-2 border-white/50 shadow-sm ${
                        tile.value <= 4 ? "bg-white text-rose-400" :
                        tile.value <= 16 ? "bg-rose-100 text-rose-600" :
                        tile.value <= 64 ? "bg-rose-300 text-white" :
                        tile.value <= 256 ? "bg-rose-500 text-white shadow-lg shadow-rose-200" :
                        tile.value <= 1024 ? "bg-rose-700 text-white" : "bg-amber-400 text-white shadow-xl shadow-amber-200"
                      }`}>
                        {tile.value}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              
              <AnimatePresence>
                {(gameOver || win) && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-20 bg-rose-900/40 backdrop-blur-md rounded-[32px] flex items-center justify-center p-6 text-center">
                    <div className="bg-white rounded-[40px] p-8 md:p-10 shadow-2xl w-full max-w-[280px] border border-white/50">
                      {win ? (
                        <>
                          <div className="w-14 h-14 bg-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner"><Star className="text-amber-500" size={28} fill="currentColor" /></div>
                          <h2 className="text-xl font-black text-gray-900 mb-1">성공! ✨</h2>
                          <p className="text-gray-500 text-xs mb-8">100 포인트가 적립되었습니다.</p>
                          <button onClick={() => setWin(false)} className="w-full bg-rose-500 text-white py-4 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all">계속하기</button>
                        </>
                      ) : (
                        <>
                          <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner"><Trophy className="text-rose-500" size={28} /></div>
                          <h2 className="text-xl font-black text-gray-900 mb-1">Game Over</h2>
                          <p className="text-gray-500 text-xs mb-8">최종 점수: {score}</p>
                          <button onClick={() => initGame(true)} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all">다시 도전</button>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Sidebar Area (Right - PC Only Style) */}
          <div className="w-full lg:w-[380px] shrink-0 lg:h-full flex flex-col gap-6">
            
            {/* Status & Dashboard Card */}
            <div className="hidden lg:block bg-white border border-gray-100 rounded-[32px] p-8 shadow-sm">
              <div className="space-y-4 mb-8">
                <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isMeRewarded ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden">
                      {myProfile?.avatar_url ? <img src={myProfile.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={14} />}
                    </div>
                    <span className="text-xs font-black truncate max-w-[100px]">{myProfile?.nickname || "나"}</span>
                  </div>
                  {isMeRewarded ? <Star size={14} fill="currentColor" /> : <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">도전 가능</span>}
                </div>

                <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isPartnerRewarded ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm overflow-hidden">
                      {partnerProfile?.avatar_url ? <img src={partnerProfile.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={14} />}
                    </div>
                    <span className="text-xs font-black truncate max-w-[100px]">{partnerProfile?.nickname || "상대방"}</span>
                  </div>
                  {isPartnerRewarded ? <Star size={14} fill="currentColor" /> : <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">도전 가능</span>}
                </div>
              </div>

              {/* Action Buttons (PC) */}
              <div className="flex gap-3">
                <button onClick={handleRestart} className="flex-1 bg-gray-900 text-white py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
                  <RotateCcw size={14} /> Restart
                </button>
                <button onClick={handleHintUse} disabled={hintUsed} className={`flex-1 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 ${hintUsed ? 'bg-gray-100 text-gray-300 grayscale cursor-not-allowed' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'}`}>
                  <Lightbulb size={14} /> Hint
                </button>
              </div>
            </div>

            {/* Quick Tips Panel */}
            <div className="bg-gray-50/50 rounded-[32px] p-8 border border-gray-100">
              <div className="flex items-center gap-2 text-gray-400 font-black text-[10px] uppercase tracking-widest mb-4">
                <Info size={14} /> How to play
              </div>
              <ul className="space-y-3">
                <li className="text-[11px] text-gray-400 font-medium leading-relaxed flex gap-2">
                  <span className="w-1 h-1 bg-gray-300 rounded-full mt-1.5 shrink-0" />
                  키보드 방향키 또는 스와이프로 타일을 이동시키세요.
                </li>
                <li className="text-[11px] text-gray-400 font-medium leading-relaxed flex gap-2">
                  <span className="w-1 h-1 bg-gray-300 rounded-full mt-1.5 shrink-0" />
                  똑같은 숫자가 만나면 하나로 합쳐져 두 배가 됩니다.
                </li>
                <li className="text-[11px] text-gray-400 font-medium leading-relaxed flex gap-2">
                  <span className="w-1 h-1 bg-gray-300 rounded-full mt-1.5 shrink-0" />
                  2048을 만들면 즉시 100 포인트를 드립니다!
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
