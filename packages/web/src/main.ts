import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersistedstate from 'pinia-plugin-persistedstate'
import { vuetify } from './plugins/vuetify'
import { VueQueryPlugin, queryClient } from './plugins/query'
import router from './plugins/router'
import App from './App.vue'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPersistedstate)

app.use(pinia)
app.use(vuetify)
app.use(VueQueryPlugin, { queryClient })
app.use(router)

app.mount('#app')
