import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/home.vue'
import Dashboard from '../views/dashboard.vue'
import Users from '../views/users.vue'
import Settings from '../views/settings.vue'
import Reports from '../views/reports.vue'
import Documents from '../views/documents.vue'
import Help from '../views/help.vue'
import PuzzleGame from '../views/puzzlegamefixed.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/users',
    name: 'Users',
    component: Users
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  },
  {
    path: '/reports',
    name: 'Reports',
    component: Reports
  },
  {
    path: '/documents',
    name: 'Documents',
    component: Documents
  },
  {
    path: '/help',
    name: 'Help',
    component: Help
  },
  {
    path: '/puzzlegame',
    name: 'PuzzleGame',
    component: PuzzleGame
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
