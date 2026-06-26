import { useCallback, useEffect, useRef } from 'react';

const INACTIVITY_MS = 2 * 60 * 60 * 1000;

const EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

export const useInactivityTracker = (onExpired: () => void) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(onExpired, INACTIVITY_MS);
  }, [onExpired]);

  useEffect(() => {
    resetTimer();

    EVENTS.forEach((event) => window.addEventListener(event, resetTimer));

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, [resetTimer]);
};
