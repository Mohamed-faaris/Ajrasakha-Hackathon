import { useQuery } from '@tanstack/react-query'
import type { Coverage, Filters } from '@shared/types'
import { apiGet } from '../shared/api'

export const useCoverage = (filters: Filters) =>
  useQuery({
    queryKey: ['coverage', filters],
    queryFn: () => apiGet<Coverage>('/coverage', filters),
  })
