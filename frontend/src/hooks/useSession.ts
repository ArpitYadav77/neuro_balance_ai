'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { startSession, endSession, saveReading } from '@/lib/api';

export function useSession(sendMessage: (type: string, data: unknown) => void) {
  const sessionId = useAppStore((s) => s.sessionId);
  const setSessionId = useAppStore((s) => s.setSessionId);
  const isMonitoring = useAppStore((s) => s.isMonitoring);
  const setMonitoring = useAppStore((s) => s.setMonitoring);
  const setSessionMinutes = useAppStore((s) => s.setSessionMinutes);
  const stressScore = useAppStore((s) => s.stressScore);
  const stressLevel = useAppStore((s) => s.stressLevel);
  const blinkRate = useAppStore((s) => s.blinkRate);
  const gazeDirection = useAppStore((s) => s.gazeDirection);
  const eyeClosure = useAppStore((s) => s.eyeClosure);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const alertedRef = useRef(false);
  const elapsedRef = useRef(0);

  const stopSession = useCallback(async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    if (sessionId) {
      try { await endSession(sessionId); } catch { /* ignore */ }
    }
    setSessionId(null);
    setMonitoring(false);
    setSessionMinutes(0);
    elapsedRef.current = 0;
    alertedRef.current = false;
  }, [sessionId, setSessionId, setMonitoring, setSessionMinutes]);

  const beginSession = useCallback(async () => {
    try {
      const data = await startSession();
      const sid = data.session.id;
      setSessionId(sid);
      setMonitoring(true);
      elapsedRef.current = 0;
      alertedRef.current = false;

      sendMessage('session_start', { sessionId: sid });

      // Timer — tick every second
      timerRef.current = setInterval(() => {
        elapsedRef.current += 1;
        const minutes = elapsedRef.current / 60;
        setSessionMinutes(minutes);

        // 45-minute alert
        if (minutes >= 45 && !alertedRef.current) {
          alertedRef.current = true;
          sendMessage('session_time_alert', {
            minutes: Math.round(minutes),
            currentScore: stressScore,
          });
        }
      }, 1000);

      // Save reading every 10 seconds
      saveTimerRef.current = setInterval(async () => {
        if (!sid) return;
        try {
          await saveReading({
            sessionId: sid,
            stressScore,
            stressLevel,
            blinkRate,
            gazeDirection,
            eyeClosure,
            screenTimeMinutes: elapsedRef.current / 60,
          });
        } catch { /* non-fatal */ }
      }, 10000);
    } catch (err) {
      console.error('[useSession] Failed to start session', err);
    }
  }, [sendMessage, stressScore, stressLevel, blinkRate, gazeDirection, eyeClosure, setSessionId, setMonitoring, setSessionMinutes]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    };
  }, []);

  return { beginSession, stopSession, isMonitoring };
}
