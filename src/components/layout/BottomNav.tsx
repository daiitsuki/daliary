import { useNavigate, useLocation } from "react-router-dom";
import { Home, Map, Calendar, Gamepad2, User } from "lucide-react";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleNav = (path: string) => {
    // If we're already on Home, don't navigate again
    if (path === "/" && (location.pathname === "/" || location.pathname === "/home")) {
      return;
    }
    // If we're already on the targeted pathname, don't navigate again
    if (location.pathname === path) {
      return;
    }
    navigate(path);
  };

  // 글쓰기 페이지 등에서는 네비게이션 숨기기
  if (
    location.pathname === "/write" ||
    location.pathname === "/login" ||
    location.pathname === "/onboarding"
  ) {
    return null;
  }

  return (
    <nav className="absolute bottom-6 md:bottom-4 left-1/2 -translate-x-1/2 w-fit bg-gradient-to-b from-white/40 to-white/10 backdrop-blur-[32px] border border-white/50 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1),0_1px_2px_rgba(255,255,255,0.5)_inset] p-1 md:p-1 flex items-center gap-1.5 md:gap-4 z-40 transition-all duration-300 hover:from-white/50 hover:to-white/20">
      <button
        onClick={() => handleNav("/")}
        className={`relative flex flex-col items-center justify-center px-4 py-1 md:px-5 md:py-1 rounded-full transition-all duration-200 gap-0.5 ${
          isActive("/") || isActive("/home")
            ? "text-rose-500 bg-white/40 shadow-[0_2px_10px_rgba(0,0,0,0.05),0_1px_0_rgba(255,255,255,0.8)_inset] scale-110"
            : "text-gray-500 hover:text-gray-800 hover:bg-white/20 hover:scale-105"
        }`}
      >
        <Home
          className="w-5 h-5 md:w-6 md:h-6"
          strokeWidth={isActive("/") || isActive("/home") ? 2.5 : 2}
        />
        <span className={`text-[10px] md:text-[11px] tracking-tight ${isActive("/") || isActive("/home") ? "font-bold" : "font-normal"}`}>홈</span>
      </button>

      <button
        onClick={() => handleNav("/calendar")}
        className={`relative flex flex-col items-center justify-center px-4 py-1 md:px-5 md:py-1 rounded-full transition-all duration-200 gap-0.5 ${
          isActive("/calendar")
            ? "text-rose-500 bg-white/40 shadow-[0_2px_10px_rgba(0,0,0,0.05),0_1px_0_rgba(255,255,255,0.8)_inset] scale-110"
            : "text-gray-500 hover:text-gray-800 hover:bg-white/20 hover:scale-105"
        }`}
      >
        <Calendar
          className="w-5 h-5 md:w-6 md:h-6"
          strokeWidth={isActive("/calendar") ? 2.5 : 2}
        />
        <span className={`text-[10px] md:text-[11px] tracking-tight ${isActive("/calendar") ? "font-bold" : "font-normal"}`}>달력</span>
      </button>

      <button
        onClick={() => handleNav("/games")}
        className={`relative flex flex-col items-center justify-center px-4 py-1 md:px-5 md:py-1 rounded-full transition-all duration-200 gap-0.5 ${
          isActive("/games")
            ? "text-rose-500 bg-white/40 shadow-[0_2px_10px_rgba(0,0,0,0.05),0_1px_0_rgba(255,255,255,0.8)_inset] scale-110"
            : "text-gray-500 hover:text-gray-800 hover:bg-white/20 hover:scale-105"
        }`}
      >
        <Gamepad2
          className="w-5 h-5 md:w-6 md:h-6"
          strokeWidth={isActive("/games") ? 2.5 : 2}
        />
        <span className={`text-[10px] md:text-[11px] tracking-tight ${isActive("/games") ? "font-bold" : "font-normal"}`}>게임</span>
      </button>

      <button
        onClick={() => handleNav("/places")}
        className={`relative flex flex-col items-center justify-center px-4 py-1 md:px-5 md:py-1 rounded-full transition-all duration-200 gap-0.5 ${
          isActive("/places")
            ? "text-rose-500 bg-white/40 shadow-[0_2px_10px_rgba(0,0,0,0.05),0_1px_0_rgba(255,255,255,0.8)_inset] scale-110"
            : "text-gray-500 hover:text-gray-800 hover:bg-white/20 hover:scale-105"
        }`}
      >
        <Map
          className="w-5 h-5 md:w-6 md:h-6"
          strokeWidth={isActive("/places") ? 2.5 : 2}
        />
        <span className={`text-[10px] md:text-[11px] tracking-tight ${isActive("/places") ? "font-bold" : "font-normal"}`}>지도</span>
      </button>

      <button
        onClick={() => handleNav("/profile")}
        className={`relative flex flex-col items-center justify-center px-3.5 py-1 md:px-5 md:py-1 rounded-full transition-all duration-200 gap-0.5 ${
          isActive("/profile")
            ? "text-rose-500 bg-white/40 shadow-[0_2px_10px_rgba(0,0,0,0.05),0_1px_0_rgba(255,255,255,0.8)_inset] scale-110"
            : "text-gray-500 hover:text-gray-800 hover:bg-white/20 hover:scale-105"
        }`}
      >
        <User
          className="w-5 h-5 md:w-6 md:h-6"
          strokeWidth={isActive("/profile") ? 2.5 : 2}
        />
        <span className={`text-[10px] md:text-[11px] tracking-tight whitespace-nowrap ${isActive("/profile") ? "font-bold" : "font-normal"}`}>내 정보</span>
      </button>
    </nav>
  );
}
