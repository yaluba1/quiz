'use client';

export function useHaptics() {
  const vibrate = (pattern: number | number[] = 20) => {
    if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Silently catch unsupported vibration permissions
      }
    }
  };

  const tap = () => vibrate(15);
  const success = () => vibrate([30, 40, 60]);
  const error = () => vibrate([60, 50, 60, 50, 100]);

  return {
    vibrate,
    tap,
    success,
    error,
  };
}

