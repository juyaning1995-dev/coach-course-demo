<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCoachStore } from '@/stores/coachStore'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const coach = useCoachStore()
const userStore = useUserStore()

const avatarUrl = computed(() => coach.coachProfile?.avatar || '/coach-photo.jpg')

const products = computed(() => userStore.userProducts)

function hasContract(productId) {
  return !!userStore.userContracts[String(productId)]
}

function openAction(p) {
  userStore.currentUserProductId = p.id
  if (hasContract(p.id)) {
    userStore.pendingBookingAfterContract = false
    userStore.currentContractProductId = null
    userStore.persist()
    router.push('/user/booking')
  } else {
    userStore.currentContractProductId = p.id
    userStore.pendingBookingAfterContract = true
    userStore.persist()
    router.push('/user/contract')
  }
}

function openContract(productId) {
  userStore.currentContractProductId = productId
  userStore.pendingBookingAfterContract = false
  userStore.persist()
  router.push('/user/contract')
}
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="nav"><div class="back" @click="router.push('/user')">‹</div>私教课<div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div></div>
      <div class="user-shell">
        <div v-if="!products.length" class="user-empty">
          <div class="empty-title">暂无可预约课程</div>
          <div>先在教练端创建并上架课程，再配置课次，用户端就会自动回填。</div>
        </div>
        <div v-for="p in products" :key="p.id" class="user-course-card">
          <span v-if="hasContract(p.id)" class="user-card-link" @click="openContract(p.id)">查看合同</span>
          <div class="user-avatar" :style="{ backgroundImage: `url(${avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }"></div>
          <div class="user-course-main">
            <div class="user-course-title">{{ p.name }}</div>
            <div class="user-course-sub">剩余{{ p.remain }}课时</div>
          </div>
          <button class="user-action-btn" :disabled="p.remain <= 0" @click="openAction(p)">{{ p.remain > 0 ? '预约' : '已用完' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
