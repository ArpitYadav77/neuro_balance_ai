'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useEyeTracking } from '@/hooks/useEyeTracking';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useSession } from '@/hooks/useSession';
import { Button } from '@/components/ui/Button';
import { Camera, CameraOff, Wifi, WifiOff } from 'lucide-react';

export function WebcamMonitor() {
  const isMonitoring = useAppStore((s) => s.isMonitoring);
  const wsConnected = useAppStore((s) => s.wsConnected);
  const sessionMinutes = useAppStore((s) => s.sessionMinutes);
  const setEyeMetrics = useAppStore((s) => s.setEyeMetrics);

  const [active, setActive] = useState(false);
  const sendRef = useRef<(type: string, data: unknown) => void>(() => {});

  const { sendMessage } = useWebSocket();
  const { beginSession, stopSession } = useSession(sendMessage);
  const eye = useEyeTracking(active);

  // Keep sendRef current without re-triggering intervals
  useEffect(() => { sendRef.current = sendMessage; }, [sendMessage]);

  // Send eye metrics via WS every 1 second
  useEffect(() => {
    if (!active || !eye.isReady) return;
    const metrics = {
      blinkRate: eye.blinkRate,
      gazeDirection: eye.gazeDirection,
      eyeClosure: eye.eyeClosure,
      screenTimeMinutes: sessionMinutes,
      gazeShifts: eye.gazeShifts,
    };
    setEyeMetrics(metrics);
    const interval = setInterval(() => {
      sendRef.current('eye_metrics', {
        blinkRate: eye.blinkRate,
        gazeDirection: eye.gazeDirection,
        eyeClosure: eye.eyeClosure,
        screenTimeMinutes: sessionMinutes,
        gazeShifts: eye.gazeShifts,
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [active, eye, sessionMinutes, setEyeMetrics]);

  const handleToggle = useCallback(async () => {
    if (active) {
      setActive(false);
      await stopSession();
    } else {
      setActive(true);
      await beginSession();
    }
  }, [active, beginSession, stopSession]);

  return (
    <div className="flex flex-col gap-4">
      {/* Webcam preview */}
      <div className="relative w-32 h-24 rounded-xl overflow-hidden border border-white/10 bg-black/40 scan-line-container">
        {active ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-accent/10 animate-pulse" />
            <Camera className="absolute text-primary/50 w-8 h-8" />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <CameraOff className="text-white/20 w-8 h-8" />
          </div>
        )}
        {active && eye.isReady && (
          <div className="absolute bottom-1 left-1 right-1 flex justify-between items-center">
            <span className="text-[9px] text-green-400 font-mono bg-black/60 px-1 rounded">LIVE</span>
          </div>
        )}
      </div>

      {/* Status row */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-1.5 text-xs ${wsConnected ? 'text-green-400' : 'text-white/30'}`}>
          {wsConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {wsConnected ? 'Connected' : 'Offline'}
        </div>
        {eye.error && <span className="text-xs text-red-400 truncate">{eye.error}</span>}
      </div>

      {/* Toggle button */}
      <Button
        id="monitoring-toggle-btn"
        variant={active ? 'danger' : 'primary'}
        size="md"
        onClick={handleToggle}
        className="w-full"
      >
        {active ? (
          <>
            <CameraOff className="w-4 h-4" /> Stop Monitoring
          </>
        ) : (
          <>
            <Camera className="w-4 h-4" /> Start Monitoring
          </>
        )}
      </Button>
    </div>
  );
}
