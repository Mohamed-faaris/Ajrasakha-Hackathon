import { useState } from 'react'
import type { Filters } from '@shared/types'
import FiltersPanel from '../components/Filters/FiltersPanel'
import SummaryCards from '../components/Dashboard/SummaryCards'
import TopMoversList from '../components/Dashboard/TopMoversList'
import AlertsPanel from '../components/Dashboard/AlertsPanel'
import PriceTrendChart from '../components/Charts/PriceTrendChart'
import TopMoversChart from '../components/Charts/TopMoversChart'
import LoadingState from '../components/Common/LoadingState'
import ErrorState from '../components/Common/ErrorState'
import { useCoverage } from '../hooks/useCoverage'
import { useTopMovers } from '../hooks/useTopMovers'
import { useAlerts } from '../hooks/useAlerts'
import { usePriceTrends } from '../hooks/usePriceTrends'

const DashboardPage = () => {
  const [filters, setFilters] = useState<Filters>({})

  const coverageQuery = useCoverage(filters)
  const moversQuery = useTopMovers(filters)
  const alertsQuery = useAlerts(filters)
  const trendsQuery = usePriceTrends(filters)

  return (
    <>
      <section className="page-header">
        <div>
          <div className="page-title">Market Snapshot</div>
          <div className="page-subtitle">Live coverage, movers, and alerts in one glance.</div>
        </div>
        <span className="chip">Auto-refresh via React Query</span>
      </section>

      <FiltersPanel filters={filters} onChange={setFilters} />

      <SummaryCards coverage={coverageQuery.data} movers={moversQuery.data} />

      <section className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Price Trend</div>
            <span className="chip">Modal Price</span>
          </div>
          {trendsQuery.isLoading && <LoadingState message="Loading trends..." />}
          {trendsQuery.isError && <ErrorState message="Unable to load trends." />}
          {trendsQuery.data && <PriceTrendChart data={trendsQuery.data} />}
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Top Movers</div>
            <span className="chip">Last 24h</span>
          </div>
          {moversQuery.isLoading && <LoadingState message="Loading movers..." />}
          {moversQuery.isError && <ErrorState message="Unable to load movers." />}
          {moversQuery.data && <TopMoversChart data={moversQuery.data} />}
        </div>
      </section>

      <section className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Latest Movers</div>
            <span className="chip">Top 6</span>
          </div>
          {moversQuery.isLoading && <LoadingState message="Loading movers..." />}
          {moversQuery.isError && <ErrorState message="Unable to load movers." />}
          {moversQuery.data && <TopMoversList movers={moversQuery.data} />}
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Alerts</div>
            <span className="chip">Thresholds</span>
          </div>
          {alertsQuery.isLoading && <LoadingState message="Loading alerts..." />}
          {alertsQuery.isError && <ErrorState message="Unable to load alerts." />}
          {alertsQuery.data && <AlertsPanel alerts={alertsQuery.data} />}
        </div>
      </section>
    </>
  )
}

export default DashboardPage
