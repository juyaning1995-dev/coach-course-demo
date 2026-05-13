<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCoachStore } from '@/stores/coachStore'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const route = useRoute()
const toastMsg = ref('')
const toastVisible = ref(false)
let toastTimer = null

function showToast(msg) {
  toastMsg.value = msg
  toastVisible.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastVisible.value = false }, 1500)
}

window.__toast = showToast

let lastMode = ''
watch(() => route.path, (path) => {
  const mode = path.startsWith('/user') ? 'user' : 'coach'
  document.body.setAttribute('data-app', mode)
  if (mode !== lastMode) {
    lastMode = mode
    useCoachStore().reloadSchedules()
    useUserStore().reload()
  }
}, { immediate: true })
</script>

<template>
  <div class="app-shell">
    <router-view />
    <div class="toast" :style="{ display: toastVisible ? 'block' : 'none' }">{{ toastMsg }}</div>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: var(--app-bg, #111);
}
.toast {
  display: none;
  position: fixed;
  left: 50%;
  bottom: 120px;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.78);
  color: #fff;
  padding: 10px 22px;
  border-radius: 22px;
  font-size: 14px;
  z-index: 9999;
  white-space: nowrap;
  pointer-events: none;
}
</style>
