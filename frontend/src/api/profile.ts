import type { IUserProfile, IUserProfileInput } from '@/types/models'

import { request } from './utils'

export function getProfile(id: string): Promise<IUserProfile> {
  return request<IUserProfile>(`/profile/${id}`)
}

export function createProfile(data: IUserProfileInput): Promise<IUserProfile> {
  return request<IUserProfile>('/profile', { method: 'POST', body: data })
}

export function updateProfile(
  data: Partial<IUserProfileInput>,
): Promise<IUserProfile> {
  return request<IUserProfile>('/profile', { method: 'PATCH', body: data })
}
