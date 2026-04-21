/** Format seconds as mm:ss */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/** Format minutes as "Xh Ym" */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/** Stress score → colour class */
export function stressColor(score: number): string {
  if (score < 35) return '#22c55e';
  if (score <= 65) return '#f59e0b';
  return '#ef4444';
}

/** Stress level → readable label */
export function stressLabel(level: 'low' | 'medium' | 'high'): string {
  return { low: 'Low', medium: 'Moderate', high: 'High' }[level];
}

/** Clamp a number */
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/** Format date as "Apr 21" */
export function formatDay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Format hour for chart */
export function formatHour(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/** Truncate text */
export function truncate(text: string, len: number): string {
  return text.length > len ? text.slice(0, len) + '…' : text;
}
