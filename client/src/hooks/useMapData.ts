import { useQuery } from '@tanstack/react-query'
import type { Filters, MandiPrice } from '@shared/types'
import { apiGet } from '../shared/api'

export const useMapData = (filters: Filters) =>
  useQuery({
    queryKey: ['map-data', filters],
    queryFn: () => apiGet<MandiPrice[]>('/map/mandi-prices', filters),
  })
