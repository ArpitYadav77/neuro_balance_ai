'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { updateSettings, getMe } from '@/lib/api';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Bell, Clock, Volume2, Play, RotateCcw, Save } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const token = useAppStore((s) => s.token);
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);

  const [threshold, setThreshold] = useState(70);
  const [sensitivity, setSensitivity] = useState<'low' | 'medium' | 'high'>('medium');
  const [snooze, setSnooze] = useState(10);
  const [loading, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) router.push('/auth');
  }, [token, router]);

  useEffect(() => {
    if (profile) {
      setThreshold(profile.alert_threshold);
      setSensitivity(profile.alert_sensitivity);
      setSnooze(profile.snooze_duration_minutes);
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const data = await updateSettings({
        alertThreshold: threshold,
        alertSensitivity: sensitivity,
        snoozeDurationMinutes: snooze,
      });
      setProfile(data.profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  };

  const handleResetBaseline = async () => {
    try {
      await updateSettings({ alertThreshold: 70, alertSensitivity: 'medium', snoozeDurationMinutes: 10 });
      const me = await getMe();
      if (me.profile) setProfile(me.profile);
    } catch { /* ignore */ }
  };

  const stressColor = threshold < 60 ? '#22c55e' : threshold <= 75 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex h-screen bg-[#06080f] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-black font-heading">Settings</h1>
            <p className="text-sm text-white/40 mt-0.5">Personalise your monitoring experience</p>
          </div>

          {/* Alert Settings */}
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <Bell className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-white">Alert Configuration</h2>
            </div>

            {/* Threshold slider */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm text-white/70">Alert Threshold</label>
                <span className="text-sm font-bold" style={{ color: stressColor }}>{threshold}</span>
              </div>
              <input
                id="settings-threshold-slider"
                type="range"
                min={50}
                max={90}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-white/30 mt-1">
                <span>50 (sensitive)</span>
                <span>90 (relaxed)</span>
              </div>
              <p className="text-xs text-white/40 mt-2">
                Interventions trigger when stress exceeds {threshold}
              </p>
            </div>

            {/* Sensitivity */}
            <div className="mb-5">
              <label className="text-sm text-white/70 block mb-2">Alert Sensitivity</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map((s) => (
                  <button
                    key={s}
                    id={`settings-sensitivity-${s}`}
                    onClick={() => setSensitivity(s)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                      sensitivity === s
                        ? 'bg-primary border-primary/50 text-white'
                        : 'bg-white/3 border-white/10 text-white/50 hover:text-white hover:bg-white/8'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Snooze Settings */}
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <Clock className="w-4 h-4 text-accent" />
              <h2 className="font-bold text-white">Snooze Duration</h2>
            </div>
            <div className="flex gap-2">
              {[5, 10, 15, 30].map((m) => (
                <button
                  key={m}
                  id={`settings-snooze-${m}`}
                  onClick={() => setSnooze(m)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${
                    snooze === m
                      ? 'bg-accent/20 border-accent/40 text-accent'
                      : 'bg-white/3 border-white/10 text-white/50 hover:text-white hover:bg-white/8'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
            <p className="text-xs text-white/30 mt-3">
              Snoozed interventions will reappear after {snooze} minutes
            </p>
          </Card>

          {/* Session Settings */}
          <Card>
            <div className="flex items-center gap-2 mb-5">
              <Play className="w-4 h-4 text-primary" />
              <h2 className="font-bold text-white">Session Defaults</h2>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-3 bg-white/3 rounded-xl border border-white/5">
                <div>
                  <p className="text-sm text-white/80">Your Baseline Stress</p>
                  <p className="text-xs text-white/40">Computed from your last 5 sessions</p>
                </div>
                <span className="text-xl font-bold text-accent">{profile?.baseline_stress?.toFixed(0) ?? 40}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-white/3 rounded-xl border border-white/5">
                <div>
                  <p className="text-sm text-white/80">Sessions Analysed</p>
                  <p className="text-xs text-white/40">Used to personalise your baseline</p>
                </div>
                <span className="text-xl font-bold text-white">{profile?.sessions_count ?? 0}</span>
              </div>
            </div>

            <button
              id="settings-reset-baseline"
              onClick={handleResetBaseline}
              className="mt-4 flex items-center gap-2 text-xs text-white/40 hover:text-red-400 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to default settings
            </button>
          </Card>

          {/* Save */}
          <div className="flex gap-3">
            <Button
              id="settings-save-btn"
              variant="primary"
              size="lg"
              loading={loading}
              onClick={handleSave}
              className="flex-1"
            >
              <Save className="w-4 h-4" />
              {saved ? 'Saved ✓' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
