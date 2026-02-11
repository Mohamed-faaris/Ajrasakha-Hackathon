import { useState } from 'react'
import type { Filters } from '@shared/types'
import FiltersPanel from '../components/Filters/FiltersPanel'
import MandiMap from '../components/Map/MandiMap'
import LoadingState from '../components/Common/LoadingState'
import ErrorState from '../components/Common/ErrorState'
import { useMapData } from '../hooks/useMapData'

const MapPage = () => {
  const [filters, setFilters] = useState<Filters>({})
  const mapQuery = useMapData(filters)

  return (
    <>
      <section className="page-header">
        <div>
          <div className="page-title">APMC Map</div>
          <div className="page-subtitle">Heatmap-style view of mandi prices.</div>
        </div>
        <span className="chip">Live map</span>
      </section>

      <FiltersPanel filters={filters} onChange={setFilters} />

      {mapQuery.isLoading && <LoadingState message="Loading mandi map..." />}
      {mapQuery.isError && <ErrorState message="Unable to load map data." />}
      {mapQuery.data && <MandiMap data={mapQuery.data} />}
    </>
  )
}

export default MapPage
