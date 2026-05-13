import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

// Clear localStorage data via ?clear=coach | ?clear=user | ?clear=all
const clearParam = new URLSearchParams(window.location.search).get('clear')
if (clearParam) {
  const prefix = 'coachSplitProject_'
  const coachKeys = ['courses', 'workTimes', 'schedules', 'coachProfile', 'storeInfo']
  const userKeys = ['userProducts', 'userBookings', 'userContracts']
  let keysToClear = []
  if (clearParam === 'coach') keysToClear = coachKeys
  else if (clearParam === 'user') keysToClear = userKeys
  else keysToClear = [...coachKeys, ...userKeys]
  keysToClear.forEach(k => localStorage.removeItem(prefix + k))
}

function setAppMode(path) {
  document.body.setAttribute('data-app', path.startsWith('/user') ? 'user' : 'coach')
}
setAppMode(window.location.pathname)
router.afterEach((to) => setAppMode(to.path))

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
