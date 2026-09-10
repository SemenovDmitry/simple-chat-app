export type IUserStatus = 'online' | 'offline'

export type IUser = {
  id: string
  email: string
  profile?: IUserProfile | null
}

export type IUserProfile = {
  id: string
  username: string
  color: string
  created_at: string
  updated_at: string
}
