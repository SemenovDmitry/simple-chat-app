export type IUserStatus = 'online' | 'offline'

export type IUser = {
  id: string
  email: string
  profile?: IUserProfile
}

export type IUserProfile = {
  id: string
  username: string
  color: string
  // last_seen: string | null
  created_at: string
  updated_at: string
}

export type IRoom = {
  id: string
  owner_id: string
  name: string
  description: string
  is_private: boolean
  created_at: string
  updated_at: string
}

export type IRoomMember = {
  room_id: string
  user_id: string
  // role: 'owner' | 'admin' | 'member'
  joined_at: string
}

export type IMessage = {
  id: string
  room_id: string
  user_id: string | null
  content: string
  created_at: string
}
