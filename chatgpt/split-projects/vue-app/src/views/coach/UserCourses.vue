<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCoachStore } from '@/stores/coachStore'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const coach = useCoachStore()
const user = useUserStore()

const products = computed(() => user.userProducts)
const defaultAvatar = '/coach-photo.jpg'

onMounted(() => {
  coach.syncUserProducts()
})
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="nav"><div class="back" @click="router.push('/coach')">‹</div>私教课<div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div></div>
      <div class="user-shell">
        <div class="work-edit" style="margin:0 0 16px" @click="router.push('/coach/user/bookings')">查看我的预约</div>
        <div v-if="!products.length" class="user-empty">
          <div class="empty-title">暂无可预约课程</div>
          <div>先在教练端创建并上架课程，再配置课次，用户端就会自动回填。</div>
        </div>
        <div v-for="p in products" :key="p.id" class="user-course-card">
          <div class="user-avatar" :style="{ backgroundImage: `url(${coach.coachProfile?.avatar || defaultAvatar})`, backgroundSize: 'cover', backgroundPosition: 'center' }"></div>
          <div class="user-course-main">
            <div class="user-course-title">{{ p.name }}</div>
            <div class="user-course-sub">剩余{{ p.remain }}课时</div>
          </div>
          <button v-if="p.remain > 0" class="user-action-btn" @click="user.currentUserProductId = p.id; router.push('/coach/user/booking')">预约</button>
          <button v-else class="user-action-btn" disabled>已用完</button>
        </div>
      </div>
    </div>
  </div>
</template>
