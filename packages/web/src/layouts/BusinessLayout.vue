<template>
  <v-app>
    <v-navigation-drawer permanent>
      <v-list-item title="Amanat" subtitle="Business Portal" class="py-4" />
      <v-divider />
      <v-list nav>
        <v-list-item to="/business/dashboard"  prepend-icon="mdi-view-dashboard" title="Dashboard" />
        <v-list-item to="/business/reports"    prepend-icon="mdi-file-chart"     title="Reports" />
        <v-list-item to="/business/reports/new" prepend-icon="mdi-plus-circle"   title="New Report" />
      </v-list>
    </v-navigation-drawer>
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>
