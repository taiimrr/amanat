import { defineStore } from 'pinia'
import { ref } from 'vue'

type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface Notification {
  id: string
  message: string
  type: NotificationType
}

export const useNotificationStore = defineStore('notifications', () => {
  const items = ref<Notification[]>([])

  function push(message: string, type: NotificationType, durationMs = 4000) {
    const id = crypto.randomUUID()
    items.value.push({ id, message, type })
    if (durationMs > 0) {
      setTimeout(() => dismiss(id), durationMs)
    }
    return id
  }

  const success = (msg: string) => push(msg, 'success')
  const error   = (msg: string) => push(msg, 'error', 6000)
  const warn    = (msg: string) => push(msg, 'warning')
  const info    = (msg: string) => push(msg, 'info')

  function dismiss(id: string) {
    items.value = items.value.filter(n => n.id !== id)
  }

  return { items, success, error, warn, info, dismiss }
})
