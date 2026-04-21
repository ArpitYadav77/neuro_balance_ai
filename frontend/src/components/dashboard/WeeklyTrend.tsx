'use client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import { formatDay, stressColor } from '@/lib/utils';

export function WeeklyTrend() {
  const analytics = useAppStore((s) => s.analytics);
  const weekly = analytics?.weekly ?? [];

  const data = weekly.map((d) => ({
    day: formatDay(d.day),
    score: Math.round(d.avg_stress ?? 0),
  }));

  // Fill missing days (up to 7)
  while (data.length < 7 && data.length > 0) {
    const d = new Date();
    d.setDate(d.getDate() - (7 - data.length));
    data.unshift({ day: formatDay(d.toISOString()), score: 0 });
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-white/80 mb-4">Weekly Trend</h3>
      {data.length === 0 ? (
        <div className="h-32 flex items-center justify-center text-white/20 text-sm">
          No data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="day"
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(6,8,15,0.9)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                fontSize: 11,
              }}
              itemStyle={{ color: '#fff' }}
            />
            <Bar dataKey="score" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={stressColor(entry.score)} opacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
