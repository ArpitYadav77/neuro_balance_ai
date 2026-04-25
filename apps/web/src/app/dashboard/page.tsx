'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { getAnalytics } from '@/lib/api';
import { Sidebar } from '@/components/layout/Sidebar';
import { SessionStats } from '@/components/dashboard/SessionStats';
import { StressChart } from '@/components/dashboard/StressChart';
import { WeeklyTrend } from '@/components/dashboard/WeeklyTrend';
import { DailySummary } from '@/components/dashboard/DailySummary';
import { StressRing } from '@/components/monitoring/StressRing';
import { WebcamMonitor } from '@/components/monitoring/WebcamMonitor';
import { EyeMetrics } from '@/components/monitoring/EyeMetrics';
import { InterventionToast } from '@/components/interventions/InterventionToast';
import { BreathingExercise } from '@/components/interventions/BreathingExercise';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { RefreshCw } from 'lucide-react';
import type { Analytics } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const token = useAppStore((s) => s.token);
  const user = useAppStore((s) => s.user);
  const setAnalytics = useAppStore((s) => s.setAnalytics);
  const profile = useAppStore((s) => s.profile);
  const stressScore = useAppStore((s) => s.stressScore);
  const stressLevel = useAppStore((s) => s.stressLevel);
  const setProfile = useAppStore((s) => s.setProfile);

  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [showBreathing, setShowBreathing] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!token) router.push('/auth');
  }, [token, router]);

  // Load analytics
  const fetchAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const data: Analytics = await getAnalytics();
      setAnalytics(data);
      if (data.profile) setProfile(data.profile);
    } catch { /* non-fatal */ } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAnalytics();
      const interval = setInterval(fetchAnalytics, 60000); // refresh every minute
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token || !user) return null;

  return (
    <div className="flex h-screen bg-[#06080f] overflow-hidden">
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 flex flex-col gap-6">

          {/* Page header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black font-heading">
                Good {getTimeOfDay()}, {user?.name || 'there'} 👋
              </h1>
              <p className="text-sm text-white/40 mt-0.5">Here's your cognitive health overview</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={stressLevel}>{stressLevel} stress</Badge>
              <button
                onClick={fetchAnalytics}
                disabled={loadingAnalytics}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${loadingAnalytics ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Top metric cards */}
          <SessionStats />

          {/* Center row — monitoring + chart */}
          <div className="grid lg:grid-cols-3 gap-6" id="monitor">
            {/* Live monitoring panel */}
            <Card className="lg:col-span-1 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white/80">Live Monitor</h2>
                <button
                  onClick={() => setShowBreathing(true)}
                  className="text-xs text-accent hover:underline"
                >
                  Breathing →
                </button>
              </div>
              <div className="flex justify-center">
                <StressRing />
              </div>
              <EyeMetrics />
              <WebcamMonitor />
            </Card>

            {/* Stress over time chart */}
            <Card className="lg:col-span-2">
              <StressChart />
            </Card>
          </div>

          {/* Bottom row — weekly trend + daily summary + personalization */}
          <div className="grid lg:grid-cols-3 gap-6" id="analytics">
            <Card>
              <WeeklyTrend />
            </Card>
            <Card>
              <DailySummary />
            </Card>

            {/* Personalization panel */}
            <Card>
              <h3 className="text-sm font-semibold text-white/80 mb-4">Personalization</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex justify-between text-xs text-white/50 mb-1">
                    <span>Your Baseline</span>
                    <span className="font-bold text-accent">{profile?.baseline_stress?.toFixed(0) ?? 40}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full"
                      style={{ width: `${profile?.baseline_stress ?? 40}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-white/50 mb-1">
                    <span>Alert Threshold</span>
                    <span className="font-bold text-primary">{profile?.alert_threshold?.toFixed(0) ?? 70}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${profile?.alert_threshold ?? 70}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-xs text-white/40">
                  <span>Sessions Analysed</span>
                  <span className="text-white">{profile?.sessions_count ?? 0}</span>
                </div>
                <div className="flex justify-between text-xs text-white/40">
                  <span>Interventions Accepted</span>
                  <span className="text-green-400">{profile?.accept_count ?? 0}</span>
                </div>
                <div className="flex justify-between text-xs text-white/40">
                  <span>Interventions Ignored</span>
                  <span className="text-red-400">{profile?.ignore_count ?? 0}</span>
                </div>
                <div className="mt-1 text-xs text-white/30 italic">
                  {(profile?.sessions_count ?? 0) > 0
                    ? 'Accuracy improving with each session ✓'
                    : 'Start monitoring to build your profile'}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Intervention toast (always rendered, shows conditionally) */}
      <InterventionToast />

      {/* Breathing exercise modal */}
      {showBreathing && <BreathingExercise onClose={() => setShowBreathing(false)} />}
    </div>
  );
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
