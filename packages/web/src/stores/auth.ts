import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface AuthUser {
  id: string
  email: string
  role: 'DEPOSITOR' | 'BUSINESS' | 'ADMIN'
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const accessToken = ref<string | null>(null)  // memory only — never localStorage

  const isAuthenticated = computed(() => !!user.value && !!accessToken.value)
  const isDepositor = computed(() => user.value?.role === 'DEPOSITOR')
  const isBusiness  = computed(() => user.value?.role === 'BUSINESS')
  const isAdmin     = computed(() => user.value?.role === 'ADMIN')

  function setAuth(userData: AuthUser, token: string) {
    user.value = userData
    accessToken.value = token
  }

  function clearAuth() {
    user.value = null
    accessToken.value = null
  }

  return {
    user,
    accessToken,
    isAuthenticated,
    isDepositor,
    isBusiness,
    isAdmin,
    setAuth,
    clearAuth,
  }
})
