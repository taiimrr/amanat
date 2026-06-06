<template>
  <v-app>
    <v-navigation-drawer permanent>
      <v-list-item title="Amanat" subtitle="Depositor Portal" class="py-4" />
      <v-divider />
      <v-list nav>
        <v-list-item to="/depositor/dashboard" prepend-icon="mdi-view-dashboard" title="Dashboard" />
        <v-list-item to="/depositor/portfolio"  prepend-icon="mdi-briefcase"       title="Portfolio" />
        <v-list-item to="/depositor/impact"     prepend-icon="mdi-leaf"            title="Impact" />
        <v-list-item to="/depositor/audit"      prepend-icon="mdi-shield-check"    title="Audit Trail" />
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
