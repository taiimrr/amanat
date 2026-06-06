<template>
  <v-app>
    <v-navigation-drawer permanent>
      <v-list-item title="Amanat" subtitle="Admin Portal" class="py-4" />
      <v-divider />
      <v-list nav>
        <v-list-item to="/admin/applications"  prepend-icon="mdi-account-check"  title="Applications" />
        <v-list-item to="/admin/contracts"     prepend-icon="mdi-handshake"      title="Contracts" />
        <v-list-item to="/admin/reports"       prepend-icon="mdi-clipboard-list" title="Report Queue" />
        <v-list-item to="/admin/distributions" prepend-icon="mdi-cash-multiple"  title="Distributions" />
        <v-list-item to="/admin/zakat"         prepend-icon="mdi-hand-heart"     title="Zakat" />
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
