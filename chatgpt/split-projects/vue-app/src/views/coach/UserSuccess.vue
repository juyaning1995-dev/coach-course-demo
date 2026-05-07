<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { fmtUserDateTime } from '@/utils/date'

const router = useRouter()
const userStore = useUserStore()

const booking = computed(() => {
  return userStore.userBookings.find(b => String(b.id) === String(userStore.newBookingId))
})
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="nav"><div class="back" @click="router.push('/coach')">‹</div>预约结果<div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div></div>
      <div class="user-success-stage">
        <div class="user-success-sheet">
          <div class="success-icon">✓</div>
          <div class="user-success-title">预约成功</div>
          <div class="user-summary-card">
            <div v-if="booking">教练：{{ booking.coachName }}</div>
            <div v-if="booking">门店：{{ booking.store }}</div>
            <div v-if="booking">时段：{{ fmtUserDateTime(booking.date, booking.start, booking.end) }}</div>
            <div v-else>暂无预约信息</div>
          </div>
          <div class="user-rules">
            <strong>预约与取消规则：</strong>1、预约成功后将使用1节对应课程课时，每次训练1个小时；<br/>2、每日21:00更新后续预约时间，每周六21:00更新下周可预约时段；<br/>3、同一课程单日最多可预约2次训练，仅可选择订单过期前的训练日；<br/>4、如需取消预约，请提前一天操作，训练当日无法取消预约。
          </div>
          <button class="user-confirm-btn" @click="router.push('/coach/user/bookings')">查看我的预约</button>
        </div>
      </div>
    </div>
  </div>
</template>
