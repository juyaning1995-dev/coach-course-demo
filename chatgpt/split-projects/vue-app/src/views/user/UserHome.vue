<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { useCoachStore } from '@/stores/coachStore'

const router = useRouter()
const user = useUserStore()
const coach = useCoachStore()

onMounted(() => {
  user.reload()
  coach.syncUserProducts()
})

const courseCount = computed(() => user.userProducts.length)
const remainCount = computed(() => user.userProducts.reduce((s, p) => s + Number(p.remain || 0), 0))
const bookingCount = computed(() => user.userBookings.length)
const pendingCount = computed(() => user.userBookings.filter(b => !['已取消', '已完课'].includes(b.status)).length)
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="nav">首页</div>
      <div class="user-shell">
        <div class="user-home-grid">
          <div class="user-home-card" @click="router.push('/user/courses')">
            <div class="user-home-chip">功能 01</div>
            <div class="user-home-name">私教课</div>
            <div class="user-home-count">{{ courseCount }}</div>
            <div class="user-home-desc">购买的私教课放在这里统一查看，当前剩余 {{ remainCount }} 课时，可继续选择时段预约。</div>
            <div class="user-home-arrow">进入私教课 ›</div>
          </div>
          <div class="user-home-card" @click="router.push('/user/bookings')">
            <div class="user-home-chip">功能 02</div>
            <div class="user-home-name">预约记录</div>
            <div class="user-home-count">{{ bookingCount }}</div>
            <div class="user-home-desc">查看全部预约记录，当前还有 {{ pendingCount }} 条待处理或待上课记录。</div>
            <div class="user-home-arrow">进入预约记录 ›</div>
          </div>
          <div class="user-home-card" @click="router.push('/user/coach')">
            <div class="user-home-chip">功能 03</div>
            <div class="user-home-name">教练主页</div>
            <div class="user-home-desc">查看教练资料、课程介绍和门店信息，购买课程后即可在线预约训练时段。</div>
            <div class="user-home-arrow">进入教练主页 ›</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
