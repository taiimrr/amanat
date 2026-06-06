<template>
  <v-container class="pa-6">
    <h1 class="text-h4 font-weight-bold mb-1">Dashboard</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">Welcome back, {{ auth.user?.email }}</p>

    <!-- Auth status card -->
    <v-row>
      <v-col cols="12" md="6" lg="4">
        <v-card color="primary" variant="tonal">
          <v-card-text>
            <div class="d-flex align-center mb-3">
              <v-icon color="primary" class="mr-2">mdi-account-circle</v-icon>
              <span class="text-subtitle-2 font-weight-medium">Session</span>
            </div>
            <v-list-item class="px-0">
              <v-list-item-subtitle>Email</v-list-item-subtitle>
              <v-list-item-title class="text-body-2">{{ auth.user?.email }}</v-list-item-title>
            </v-list-item>
            <v-list-item class="px-0 mt-1">
              <v-list-item-subtitle>Role</v-list-item-subtitle>
              <v-list-item-title>
                <v-chip color="primary" size="small" label>{{ auth.user?.role }}</v-chip>
              </v-list-item-title>
            </v-list-item>
            <v-list-item class="px-0 mt-1">
              <v-list-item-subtitle>Token</v-list-item-subtitle>
              <v-list-item-title>
                <v-chip color="success" size="small" label prepend-icon="mdi-check-circle">Active</v-chip>
              </v-list-item-title>
            </v-list-item>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6" lg="4">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center mb-3">
              <v-icon color="secondary" class="mr-2">mdi-api</v-icon>
              <span class="text-subtitle-2 font-weight-medium">API Verification</span>
            </div>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Test the <code>/auth/me</code> endpoint to confirm your token is valid.
            </p>
            <v-btn
              color="primary"
              variant="tonal"
              size="small"
              prepend-icon="mdi-send"
              :loading="verifying"
              @click="verifyToken"
            >
              Verify Token
            </v-btn>
            <v-alert
              v-if="verifyResult"
              :type="verifyResult.ok ? 'success' : 'error'"
              variant="tonal"
              density="compact"
              class="mt-3 text-body-2"
            >
              {{ verifyResult.message }}
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="12" lg="4">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center mb-3">
              <v-icon color="info" class="mr-2">mdi-information-outline</v-icon>
              <span class="text-subtitle-2 font-weight-medium">Coming Next</span>
            </div>
            <v-list density="compact" class="pa-0">
              <v-list-item
                v-for="item in upcomingFeatures"
                :key="item"
                :title="item"
                prepend-icon="mdi-clock-outline"
                density="compact"
                class="px-0"
              />
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api/endpoints/auth'

const auth = useAuthStore()
const verifying = ref(false)
const verifyResult = ref<{ ok: boolean; message: string } | null>(null)

const upcomingFeatures = [
  'Wallet balance & portfolio',
  'Allocation breakdown chart',
  'Recent distributions',
  'Impact metrics',
]

async function verifyToken() {
  verifying.value = true
  verifyResult.value = null
  try {
    const res = await authApi.me()
    verifyResult.value = {
      ok: true,
      message: `Verified: ${res.data.email} (${res.data.role})`,
    }
  } catch {
    verifyResult.value = { ok: false, message: 'Token verification failed.' }
  } finally {
    verifying.value = false
  }
}
</script>
