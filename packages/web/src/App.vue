<script setup lang="ts">
import { onMounted } from 'vue'
import AppSnackbar from '@/components/shared/AppSnackbar.vue'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api/endpoints/auth'

const auth = useAuthStore()

onMounted(async () => {
  if (!auth.isAuthenticated) {
    try {
      const refreshRes = await authApi.refresh()
      auth.accessToken = refreshRes.data.accessToken
      const meRes = await authApi.me()
      auth.setAuth(meRes.data, refreshRes.data.accessToken)
    } catch {
      // No valid refresh token — user will be sent to login by the route guard
    }
  }
})
</script>

<template>
  <router-view />
  <AppSnackbar />
</template>
