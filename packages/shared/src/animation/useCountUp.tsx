import { useEffect, useRef, useState } from "react";

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Anime un nombre de 0 jusqu'à `target` à l'apparition (et à chaque
 * changement de target). Renvoie la valeur courante (entière) à afficher.
 * Utilise requestAnimationFrame, sans dépendance externe.
 */
export function useCountUp(target: number, duration = 800, delay = 0): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const start = () => {
      const startTime = Date.now();
      const tick = () => {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        setValue(Math.round(target * easeOutCubic(t)));
        if (t < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    };
    if (delay > 0) {
      timeoutRef.current = setTimeout(start, delay);
    } else {
      start();
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [target, duration, delay]);

  return value;
}