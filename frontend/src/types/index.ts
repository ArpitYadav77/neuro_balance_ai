// ─── Type Definitions ─────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  baseline_stress: number;
  alert_threshold: number;
  alert_sensitivity: 'low' | 'medium' | 'high';
  sessions_count: number;
  ignore_count: number;
  accept_count: number;
  snooze_duration_minutes: number;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  started_at: string;
  ended_at?: string;
  duration_minutes?: number;
  avg_stress?: number;
  max_stress?: number;
  min_stress?: number;
  breaks_taken: number;
  alerts_sent: number;
}

export interface StressReading {
  id: string;
  session_id: string;
  user_id: string;
  timestamp: string;
  stress_score: number;
  stress_level: 'low' | 'medium' | 'high';
  blink_rate?: number;
  gaze_direction?: string;
  eye_closure?: number;
  screen_time_minutes?: number;
}

export interface Intervention {
  id: string;
  type: 'eye_exercise' | 'breathing' | 'movement' | 'mindfulness' | 'break';
  title: string;
  message: string;
  action: string;
  icon: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ScoreComponents {
  blinkScore: number;
  screenTimeScore: number;
  gazeInstabilityScore: number;
  eyeClosureScore: number;
}

export interface StressResult {
  stressScore: number;
  level: 'low' | 'medium' | 'high';
  components: ScoreComponents;
  recommendations: string[];
}

export interface EyeMetrics {
  blinkRate: number;
  gazeDirection: 'left' | 'right' | 'center';
  eyeClosure: number;
  screenTimeMinutes: number;
  gazeShifts: number;
}

export interface StressHistoryPoint {
  time: string;
  score: number;
}

// WebSocket message types
export type WsMessageType =
  | 'connected'
  | 'stress_result'
  | 'intervention'
  | 'error'
  | 'eye_metrics'
  | 'session_time_alert'
  | 'intervention_response'
  | 'session_start';

export interface WsMessage {
  type: WsMessageType;
  data: unknown;
}

// Analytics
export interface HourlyData {
  hour: string;
  avg_score: number;
  reading_count: number;
}

export interface WeeklyData {
  day: string;
  avg_stress: number;
  session_count: number;
}

export interface TodayStats {
  avg_stress: number | null;
  max_stress: number | null;
  min_stress: number | null;
  session_count: number;
}

export interface Analytics {
  hourly: HourlyData[];
  weekly: WeeklyData[];
  latestSession: Session | null;
  profile: UserProfile | null;
  today: TodayStats | null;
  recentInterventions: Intervention[];
}
