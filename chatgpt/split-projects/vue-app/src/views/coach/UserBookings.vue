<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCoachStore } from '@/stores/coachStore'
import { useUserStore } from '@/stores/userStore'
import { fmtUserDateTime, hoursUntilBooking } from '@/utils/date'
import { icons } from '@/components/icons'

const router = useRouter()
const coach = useCoachStore()
const userStore = useUserStore()

const bookings = computed(() => userStore.userBookings)

function userBookingNote(b) {
  if (b.status === '待上课' && hoursUntilBooking(b) < 3) return '距开课不足 3 小时，需联系教练协商取消。'
  if (b.status === '待教练处理取消') return '取消申请已提交，等待教练处理。'
  if (b.status === '待学员确认完课') return '请在 24 小时内确认完课，超时系统会自动完课。'
  if (b.status === '未到场') return '教练未同意取消，本次课程按未到场处理并正常核销。'
  if (b.status === '已完课') return ''
  return ''
}

function userBookingActions(b) {
  const btns = []
  if (b.status === '待上课') {
    btns.push({ text: hoursUntilBooking(b) >= 3 ? '取消预约' : '联系教练取消', secondary: hoursUntilBooking(b) < 3, action: 'cancel' })
  }
  if (b.status === '待学员确认完课') {
    btns.push({ text: '确认完课', secondary: false, action: 'finish' })
  }
  return btns
}

function handleCancel(b) {
  if (hoursUntilBooking(b) >= 3) {
    userStore.cancelBooking(b.id)
    window.__toast?.('已取消预约')
  } else {
    userStore.updateBookingInList(b.id, { status: '待教练处理取消', cancelRequestedAt: new Date().toISOString() })
    userStore.persist()
    window.__toast?.('已提交取消申请，请联系教练处理')
  }
}

function handleFinish(b) {
  userStore.updateBookingInList(b.id, { status: '已完课', completedAt: new Date().toISOString() })
  userStore.persist()
  window.__toast?.('已确认完课')
}
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="status-bar"><span>9:41</span><span class="status-icons"><span v-html="icons.signal" style="width:16px;height:12px"></span><span v-html="icons.battery" style="width:27px;height:12px;margin-left:6px"></span></span></div>
      <div class="nav"><div class="back" @click="router.push('/coach/user/courses')">‹</div>我的预约<div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div></div>
      <div class="user-shell">
        <div v-if="!bookings.length" class="user-empty">
          <div class="empty-title">暂无预约记录</div>
          <div>完成预约后，会在这里展示你的课程安排。</div>
        </div>
        <div v-for="b in bookings" :key="b.id" class="user-booking-card">
          <div class="user-booking-head">
            <div>
              <div class="user-booking-name">{{ b.courseName }}</div>
              <div class="user-store">{{ b.coachName }} · {{ b.store }}</div>
            </div>
            <div class="user-status">{{ b.status }}</div>
          </div>
          <div class="user-booking-time">{{ fmtUserDateTime(b.date, b.start, b.end) }}</div>
          <div class="user-booking-meta">
            <span>预约方式：{{ b.source === 'user' ? '学员预约' : '教练代约' }}</span>
            <span>预约时间：{{ b.createdAt ? new Date(b.createdAt).toLocaleString('zh-CN', { hour12: false }) : '--' }}</span>
            <span v-if="b.status === '已完课' && b.completedAt">完课时间：{{ new Date(b.completedAt).toLocaleString('zh-CN', { hour12: false }) }}</span>
          </div>
          <div v-if="userBookingActions(b).length" class="user-booking-actions">
            <button v-for="act in userBookingActions(b)" :key="act.text" :class="['mini-btn', { secondary: act.secondary }]" @click="act.action === 'cancel' ? handleCancel(b) : handleFinish(b)">{{ act.text }}</button>
          </div>
          <div v-if="userBookingNote(b)" class="user-booking-note">{{ userBookingNote(b) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>
