import { BASE_URL } from '@/consts/api'
import { AUTH_ACCESS_KEY } from '@/consts/storage'
import type { IUserProfile } from '@/types/models'

function getAuthHeaders() {
  const token = localStorage.getItem(AUTH_ACCESS_KEY)
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function getProfile(id: string): Promise<IUserProfile> {
  const res = await fetch(`${BASE_URL}/profile/${id}`, {
    headers: getAuthHeaders(),
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to fetch profile')
  return json.data
}

export async function createProfile(data: {
  username: string
  color?: string
}): Promise<IUserProfile> {
  const res = await fetch(`${BASE_URL}/profile`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to create profile')
  return json.data
}

export async function updateProfile(data: {
  username?: string
  color?: string
}): Promise<IUserProfile> {
  const res = await fetch(`${BASE_URL}/profile`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json.message || 'Failed to update profile')
  return json.data
}
