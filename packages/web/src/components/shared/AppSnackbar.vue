<template>
  <div>
    <v-snackbar
      v-for="item in notifications.items"
      :key="item.id"
      v-model="show"
      :color="item.type"
      location="bottom right"
      :timeout="4000"
    >
      {{ item.message }}
      <template #actions>
        <v-btn variant="text" @click="notifications.dismiss(item.id)">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useNotificationStore } from '@/stores/notifications'

const notifications = useNotificationStore()
const show = ref(true)
</script>
