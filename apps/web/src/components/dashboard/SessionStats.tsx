'use client';
import { useAppStore } from '@/store/useAppStore';
import { MetricCard } from '@/components/ui/Card';
import { Brain, Clock, Eye, Coffee } from 'lucide-react';
import { stressColor, formatMinutes } from '@/lib/utils';

export function SessionStats() {
  const stressScore = useAppStore((s) => s.stressScore);
  const stressLevel = useAppStore((s) => s.stressLevel);
  const sessionMinutes = useAppStore((s) => s.sessionMinutes);
  const blinkRate = useAppStore((s) => s.blinkRate);
  const isMonitoring = useAppStore((s) => s.isMonitoring);
  const analytics = useAppStore((s) => s.analytics);

  const breaksTaken = analytics?.latestSession?.breaks_taken ?? 0;

  const cards = [
    {
      title: 'Live Stress Score',
      value: isMonitoring ? Math.round(stressScore) : '—',
      icon: <Brain className="w-4 h-4" />,
      color: isMonitoring ? stressColor(stressScore) : undefined,
      subtitle: isMonitoring ? `Level: ${stressLevel}` : 'Start monitoring',
    },
    {
      title: 'Session Duration',
      value: isMonitoring ? formatMinutes(sessionMinutes) : '00:00',
      icon: <Clock className="w-4 h-4" />,
      color: '#3d53fc',
      subtitle: isMonitoring ? 'Elapsed this session' : 'No active session',
    },
    {
      title: 'Blink Rate',
      value: isMonitoring ? blinkRate : '—',
      unit: 'bpm',
      icon: <Eye className="w-4 h-4" />,
      color: blinkRate < 8 ? '#f59e0b' : '#22c55e',
      subtitle: 'Normal: ~15 bpm',
    },
    {
      title: 'Breaks Today',
      value: breaksTaken,
      icon: <Coffee className="w-4 h-4" />,
      color: '#14b8a6',
      subtitle: 'Accepted interventions',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <MetricCard key={card.title} {...card} />
      ))}
    </div>
  );
}
