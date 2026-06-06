import { apiClient } from '@/api/client'

export interface AuthUser {
  id: string
  email: string
  role: 'DEPOSITOR' | 'BUSINESS' | 'ADMIN'
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  role: 'DEPOSITOR' | 'BUSINESS'
  displayName?: string
  legalName?: string
  sector?: string
  description?: string
}

export interface AuthResponse {
  user: AuthUser
  accessToken: string
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/login', payload),

  register: (payload: RegisterPayload) =>
    apiClient.post<AuthResponse>('/auth/register', payload),

  logout: () =>
    apiClient.post('/auth/logout'),

  refresh: () =>
    apiClient.post<{ accessToken: string }>('/auth/refresh'),

  me: () =>
    apiClient.get<AuthUser>('/auth/me'),
}
