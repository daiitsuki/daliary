import { useCouplePointsContext } from '../context/CouplePointsContext';

export const useCouplePoints = () => {
  const { totalPoints, currentPoints, history, levelInfo, loading, refreshPoints } = useCouplePointsContext();
  
  return { 
    totalPoints, 
    currentPoints,
    history, 
    levelInfo, 
    loading, 
    refresh: refreshPoints 
  };
};