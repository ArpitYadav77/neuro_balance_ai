import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User,
  UserProfile,
  EyeMetrics,
  StressResult,
  StressHistoryPoint,
  Intervention,
  Analytics,
} from '@/types';

interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  profile: UserProfile | null;
  setUser: (user: User, token: string) => void;
  setProfile: (profile: UserProfile) => void;
  logout: () => void;

  // Session
  sessionId: string | null;
  sessionStartTime: number | null;
  isMonitoring: boolean;
  sessionMinutes: number;
  setSessionId: (id: string | null) => void;
  setMonitoring: (v: boolean) => void;
  setSessionMinutes: (m: number) => void;

  // Live metrics
  stressScore: number;
  stressLevel: 'low' | 'medium' | 'high';
  blinkRate: number;
  gazeDirection: 'left' | 'right' | 'center';
  eyeClosure: number;
  gazeShifts: number;
  stressHistory: StressHistoryPoint[];
  setEyeMetrics: (metrics: EyeMetrics) => void;
  setStressResult: (result: StressResult) => void;
  addStressReading: (point: StressHistoryPoint) => void;

  // Interventions
  activeIntervention: Intervention | null;
  interventionQueue: Intervention[];
  snoozeUntil: number | null;
  setIntervention: (i: Intervention | null) => void;
  dismissIntervention: () => void;
  snoozeIntervention: (minutes: number) => void;
  enqueueInterventions: (items: Intervention[]) => void;

  // Analytics
  analytics: Analytics | null;
  setAnalytics: (a: Analytics) => void;

  // WS
  wsConnected: boolean;
  setWsConnected: (v: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── Auth ────────────────────────────────────────────────────────────
      user: null,
      token: null,
      profile: null,
      setUser: (user, token) => set({ user, token }),
      setProfile: (profile) => set({ profile }),
      logout: () =>
        set({
          user: null,
          token: null,
          profile: null,
          sessionId: null,
          isMonitoring: false,
          sessionMinutes: 0,
          stressScore: 0,
          stressHistory: [],
          activeIntervention: null,
          wsConnected: false,
        }),

      // ── Session ─────────────────────────────────────────────────────────
      sessionId: null,
      sessionStartTime: null,
      isMonitoring: false,
      sessionMinutes: 0,
      setSessionId: (id) =>
        set({ sessionId: id, sessionStartTime: id ? Date.now() : null }),
      setMonitoring: (v) => set({ isMonitoring: v }),
      setSessionMinutes: (m) => set({ sessionMinutes: m }),

      // ── Live metrics ─────────────────────────────────────────────────────
      stressScore: 0,
      stressLevel: 'low',
      blinkRate: 15,
      gazeDirection: 'center',
      eyeClosure: 0.2,
      gazeShifts: 0,
      stressHistory: [],
      setEyeMetrics: (metrics) =>
        set({
          blinkRate: metrics.blinkRate,
          gazeDirection: metrics.gazeDirection,
          eyeClosure: metrics.eyeClosure,
          gazeShifts: metrics.gazeShifts,
        }),
      setStressResult: (result) => {
        const now = new Date();
        const timeLabel = now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const prev = get().stressHistory;
        const updated =
          prev.length >= 60 ? [...prev.slice(1), { time: timeLabel, score: result.stressScore }] : [...prev, { time: timeLabel, score: result.stressScore }];
        set({
          stressScore: result.stressScore,
          stressLevel: result.level,
          stressHistory: updated,
        });
      },
      addStressReading: (point) => {
        const prev = get().stressHistory;
        const updated = prev.length >= 60 ? [...prev.slice(1), point] : [...prev, point];
        set({ stressHistory: updated });
      },

      // ── Interventions ────────────────────────────────────────────────────
      activeIntervention: null,
      interventionQueue: [],
      snoozeUntil: null,
      setIntervention: (i) => set({ activeIntervention: i }),
      dismissIntervention: () => {
        const queue = get().interventionQueue;
        set({
          activeIntervention: queue.length > 0 ? queue[0] : null,
          interventionQueue: queue.slice(1),
        });
      },
      snoozeIntervention: (minutes) => {
        set({ activeIntervention: null, snoozeUntil: Date.now() + minutes * 60000 });
      },
      enqueueInterventions: (items) => {
        const current = get().activeIntervention;
        if (!current) {
          set({ activeIntervention: items[0], interventionQueue: items.slice(1) });
        } else {
          set({ interventionQueue: [...get().interventionQueue, ...items] });
        }
      },

      // ── Analytics ───────────────────────────────────────────────────────
      analytics: null,
      setAnalytics: (a) => set({ analytics: a }),

      // ── WS ──────────────────────────────────────────────────────────────
      wsConnected: false,
      setWsConnected: (v) => set({ wsConnected: v }),
    }),
    {
      name: 'neurobalance-store',
      partialize: (state) => ({ user: state.user, token: state.token, profile: state.profile }),
    },
  ),
);
