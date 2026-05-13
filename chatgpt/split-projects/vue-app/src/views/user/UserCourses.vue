<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCoachStore } from '@/stores/coachStore'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const coach = useCoachStore()
const userStore = useUserStore()

onMounted(() => {
  userStore.reload()
  coach.syncUserProducts()
})

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
      <div class="nav"><div class="back" @click="router.push('/user')">‹</div>私教课</div>
      <div class="user-shell">
        <div v-if="!products.length" class="user-empty">
          <div class="empty-title">暂无已购课程</div>
          <div>请前往<router-link to="/user/coach" style="color:var(--brand);font-weight:600">教练主页</router-link>浏览并购买课程，支付完成后即可预约训练时段。</div>
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
