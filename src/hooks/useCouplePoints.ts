import { useCouplePointsContext } from '../context/CouplePointsContext';

export const useCouplePoints = () => {
  const { totalPoints, history, levelInfo, loading, refreshPoints } = useCouplePointsContext();
  
  return { 
    totalPoints, 
    history, 
    levelInfo, 
    loading, 
    refresh: refreshPoints 
  };
};