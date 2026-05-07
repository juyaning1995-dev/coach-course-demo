<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { fmtUserDateTime } from '@/utils/date'

const router = useRouter()
const userStore = useUserStore()

const booking = computed(() => {
  return userStore.userBookings.find(b => String(b.id) === String(userStore.newBookingId)) || userStore.userBookings[userStore.userBookings.length - 1]
})

const isGroup = computed(() => booking.value && booking.value.type === '一对多')
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="us-bottom-sheet">
        <div class="us-drag-bar"></div>
        <div class="us-icon-wrap"><div class="us-check">&#10003;</div></div>
        <div class="us-title">预约成功</div>
        <div class="us-info-card">
          <template v-if="booking">
            <div class="us-info-row"><span class="us-info-icon">&#9679;</span><span class="us-info-label">教练：</span><span class="us-info-value">{{ booking.coachName }}</span></div>
            <div class="us-info-row"><span class="us-info-icon">&#9679;</span><span class="us-info-label">门店：</span><span class="us-info-value">{{ booking.store }}</span></div>
            <div class="us-info-row"><span class="us-info-icon">&#9679;</span><span class="us-info-label">时段：</span><span class="us-info-value">{{ fmtUserDateTime(booking.date, booking.start, booking.end) }}</span></div>
          </template>
          <div v-else class="us-info-row"><span class="us-info-value">暂无预约信息</span></div>
        </div>
        <div class="us-rules">
          <template v-if="isGroup">
            <strong>小班预约训练与取消规则：</strong>1、预约成功后将使用1节小班课时，每次训练时间由教练统一安排；<br/>2、如需取消预约，请提前一天操作，训练当日无法取消预约。
          </template>
          <template v-else>
            <strong>私教预约训练与取消规则：</strong>1、预约成功后将使用1节私教课时，每次训练1个小时；<br/>2、每日21:00更新后续预约时间，每周六21:00更新下周可预约时间；<br/>3、同一课程单日最多可预约2次训练，请合理安排您的时间；<br/>4、如需取消预约，请提前一天操作，训练当日无法取消预约。
          </template>
        </div>
        <button class="user-book-btn" style="position:static;transform:none;width:100%;max-width:none" @click="router.push('/user/bookings')">查看我的预约</button>
      </div>
    </div>
  </div>
</template>
