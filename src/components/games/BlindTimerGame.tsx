import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Trophy, RotateCcw, ChevronLeft, AlertCircle, Play, Ticket } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCouplePoints } from "../../hooks/useCouplePoints";
import { useCouplePointsContext } from "../../context/CouplePointsContext";

interface BlindTimerGameProps {
  onBack: () => void;
}

type GameState = "idle" | "countdown" | "playing" | "result";

const FEVER_TEXTS = [
  "지금인가?",
  "지금일지도 몰라",
  "지금은 어때?",
  "한번 눌러볼까?",
  "두근 두근",
  "조금 더?",
  "아직이야!",
  "이제 눌러!",
  "침착해...",
  "집중해!"
];

const SAVE_KEY = "daliary_blind_timer_state_v1";
const ENCRYPTION_SALT = "dal_game_blind_timer";

export default function BlindTimerGame({ onBack }: BlindTimerGameProps) {
  const { items } = useCouplePointsContext();
  const { refreshItems } = useCouplePoints();
  const [gameState, setGameState] = useState<GameState>("idle");
  const [targetTime, setTargetTime] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [stoppedTime, setStoppedTime] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [retriesLeft, setRetriesLeft] = useState(3);
  const [countdown, setCountdown] = useState(3);
  const [loading, setLoading] = useState(false);
  const [feverTexts, setFeverTexts] = useState<{ id: number; text: string; x: number; y: number }[]>([]);
  const requestRef = useRef<number>(null);
  const feverIntervalRef = useRef<NodeJS.Timeout>(null);

  const ticketCount = items.find(i => i.item_type === 'blind_timer_ticket')?.quantity || 0;

  // Encryption helpers
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

  // Persistence: Load
  useEffect(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      const parsed = decrypt(saved);
      if (parsed && parsed.sessionId) {
        setSessionId(parsed.sessionId);
        setTargetTime(parsed.targetTime);
        setRetriesLeft(parsed.retriesLeft ?? 3);
        
        // If it was in result state, restore it immediately
        if (parsed.gameState === "result" && parsed.stoppedTime) {
          setStoppedTime(parsed.stoppedTime);
          setGameState("result");
        }
      }
    }
  }, []);

  // Persistence: Save
  useEffect(() => {
    if (sessionId) {
      const state = { 
        sessionId, 
        targetTime, 
        retriesLeft, 
        gameState, 
        stoppedTime: gameState === "result" ? stoppedTime : 0 
      };
      localStorage.setItem(SAVE_KEY, encrypt(state));
    }
  }, [sessionId, targetTime, retriesLeft, gameState, stoppedTime]);

  const clearSession = useCallback(() => {
    localStorage.removeItem(SAVE_KEY);
    setSessionId(null);
  }, []);

  const startGameSession = async () => {
    if (loading) return;
    
    // If we already have a session in state (resumed), just start the round
    if (sessionId) {
      // If we were in result state, we can't just "start", we must either retry or claim.
      // But since startGameSession is called from idle, and the idle screen has 
      // "이어서 도전하기" button, it should just trigger startRound if not in result.
      if (gameState === "idle") {
        startRound(targetTime);
      }
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('start_blind_timer_game');
      
      if (error) throw error;
      if (!data.success) {
        if (data.error === 'NO_TICKET') {
          alert("입장권이 부족합니다! 포인트 상점에서 구매해주세요.");
        } else {
          alert("게임을 시작할 수 없습니다.");
        }
        return;
      }

      setSessionId(data.session_id);
      setTargetTime(data.target_time);
      setRetriesLeft(3);
      if (typeof refreshItems === 'function') {
        await refreshItems(); 
      }
      startRound(data.target_time);
    } catch (err) {
      console.error(err);
      alert("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const startRound = (serverTarget?: number) => {
    if (serverTarget) setTargetTime(serverTarget);
    setGameState("countdown");
    setCountdown(3);
    setCurrentTime(0);
    setStoppedTime(0);
    setFeverTexts([]);
  };

  useEffect(() => {
    if (gameState === "countdown") {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        handleRoundStart();
      }
    }
  }, [gameState, countdown]);

  const handleRoundStart = async () => {
    if (sessionId) {
        await supabase.rpc('record_blind_timer_start', { p_session_id: sessionId });
    }
    setGameState("playing");
    setStartTime(performance.now());
  };

  useEffect(() => {
    if (gameState === "playing") {
      const animate = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        setCurrentTime(elapsed);
        requestRef.current = requestAnimationFrame(animate);
      };
      requestRef.current = requestAnimationFrame(animate);

      // Fever Mode: Random intervals after 10 seconds
      const spawnFeverText = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        
        if (elapsed > 10) {
          const text = FEVER_TEXTS[Math.floor(Math.random() * FEVER_TEXTS.length)];
          setFeverTexts(prev => [
            ...prev.slice(-2),
            { 
              id: Date.now(), 
              text, 
              x: Math.random() * 70 + 15, 
              y: Math.random() * 50 + 25 
            }
          ]);
        }

        const nextDelay = Math.random() * 1500 + 1000; // 1s to 2.5s
        feverIntervalRef.current = setTimeout(spawnFeverText, nextDelay);
      };

      feverIntervalRef.current = setTimeout(spawnFeverText, 1000);

      return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        if (feverIntervalRef.current) clearTimeout(feverIntervalRef.current);
      };
    }
  }, [gameState, startTime]);

  const handleStop = async () => {
    if (gameState !== "playing") return;
    
    const end = performance.now();
    const elapsed = (end - startTime) / 1000;
    
    // Record stop time on server immediately for verification
    if (sessionId) {
        await supabase.rpc('record_blind_timer_stop', { p_session_id: sessionId });
    }

    setStoppedTime(elapsed);
    setGameState("result");
  };

  const handleRetry = () => {
    if (retriesLeft <= 0) return;

    // Check for high reward confirmation
    const diff = stoppedTime - targetTime;
    const info = getResultInfo(diff);
    const isHighReward = ["GREAT", "GOOD"].includes(info.rank);

    if (isHighReward) {
      const confirmRetry = window.confirm(
        `현재 상당히 높은 점수(${info.rank})를 기록하셨어요!\n다시 시도하면 이 점수는 사라집니다. 정말 다시 하시겠어요?`
      );
      if (!confirmRetry) return;
    }

    setRetriesLeft(prev => prev - 1);
    startRound();
  };

  const handleClaim = async () => {
    if (!sessionId || loading) return;

    // Check for low reward confirmation
    const diff = stoppedTime - targetTime;
    const info = getResultInfo(diff);
    const isLowReward = ["NORMAL", "BAD", "FAIL"].includes(info.rank);

    if (isLowReward && retriesLeft > 0) {
      const confirmClaim = window.confirm(
        `아직 재도전 기회가 ${retriesLeft}회 남아있습니다!\n정말 이대로 포인트를 받으시겠어요?`
      );
      if (!confirmClaim) return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('claim_blind_timer_reward', {
        p_session_id: sessionId,
        p_diff_seconds: diff
      });

      if (error) throw error;
      if (!data.success) {
        alert("보상을 수령할 수 없습니다: " + data.error);
        clearSession();
        return;
      }

      alert(`${data.rank}! ${data.reward}포인트를 획득했습니다.`);
      clearSession();
      onBack();
    } catch (err) {
      console.error(err);
      alert("오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getResultInfo = (diff: number) => {
    const absDiff = Math.abs(diff);
    if (absDiff < 0.005) return { rank: "PERFECT", color: "text-rose-500", reward: 500, message: "신이 내린 타이밍!" };
    if (absDiff <= 0.05) return { rank: "GREAT", color: "text-amber-500", reward: 300, message: "엄청난 감각이에요!" };
    if (absDiff <= 0.20) return { rank: "GOOD", color: "text-blue-500", reward: 150, message: "나쁘지 않아요!" };
    if (absDiff <= 0.50) return { rank: "NORMAL", color: "text-green-500", reward: 100, message: "조금만 더 집중해봐요." };
    if (absDiff <= 1.00) return { rank: "BAD", color: "text-gray-500", reward: 50, message: "아쉬워요..." };
    return { rank: "FAIL", color: "text-gray-400", reward: 0, message: "너무 많이 벗어났어요." };
  };

  const resultInfo = gameState === "result" ? getResultInfo(stoppedTime - targetTime) : null;

  return (
    <div className="flex-1 bg-gray-50/30 flex flex-col relative h-full overflow-hidden">
        <div className="px-4 py-4 flex items-center justify-between bg-white/50 backdrop-blur-sm border-b border-gray-100 z-10">
          <button onClick={onBack} className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-400">
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 bg-violet-50 px-3 py-1.5 rounded-full border border-violet-100">
            <Ticket size={12} className="text-violet-500" />
            <span className="text-xs font-black text-violet-500">보유 입장권: {ticketCount}개</span>
          </div>
        </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-200/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-200/20 rounded-full blur-[100px]" />
        </div>

        {gameState === "idle" && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-sm bg-white rounded-[32px] p-8 shadow-xl border border-gray-100 text-center"
          >
            <div className="w-20 h-20 bg-violet-50 rounded-[28px] flex items-center justify-center mx-auto mb-6 shadow-inner text-violet-500">
              <Timer size={40} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2">블라인드 타이머</h1>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              사라지는 타이머를 보고<br/>목표 시간(15~20초)에 정확히 멈추세요!
            </p>

            {sessionId && (
              <div className="mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3 text-left">
                <div className="bg-white p-2 rounded-xl shadow-sm text-amber-500">
                  <RotateCcw size={16} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-amber-600 uppercase tracking-widest">Resuming Session</p>
                  <p className="text-[13px] font-bold text-gray-800">
                    이전 게임이 진행 중입니다.
                  </p>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-2xl p-4 mb-8 text-left space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 font-medium">참가 방법</span>
                <span className="font-bold text-gray-900">{sessionId ? "세션 유지됨" : "전용 입장권 1매"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 font-medium">최대 보상</span>
                <span className="font-bold text-rose-500">500 P</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-400 font-medium">재도전 기회</span>
                <span className="font-bold text-gray-900">{retriesLeft}회</span>
              </div>
            </div>

            <button
              onClick={startGameSession}
              disabled={loading || (!sessionId && ticketCount <= 0)}
              className={`w-full py-4 rounded-2xl font-black text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
                !sessionId && ticketCount <= 0 
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-violet-500 text-white shadow-violet-200 hover:bg-violet-600"
              }`}
            >
              {loading ? "준비 중..." : (
                <>
                  <Play size={16} fill="currentColor" />
                  {sessionId ? "이어서 도전하기" : "게임 시작 (입장권 사용)"}
                </>
              )}
            </button>
            {!sessionId && ticketCount <= 0 && (
                <p className="text-[10px] text-rose-500 mt-3 font-medium flex items-center justify-center gap-1">
                    <AlertCircle size={10} /> 입장권이 부족합니다 (상점에서 구매 가능)
                </p>
            )}
          </motion.div>
        )}

        {gameState === "countdown" && (
          <div className="text-center">
            <motion.div
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="text-8xl font-black text-violet-500"
            >
              {countdown}
            </motion.div>
          </div>
        )}

        {gameState === "playing" && (
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            {/* Target Time - Updated Instruction */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center mb-16"
            >
                <div className="bg-white/80 backdrop-blur-md px-8 py-4 rounded-3xl border border-violet-100 shadow-xl shadow-violet-50">
                  <p className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
                    <span className="text-violet-600 font-black">{targetTime}초</span> 후에 <br className="md:hidden" />
                    STOP 버튼을 클릭하세요!
                  </p>
                </div>
            </motion.div>

            {/* Current Time - Fades Out from 10s to 12s and gets hidden from DOM */}
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 2, delay: 10 }}
              className="text-center mb-20"
            >
                <p className="text-4xl font-bold text-violet-500 font-mono">
                    {currentTime < 12 ? `${currentTime.toFixed(2)}s` : "??.??s"}
                </p>
            </motion.div>

            <AnimatePresence>
                {feverTexts.map((item) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        className="absolute font-black text-gray-900/10 text-xl md:text-3xl pointer-events-none whitespace-nowrap"
                        style={{ left: `${item.x}%`, top: `${item.y}%` }}
                    >
                        {item.text}
                    </motion.div>
                ))}
            </AnimatePresence>

            <button
                onClick={handleStop}
                className="w-32 h-32 rounded-full bg-violet-600 text-white font-black text-2xl shadow-2xl shadow-violet-200 active:scale-90 transition-all z-20 flex flex-col items-center justify-center border-8 border-violet-400 ring-8 ring-violet-100"
            >
                STOP
            </button>
          </div>
        )}

        {gameState === "result" && resultInfo && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-sm bg-white rounded-[32px] p-8 shadow-xl border border-gray-100 text-center"
            >
                <div className="mb-8">
                    <p className={`text-4xl font-black ${resultInfo.color} mb-2`}>{resultInfo.rank}</p>
                    <p className="text-gray-400 text-xs font-medium">{resultInfo.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-50 p-4 rounded-2xl">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">Target</p>
                        <p className="text-xl font-black text-gray-900">{targetTime.toFixed(2)}s</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl">
                        <p className="text-[10px] text-gray-400 font-bold uppercase">You</p>
                        <p className={`text-xl font-black ${Math.abs(stoppedTime - targetTime) <= 0.05 ? 'text-rose-500' : 'text-gray-900'}`}>
                            {stoppedTime.toFixed(2)}s
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2 mb-8 bg-amber-50 p-3 rounded-xl border border-amber-100">
                    <Trophy size={16} className="text-amber-500" />
                    <span className="text-sm font-bold text-amber-700">보상: {resultInfo.reward} P</span>
                </div>

                <div className="flex flex-col gap-3">
                    {/* High Rewards or No Retries Left: Emphasize Claim */}
                    {(resultInfo.rank === "PERFECT" || resultInfo.rank === "GREAT" || resultInfo.rank === "GOOD" || retriesLeft <= 0) ? (
                        <>
                            <button
                                onClick={handleClaim}
                                disabled={loading}
                                className="w-full bg-violet-500 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-violet-100 active:scale-95 transition-all"
                            >
                                포인트 받기
                            </button>
                            {resultInfo.rank !== "PERFECT" && retriesLeft > 0 && (
                                <button
                                    onClick={handleRetry}
                                    disabled={loading}
                                    className="w-full bg-white border border-gray-200 text-gray-500 py-4 rounded-2xl font-black text-sm shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-gray-50"
                                >
                                    <RotateCcw size={14} />
                                    다시 시도 ({retriesLeft}회 남음)
                                </button>
                            )}
                        </>
                    ) : (
                        /* Low Rewards: Emphasize Retry */
                        <>
                            <button
                                onClick={handleRetry}
                                disabled={loading}
                                className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-amber-100 active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-amber-600"
                            >
                                <RotateCcw size={14} />
                                다시 시도 ({retriesLeft}회 남음)
                            </button>
                            <button
                                onClick={handleClaim}
                                disabled={loading}
                                className="w-full bg-white border border-gray-200 text-gray-400 py-4 rounded-2xl font-black text-sm shadow-sm active:scale-95 transition-all"
                            >
                                포인트 받기
                            </button>
                        </>
                    )}
                </div>
            </motion.div>
        )}
      </div>
    </div>
  );
}
