import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CoupleProvider } from './context/CoupleContext';
import { CouplePointsProvider } from './context/CouplePointsContext';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import Places from './pages/Places';
import Calendar from './pages/Calendar';
import ProtectedRoute from './components/ProtectedRoute';
import BottomNav from './components/BottomNav';

import UpdateNotification from './components/UpdateNotification';

function App() {
  return (
    <CoupleProvider>
      <CouplePointsProvider>
        <div className="relative w-full h-[100svh] bg-gray-50 flex justify-center items-center md:py-8 overflow-hidden">
          <div className="w-full h-full md:max-w-5xl md:h-[90vh] bg-white md:rounded-[32px] md:shadow-2xl md:border-8 md:border-white overflow-hidden relative flex flex-col">
            <Router>
              <div className="flex-1 relative overflow-hidden flex flex-col">
                <Routes>
                  <Route path="/login" element={<Auth />} />
                  
                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Navigate to="/home" replace />} />
                    <Route path="/home" element={<Home />} />
                    <Route path="/places" element={<Places />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                  </Route>
                </Routes>
              </div>
              
              <UpdateNotification />

              <div className="shrink-0">
                <BottomNav />
              </div>
            </Router>
          </div>
        </div>
      </CouplePointsProvider>
    </CoupleProvider>
  );
}

export default App;
