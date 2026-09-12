import type { IRoom } from '@/types/models'

import { request } from './utils'

export function getRooms(): Promise<IRoom[]> {
  return request<IRoom[]>(`/rooms`)
}

export function getRoom(id: string): Promise<IRoom> {
  return request<IRoom>(`/rooms/${id}`)
}

export type ICreateRoom = Pick<IRoom, 'name'> &
  Partial<Pick<IRoom, 'description'>>

export function createRoom(data: ICreateRoom): Promise<IRoom> {
  return request<IRoom>('/rooms', { method: 'POST', body: data })
}

export type IUpdateRoom = Partial<Pick<IRoom, 'name' | 'description'>>

export function updateRoom(id: string, data: IUpdateRoom): Promise<IRoom> {
  return request<IRoom>(`/rooms/${id}`, { method: 'PATCH', body: data })
}

export function deleteRoom(id: string): Promise<IRoom> {
  return request<IRoom>(`/rooms/${id}`, { method: 'DELETE' })
}
