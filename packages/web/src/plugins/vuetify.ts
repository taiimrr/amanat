import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

export const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: 'amanatLight',
    themes: {
      amanatLight: {
        dark: false,
        colors: {
          primary:    '#1A6B4A',
          secondary:  '#C8960C',
          success:    '#2D7A4F',
          warning:    '#B86A00',
          error:      '#C0392B',
          info:       '#1A5F8A',
          surface:    '#FAFAF8',
          background: '#F4F4F0',
        },
      },
    },
  },
  defaults: {
    VCard: { elevation: 1, rounded: 'lg' },
    VBtn: { rounded: 'lg' },
    VTextField: { variant: 'outlined', density: 'comfortable' },
    VSelect: { variant: 'outlined', density: 'comfortable' },
    VDataTable: { hover: true },
  },
})
