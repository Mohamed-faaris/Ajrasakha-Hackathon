import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PriceTrendPoint } from '@shared/types'
import EmptyState from '../Common/EmptyState'

interface PriceTrendChartProps {
  data: PriceTrendPoint[]
}

const PriceTrendChart = ({ data }: PriceTrendChartProps) => {
  if (!data.length) {
    return <EmptyState message="No trend data yet." />
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="modalPrice"
          stroke="#0d6a5e"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default PriceTrendChart
