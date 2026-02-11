import { useEffect, useMemo, useState } from 'react'
import type { Filters, Price, PriceSortBy, SortDirection } from '@shared/types'
import { usePrices } from '../../hooks/usePrices'
import LoadingState from '../Common/LoadingState'
import ErrorState from '../Common/ErrorState'
import EmptyState from '../Common/EmptyState'
import ExportButtons, { type ExportColumn } from '../Export/ExportButtons'

interface PriceTableProps {
  filters: Filters
}

const PriceTable = ({ filters }: PriceTableProps) => {
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<PriceSortBy>('date')
  const [sortDir, setSortDir] = useState<SortDirection>('desc')
  const pageSize = 10

  useEffect(() => {
    setPage(1)
  }, [filters])

  const { data, isLoading, isError } = usePrices({
    filters,
    pagination: { page, pageSize },
    sortBy,
    sortDir,
  })

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 1

  const columns = useMemo<ExportColumn<Price>[]>(
    () => [
      { key: 'date', label: 'Date' },
      { key: 'cropName', label: 'Crop' },
      { key: 'mandiName', label: 'Mandi' },
      { key: 'stateName', label: 'State' },
      { key: 'minPrice', label: 'Min' },
      { key: 'maxPrice', label: 'Max' },
      { key: 'modalPrice', label: 'Modal' },
      { key: 'unit', label: 'Unit' },
    ],
    [],
  )

  const handleSort = (next: PriceSortBy) => {
    if (sortBy === next) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(next)
      setSortDir('desc')
    }
  }

  if (isLoading) {
    return <LoadingState message="Loading price table..." />
  }

  if (isError) {
    return <ErrorState message="Unable to load price table." />
  }

  if (!data || data.items.length === 0) {
    return <EmptyState message="No prices for the selected filters." />
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Price Table</div>
          <div className="stat-label">Search, sort, and export the latest mandi prices.</div>
        </div>
        <ExportButtons
          rows={data.items}
          columns={columns}
          fileName={`mandi_prices_${new Date().toISOString().slice(0, 10)}`}
        />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('date')}>Date</th>
              <th onClick={() => handleSort('crop')}>Crop</th>
              <th onClick={() => handleSort('mandi')}>Mandi</th>
              <th onClick={() => handleSort('state')}>State</th>
              <th onClick={() => handleSort('modalPrice')}>Modal</th>
              <th>Min</th>
              <th>Max</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((price) => (
              <tr key={price.id}>
                <td>{new Date(price.date).toLocaleDateString()}</td>
                <td>{price.cropName}</td>
                <td>{price.mandiName}</td>
                <td>{price.stateName}</td>
                <td>{price.modalPrice}</td>
                <td>{price.minPrice}</td>
                <td>{price.maxPrice}</td>
                <td>{price.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-actions" style={{ justifyContent: 'space-between', marginTop: '12px' }}>
        <span className="stat-label">
          Page {data.page} of {totalPages}
        </span>
        <div className="table-actions">
          <button
            type="button"
            className="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <button
            type="button"
            className="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default PriceTable
