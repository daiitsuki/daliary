import { useNavigate, useLocation } from "react-router-dom";
import { Home, Settings, Map, Calendar, Gamepad2 } from "lucide-react";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // 글쓰기 페이지 등에서는 네비게이션 숨기기
  if (
    location.pathname === "/write" ||
    location.pathname === "/login" ||
    location.pathname === "/onboarding"
  ) {
    return null;
  }

            return (

              <nav className="absolute bottom-4 left-1/2 -translate-x-1/2 w-fit bg-gradient-to-b from-white/40 to-white/10 backdrop-blur-[32px] border border-white/50 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1),0_1px_2px_rgba(255,255,255,0.5)_inset] p-1 md:p-1.5 flex items-center gap-1 md:gap-4 z-40 transition-all duration-700 hover:from-white/50 hover:to-white/20">

                <button

                  onClick={() => navigate("/")}

                  className={`relative flex flex-col items-center px-4 py-1.5 md:px-5 md:py-2.5 rounded-full transition-all duration-500 ${

                    isActive("/") || isActive("/home") 

                      ? "text-rose-500 bg-white/40 shadow-[0_2px_10px_rgba(0,0,0,0.05),0_1px_0_rgba(255,255,255,0.8)_inset] scale-110" 

                      : "text-gray-500 hover:text-gray-800 hover:bg-white/20 hover:scale-105"

                  }`}

                >

                  <Home size={20} className="md:w-7 md:h-7" strokeWidth={isActive("/") || isActive("/home") ? 2.5 : 2} />

                  <span className="text-[9px] mt-0.5 font-bold tracking-tight md:hidden">홈</span>

                </button>

          

                <button

                  onClick={() => navigate("/calendar")}

                  className={`relative flex flex-col items-center px-4 py-1.5 md:px-5 md:py-2.5 rounded-full transition-all duration-500 ${

                    isActive("/calendar")

                      ? "text-rose-500 bg-white/40 shadow-[0_2px_10px_rgba(0,0,0,0.05),0_1px_0_rgba(255,255,255,0.8)_inset] scale-110"

                      : "text-gray-500 hover:text-gray-800 hover:bg-white/20 hover:scale-105"

                  }`}

                >

                  <Calendar size={20} className="md:w-7 md:h-7" strokeWidth={isActive("/calendar") ? 2.5 : 2} />

                  <span className="text-[9px] mt-0.5 font-bold tracking-tight md:hidden">일정</span>

                </button>

          

                <button

                  onClick={() => navigate("/games")}

                  className={`relative flex flex-col items-center px-4 py-1.5 md:px-5 md:py-2.5 rounded-full transition-all duration-500 ${

                    isActive("/games")

                      ? "text-rose-500 bg-white/40 shadow-[0_2px_10px_rgba(0,0,0,0.05),0_1px_0_rgba(255,255,255,0.8)_inset] scale-110"

                      : "text-gray-500 hover:text-gray-800 hover:bg-white/20 hover:scale-105"

                  }`}

                >

                  <Gamepad2 size={20} className="md:w-7 md:h-7" strokeWidth={isActive("/games") ? 2.5 : 2} />

                  <span className="text-[9px] mt-0.5 font-bold tracking-tight md:hidden">게임</span>

                </button>

          

                <button

                  onClick={() => navigate("/places")}

                  className={`relative flex flex-col items-center px-4 py-1.5 md:px-5 md:py-2.5 rounded-full transition-all duration-500 ${

                    isActive("/places")

                      ? "text-rose-500 bg-white/40 shadow-[0_2px_10px_rgba(0,0,0,0.05),0_1px_0_rgba(255,255,255,0.8)_inset] scale-110"

                      : "text-gray-500 hover:text-gray-800 hover:bg-white/20 hover:scale-105"

                  }`}

                >

                  <Map size={20} className="md:w-7 md:h-7" strokeWidth={isActive("/places") ? 2.5 : 2} />

                  <span className="text-[9px] mt-0.5 font-bold tracking-tight md:hidden">지도</span>

                </button>

          

                <button

                  onClick={() => navigate("/settings")}

                  className={`relative flex flex-col items-center px-4 py-1.5 md:px-5 md:py-2.5 rounded-full transition-all duration-500 ${

                    isActive("/settings")

                      ? "text-rose-500 bg-white/40 shadow-[0_2px_10px_rgba(0,0,0,0.05),0_1px_0_rgba(255,255,255,0.8)_inset] scale-110"

                      : "text-gray-500 hover:text-gray-800 hover:bg-white/20 hover:scale-105"

                  }`}

                >

                  <Settings size={20} className="md:w-7 md:h-7" strokeWidth={isActive("/settings") ? 2.5 : 2} />

                  <span className="text-[9px] mt-0.5 font-bold tracking-tight md:hidden">설정</span>

                </button>

              </nav>

            );

          }
