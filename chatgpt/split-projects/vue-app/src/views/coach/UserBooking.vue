<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCoachStore } from '@/stores/coachStore'
import { useUserStore } from '@/stores/userStore'
import { fmtISO, dayName } from '@/utils/date'
import { icons } from '@/components/icons'

const router = useRouter()
const coach = useCoachStore()
const userStore = useUserStore()

const selectedDate = ref('')
const selectedSlotId = ref(null)
const showConfirm = ref(false)

const product = computed(() => userStore.getUserProduct(userStore.currentUserProductId))
const defaultAvatar = '/coach-photo.jpg'

const dates = computed(() => {
  if (!product.value) return []
  const ts = fmtISO(new Date())
  return [...new Set(
    coach.schedules.filter(s => String(s.courseId ?? '') === String(product.value.courseId) && s.status !== '已取消' && s.date >= ts).map(s => s.date)
  )].slice(0, 7)
})

function canUserBookSlot(slot) {
  return !!slot && !!product.value && Number(product.value.remain || 0) > 0 && slot.status !== '停止预约' && slot.status !== '已取消' && getUserRemainingSeats(slot) > 0
}

function getUserRemainingSeats(slot) {
  return Math.max(0, Number(slot.limit || 1) - Number(slot.booked || 0))
}

function hasBooked(slot) {
  return userStore.userBookings.some(b => String(b.scheduleId) === String(slot.id) && !['已取消'].includes(b.status))
}

const daySlots = computed(() => {
  if (!selectedDate.value || !product.value) return []
  return coach.schedules.filter(s => s.date === selectedDate.value && String(s.courseId ?? '') === String(product.value.courseId) && s.status !== '已取消').sort((a, b) => a.start.localeCompare(b.start))
})

function userSlotPeriod(start) {
  const hour = parseInt(String(start).split(':')[0], 10)
  return hour < 12 ? '上午' : hour < 18 ? '下午' : '晚上'
}

const slotSections = computed(() => {
  const sections = { 上午: [], 下午: [], 晚上: [] }
  daySlots.value.forEach(s => {
    const p = userSlotPeriod(s.start)
    sections[p].push(s)
  })
  return Object.entries(sections).filter(([, slots]) => slots.length)
})

function selectDate(d) { selectedDate.value = d; selectedSlotId.value = null }
function selectSlot(id) { selectedSlotId.value = id }

function fmtUserDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`
}
function fmtUserDateTime(dateStr, start, end) {
  return `${fmtUserDate(dateStr)} 星期${dayName(dateStr)} ${start}–${end}`
}

const selectedSlot = computed(() => coach.schedules.find(s => s.id === selectedSlotId.value))

function confirmBooking() {
  coach.reloadSchedules()
  const slot = coach.schedules.find(s => s.id === selectedSlotId.value)
  if (!canUserBookSlot(slot)) return
  if (!Array.isArray(slot.members)) slot.members = []
  if (userStore.userBookings.some(b => String(b.scheduleId) === String(slot.id) && b.status !== '已取消')) {
    showConfirm.value = false
    window.__toast?.('这个时段已经预约过了')
    return
  }
  product.value.remain = Math.max(0, Number(product.value.remain || 0) - 1)
  const booking = {
    bookingId: `booking-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: '小明', phone: '188****0000',
    time: '用户端预约', status: '待上课', source: 'user', isCurrentUser: true,
    productId: product.value.id, createdAt: new Date().toISOString(),
    cancelRequestedAt: '', completeConfirmExpireAt: '', completedAt: ''
  }
  slot.members.push(booking)
  userStore.upsertBookingMirror(slot, booking)
  coach.syncScheduleBookedCount(slot)
  userStore.newBookingId = booking.bookingId
  coach.persist()
  userStore.persist()
  showConfirm.value = false
  router.push('/coach/user/success')
}

onMounted(() => {
  if (dates.value.length) selectedDate.value = dates.value[0]
})
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="status-bar"><span>9:41</span><span class="status-icons"><span v-html="icons.signal" style="width:16px;height:12px"></span><span v-html="icons.battery" style="width:27px;height:12px;margin-left:6px"></span></span></div>
      <div class="nav"><div class="back" @click="router.push('/coach/user/courses')">‹</div>私教课<div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div></div>
      <div class="user-shell">
        <div class="work-edit" style="margin:0 0 16px" @click="router.push('/coach/user/bookings')">查看我的预约</div>
        <div class="user-brief-card">
          <div class="user-avatar" :style="{ backgroundImage: `url(${coach.coachProfile?.avatar || defaultAvatar})`, backgroundSize: 'cover', backgroundPosition: 'center' }"></div>
          <div class="user-course-main">
            <div class="user-course-title">{{ product?.coachName || coach.coachProfile?.name || '王美丽' }}</div>
            <div class="user-store">{{ product?.store || coach.storeInfo?.name || '未设置门店' }}</div>
          </div>
        </div>
        <div class="user-panel">
          <div class="user-panel-title">预约时段</div>
          <div v-if="!dates.length" class="user-empty">当前课程暂无可预约时段</div>
          <template v-else>
            <div class="user-date-strip">
              <div v-for="d in dates" :key="d" :class="['user-date-item', { active: d === selectedDate }]" @click="selectDate(d)">
                <div class="user-date-week">周{{ dayName(d) }}</div>
                <div class="user-date-day">{{ fmtISO(new Date()) === d ? '今' : new Date(d + 'T00:00:00').getDate() }}</div>
              </div>
            </div>
            <div v-if="!slotSections.length" class="user-empty">当日暂无可预约时段</div>
            <div v-for="[period, slots] in slotSections" :key="period" class="user-slot-section">
              <div class="user-slot-label">{{ period }}</div>
              <div class="user-slot-grid">
                <button v-for="s in slots" :key="s.id"
                  :class="['user-slot', { selected: selectedSlotId === s.id, disabled: !canUserBookSlot(s) || hasBooked(s) }]"
                  :disabled="!canUserBookSlot(s) || hasBooked(s)"
                  @click="selectSlot(s.id)">
                  {{ s.start }}–{{ s.end }}
                  <span v-if="hasBooked(s)" class="user-slot-state">已约</span>
                  <span v-else-if="!canUserBookSlot(s) && getUserRemainingSeats(s) <= 0" class="user-slot-state">已约满</span>
                  <span v-else-if="product?.type === '一对多'" class="user-slot-cap">余{{ getUserRemainingSeats(s) }}/{{ s.limit }}</span>
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
      <button class="user-book-btn" :disabled="!selectedSlot || !canUserBookSlot(selectedSlot)" @click="showConfirm = true">
        {{ selectedSlot && canUserBookSlot(selectedSlot) ? `预约${fmtUserDateTime(selectedSlot.date, selectedSlot.start, selectedSlot.end)}` : product?.remain > 0 ? '请选择预约时段' : '剩余课时不足' }}
      </button>
    </div>
    <!-- Confirm Dialog -->
    <div v-if="showConfirm" class="sheet-mask" style="display:block">
      <div class="user-confirm-dialog">
        <div class="user-confirm-close" @click="showConfirm = false">×</div>
        <div class="user-confirm-title">预约确认</div>
        <div class="user-confirm-text">
          将预约{{ fmtUserDateTime(selectedSlot.date, selectedSlot.start, selectedSlot.end) }}的训练，成功预约将使用1节{{ product?.type === '一对多' ? '小班' : '私教' }}课时
        </div>
        <div class="user-confirm-note">*如需取消预约，请提前一天操作，训练当日无法取消预约</div>
        <button class="user-confirm-btn" @click="confirmBooking">确认预约</button>
      </div>
    </div>
  </div>
</template>
