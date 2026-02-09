import type { PriceSource } from '@shared/types'

export const PRICE_SOURCES: { label: string; value: PriceSource }[] = [
  { label: 'Agmarknet', value: 'agmarknet' },
  { label: 'Mandi Insights', value: 'mandi-insights' },
  { label: 'Other', value: 'other' },
]
