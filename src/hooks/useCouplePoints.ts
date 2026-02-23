import { useCouplePointsContext } from '../context/CouplePointsContext';

export const useCouplePoints = () => {
  const { totalPoints, currentPoints, history, levelInfo, loading, refreshPoints, refreshItems } = useCouplePointsContext();
  
  return { 
    totalPoints, 
    currentPoints,
    history, 
    levelInfo, 
    loading, 
    refresh: refreshPoints,
    refreshItems 
  };
};