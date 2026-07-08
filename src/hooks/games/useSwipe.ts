import { useState, TouchEvent, MouseEvent } from "react";

export function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [touchEndY, setTouchEndY] = useState<number | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);

  const minSwipeDistance = 50;

  // Touch handlers (Mobile)
  const onTouchStart = (e: TouchEvent) => {
    setTouchEndX(null);
    setTouchEndY(null);
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
    setTouchEndY(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (
      touchStartX === null ||
      touchStartY === null ||
      touchEndX === null ||
      touchEndY === null
    ) {
      return;
    }
    const distanceX = touchStartX - touchEndX;
    const distanceY = touchStartY - touchEndY;

    if (
      Math.abs(distanceX) > Math.abs(distanceY) &&
      Math.abs(distanceX) > minSwipeDistance
    ) {
      if (distanceX > 0) {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
    }
  };

  // Mouse handlers (PC Desktop)
  const onMouseDown = (e: MouseEvent) => {
    setTouchEndX(null);
    setTouchEndY(null);
    setTouchStartX(e.clientX);
    setTouchStartY(e.clientY);
    setIsMouseDown(true);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isMouseDown) return;
    setTouchEndX(e.clientX);
    setTouchEndY(e.clientY);
  };

  const onMouseUp = () => {
    if (!isMouseDown) return;
    setIsMouseDown(false);

    if (
      touchStartX === null ||
      touchStartY === null ||
      touchEndX === null ||
      touchEndY === null
    ) {
      return;
    }
    const distanceX = touchStartX - touchEndX;
    const distanceY = touchStartY - touchEndY;

    if (
      Math.abs(distanceX) > Math.abs(distanceY) &&
      Math.abs(distanceX) > minSwipeDistance
    ) {
      if (distanceX > 0) {
        onSwipeLeft();
      } else {
        onSwipeRight();
      }
    }
  };

  const onMouseLeave = () => {
    setIsMouseDown(false);
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
  };
}
