<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { authApi } from '@/api/endpoints/auth'

const router = useRouter()
const auth = useAuthStore()
const notifications = useNotificationStore()
const loggingOut = ref(false)

async function handleLogout() {
  loggingOut.value = true
  try {
    await authApi.logout()
  } finally {
    auth.clearAuth()
    loggingOut.value = false
    notifications.info('Signed out successfully')
    router.push('/login')
  }
}
</script>

<template>
  <v-app>
    <v-navigation-drawer permanent>
      <v-list-item title="Amanat" subtitle="Business Portal" class="py-4" />
      <v-divider />
      <v-list nav>
        <v-list-item to="/business/dashboard"   prepend-icon="mdi-view-dashboard" title="Dashboard" />
        <v-list-item to="/business/reports"      prepend-icon="mdi-file-chart"     title="Reports" />
        <v-list-item to="/business/reports/new" prepend-icon="mdi-plus-circle"    title="New Report" />
      </v-list>

      <template #append>
        <v-divider />
        <v-list-item
          :subtitle="auth.user?.email"
          prepend-icon="mdi-account-circle"
          class="py-3"
        >
          <template #append>
            <v-tooltip text="Sign out" location="top">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-logout"
                  variant="text"
                  size="small"
                  :loading="loggingOut"
                  @click="handleLogout"
                />
              </template>
            </v-tooltip>
          </template>
        </v-list-item>
      </template>
    </v-navigation-drawer>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
