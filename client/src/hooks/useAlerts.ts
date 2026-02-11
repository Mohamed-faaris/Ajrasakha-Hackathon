import { useQuery } from '@tanstack/react-query'
import type { Alert, Filters } from '@shared/types'
import { apiGet } from '../shared/api'

export const useAlerts = (filters: Filters) =>
  useQuery({
    queryKey: ['alerts', filters],
    queryFn: () => apiGet<Alert[]>('/alerts', filters),
  })
