<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCoachStore } from '@/stores/coachStore'
import { icons } from '@/components/icons'
import { fmtISO } from '@/utils/date'

const router = useRouter()
const coach = useCoachStore()

// ============ Filters ============
const filterDate = ref('')
const searchText = ref('')

// ============ Tabs ============
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

// ============ Flat booking list ============
const allBookings = computed(() => {
  const result = []
  coach.schedules.forEach(s => {
    coach.ensureScheduleMembers(s)
    ;(s.members || []).forEach(m => {
      result.push({
        bookingId: m.bookingId,
        name: m.name || '',
        phone: m.phone || '',
        status: m.status || '',
        source: m.source || 'coach',
        time: m.time || '',
        createdAt: m.createdAt || '',
        completedAt: m.completedAt || '',
        completeConfirmExpireAt: m.completeConfirmExpireAt || '',
        isCurrentUser: !!m.isCurrentUser,
        productId: m.productId || '',
        scheduleId: s.id,
        courseName: s.courseName || '',
        scheduleDate: s.date || '',
        scheduleStart: s.start || '',
        scheduleEnd: s.end || '',
        store: s.store || ''
      })
    })
  })
  return result.sort((a, b) => {
    const dc = (b.scheduleDate || '').localeCompare(a.scheduleDate || '')
    if (dc !== 0) return dc
    return (b.createdAt || '').localeCompare(a.createdAt || '')
  })
})

const filteredBookings = computed(() => {
  let list = allBookings.value
  if (filterDate.value) {
    list = list.filter(b => b.scheduleDate === filterDate.value)
  }
  if (searchText.value.trim()) {
    const kw = searchText.value.trim().toLowerCase()
    list = list.filter(b =>
      (b.name || '').toLowerCase().includes(kw) ||
      (b.phone || '').toLowerCase().includes(kw)
    )
  }
  const statuses = tabStatusMap[activeTab.value] || tabStatusMap.all
  list = list.filter(b => statuses.includes(b.status))
  return list
})

// Tab counts
const tabCounts = computed(() => {
  const all = allBookings.value
  return {
    all: all.length,
    pending: all.filter(b => tabStatusMap.pending.includes(b.status)).length,
    active: all.filter(b => tabStatusMap.active.includes(b.status)).length,
    done: all.filter(b => tabStatusMap.done.includes(b.status)).length,
    abnormal: all.filter(b => tabStatusMap.abnormal.includes(b.status)).length
  }
})

// ============ Status helpers ============
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

function memberDisplayName(b) {
  const key = (b.phone || '').trim()
  const entry = key ? (coach.studentNotes[key] || {}) : {}
  if (entry.displayName) return entry.displayName
  return b.name || ''
}

// ============ Actions ============
function doConfirmStart(bookingId) {
  coach.updateBookingRecord(bookingId, { status: '上课中' })
  window.__toast?.('已确认上课')
}

function doFinishClass(booking) {
  if (booking.source === 'user') {
    coach.updateBookingRecord(booking.bookingId, { status: '已完课', completedAt: new Date().toISOString() })
    window.__toast?.('已确认完课')
  } else {
    coach.updateBookingRecord(booking.bookingId, {
      status: '待学员确认完课',
      completeConfirmExpireAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    })
    window.__toast?.('已发起完课确认')
  }
}

function doApproveCancel(bookingId) {
  coach.cancelBookingSeat(bookingId)
  window.__toast?.('已同意取消')
}

function doCancelBooking(bookingId) {
  coach.cancelBookingSeat(bookingId)
  window.__toast?.('已取消预约')
}

function doMarkNoShow(bookingId) {
  coach.updateBookingRecord(bookingId, { status: '未到场', completedAt: new Date().toISOString() })
  window.__toast?.('已记为未到场')
}

function getActions(booking) {
  const arr = []
  switch (booking.status) {
    case '待上课':
      arr.push({ label: '取消预约', cls: 'ghost', fn: () => doCancelBooking(booking.bookingId) })
      arr.push({ label: '确认上课', cls: 'primary', fn: () => doConfirmStart(booking.bookingId) })
      break
    case '上课中':
      arr.push({ label: '发起下课', cls: 'primary', fn: () => doFinishClass(booking) })
      break
    case '待学员确认完课':
      arr.push({ label: '取消预约', cls: 'ghost', fn: () => doCancelBooking(booking.bookingId) })
      arr.push({ label: '发起下课', cls: 'primary', fn: () => doFinishClass(booking) })
      break
    case '待教练处理取消':
      arr.push({ label: '同意取消', cls: 'ghost', fn: () => doApproveCancel(booking.bookingId) })
      arr.push({ label: '记为未到场', cls: 'ghost', fn: () => doMarkNoShow(booking.bookingId) })
      break
    case '已取消':
    case '未到场':
      arr.push({ label: '预约', cls: 'ghost', fn: () => openBookDialog(booking) })
      break
  }
  return arr
}

// ============ New booking dialog ============
const showBookDialog = ref(false)
const bookName = ref('')
const bookPhone = ref('')
const bookDate = ref(fmtISO(new Date()))
const bookScheduleId = ref(null)

const availableSchedules = computed(() => {
  return coach.schedules
    .filter(s => s.status !== '已取消')
    .filter(s => !bookDate.value || s.date === bookDate.value)
    .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`))
})

function openBookDialog(booking) {
  bookName.value = booking ? booking.name : ''
  bookPhone.value = booking ? booking.phone : ''
  bookDate.value = fmtISO(new Date())
  bookScheduleId.value = null
  showBookDialog.value = true
}

function doBook() {
  if (!bookName.value.trim() || !bookPhone.value.trim()) {
    window.__toast?.('请填写姓名和手机号')
    return
  }
  if (!bookScheduleId.value) {
    window.__toast?.('请选择课次')
    return
  }
  const result = coach.confirmMemberBook(bookName.value.trim(), bookPhone.value.trim(), bookScheduleId.value)
  window.__toast?.(result.msg)
  if (result.ok) showBookDialog.value = false
}
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="status-bar"><span>9:41</span><span class="status-icons"><span v-html="icons.signal" style="width:16px;height:12px"></span><span v-html="icons.battery" style="width:27px;height:12px;margin-left:6px"></span></span></div>
      <div class="nav"><div class="back" @click="router.push('/coach')">‹</div>预约管理<div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div></div>

      <!-- Filter bar -->
      <div class="booking-filter-bar">
        <div class="booking-filter-input">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M8 3v3M16 3v3M4 10h16"/></svg>
          <input type="date" v-model="filterDate" class="booking-date-field" />
        </div>
        <div class="booking-filter-input" style="flex:1.2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 20 20"/></svg>
          <input v-model="searchText" placeholder="姓名 / 手机号" class="booking-search-field" />
        </div>
      </div>

      <!-- Tabs -->
      <div class="booking-tabs">
        <div v-for="t in tabs" :key="t.key" :class="['booking-tab', { active: activeTab === t.key }]" @click="activeTab = t.key">
          {{ t.label }}<span class="booking-tab-count">{{ tabCounts[t.key] }}</span>
        </div>
      </div>

      <!-- List -->
      <div class="booking-list">
        <template v-if="filteredBookings.length">
          <div v-for="b in filteredBookings" :key="b.bookingId" class="booking-card">
            <!-- Row 1: course name + status -->
            <div class="booking-card-row1">
              <div class="booking-course-name">{{ b.courseName }}</div>
              <span :class="['booking-status', statusKey(b.status)]">{{ statusLabel(b.status) }}</span>
            </div>
            <!-- Row 2: member name · phone -->
            <div class="booking-card-row2">
              <span class="booking-member-name">{{ memberDisplayName(b) }}</span>
              <span class="booking-dot">·</span>
              <span class="booking-member-phone">{{ b.phone || '--' }}</span>
            </div>
            <!-- Meta -->
            <div class="booking-meta">
              <div class="booking-meta-row">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M16 3v3M8 3v3M4 10h16"/><circle cx="12" cy="15" r="3"/><path d="M12 13.5V15"/><path d="M12 16v.01"/></svg>
                <span class="booking-meta-label">上课时间：</span>
                <span class="booking-meta-text booking-class-time">{{ formatDateMD(b.scheduleDate) }} {{ b.scheduleStart }} – {{ b.scheduleEnd }}</span>
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
            <!-- Actions -->
            <div v-if="getActions(b).length" class="booking-actions">
              <button v-for="a in getActions(b)" :key="a.label" :class="['booking-action-btn', a.cls]" @click="a.fn">{{ a.label }}</button>
            </div>
          </div>
        </template>
        <div v-else class="booking-empty">暂无符合条件的预约</div>
      </div>

    </div>

    <!-- New booking dialog -->
    <div v-if="showBookDialog" class="sheet-mask" style="display:block">
      <div class="op-dialog">
        <div class="op-head"><span>新增预约</span><span class="op-close" @click="showBookDialog = false">×</span></div>
        <div class="form-row"><span class="label">日期</span><input type="date" v-model="bookDate" class="box-field" style="width:160px" /></div>
        <div class="form-row"><span class="label">姓名</span><input v-model="bookName" class="box-field" style="width:160px" placeholder="请输入" /></div>
        <div class="form-row"><span class="label">手机号</span><input v-model="bookPhone" class="box-field" style="width:160px" placeholder="请输入" /></div>
        <div class="form-row"><span class="label">课次</span>
          <select v-model="bookScheduleId" class="box-field" style="width:160px">
            <option :value="null" disabled>请选择课次</option>
            <option v-for="s in availableSchedules" :key="s.id" :value="s.id">{{ s.courseName }} {{ s.date }} {{ s.start }}</option>
          </select>
        </div>
        <button class="op-btn" style="margin-top:14px;background:var(--brand);color:var(--brand-foreground);font-weight:600" @click="doBook">确认预约</button>
      </div>
    </div>
  </div>
</template>
