import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

interface MonthlyData {
  month: string;
  countArs: number;
  countUsd: number;
}

interface Props {
  data: MonthlyData[];
  language: 'en' | 'es';
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-card border border-border rounded-lg shadow-lg p-3 text-xs">
      <p className="text-text-primary font-semibold mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="font-medium">
          {entry.name}: {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export const CollectionChart = ({ data, language }: Props) => {
  const monthNames: Record<string, string> = language === 'es'
    ? { '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic' }
    : { '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr', '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Aug', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec' };

  const chartData = data.map((d) => {
    const [, m] = d.month.split('-');
    return {
      ...d,
      label: monthNames[m] ?? d.month,
    };
  });

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barGap={2} barCategoryGap="20%" margin={{ left: -20, right: 0, top: 4, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle, #2a2a3a)" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--color-text-muted, #8b8fa3)' }}
            axisLine={{ stroke: 'var(--color-border, #2a2a3a)' }}
            tickLine={false}
          />
          <YAxis
            width={30}
            tick={{ fontSize: 10, fill: 'var(--color-text-muted, #8b8fa3)' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-bg-card-hover, #1e1e2e)' }} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value: string) => {
              const labels: Record<string, string> = language === 'es'
                ? { countArs: 'Pagos ARS', countUsd: 'Pagos USD' }
                : { countArs: 'ARS Payments', countUsd: 'USD Payments' };
              return labels[value] ?? value;
            }}
          />
          <Bar dataKey="countArs" name="countArs" fill="#7c3aed" radius={[4, 4, 0, 0]} />
          <Bar dataKey="countUsd" name="countUsd" fill="#06b6d4" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
