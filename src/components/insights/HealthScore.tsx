import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Activity } from 'lucide-react';
import type { HealthTrendPoint } from '../../api/insights';

interface HealthScoreProps {
  score: number;
  trend: HealthTrendPoint[];
  errorRate: number;
  traceCount: number;
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

function getChartColor(score: number): string {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#ca8a04';
  return '#dc2626';
}

export function HealthScore({ score, trend, errorRate, traceCount }: HealthScoreProps) {
  const chartColor = getChartColor(score);

  return (
    <div className="overflow-hidden rounded-lg bg-white px-6 py-5 shadow">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-500">Health Score</h3>
          </div>
          <div className={`mt-2 text-5xl font-bold ${getScoreColor(score)}`}>
            {Math.round(score)}
          </div>
          <div className="mt-3 flex gap-4 text-sm text-gray-500">
            <span>
              <span className="font-medium text-gray-900">{traceCount.toLocaleString()}</span> traces
            </span>
            <span>
              <span className="font-medium text-gray-900">{(errorRate * 100).toFixed(1)}%</span> error rate
            </span>
          </div>
        </div>
        {trend.length > 1 && (
          <div className="h-16 w-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" hide />
                <Tooltip
                  contentStyle={{ fontSize: '12px', padding: '4px 8px' }}
                  labelFormatter={(label) => label}
                  formatter={(value: number) => [value.toFixed(1), 'Score']}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke={chartColor}
                  strokeWidth={2}
                  fill="url(#healthGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
