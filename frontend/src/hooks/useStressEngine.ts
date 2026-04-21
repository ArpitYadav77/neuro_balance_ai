'use client';
import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';

export function useStressEngine() {
  const stressHistory = useAppStore((s) => s.stressHistory);
  const stressScore = useAppStore((s) => s.stressScore);
  const stressLevel = useAppStore((s) => s.stressLevel);

  const sessionAvg = useMemo(() => {
    if (stressHistory.length === 0) return 0;
    const sum = stressHistory.reduce((acc, p) => acc + p.score, 0);
    return Math.round(sum / stressHistory.length);
  }, [stressHistory]);

  const sessionMax = useMemo(() => {
    if (stressHistory.length === 0) return 0;
    return Math.max(...stressHistory.map((p) => p.score));
  }, [stressHistory]);

  const chartData = useMemo(
    () =>
      stressHistory.map((p) => ({
        time: p.time,
        score: Math.round(p.score),
      })),
    [stressHistory],
  );

  return { stressScore, stressLevel, sessionAvg, sessionMax, chartData };
}
