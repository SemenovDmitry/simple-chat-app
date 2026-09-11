import type { IRoom } from '@/types/models'

import { request } from './utils'

export function getRooms(): Promise<IRoom[]> {
  return request<IRoom[]>(`/rooms`)
}

export function getRoom(id: string): Promise<IRoom> {
  return request<IRoom>(`/rooms/${id}`)
}

export type ICreateRoom = Pick<IRoom, 'name' | 'is_private'> & Partial<Pick<IRoom, 'description'>>

export function createRoom(data: ICreateRoom): Promise<IRoom> {
  return request<IRoom>('/rooms', { method: 'POST', body: data })
}

export type IUpddateRoom = Partial<Pick<IRoom, 'name' | 'description' | 'is_private'>>

export function updateRoom(data: IUpddateRoom): Promise<IRoom> {
  return request<IRoom>('/rooms', { method: 'PATCH', body: data })
}

export function deleteRoom(id: string): Promise<IRoom> {
  return request<IRoom>(`/rooms/${id}`, { method: 'DELETE' })
}

export function joinRoom(id: string): Promise<IRoom> {
  return request<IRoom>(`/rooms/${id}/join`, { method: 'POST' })
}

export function leaveRoom(id: string): Promise<IRoom> {
  return request<IRoom>(`/rooms/${id}/leave`, { method: 'POST' })
}

export function getRoomMembers(id: string): Promise<IRoom> {
  return request<IRoom>(`/rooms/${id}/members`, { method: 'GET' })
}
