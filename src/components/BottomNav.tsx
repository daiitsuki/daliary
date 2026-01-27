import { useNavigate, useLocation } from "react-router-dom";
import { Home, BookHeart, Settings, Map } from "lucide-react";

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
    <nav className="relative bg-white/80 backdrop-blur-md border-t border-gray-100 px-6 py-2 pb-safe flex justify-around items-center z-40 md:py-4">
      <button
        onClick={() => navigate("/")}
        className={`flex flex-col items-center p-2 transition-all hover:scale-110 ${
          isActive("/") || isActive("/home") ? "text-rose-500" : "text-gray-300 hover:text-gray-500"
        }`}
      >
        <Home size={24} strokeWidth={isActive("/") || isActive("/home") ? 2.5 : 2} />
        <span className="text-[10px] mt-1 font-bold">홈</span>
      </button>

      <button
        onClick={() => navigate("/timeline")}
        className={`flex flex-col items-center p-2 transition-all hover:scale-110 ${
          isActive("/timeline")
            ? "text-rose-500"
            : "text-gray-300 hover:text-gray-500"
        }`}
      >
        <BookHeart size={24} strokeWidth={isActive("/timeline") ? 2.5 : 2} />
        <span className="text-[10px] mt-1 font-bold">타임라인</span>
      </button>

      <button
        onClick={() => navigate("/places")}
        className={`flex flex-col items-center p-2 transition-all hover:scale-110 ${
          isActive("/places")
            ? "text-rose-500"
            : "text-gray-300 hover:text-gray-500"
        }`}
      >
        <Map size={24} strokeWidth={isActive("/places") ? 2.5 : 2} />
        <span className="text-[10px] mt-1 font-bold">지도</span>
      </button>

      <button
        onClick={() => navigate("/settings")}
        className={`flex flex-col items-center p-2 transition-all hover:scale-110 ${
          isActive("/settings")
            ? "text-rose-500"
            : "text-gray-300 hover:text-gray-500"
        }`}
      >
        <Settings size={24} strokeWidth={isActive("/settings") ? 2.5 : 2} />
        <span className="text-[10px] mt-1 font-bold">설정</span>
      </button>
    </nav>
  );
}
