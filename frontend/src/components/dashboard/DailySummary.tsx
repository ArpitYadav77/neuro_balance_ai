'use client';
import { useAppStore } from '@/store/useAppStore';
import { Badge } from '@/components/ui/Badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function DailySummary() {
  const analytics = useAppStore((s) => s.analytics);
  const today = analytics?.today;
  const recentInterventions = analytics?.recentInterventions ?? [];

  const avg = today?.avg_stress ? Math.round(today.avg_stress) : null;
  const max = today?.max_stress ? Math.round(today.max_stress) : null;
  const min = today?.min_stress ? Math.round(today.min_stress) : null;
  const sessions = today?.session_count ?? 0;

  const interventionTypeMap: Record<string, string> = {
    eye_exercise: '👁️',
    breathing: '🌬️',
    movement: '🤸',
    mindfulness: '🧘',
    break: '☕',
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-white/80">Daily Summary</h3>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: 'Avg Stress', value: avg ?? '—', icon: <Minus className="w-3 h-3" /> },
          { label: 'Max Stress', value: max ?? '—', icon: <TrendingUp className="w-3 h-3 text-red-400" /> },
          { label: 'Min Stress', value: min ?? '—', icon: <TrendingDown className="w-3 h-3 text-green-400" /> },
          { label: 'Sessions', value: sessions, icon: null },
        ].map(({ label, value, icon }) => (
          <div key={label} className="p-3 bg-white/3 rounded-xl border border-white/5">
            <div className="flex items-center gap-1 text-white/40 text-[10px] mb-1">
              {icon} {label}
            </div>
            <span className="text-xl font-bold text-white">{value}</span>
          </div>
        ))}
      </div>

      {/* Recent Interventions */}
      <div>
        <p className="text-xs uppercase tracking-widest text-white/30 mb-2">Recent Interventions</p>
        {recentInterventions.length === 0 ? (
          <p className="text-xs text-white/20 italic">No interventions yet</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {recentInterventions.slice(0, 5).map((iv, i) => (
              <div key={i} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/2 border border-white/5">
                <span className="text-xs flex items-center gap-1.5">
                  <span>{interventionTypeMap[iv.type] ?? '💡'}</span>
                  <span className="text-white/60 capitalize">{iv.type.replace('_', ' ')}</span>
                </span>
                <Badge
                  variant={
                    (iv as unknown as { response?: string }).response === 'accepted'
                      ? 'low'
                      : (iv as unknown as { response?: string }).response === 'ignored'
                      ? 'high'
                      : 'neutral'
                  }
                >
                  {(iv as unknown as { response?: string }).response ?? 'pending'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
