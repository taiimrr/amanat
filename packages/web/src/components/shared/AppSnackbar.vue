<template>
  <template v-for="item in notifications.items" :key="item.id">
    <v-snackbar
      :model-value="true"
      :color="item.type"
      location="bottom right"
      :timeout="4000"
      @update:model-value="notifications.dismiss(item.id)"
    >
      {{ item.message }}
      <template #actions>
        <v-btn variant="text" @click="notifications.dismiss(item.id)">Close</v-btn>
      </template>
    </v-snackbar>
  </template>
</template>

<script setup lang="ts">
import { useNotificationStore } from '@/stores/notifications'

const notifications = useNotificationStore()
</script>
