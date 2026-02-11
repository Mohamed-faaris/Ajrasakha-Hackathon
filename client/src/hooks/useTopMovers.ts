import { useQuery } from '@tanstack/react-query'
import type { Filters, TopMover } from '@shared/types'
import { apiGet } from '../shared/api'

export const useTopMovers = (filters: Filters) =>
  useQuery({
    queryKey: ['top-movers', filters],
    queryFn: () => apiGet<TopMover[]>('/top-movers', filters),
  })
