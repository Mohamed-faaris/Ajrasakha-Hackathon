export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api'

export type QueryParams = Record<string, string | number | boolean | undefined>

const buildQuery = (params?: QueryParams) => {
  if (!params) return ''
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === '') return
    search.set(key, String(value))
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

export const apiGet = async <T>(path: string, params?: QueryParams): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}${buildQuery(params)}`)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || `Request failed (${response.status})`)
  }
  return (await response.json()) as T
}
