import { useQuery } from '@tanstack/react-query'
import type {
  ApiListResponse,
  Filters,
  Pagination,
  Price,
  PriceSortBy,
  SortDirection,
} from '@shared/types'
import { apiGet } from '../shared/api'

export interface UsePricesParams {
  filters: Filters
  pagination: Pagination
  sortBy: PriceSortBy
  sortDir: SortDirection
}

export const usePrices = ({ filters, pagination, sortBy, sortDir }: UsePricesParams) =>
  useQuery({
    queryKey: ['prices', filters, pagination, sortBy, sortDir],
    queryFn: () =>
      apiGet<ApiListResponse<Price>>('/prices', {
        ...filters,
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortBy,
        sortDir,
      }),
  })
