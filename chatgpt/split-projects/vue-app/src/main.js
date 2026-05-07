import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

function setAppMode(path) {
  document.body.setAttribute('data-app', path.startsWith('/user') ? 'user' : 'coach')
}
setAppMode(window.location.pathname)
router.afterEach((to) => setAppMode(to.path))

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
