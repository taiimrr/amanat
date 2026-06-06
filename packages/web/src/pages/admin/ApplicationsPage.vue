<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const upcomingFeatures = [
  'Review business applications',
  'Due diligence score breakdown',
  'Approve / reject businesses',
  'Contract management',
]
</script>

<template>
  <v-container class="pa-6">
    <h1 class="text-h4 font-weight-bold mb-1">Business Applications</h1>
    <p class="text-body-2 text-medium-emphasis mb-6">Admin panel — logged in as {{ auth.user?.email }}</p>

    <v-row>
      <v-col cols="12" md="6" lg="4">
        <v-card color="primary" variant="tonal">
          <v-card-text>
            <div class="d-flex align-center mb-3">
              <v-icon color="primary" class="mr-2">mdi-account-circle</v-icon>
              <span class="text-subtitle-2 font-weight-medium">Admin Session</span>
            </div>
            <v-list-item class="px-0">
              <v-list-item-subtitle>Email</v-list-item-subtitle>
              <v-list-item-title class="text-body-2">{{ auth.user?.email }}</v-list-item-title>
            </v-list-item>
            <v-list-item class="px-0 mt-1">
              <v-list-item-subtitle>Role</v-list-item-subtitle>
              <v-list-item-title>
                <v-chip color="error" size="small" label>{{ auth.user?.role }}</v-chip>
              </v-list-item-title>
            </v-list-item>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6" lg="4">
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
