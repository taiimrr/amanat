import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/auth/LoginPage.vue'),
      meta: { public: true },
    },
    {
      path: '/depositor',
      component: () => import('@/layouts/DepositorLayout.vue'),
      meta: { role: 'DEPOSITOR' },
      children: [
        { path: '', redirect: '/depositor/dashboard' },
        { path: 'dashboard', name: 'depositor-dashboard', component: () => import('@/pages/depositor/DashboardPage.vue') },
        { path: 'portfolio',  name: 'depositor-portfolio', component: () => import('@/pages/depositor/PortfolioPage.vue') },
        { path: 'impact',     name: 'depositor-impact',    component: () => import('@/pages/depositor/ImpactPage.vue') },
        { path: 'audit',      name: 'depositor-audit',     component: () => import('@/pages/depositor/AuditPage.vue') },
      ],
    },
    {
      path: '/business',
      component: () => import('@/layouts/BusinessLayout.vue'),
      meta: { role: 'BUSINESS' },
      children: [
        { path: '', redirect: '/business/dashboard' },
        { path: 'dashboard', name: 'business-dashboard', component: () => import('@/pages/business/DashboardPage.vue') },
        { path: 'reports',    name: 'business-reports',   component: () => import('@/pages/business/ReportsPage.vue') },
        { path: 'reports/new', name: 'business-report-new', component: () => import('@/pages/business/ReportNewPage.vue') },
      ],
    },
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { role: 'ADMIN' },
      children: [
        { path: '', redirect: '/admin/applications' },
        { path: 'applications', name: 'admin-applications', component: () => import('@/pages/admin/ApplicationsPage.vue') },
        { path: 'contracts',    name: 'admin-contracts',    component: () => import('@/pages/admin/ContractsPage.vue') },
        { path: 'reports',      name: 'admin-reports',      component: () => import('@/pages/admin/ReportQueuePage.vue') },
        { path: 'distributions',name: 'admin-distributions',component: () => import('@/pages/admin/DistributionsPage.vue') },
        { path: 'zakat',        name: 'admin-zakat',        component: () => import('@/pages/admin/ZakatPage.vue') },
      ],
    },
    { path: '/', redirect: '/login' },
    { path: '/:pathMatch(.*)*', redirect: '/login' },
  ],
})

// Route guard — role-based access
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.public) return true
  if (!auth.isAuthenticated) return '/login'
  const required = to.meta.role as string | undefined
  if (required && auth.user?.role !== required) return '/login'
  return true
})

export default router
