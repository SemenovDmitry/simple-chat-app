import type { IAuthVerify, ILoginInput, IUser } from '@/types/models'

import { request } from './utils'

export function login(payload: ILoginInput): Promise<ILoginInput> {
  return request<ILoginInput>('/auth/login', {
    method: 'POST',
    body: payload,
  })
}

export function verifyToken(accessToken: string): Promise<IAuthVerify> {
  return request<IAuthVerify>('/auth/verify', {
    method: 'POST',
    body: { access_token: accessToken },
  })
}

export function me(): Promise<IUser> {
  return request<IUser>('/auth/me')
}
