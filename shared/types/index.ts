// User types
export interface User {
  _id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

export type ISODateString = string

export type PriceSource = 'agmarknet' | 'mandi-insights' | 'other'
export type SortDirection = 'asc' | 'desc'
export type PriceSortBy = 'date' | 'crop' | 'state' | 'mandi' | 'modalPrice'

export interface Crop {
  id: string
  name: string
  commodityGroup?: string
}

export interface State {
  id: string
  name: string
  code?: string
}

export interface Mandi {
  id: string
  name: string
  stateId: string
  stateName: string
  latitude: number
  longitude: number
}

export interface Price {
  id: string
  cropId: string
  cropName: string
  mandiId: string
  mandiName: string
  stateId: string
  stateName: string
  date: ISODateString
  minPrice: number
  maxPrice: number
  modalPrice: number
  unit: string
  arrival?: number
  source?: PriceSource
}

export interface Coverage {
  totalApmcs: number
  coveredApmcs: number
  coveragePercent: number
  statesCovered: number
  lastUpdated: ISODateString
}

export interface Alert {
  id: string
  cropId: string
  cropName: string
  mandiId?: string
  mandiName?: string
  thresholdPrice: number
  direction: 'above' | 'below'
  isActive: boolean
  triggeredAt?: ISODateString
  message?: string
}

export interface PriceTrendPoint {
  date: ISODateString
  modalPrice: number
}

export interface TopMover {
  cropId: string
  cropName: string
  latestPrice: number
  previousPrice: number
  changePct: number
  direction: 'up' | 'down'
}

export interface MandiPrice {
  mandiId: string
  mandiName: string
  stateName: string
  latitude: number
  longitude: number
  modalPrice: number
  date: ISODateString
  cropName?: string
}

export interface Filters {
  cropId?: string
  stateId?: string
  dateFrom?: ISODateString
  dateTo?: ISODateString
  source?: PriceSource
  search?: string
}

export interface Pagination {
  page: number
  pageSize: number
}

export interface ApiListResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

