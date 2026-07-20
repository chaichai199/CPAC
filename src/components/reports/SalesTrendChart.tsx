import { Bar, CartesianGrid, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export interface TrendPoint {
  label: string
  revenue: number
  volume: number
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; dataKey: string }[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-xl border border-sand-200 bg-white/95 px-3 py-2 text-xs shadow-elevated">
      <p className="mb-1 font-semibold text-stone-700">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-mono text-stone-600">
          {p.dataKey === 'revenue' ? 'รายได้: ฿' : 'ปริมาณ: '}
          {p.value.toLocaleString('th-TH')}
          {p.dataKey === 'volume' ? ' คิว' : ''}
        </p>
      ))}
    </div>
  )
}

export function SalesTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2d0ac" opacity={0.5} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#7d7361' }} axisLine={{ stroke: '#e2d0ac' }} tickLine={false} />
        <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#7d7361' }} axisLine={false} tickLine={false} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#bd9a5f' }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(189,154,95,0.08)' }} />
        <Bar yAxisId="left" dataKey="revenue" fill="#bd9a5f" radius={[6, 6, 0, 0]} maxBarSize={38} name="รายได้" />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="volume"
          stroke="#4a4438"
          strokeWidth={2}
          dot={{ r: 3, fill: '#4a4438' }}
          name="ปริมาณ"
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}
