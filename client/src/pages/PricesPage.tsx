import { useState } from 'react'
import type { Filters } from '@shared/types'
import FiltersPanel from '../components/Filters/FiltersPanel'
import PriceTable from '../components/Table/PriceTable'
import PriceTrendChart from '../components/Charts/PriceTrendChart'
import TopMoversChart from '../components/Charts/TopMoversChart'
import LoadingState from '../components/Common/LoadingState'
import ErrorState from '../components/Common/ErrorState'
import { usePriceTrends } from '../hooks/usePriceTrends'
import { useTopMovers } from '../hooks/useTopMovers'

const PricesPage = () => {
  const [filters, setFilters] = useState<Filters>({})

  const trendsQuery = usePriceTrends(filters)
  const moversQuery = useTopMovers(filters)

  return (
    <>
      <section className="page-header">
        <div>
          <div className="page-title">Prices</div>
          <div className="page-subtitle">
            Explore mandi prices with filters, sorting, and exports.
          </div>
        </div>
        <span className="chip">Live data</span>
      </section>

      <FiltersPanel filters={filters} onChange={setFilters} />

      <section className="grid grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Trend Lines</div>
            <span className="chip">Modal price</span>
          </div>
          {trendsQuery.isLoading && <LoadingState message="Loading trends..." />}
          {trendsQuery.isError && <ErrorState message="Unable to load trends." />}
          {trendsQuery.data && <PriceTrendChart data={trendsQuery.data} />}
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Top Movers</div>
            <span className="chip">Percent change</span>
          </div>
          {moversQuery.isLoading && <LoadingState message="Loading movers..." />}
          {moversQuery.isError && <ErrorState message="Unable to load movers." />}
          {moversQuery.data && <TopMoversChart data={moversQuery.data} />}
        </div>
      </section>

      <PriceTable filters={filters} />
    </>
  )
}

export default PricesPage
