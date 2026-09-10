import { useState } from 'react';

export type MapDisplayMode = 'photo' | 'color';

const STORAGE_KEY = 'mapDisplayMode';

export const useMapDisplayMode = () => {
  const [mode, setMode] = useState<MapDisplayMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved as MapDisplayMode) ?? 'photo';
  });

  const toggleMode = () => {
    const next: MapDisplayMode = mode === 'photo' ? 'color' : 'photo';
    localStorage.setItem(STORAGE_KEY, next);
    setMode(next);
  };

  const setDisplayMode = (m: MapDisplayMode) => {
    localStorage.setItem(STORAGE_KEY, m);
    setMode(m);
  };

  return { mode, toggleMode, setDisplayMode };
};
