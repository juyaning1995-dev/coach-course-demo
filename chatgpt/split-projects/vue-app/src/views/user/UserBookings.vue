<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { icons } from '@/components/icons'
import { useCoachStore } from '@/stores/coachStore'
import { useUserStore } from '@/stores/userStore'
import { fmtUserDateTime, hoursUntilBooking } from '@/utils/date'

const router = useRouter()
const coach = useCoachStore()
const userStore = useUserStore()

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待上课' },
  { key: 'active', label: '进行中' },
  { key: 'done', label: '已完成' },
  { key: 'abnormal', label: '异常' }
]
const activeTab = ref('all')

const tabStatusMap = {
  all: ['待上课', '上课中', '待学员确认完课', '待教练处理取消', '已完课', '已取消', '未到场'],
  pending: ['待上课'],
  active: ['上课中', '待学员确认完课', '待教练处理取消'],
  done: ['已完课'],
  abnormal: ['已取消', '未到场']
}

const bookings = computed(() => userStore.userBookings)

const filteredBookings = computed(() => {
  const statuses = tabStatusMap[activeTab.value] || tabStatusMap.all
  return bookings.value.filter(b => statuses.includes(b.status))
})

const tabCounts = computed(() => {
  const all = bookings.value
  return {
    all: all.length,
    pending: all.filter(b => tabStatusMap.pending.includes(b.status)).length,
    active: all.filter(b => tabStatusMap.active.includes(b.status)).length,
    done: all.filter(b => tabStatusMap.done.includes(b.status)).length,
    abnormal: all.filter(b => tabStatusMap.abnormal.includes(b.status)).length
  }
})

onMounted(() => {
  userStore.reload()
  userStore.settleBookingTimeouts(coach.schedules)
  coach.persist()
  userStore.persist()
})

function statusKey(status) {
  const map = {
    '待上课': 'upcoming',
    '上课中': 'ongoing',
    '待学员确认完课': 'pending_confirm',
    '待教练处理取消': 'pending_confirm',
    '已完课': 'completed',
    '已取消': 'canceled',
    '未到场': 'no_show'
  }
  return map[status] || 'completed'
}

function statusLabel(status) {
  const map = {
    '待学员确认完课': '待确认完课',
    '待教练处理取消': '待处理取消'
  }
  return map[status] || status
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDateMD(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, '0')}`
}

function userBookingNote(b) {
  if (b.status === '待上课' && hoursUntilBooking(b) < 3) return '距开课不足 3 小时，需联系教练协商取消。'
  if (b.status === '待教练处理取消') return '取消申请已提交，等待教练处理。'
  if (b.status === '待学员确认完课') return '请在 24 小时内确认完课，超时系统会自动完课。'
  if (b.status === '未到场') return '教练未同意取消，本次课程按未到场处理并正常核销。'
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
    coach.cancelBookingSeat(b.id)
    window.__toast?.('已取消预约')
  } else {
    coach.updateBookingRecord(b.id, { status: '待教练处理取消', cancelRequestedAt: new Date().toISOString() })
    window.__toast?.('已提交取消申请，请联系教练处理')
  }
}

function handleFinish(b) {
  coach.updateBookingRecord(b.id, { status: '已完课', completedAt: new Date().toISOString() })
  window.__toast?.('已确认完课')
}
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="status-bar"><span>9:41</span><span class="status-icons"><span v-html="icons.signal" style="width:16px;height:12px"></span><span v-html="icons.battery" style="width:27px;height:12px;margin-left:6px"></span></span></div>
      <div class="nav"><div class="back" @click="router.push('/user/courses')">‹</div>我的预约</div>

      <!-- Tabs -->
      <div class="booking-tabs">
        <div v-for="t in tabs" :key="t.key" :class="['booking-tab', { active: activeTab === t.key }]" @click="activeTab = t.key">
          {{ t.label }}<span class="booking-tab-count">{{ tabCounts[t.key] }}</span>
        </div>
      </div>

      <!-- List -->
      <div class="booking-list">
        <template v-if="filteredBookings.length">
          <div v-for="b in filteredBookings" :key="b.id" class="booking-card">
            <!-- Row 1: course name + status -->
            <div class="booking-card-row1">
              <div class="booking-course-name">{{ b.courseName }}</div>
              <span :class="['booking-status', statusKey(b.status)]">{{ statusLabel(b.status) }}</span>
            </div>
            <!-- Row 2: coach · store -->
            <div class="booking-card-row2">
              <span class="booking-coach-name">{{ b.coachName }}</span>
              <span class="booking-dot">·</span>
              <span class="booking-store-text">{{ b.store }}</span>
            </div>
            <!-- Meta -->
            <div class="booking-meta">
              <div class="booking-meta-row">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M16 3v3M8 3v3M4 10h16"/><circle cx="12" cy="15" r="3"/><path d="M12 13.5V15"/><path d="M12 16v.01"/></svg>
                <span class="booking-meta-label">上课时间：</span>
                <span class="booking-meta-text booking-class-time">{{ formatDateMD(b.date) }} {{ b.start }} – {{ b.end }}</span>
              </div>
              <div class="booking-meta-row">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.2"/><path d="M12 6.8v5.2l3.5 2"/></svg>
                <span class="booking-meta-label">约课时间：</span>
                <span class="booking-meta-text">{{ formatTime(b.createdAt) }}</span>
              </div>
              <div v-if="b.status === '已完课'" class="booking-meta-row">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.2"/><path d="m9 12 2 2 4-4"/></svg>
                <span class="booking-meta-label">完课时间：</span>
                <span class="booking-meta-text">{{ formatTime(b.completedAt) }}</span>
              </div>
              <div v-if="b.status === '已取消'" class="booking-meta-row">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
                <span class="booking-meta-label">取消时间：</span>
                <span class="booking-meta-text">{{ formatTime(b.completedAt) }}</span>
              </div>
              <div class="booking-meta-row">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 5.5-8 13-8 13s-8-7.5-8-13a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                <span class="booking-meta-label">上课门店：</span>
                <span class="booking-meta-text">{{ b.store || '未设置门店' }}</span>
              </div>
            </div>
            <!-- Note -->
            <div v-if="userBookingNote(b)" class="booking-note">{{ userBookingNote(b) }}</div>
            <!-- Actions -->
            <div v-if="userBookingActions(b).length" class="booking-actions">
              <button v-for="act in userBookingActions(b)" :key="act.text" :class="['booking-action-btn', act.secondary ? 'ghost' : 'primary']" @click="act.action === 'cancel' ? handleCancel(b) : handleFinish(b)">{{ act.text }}</button>
            </div>
          </div>
        </template>
        <div v-else class="booking-empty">暂无符合条件的预约</div>
      </div>
    </div>
  </div>
</template>
