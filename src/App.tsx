import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { CoupleProvider } from "./context/CoupleContext";
import { CouplePointsProvider } from "./context/CouplePointsContext";
import { SchedulesProvider } from "./context/SchedulesContext";
import { PlacesProvider } from "./context/PlacesContext";
import { HomeProvider } from "./context/HomeContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";

// 탭/메뉴 클릭 시에만 로드되도록 Code Splitting (지연 로딩) 적용
const Home = lazy(() => import("./pages/Home"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const Places = lazy(() => import("./pages/Places"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Games = lazy(() => import("./pages/Games"));
import ProtectedRoute from "./components/auth/ProtectedRoute";
import BottomNav from "./components/layout/BottomNav";

import UpdateNotification from "./components/common/UpdateNotification";
import { GlobalErrorBoundary } from "./components/common/GlobalErrorBoundary";
import NotificationPermissionPopup from "./components/common/NotificationPermissionPopup";
import ChangelogModal from "./components/common/ChangelogModal";
import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "./context/ToastContext";
import { ConfirmProvider } from "./context/ConfirmContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [showChangelog, setShowChangelog] = useState(false);

  useEffect(() => {
    // Check if we should show the changelog
    const currentVersion = localStorage.getItem("app_version");
    const lastSeenVersion = localStorage.getItem("last_seen_changelog_version");

    if (currentVersion && lastSeenVersion !== currentVersion) {
      setShowChangelog(true);
      localStorage.setItem("last_seen_changelog_version", currentVersion);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConfirmProvider>
          <CoupleProvider>
            <NotificationsProvider>
              <CouplePointsProvider>
                <HomeProvider>
                  <div className="fixed inset-0 w-full h-full bg-gray-50 flex justify-center items-center md:py-8 overflow-hidden">
                    <div id="app-container" className="w-full h-full md:max-w-5xl md:h-[90vh] bg-white md:rounded-[32px] md:shadow-2xl md:border-8 md:border-white overflow-hidden relative flex flex-col">
                      <Router>
                        <div className="flex-1 relative overflow-hidden flex flex-col min-h-0">
                          <GlobalErrorBoundary>
                            <Suspense fallback={
                              <div className="w-full h-full flex items-center justify-center bg-[#FDFBF7]">
                                <Loader2 className="animate-spin text-rose-400" size={32} />
                              </div>
                            }>
                              <Routes>
                                <Route path="/login" element={<Auth />} />

                                <Route element={<ProtectedRoute />}>
                                  <Route
                                    path="/"
                                    element={<Navigate to="/home" replace />}
                                  />
                                  <Route path="/home" element={<Home />} />
                                  <Route
                                    path="/calendar"
                                    element={
                                      <SchedulesProvider>
                                        <Calendar />
                                      </SchedulesProvider>
                                    }
                                  />
                                  <Route path="/games" element={<Games />} />
                                  <Route
                                    path="/places"
                                    element={
                                      <PlacesProvider>
                                        <Places />
                                      </PlacesProvider>
                                    }
                                  />
                                  <Route path="/profile" element={<Profile />} />
                                  <Route path="/settings" element={<Settings />} />
                                  <Route
                                    path="/onboarding"
                                    element={<Onboarding />}
                                  />
                                  <Route
                                    path="*"
                                    element={<Navigate to="/home" replace />}
                                  />
                                </Route>
                              </Routes>
                            </Suspense>
                          </GlobalErrorBoundary>
                        </div>

                        <UpdateNotification />

                        <ChangelogModal
                          isOpen={showChangelog}
                          onClose={() => setShowChangelog(false)}
                        />

                        <BottomNav />
                        <NotificationPermissionPopup />
                      </Router>
                    </div>
                  </div>
                </HomeProvider>
              </CouplePointsProvider>
            </NotificationsProvider>
          </CoupleProvider>
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
