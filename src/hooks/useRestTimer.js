import { useState, useRef, useEffect, useCallback } from "react";

export function useRestTimer() {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [active, setActive] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!active) return undefined;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current);
          setActive(false);
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            try { navigator.vibrate([250, 120, 250]); } catch (e) { /* unsupported, ignore */ }
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [active]);

  const start = useCallback((seconds) => {
    setSecondsLeft(seconds);
    setActive(true);
  }, []);
  const adjust = useCallback((delta) => setSecondsLeft((s) => Math.max(0, s + delta)), []);
  const stop = useCallback(() => {
    setActive(false);
    setSecondsLeft(0);
  }, []);

  return { secondsLeft, active, start, adjust, stop };
}
