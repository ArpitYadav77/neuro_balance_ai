'use client';
import { useAppStore } from '@/store/useAppStore';
import { Eye, Navigation, Activity } from 'lucide-react';

export function EyeMetrics() {
  const blinkRate = useAppStore((s) => s.blinkRate);
  const gazeDirection = useAppStore((s) => s.gazeDirection);
  const eyeClosure = useAppStore((s) => s.eyeClosure);
  const isMonitoring = useAppStore((s) => s.isMonitoring);

  const gazeColors: Record<string, string> = {
    left: '#f59e0b',
    right: '#f59e0b',
    center: '#22c55e',
  };

  const blinkStatus = blinkRate < 8 ? 'Low — eye strain risk' : blinkRate > 25 ? 'High — anxiety signal' : 'Normal';
  const blinkColor = blinkRate < 8 || blinkRate > 25 ? '#f59e0b' : '#22c55e';

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs uppercase tracking-widest text-white/40 font-medium">Eye Metrics</p>

      <div className="flex flex-col gap-2">
        {/* Blink Rate */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/3 border border-white/5">
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-white/40" />
            <span className="text-xs text-white/60">Blink Rate</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold" style={{ color: blinkColor }}>
              {isMonitoring ? blinkRate : '—'}
            </span>
            <span className="text-xs text-white/30 ml-1">bpm</span>
            {isMonitoring && (
              <p className="text-[10px] text-white/30">{blinkStatus}</p>
            )}
          </div>
        </div>

        {/* Gaze Direction */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/3 border border-white/5">
          <div className="flex items-center gap-2">
            <Navigation className="w-3.5 h-3.5 text-white/40" />
            <span className="text-xs text-white/60">Gaze</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Visual gaze indicator */}
            <div className="relative w-8 h-5 bg-white/5 rounded border border-white/10">
              <div
                className="absolute w-2 h-2 rounded-full bg-current top-1/2 -translate-y-1/2 transition-all duration-300"
                style={{
                  left: gazeDirection === 'left' ? '2px' : gazeDirection === 'right' ? 'calc(100% - 10px)' : '50%',
                  transform: 'translateY(-50%) translateX(-50%)',
                  color: gazeColors[gazeDirection],
                  backgroundColor: gazeColors[gazeDirection],
                }}
              />
            </div>
            <span
              className="text-sm font-bold capitalize"
              style={{ color: gazeColors[gazeDirection] }}
            >
              {isMonitoring ? gazeDirection : '—'}
            </span>
          </div>
        </div>

        {/* Eye Closure */}
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/3 border border-white/5">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-white/40" />
            <span className="text-xs text-white/60">Eye Closure</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${isMonitoring ? eyeClosure * 100 : 0}%`,
                  background:
                    eyeClosure > 0.5 ? '#ef4444' : eyeClosure > 0.3 ? '#f59e0b' : '#22c55e',
                }}
              />
            </div>
            <span className="text-sm font-bold text-white/70">
              {isMonitoring ? `${Math.round(eyeClosure * 100)}%` : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
