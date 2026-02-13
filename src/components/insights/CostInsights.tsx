import { DollarSign, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { CostInsights as CostInsightsData } from '../../api/insights';

interface CostInsightsProps {
  data: CostInsightsData;
}

export function CostInsights({ data }: CostInsightsProps) {
  const chartData = Object.entries(data.cost_by_model)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([model, cost]) => ({ model, cost }));

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-500">Cost Insights</h3>
        </div>
      </div>
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500">Total Spend</dt>
            <dd className="mt-1 text-2xl font-semibold text-gray-900">
              ${data.total_cost_usd.toFixed(2)}
            </dd>
            <p className="mt-1 text-xs text-gray-500">
              {data.total_calls.toLocaleString()} LLM calls
            </p>
          </div>
          {data.potential_monthly_savings > 0 && (
            <div>
              <dt className="text-sm text-gray-500">Potential Savings</dt>
              <dd className="mt-1 flex items-center gap-1">
                <TrendingDown className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-semibold text-green-600">
                  ${data.potential_monthly_savings.toFixed(0)}
                </span>
                <span className="text-sm text-gray-500">/mo</span>
              </dd>
            </div>
          )}
        </div>

        {data.potential_monthly_savings > 0 && (
          <div className="mt-4 rounded-md bg-green-50 px-3 py-2">
            <p className="text-sm text-green-800">{data.top_saving_opportunity}</p>
          </div>
        )}

        {chartData.length > 0 && (
          <div className="mt-4 h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <XAxis type="number" tickFormatter={(v) => `$${v}`} fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="model"
                  width={120}
                  fontSize={12}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']}
                />
                <Bar dataKey="cost" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
