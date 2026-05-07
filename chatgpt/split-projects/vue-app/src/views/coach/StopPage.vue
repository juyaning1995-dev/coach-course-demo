<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCoachStore } from '@/stores/coachStore'

const router = useRouter()
const route = useRoute()
const coach = useCoachStore()

const s = computed(() => coach.schedules.find(s => s.id === Number(route.params.id)))
const stopped = computed(() => s.value?.status === '停止预约')

function confirm() {
  if (!s.value) return
  const wasStopped = s.value.status === '停止预约'
  coach.toggleStopBooking(s.value.id)
  window.__toast?.(wasStopped ? '已开启预约' : '已停止预约')
  router.push('/coach/calendar')
}
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="nav"><div class="back" @click="router.push('/coach/calendar')">‹</div>{{ stopped ? '开启预约' : '停止预约' }}<div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div></div>
      <div class="stop-icon">!</div>
      <div class="stop-text">
        <template v-if="stopped">开启预约后，学员将可以继续预约<br/>该课次未满员时会恢复可预约</template>
        <template v-else>停止预约后，学员将无法再预约<br/>该课次已预约的学员不受影响</template>
      </div>
      <button :class="stopped ? 'orange-btn' : 'red-btn'" @click="confirm">{{ stopped ? '确认开启' : '确认停止' }}</button>
    </div>
  </div>
</template>
