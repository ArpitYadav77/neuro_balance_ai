'use client';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

type Phase = 'inhale' | 'hold-in' | 'exhale' | 'hold-out';

const PHASES: { phase: Phase; label: string; duration: number }[] = [
  { phase: 'inhale', label: 'Breathe In', duration: 4 },
  { phase: 'hold-in', label: 'Hold', duration: 4 },
  { phase: 'exhale', label: 'Breathe Out', duration: 4 },
  { phase: 'hold-out', label: 'Hold', duration: 4 },
];

interface BreathingExerciseProps {
  onClose: () => void;
}

export function BreathingExercise({ onClose }: BreathingExerciseProps) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [countdown, setCountdown] = useState(4);
  const [cycle, setCycle] = useState(1);
  const [done, setDone] = useState(false);

  const totalCycles = 3;
  const current = PHASES[phaseIndex];

  const advance = useCallback(() => {
    const next = (phaseIndex + 1) % PHASES.length;
    if (next === 0) {
      if (cycle >= totalCycles) {
        setDone(true);
        return;
      }
      setCycle((c) => c + 1);
    }
    setPhaseIndex(next);
    setCountdown(PHASES[next].duration);
  }, [phaseIndex, cycle]);

  useEffect(() => {
    if (done) return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { advance(); return PHASES[phaseIndex].duration; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [advance, done, phaseIndex]);

  const circleClass =
    current.phase === 'inhale'
      ? 'breathe-in'
      : current.phase === 'hold-in' || current.phase === 'hold-out'
      ? 'breathe-hold-in'
      : 'breathe-out';

  const phaseColor: Record<Phase, string> = {
    inhale: '#3d53fc',
    'hold-in': '#14b8a6',
    exhale: '#22c55e',
    'hold-out': '#f59e0b',
  };
  const color = phaseColor[current.phase];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="glass-card p-8 max-w-sm w-full mx-4 relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-bold font-heading mb-1">Box Breathing</h2>
        <p className="text-xs text-white/40 mb-6">Cycle {cycle} of {totalCycles}</p>

        {/* Breathing circle */}
        <div className="relative flex items-center justify-center mb-8">
          <div
            className={`w-32 h-32 rounded-full ${circleClass}`}
            key={`${phaseIndex}-${cycle}`}
            style={{
              background: `radial-gradient(circle, ${color}33, ${color}11)`,
              border: `2px solid ${color}66`,
              boxShadow: `0 0 40px ${color}44`,
            }}
          />
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-black" style={{ color }}>{countdown}</span>
            <span className="text-xs text-white/50 mt-0.5">{current.label}</span>
          </div>
        </div>

        {/* Phase progress */}
        <div className="flex justify-center gap-2 mb-6">
          {PHASES.map((p, i) => (
            <div
              key={p.phase}
              className="flex-1 h-1 rounded-full transition-all duration-500"
              style={{ background: i === phaseIndex ? color : 'rgba(255,255,255,0.1)' }}
            />
          ))}
        </div>

        {done ? (
          <div className="text-center">
            <p className="text-green-400 font-semibold mb-3">✓ Great job! Session complete.</p>
            <Button variant="primary" onClick={onClose}>Done</Button>
          </div>
        ) : (
          <p className="text-xs text-white/30">Breathe slowly and follow the circle</p>
        )}
      </div>
    </div>
  );
}
