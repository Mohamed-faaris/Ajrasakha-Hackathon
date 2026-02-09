import { useQuery } from '@tanstack/react-query'
import type { State } from '@shared/types'
import { apiGet } from '../shared/api'

export const useStates = () =>
  useQuery({
    queryKey: ['states'],
    queryFn: () => apiGet<State[]>('/states'),
  })
