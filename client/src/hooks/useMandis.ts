import { useQuery } from '@tanstack/react-query'
import type { Mandi } from '@shared/types'
import { apiGet } from '../shared/api'

export const useMandis = () =>
  useQuery({
    queryKey: ['mandis'],
    queryFn: () => apiGet<Mandi[]>('/mandis'),
  })
