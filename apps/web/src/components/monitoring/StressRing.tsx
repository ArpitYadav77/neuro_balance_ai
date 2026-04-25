'use client';
import { useAppStore } from '@/store/useAppStore';
import { stressColor } from '@/lib/utils';

export function StressRing() {
  const stressScore = useAppStore((s) => s.stressScore);
  const stressLevel = useAppStore((s) => s.stressLevel);
  const isMonitoring = useAppStore((s) => s.isMonitoring);

  const score = isMonitoring ? stressScore : 0;
  const color = stressColor(score);
  const radius = 80;
  const stroke = 10;
  const normalised = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalised;
  const progress = ((100 - score) / 100) * circumference;

  const levelLabel = { low: 'Low Stress', medium: 'Moderate', high: 'High Stress' }[stressLevel];

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="180" height="180" className="drop-shadow-2xl -rotate-90">
          {/* Track */}
          <circle
            cx="90"
            cy="90"
            r={normalised}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={stroke}
          />
          {/* Progress arc */}
          <circle
            cx="90"
            cy="90"
            r={normalised}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            style={{
              transition: 'stroke-dashoffset 0.8s ease, stroke 0.5s ease',
              filter: `drop-shadow(0 0 8px ${color}88)`,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-5xl font-black font-heading leading-none"
            style={{ color, textShadow: `0 0 20px ${color}66` }}
          >
            {Math.round(score)}
          </span>
          <span className="text-xs text-white/40 mt-1 font-medium">/100</span>
        </div>
      </div>

      <div className="text-center">
        <div
          className="text-sm font-bold px-4 py-1 rounded-full border"
          style={{
            color,
            borderColor: `${color}40`,
            backgroundColor: `${color}10`,
          }}
        >
          {isMonitoring ? levelLabel : 'Not Monitoring'}
        </div>
        {isMonitoring && (
          <p className="text-xs text-white/30 mt-1">Updated in real-time</p>
        )}
      </div>
    </div>
  );
}
