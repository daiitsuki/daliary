import { useCouplePointsContext } from '../context/CouplePointsContext';

export const useAttendance = () => {
  const { hasCheckedIn, loading, checkIn, refreshAttendance } = useCouplePointsContext();
  
  return { 
    hasCheckedIn, 
    loading, 
    checkIn, 
    refresh: refreshAttendance 
  };
};