<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications'
import { authApi } from '@/api/endpoints/auth'

const router = useRouter()
const auth = useAuthStore()
const notifications = useNotificationStore()

const activeTab = ref('login')
const showLoginPassword = ref(false)
const showRegPassword = ref(false)

const loginFormRef = ref()
const registerFormRef = ref()
const loginLoading = ref(false)
const registerLoading = ref(false)
const loginError = ref('')
const registerError = ref('')

const loginForm = reactive({ email: '', password: '' })

const registerForm = reactive({
  role: 'DEPOSITOR' as 'DEPOSITOR' | 'BUSINESS',
  email: '',
  password: '',
  displayName: '',
  legalName: '',
  sector: '',
  description: '',
})

const sectors = [
  { title: 'Green Energy',       value: 'GREEN_ENERGY' },
  { title: 'SME Financing',      value: 'SME_FINANCING' },
  { title: 'Affordable Housing', value: 'AFFORDABLE_HOUSING' },
  { title: 'Trade Finance',      value: 'TRADE_FINANCE' },
  { title: 'Agriculture',        value: 'AGRICULTURE' },
]

const rules = {
  required:  (v: string) => !!v || 'Required',
  email:     (v: string) => /.+@.+\..+/.test(v) || 'Invalid email',
  password:  (v: string) => /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(v) || '8+ chars, 1 uppercase, 1 number',
  minLen:    (n: number) => (v: string) => (v?.length ?? 0) >= n || `Minimum ${n} characters`,
}

function redirectByRole(role: string) {
  if (role === 'DEPOSITOR') router.push('/depositor/dashboard')
  else if (role === 'BUSINESS') router.push('/business/dashboard')
  else if (role === 'ADMIN') router.push('/admin/applications')
  else router.push('/login')
}

async function handleLogin() {
  const { valid } = await loginFormRef.value.validate()
  if (!valid) return

  loginLoading.value = true
  loginError.value = ''
  try {
    const res = await authApi.login({ email: loginForm.email, password: loginForm.password })
    auth.setAuth(res.data.user, res.data.accessToken)
    notifications.success('Welcome back!')
    redirectByRole(res.data.user.role)
  } catch (err: any) {
    loginError.value = err.response?.data?.error ?? 'Login failed. Please try again.'
  } finally {
    loginLoading.value = false
  }
}

async function handleRegister() {
  const { valid } = await registerFormRef.value.validate()
  if (!valid) return

  registerLoading.value = true
  registerError.value = ''
  try {
    const payload: Parameters<typeof authApi.register>[0] = {
      email: registerForm.email,
      password: registerForm.password,
      role: registerForm.role,
    }
    if (registerForm.role === 'DEPOSITOR') {
      payload.displayName = registerForm.displayName
    } else {
      payload.legalName   = registerForm.legalName
      payload.sector      = registerForm.sector
      payload.description = registerForm.description
    }

    const res = await authApi.register(payload)
    auth.setAuth(res.data.user, res.data.accessToken)
    notifications.success('Account created successfully!')
    redirectByRole(res.data.user.role)
  } catch (err: any) {
    registerError.value = err.response?.data?.error ?? 'Registration failed. Please try again.'
  } finally {
    registerLoading.value = false
  }
}
</script>

<template>
  <v-app>
    <v-container class="fill-height d-flex align-center justify-center" fluid>
      <v-col cols="12" sm="8" md="5" lg="4">
        <div class="text-center mb-8">
          <v-icon size="56" color="primary">mdi-shield-check</v-icon>
          <h1 class="text-h4 font-weight-bold mt-3" style="color: #1A6B4A">Amanat</h1>
          <p class="text-body-2 text-medium-emphasis mt-1">Islamic Fintech Platform</p>
        </div>

        <v-card>
          <v-tabs v-model="activeTab" grow color="primary">
            <v-tab value="login">Sign In</v-tab>
            <v-tab value="register">Register</v-tab>
          </v-tabs>

          <v-divider />

          <v-card-text class="pa-6">
            <v-window v-model="activeTab">

              <!-- ── Login ── -->
              <v-window-item value="login">
                <v-form ref="loginFormRef" @submit.prevent="handleLogin">
                  <v-text-field
                    v-model="loginForm.email"
                    label="Email"
                    type="email"
                    prepend-inner-icon="mdi-email-outline"
                    :rules="[rules.required, rules.email]"
                    autocomplete="email"
                    class="mb-2"
                  />
                  <v-text-field
                    v-model="loginForm.password"
                    label="Password"
                    :type="showLoginPassword ? 'text' : 'password'"
                    prepend-inner-icon="mdi-lock-outline"
                    :append-inner-icon="showLoginPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showLoginPassword = !showLoginPassword"
                    :rules="[rules.required]"
                    autocomplete="current-password"
                  />

                  <v-alert
                    v-if="loginError"
                    type="error"
                    variant="tonal"
                    density="compact"
                    class="mt-3 mb-2 text-body-2"
                  >
                    {{ loginError }}
                  </v-alert>

                  <v-btn
                    type="submit"
                    color="primary"
                    block
                    size="large"
                    class="mt-5"
                    :loading="loginLoading"
                  >
                    Sign In
                  </v-btn>
                </v-form>
              </v-window-item>

              <!-- ── Register ── -->
              <v-window-item value="register">
                <v-form ref="registerFormRef" @submit.prevent="handleRegister">
                  <p class="text-caption text-medium-emphasis mb-1">Account type</p>
                  <v-btn-toggle
                    v-model="registerForm.role"
                    mandatory
                    color="primary"
                    class="mb-5 w-100"
                    divided
                  >
                    <v-btn value="DEPOSITOR" class="flex-1-1">
                      <v-icon start size="18">mdi-wallet</v-icon>
                      Depositor
                    </v-btn>
                    <v-btn value="BUSINESS" class="flex-1-1">
                      <v-icon start size="18">mdi-domain</v-icon>
                      Business
                    </v-btn>
                  </v-btn-toggle>

                  <v-text-field
                    v-model="registerForm.email"
                    label="Email"
                    type="email"
                    prepend-inner-icon="mdi-email-outline"
                    :rules="[rules.required, rules.email]"
                    autocomplete="email"
                    class="mb-2"
                  />
                  <v-text-field
                    v-model="registerForm.password"
                    label="Password"
                    :type="showRegPassword ? 'text' : 'password'"
                    prepend-inner-icon="mdi-lock-outline"
                    :append-inner-icon="showRegPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showRegPassword = !showRegPassword"
                    :rules="[rules.required, rules.password]"
                    autocomplete="new-password"
                    hint="8+ chars, 1 uppercase, 1 number"
                    persistent-hint
                    class="mb-4"
                  />

                  <!-- DEPOSITOR fields -->
                  <template v-if="registerForm.role === 'DEPOSITOR'">
                    <v-text-field
                      v-model="registerForm.displayName"
                      label="Display Name"
                      prepend-inner-icon="mdi-account-outline"
                      :rules="[rules.required]"
                      autocomplete="name"
                    />
                  </template>

                  <!-- BUSINESS fields -->
                  <template v-else>
                    <v-text-field
                      v-model="registerForm.legalName"
                      label="Legal Business Name"
                      prepend-inner-icon="mdi-domain"
                      :rules="[rules.required]"
                      class="mb-2"
                    />
                    <v-select
                      v-model="registerForm.sector"
                      label="Sector"
                      prepend-inner-icon="mdi-factory"
                      :items="sectors"
                      item-title="title"
                      item-value="value"
                      :rules="[rules.required]"
                      class="mb-2"
                    />
                    <v-textarea
                      v-model="registerForm.description"
                      label="Business Description"
                      prepend-inner-icon="mdi-text"
                      :rules="[rules.required, rules.minLen(10)]"
                      rows="3"
                      hint="Describe your business activities (min 10 chars)"
                      persistent-hint
                    />
                  </template>

                  <v-alert
                    v-if="registerError"
                    type="error"
                    variant="tonal"
                    density="compact"
                    class="mt-3 mb-2 text-body-2"
                  >
                    {{ registerError }}
                  </v-alert>

                  <v-btn
                    type="submit"
                    color="primary"
                    block
                    size="large"
                    class="mt-5"
                    :loading="registerLoading"
                  >
                    Create Account
                  </v-btn>
                </v-form>
              </v-window-item>

            </v-window>
          </v-card-text>
        </v-card>
      </v-col>
    </v-container>
  </v-app>
</template>
