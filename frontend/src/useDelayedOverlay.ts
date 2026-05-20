import { useEffect, useRef, useState } from 'react';

interface DelayedOverlayState {
  isMounted: boolean;
  isVisible: boolean;
}

/**
 * Shows an overlay only if loading exceeds delayMs, then fades out smoothly.
 */
export function useDelayedOverlay(
  isBusy: boolean,
  delayMs = 1500,
  fadeMs = 250
): DelayedOverlayState {
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const delayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (delayTimer.current) clearTimeout(delayTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);

    if (isBusy) {
      delayTimer.current = setTimeout(() => {
        setIsMounted(true);
        // Run in next tick so opacity transition animates in.
        setTimeout(() => setIsVisible(true), 10);
      }, delayMs);
    } else if (isMounted) {
      setIsVisible(false);
      hideTimer.current = setTimeout(() => setIsMounted(false), fadeMs);
    }

    return () => {
      if (delayTimer.current) clearTimeout(delayTimer.current);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [isBusy, delayMs, fadeMs, isMounted]);

  return { isMounted, isVisible };
}
