import type { Filters } from '@shared/types'
import { useCrops } from '../../hooks/useCrops'
import { useStates } from '../../hooks/useStates'
import { PRICE_SOURCES } from '../../shared/constants'

interface FiltersPanelProps {
  filters: Filters
  onChange: (filters: Filters) => void
}

const FiltersPanel = ({ filters, onChange }: FiltersPanelProps) => {
  const { data: crops = [] } = useCrops()
  const { data: states = [] } = useStates()

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">Filters</div>
        <span className="chip">Auto-refresh</span>
      </div>
      <div className="filters">
        <label className="field">
          Crop
          <select
            value={filters.cropId ?? ''}
            onChange={(event) => onChange({ ...filters, cropId: event.target.value || undefined })}
          >
            <option value="">All crops</option>
            {crops.map((crop) => (
              <option key={crop.id} value={crop.id}>
                {crop.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          State
          <select
            value={filters.stateId ?? ''}
            onChange={(event) => onChange({ ...filters, stateId: event.target.value || undefined })}
          >
            <option value="">All states</option>
            {states.map((state) => (
              <option key={state.id} value={state.id}>
                {state.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Date from
          <input
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={(event) => onChange({ ...filters, dateFrom: event.target.value || undefined })}
          />
        </label>
        <label className="field">
          Date to
          <input
            type="date"
            value={filters.dateTo ?? ''}
            onChange={(event) => onChange({ ...filters, dateTo: event.target.value || undefined })}
          />
        </label>
        <label className="field">
          Source
          <select
            value={filters.source ?? ''}
            onChange={(event) => onChange({ ...filters, source: event.target.value || undefined })}
          >
            <option value="">All sources</option>
            {PRICE_SOURCES.map((source) => (
              <option key={source.value} value={source.value}>
                {source.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Search
          <input
            type="search"
            placeholder="Crop, mandi, state..."
            value={filters.search ?? ''}
            onChange={(event) => onChange({ ...filters, search: event.target.value || undefined })}
          />
        </label>
      </div>
    </div>
  )
}

export default FiltersPanel
