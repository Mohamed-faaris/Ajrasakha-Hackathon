import { useQuery } from '@tanstack/react-query'
import type { Filters, PriceTrendPoint } from '@shared/types'
import { apiGet } from '../shared/api'

export const usePriceTrends = (filters: Filters) =>
  useQuery({
    queryKey: ['price-trends', filters],
    queryFn: () => apiGet<PriceTrendPoint[]>('/trends', filters),
  })
