import { useQuery } from '@tanstack/react-query'
import type { Crop } from '@shared/types'
import { apiGet } from '../shared/api'

export const useCrops = () =>
  useQuery({
    queryKey: ['crops'],
    queryFn: () => apiGet<Crop[]>('/crops'),
  })
