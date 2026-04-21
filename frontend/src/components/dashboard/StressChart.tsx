'use client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { useStressEngine } from '@/hooks/useStressEngine';
import { stressColor } from '@/lib/utils';

function CustomDot(props: { cx?: number; cy?: number; payload?: { score: number } }) {
  const { cx = 0, cy = 0, payload } = props;
  const score = payload?.score ?? 0;
  const c = stressColor(score);
  return <circle cx={cx} cy={cy} r={3} fill={c} stroke="none" />;
}

export function StressChart() {
  const { chartData } = useStressEngine();

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
    if (!active || !payload?.length) return null;
    const score = payload[0].value;
    const color = stressColor(score);
    return (
      <div className="glass-card p-3 border border-white/10 text-xs">
        <p className="text-white/50 mb-1">{label}</p>
        <p className="font-bold" style={{ color }}>Stress: {score}</p>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white/80">Stress Over Time</h3>
        <div className="flex items-center gap-4 text-xs text-white/40">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Low</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Moderate</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />High</span>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-white/20 text-sm">
          Start monitoring to see live stress data
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="time"
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={35} stroke="#22c55e22" strokeDasharray="4 4" />
            <ReferenceLine y={65} stroke="#ef444422" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#3d53fc"
              strokeWidth={2}
              dot={<CustomDot />}
              activeDot={{ r: 5, fill: '#3d53fc' }}
              isAnimationActive={true}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
