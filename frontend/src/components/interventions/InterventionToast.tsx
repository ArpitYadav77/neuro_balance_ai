'use client';
import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { respondIntervention } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { X, Check, Clock } from 'lucide-react';
import type { Intervention } from '@/types';

export function InterventionToast() {
  const activeIntervention = useAppStore((s) => s.activeIntervention);
  const profile = useAppStore((s) => s.profile);
  const dismissIntervention = useAppStore((s) => s.dismissIntervention);
  const snoozeIntervention = useAppStore((s) => s.snoozeIntervention);
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [autoTimer, setAutoTimer] = useState(30);

  const iv = activeIntervention as (Intervention & { id?: string }) | null;

  const dismiss = useCallback(
    async (response: 'accepted' | 'ignored' | 'snoozed') => {
      setExiting(true);
      setTimeout(() => {
        setExiting(false);
        setVisible(false);
        if (response === 'snoozed') {
          snoozeIntervention(profile?.snooze_duration_minutes ?? 10);
        } else {
          dismissIntervention();
        }
      }, 300);
      if (iv?.id) {
        try { await respondIntervention(iv.id, response); } catch { /* ignore */ }
      }
    },
    [iv, dismissIntervention, snoozeIntervention, profile],
  );

  // Show on new intervention
  useEffect(() => {
    if (iv) {
      setVisible(true);
      setExiting(false);
      setAutoTimer(30);
    }
  }, [iv]);

  // Auto-dismiss after 30s
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setAutoTimer((t) => {
        if (t <= 1) { dismiss('ignored'); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [visible, dismiss]);

  if (!iv || !visible) return null;

  const priorityColors: Record<string, string> = {
    high: '#ef4444',
    medium: '#f59e0b',
    low: '#3d53fc',
  };
  const priorityColor = priorityColors[iv.priority] ?? '#3d53fc';

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 w-80 glass-card border border-white/10 ${exiting ? 'toast-exit' : 'toast-enter'}`}
      style={{ borderLeftColor: priorityColor, borderLeftWidth: 3 }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{iv.icon}</span>
            <div>
              <p className="text-sm font-bold text-white">{iv.title}</p>
              <p className="text-[10px] text-white/30">Auto-dismiss in {autoTimer}s</p>
            </div>
          </div>
          <button
            onClick={() => dismiss('ignored')}
            className="text-white/30 hover:text-white transition-colors p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message */}
        <p className="text-xs text-white/60 mb-4 leading-relaxed">{iv.message}</p>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            id={`intervention-accept-${iv.id}`}
            size="sm"
            variant="primary"
            className="flex-1"
            onClick={() => dismiss('accepted')}
          >
            <Check className="w-3 h-3" />
            {iv.action}
          </Button>
          <Button
            id={`intervention-snooze-${iv.id}`}
            size="sm"
            variant="secondary"
            onClick={() => dismiss('snoozed')}
          >
            <Clock className="w-3 h-3" />
            {profile?.snooze_duration_minutes ?? 10}m
          </Button>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-0.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all linear"
            style={{
              width: `${(autoTimer / 30) * 100}%`,
              background: priorityColor,
              transitionDuration: '1s',
            }}
          />
        </div>
      </div>
    </div>
  );
}
