import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CoupleProvider } from './context/CoupleContext';
import { CouplePointsProvider } from './context/CouplePointsContext';
import { SchedulesProvider } from './context/SchedulesContext';
import { PlacesProvider } from './context/PlacesContext';
import { HomeProvider } from './context/HomeContext';
import { NotificationsProvider } from './context/NotificationsContext';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import Places from './pages/Places';
import Calendar from './pages/Calendar';
import Games from './pages/Games';
import ProtectedRoute from './components/ProtectedRoute';
import BottomNav from './components/BottomNav';

import UpdateNotification from './components/UpdateNotification';
import ChangelogModal from './components/ChangelogModal';
import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
    const currentVersion = localStorage.getItem('app_version');
    const lastSeenVersion = localStorage.getItem('last_seen_changelog_version');

    if (currentVersion && lastSeenVersion !== currentVersion) {
      setShowChangelog(true);
      localStorage.setItem('last_seen_changelog_version', currentVersion);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <CoupleProvider>
        <NotificationsProvider>
          <CouplePointsProvider>
            <SchedulesProvider>
              <PlacesProvider>
                <HomeProvider>
                  <div className="fixed inset-0 w-full h-full bg-gray-50 flex justify-center items-center md:py-8 overflow-hidden">
                    <div className="w-full h-full md:max-w-5xl md:h-[90vh] bg-white md:rounded-[32px] md:shadow-2xl md:border-8 md:border-white overflow-hidden relative flex flex-col">
                      <Router>
                        <div className="flex-1 relative overflow-hidden flex flex-col min-h-0">
                          <Routes>
                            <Route path="/login" element={<Auth />} />
                            
                            <Route element={<ProtectedRoute />}>
                              <Route path="/" element={<Navigate to="/home" replace />} />
                              <Route path="/home" element={<Home />} />
                              <Route path="/calendar" element={<Calendar />} />
                              <Route path="/games" element={<Games />} />
                              <Route path="/places" element={<Places />} />
                              <Route path="/settings" element={<Settings />} />
                              <Route path="/onboarding" element={<Onboarding />} />
                              <Route path="*" element={<Navigate to="/home" replace />} />
                            </Route>
                          </Routes>
                        </div>
                        
                        <UpdateNotification />
                        
                        <ChangelogModal 
                          isOpen={showChangelog} 
                          onClose={() => setShowChangelog(false)} 
                        />

                        <BottomNav />
                      </Router>
                    </div>
                  </div>
                </HomeProvider>
              </PlacesProvider>
            </SchedulesProvider>
          </CouplePointsProvider>
        </NotificationsProvider>
      </CoupleProvider>
    </QueryClientProvider>
  );
}

export default App;
