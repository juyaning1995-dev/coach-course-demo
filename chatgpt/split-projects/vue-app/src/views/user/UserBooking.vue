<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { icons } from '@/components/icons'
import { useCoachStore } from '@/stores/coachStore'
import { useUserStore } from '@/stores/userStore'
import { fmtISO, dayName, fmtUserDateTime, normalizeUserCourseName } from '@/utils/date'

const router = useRouter()
const coach = useCoachStore()
const userStore = useUserStore()

const selectedDate = ref('')
const selectedScheduleId = ref(null)
const showConfirm = ref(false)
const showSuccess = ref(false)
const successBooking = ref(null)
const successSchedule = ref(null)

const successCourseDesc = computed(() => {
  if (!successSchedule.value) return ''
  const c = coach.courses.find(c => String(c.id) === String(successSchedule.value.courseId))
  return c?.desc || c?.intro || ''
})

const avatarUrl = computed(() => coach.coachProfile?.avatar || '/coach-photo.jpg')

const product = computed(() => {
  return userStore.getUserProduct(userStore.purchaseProductId || userStore.currentUserProductId)
})

const isGroup = computed(() => {
  return userStore.purchaseCourseType === 'group' || (product.value && product.value.type === '一对多')
})

function getUserRemainingSeats(slot) {
  return Math.max(0, Number(slot.limit || 1) - Number(slot.booked || 0))
}

function hasCurrentUserBookedSlot(scheduleId) {
  return userStore.userBookings.some(b => String(b.scheduleId) === String(scheduleId) && !['已取消'].includes(b.status))
}

function canUserBookSlot(slot, p) {
  return !!slot && !!p && Number(p.remain || 0) > 0 && slot.status !== '停止预约' && slot.status !== '已取消' && getUserRemainingSeats(slot) > 0
}

function getUserCourseSchedules(p) {
  if (!p) return []
  return coach.schedules.filter(s => String(s.courseId ?? '') === String(p.courseId) && s.status !== '已取消')
    .sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`))
}

const availableDates = computed(() => {
  if (!product.value) return []
  const ts = fmtISO(new Date())
  return [...new Set(getUserCourseSchedules(product.value).filter(s => s.date >= ts).map(s => s.date))].slice(0, 7)
})

const daySlots = computed(() => {
  if (!selectedDate.value || !product.value) return []
  return getUserCourseSchedules(product.value).filter(s => s.date === selectedDate.value)
})

const periods = [
  { label: '早课', startH: 5, endH: 12 },
  { label: '午间', startH: 12, endH: 14 },
  { label: '下午', startH: 14, endH: 18 },
  { label: '晚间', startH: 18, endH: 24 }
]

const slotSections = computed(() => {
  return periods.map(per => {
    const slots = daySlots.value.filter(s => {
      const h = parseInt(s.start.split(':')[0], 10)
      return h >= per.startH && h < per.endH
    })
    return { label: per.label, slots }
  }).filter(s => s.slots.length)
})

function selectDate(d) { selectedDate.value = d; selectedScheduleId.value = null }
function selectSlot(id) { selectedScheduleId.value = id }

const selectedSlot = computed(() => {
  return coach.schedules.find(s => s.id === selectedScheduleId.value)
})

function openConfirm() {
  const p = product.value
  if (isGroup.value) {
    showConfirm.value = true
    return
  }
  const slot = selectedSlot.value
  if (!canUserBookSlot(slot, p)) {
    window.__toast?.(Number(p?.remain || 0) > 0 ? '请选择可预约时段' : '剩余课时不足')
    return
  }
  showConfirm.value = true
}

function confirmBooking() {
  const p = product.value
  if (isGroup.value) {
    if (Number(p.remain || 0) <= 0) {
      window.__toast?.('剩余课时不足')
      showConfirm.value = false
      return
    }
    const schedules = coach.schedules
    const nextSchedule = getUserCourseSchedules(p).find(s => {
      if (s.status === '停止预约' || s.status === '已取消') return false
      if (getUserRemainingSeats(s) <= 0) return false
      return !hasCurrentUserBookedSlot(s.id)
    })
    if (!nextSchedule) {
      showConfirm.value = false
      window.__toast?.('暂无可预约时段')
      return
    }
    p.remain = Math.max(0, Number(p.remain || 0) - 1)
    if (!Array.isArray(nextSchedule.members)) nextSchedule.members = []
    const member = {
      bookingId: `booking-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: '小明', phone: '188****0000',
      time: '用户端预约', status: '待上课', source: 'user', isCurrentUser: true,
      productId: p.id, createdAt: new Date().toISOString(),
      cancelRequestedAt: '', completeConfirmExpireAt: '', completedAt: ''
    }
    nextSchedule.members.push(member)
    userStore.upsertBookingMirror(nextSchedule, member)
    coach.syncScheduleBookedCount(nextSchedule)
    userStore.newBookingId = member.bookingId
    coach.persist()
    userStore.persist()
    showConfirm.value = false
    successBooking.value = member
    successSchedule.value = nextSchedule
    showSuccess.value = true
    return
  }

  const slot = selectedSlot.value
  if (!canUserBookSlot(slot, p)) {
    showConfirm.value = false
    window.__toast?.('当前时段已不可预约')
    return
  }
  if (!Array.isArray(slot.members)) slot.members = []
  if (userStore.userBookings.some(b => String(b.scheduleId) === String(slot.id) && b.status !== '已取消')) {
    showConfirm.value = false
    window.__toast?.('这个时段已经预约过了')
    return
  }
  p.remain = Math.max(0, Number(p.remain || 0) - 1)
  const booking = {
    bookingId: `booking-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: '小明', phone: '188****0000',
    time: '用户端预约', status: '待上课', source: 'user', isCurrentUser: true,
    productId: p.id, createdAt: new Date().toISOString(),
    cancelRequestedAt: '', completeConfirmExpireAt: '', completedAt: ''
  }
  slot.members.push(booking)
  userStore.upsertBookingMirror(slot, booking)
  coach.syncScheduleBookedCount(slot)
  userStore.newBookingId = booking.bookingId
  coach.persist()
  userStore.persist()
  showConfirm.value = false
  successBooking.value = booking
  successSchedule.value = slot
  showSuccess.value = true
}

onMounted(() => {
  coach.reloadSchedules()
  userStore.reload()
  if (availableDates.value.length && !availableDates.value.includes(selectedDate.value)) {
    selectedDate.value = availableDates.value[0]
  }
})
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="status-bar"><span>9:41</span><span class="status-icons"><span v-html="icons.signal" style="width:16px;height:12px"></span><span v-html="icons.battery" style="width:27px;height:12px;margin-left:6px"></span></span></div>
      <div class="nav"><div class="back" @click="router.push('/user/coach')">‹</div>{{ isGroup ? '预约小班训练' : '预约私教训练' }}</div>
      <div class="user-shell">
        <!-- Group mode: course card -->
        <template v-if="isGroup">
          <div class="user-panel">
            <div class="user-panel-title">课程信息</div>
            <div v-if="product" class="user-brief-card">
              <div class="user-avatar" :style="{ backgroundImage: `url(${avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }"></div>
              <div class="user-course-main">
                <div class="user-course-title">{{ product.name }}</div>
                <div class="user-course-sub">{{ product.coachName }} · {{ product.store }}</div>
                <div class="user-course-sub">剩余 {{ product.remain || 0 }} 课时 | 精品小班课</div>
              </div>
            </div>
            <div class="oc-desc-list">
              <div class="oc-desc-item">小班课预约后由教练统一安排训练时段</div>
              <div class="oc-desc-item">预约成功后将使用1节小班课时</div>
            </div>
          </div>
        </template>
        <!-- Private mode: coach card + date strip + slot sections -->
        <template v-else>
          <div v-if="product" class="user-brief-card">
            <div class="user-avatar" :style="{ backgroundImage: `url(${avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }"></div>
            <div class="user-course-main">
              <div class="user-course-title">{{ product.coachName }}</div>
              <div class="user-store">{{ product.store }}</div>
            </div>
          </div>
          <div class="user-panel">
            <div class="user-panel-title">可预约时间</div>
            <div v-if="!availableDates.length" class="user-empty">当前课程暂无可预约时段</div>
            <template v-else>
              <div class="user-date-strip">
                <div v-for="d in availableDates" :key="d" :class="['user-date-item', { active: d === selectedDate }]" @click="selectDate(d)">
                  <div class="user-date-week">周{{ dayName(d) }}</div>
                  <div class="user-date-day">{{ fmtISO(new Date()) === d ? '今' : new Date(d + 'T00:00:00').getDate() }}</div>
                </div>
              </div>
              <div v-if="!slotSections.length" class="user-empty">当日暂无可预约时段</div>
              <div v-for="sec in slotSections" :key="sec.label" class="user-slot-section">
                <div class="user-slot-label">{{ sec.label }}</div>
                <div class="user-slot-grid">
                  <button v-for="s in sec.slots" :key="s.id"
                    :class="['user-slot', { selected: selectedScheduleId === s.id, disabled: !canUserBookSlot(s, product) || hasCurrentUserBookedSlot(s.id) }]"
                    :disabled="!canUserBookSlot(s, product) || hasCurrentUserBookedSlot(s.id)"
                    @click="selectSlot(s.id)">
                    {{ s.start }}–{{ s.end }}
                    <span v-if="hasCurrentUserBookedSlot(s.id)" class="user-slot-state">已约</span>
                  </button>
                </div>
              </div>
            </template>
          </div>
        </template>
      </div>
      <button class="user-book-btn" :disabled="!isGroup && !selectedSlot" @click="openConfirm">
        {{ isGroup ? (product && Number(product.remain || 0) > 0 ? '确认预约' : '剩余课时不足') : (selectedSlot && canUserBookSlot(selectedSlot, product) ? `预约${fmtUserDateTime(selectedSlot.date, selectedSlot.start, selectedSlot.end)}` : (product && Number(product.remain || 0) > 0 ? '请选择预约时段' : '剩余课时不足')) }}
      </button>
    </div>
    <!-- Confirm Dialog -->
    <div v-if="showConfirm" class="sheet-mask" style="display:block">
      <div class="user-confirm-dialog">
        <div class="user-confirm-close" @click="showConfirm = false">×</div>
        <div class="user-confirm-title">预约确认</div>
        <div class="user-confirm-text">
          <template v-if="isGroup">
            将预约 <strong>{{ product?.name }}</strong>，成功预约将使用1节小班课时。
          </template>
          <template v-else>
            将预约 {{ fmtUserDateTime(selectedSlot.date, selectedSlot.start, selectedSlot.end) }} 的训练，成功预约将使用1节{{ product?.type === '一对多' ? '小班' : '私教' }}课时。
          </template>
        </div>
        <div class="user-confirm-note">*如需取消预约，请提前一天操作，训练当日无法取消预约</div>
        <div class="user-confirm-actions">
          <button class="utc-cancel" @click="showConfirm = false">我再看看</button>
          <button class="utc-confirm" @click="confirmBooking">确认预约</button>
        </div>
      </div>
    </div>
    <!-- Success Sheet -->
    <div v-if="showSuccess" class="sheet-mask" style="display:block;z-index:30" @click="showSuccess = false">
      <div class="us-bottom-sheet" style="position:fixed;left:50%;transform:translateX(-50%);bottom:0;width:min(390px,100vw);background:var(--surface);border-radius:24px 24px 0 0;padding:14px 20px 30px;z-index:31">
        <div class="us-drag-bar" style="width:36px;height:4px;background:var(--border);border-radius:2px;margin:0 auto 16px"></div>
        <div class="us-icon-wrap" style="display:flex;justify-content:center;margin-bottom:8px"><div class="us-check" style="width:48px;height:48px;border-radius:50%;background:var(--brand);color:var(--brand-foreground);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700">&#10003;</div></div>
        <div class="us-title" style="text-align:center;font-size:18px;font-weight:600;color:var(--foreground);margin-bottom:16px">预约成功</div>
        <div v-if="successSchedule" class="us-info-card" style="padding:14px 16px;background:var(--muted);border:1px solid var(--border);border-radius:14px;margin-bottom:12px">
          <div class="us-info-row" style="display:flex;justify-content:space-between;padding:6px 0">
            <span class="us-info-label" style="font-size:13px;color:var(--muted-foreground);flex:none;width:64px">课程</span>
            <span class="us-info-value" style="font-size:14px;color:var(--foreground);line-height:1.5">{{ successSchedule.courseName }}</span>
          </div>
          <div class="us-info-row" style="display:flex;justify-content:space-between;padding:6px 0">
            <span class="us-info-label" style="font-size:13px;color:var(--muted-foreground);flex:none;width:64px">教练</span>
            <span class="us-info-value" style="font-size:14px;color:var(--foreground);line-height:1.5">{{ product?.coachName }}</span>
          </div>
          <div class="us-info-row" style="display:flex;justify-content:space-between;padding:6px 0">
            <span class="us-info-label" style="font-size:13px;color:var(--muted-foreground);flex:none;width:64px">上课时间</span>
            <span class="us-info-value" style="font-size:14px;color:var(--foreground);line-height:1.5">{{ fmtUserDateTime(successSchedule.date, successSchedule.start, successSchedule.end) }}</span>
          </div>
          <div class="us-info-row" style="display:flex;justify-content:space-between;padding:6px 0">
            <span class="us-info-label" style="font-size:13px;color:var(--muted-foreground);flex:none;width:64px">上课门店</span>
            <span class="us-info-value" style="font-size:14px;color:var(--foreground);line-height:1.5">{{ successSchedule.store }}</span>
          </div>
        </div>
        <div v-if="successCourseDesc" class="us-desc-card" style="padding:14px 16px;background:var(--muted);border:1px solid var(--border);border-radius:14px;margin-bottom:12px">
          <div class="us-desc-title" style="font-size:14px;font-weight:600;color:var(--foreground);margin-bottom:8px">课程说明</div>
          <div class="us-desc-text" style="font-size:13px;color:var(--muted-foreground);line-height:1.7">{{ successCourseDesc }}</div>
        </div>
        <div class="us-actions" style="display:flex;justify-content:center;margin-top:20px">
          <button class="us-btn primary" style="width:200px;height:48px;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;background:var(--brand);color:var(--brand-foreground);border:0" @click="router.push('/user/bookings')">查看预约</button>
        </div>
      </div>
    </div>
  </div>
</template>
