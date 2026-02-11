import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TopMover } from '@shared/types'
import EmptyState from '../Common/EmptyState'

interface TopMoversChartProps {
  data: TopMover[]
}

const TopMoversChart = ({ data }: TopMoversChartProps) => {
  if (!data.length) {
    return <EmptyState message="No movers data yet." />
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data.slice(0, 8)}>
        <XAxis dataKey="cropName" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="changePct" fill="#0d6a5e" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default TopMoversChart
