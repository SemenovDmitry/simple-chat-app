import { BASE_URL } from '@/consts/api'
import { AUTH_ACCESS_KEY } from '@/consts/storage'
import type { IApiResponse } from '@/types/models'

export function getAuthHeaders() {
  const token = localStorage.getItem(AUTH_ACCESS_KEY)
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(AUTH_ACCESS_KEY)
}

export async function request<T>(
  path: string,
  options: { method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      ...getAuthHeaders(),
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  })

  const json = (await res.json()) as IApiResponse<T>

  if (!res.ok) throw new Error(json.message || `Failed to ${options.method ?? 'GET'} ${path}`)

  return json.data
}
