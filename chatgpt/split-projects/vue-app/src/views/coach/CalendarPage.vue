<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCoachStore } from '@/stores/coachStore'
import { startOfWeek, fmtISO, fmtMD } from '@/utils/date'
import { icons } from '@/components/icons'

const router = useRouter()
const coach = useCoachStore()

const CALENDAR_START_HOUR = 8
const CALENDAR_END_HOUR = 22
const CALENDAR_HOUR_HEIGHT = 48
const pxPerMin = CALENDAR_HOUR_HEIGHT / 60
const calendarStartMin = CALENDAR_START_HOUR * 60
const calendarEndMin = CALENDAR_END_HOUR * 60

const activeDateStr = ref(fmtISO(new Date()))

const weekStart = computed(() => startOfWeek(new Date(activeDateStr.value + 'T00:00:00')))

const weekEnd = computed(() => {
  const e = new Date(weekStart.value)
  e.setDate(e.getDate() + 6)
  return e
})

const rangeText = computed(() => `${fmtMD(weekStart.value)}–${fmtMD(weekEnd.value)}`)

const daysData = computed(() => {
  const arr = []
  const todayStr = fmtISO(new Date())
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + i)
    const key = fmtISO(d)
    arr.push({
      key,
      date: d.getDate(),
      isToday: key === todayStr,
      isActive: key === activeDateStr.value
    })
  }
  return arr
})

const daySchedules = computed(() => {
  return coach.schedules
    .filter(s => (s.date || activeDateStr.value) === activeDateStr.value && s.status !== '已取消')
    .sort((a, b) => timeToMin(a.start) - timeToMin(b.start))
})

const hasDaySchedules = computed(() => daySchedules.value.length > 0)

const labels = computed(() => {
  const arr = []
  for (let h = CALENDAR_START_HOUR; h <= CALENDAR_END_HOUR; h++) {
    arr.push(`${String(h).padStart(2, '0')}:00`)
  }
  return arr
})

const trackHeightPx = computed(() => (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * CALENDAR_HOUR_HEIGHT)

function timeToMin(t) {
  const [h, m] = String(t || '00:00').split(':').map(Number)
  return h * 60 + (m || 0)
}

function minToTop(min) {
  return (min - calendarStartMin) * pxPerMin
}

function lessonMetrics(s) {
  const startMin = Math.max(calendarStartMin, timeToMin(s.start))
  const endMin = Math.min(calendarEndMin, timeToMin(s.end))
  return {
    top: (startMin - calendarStartMin) * pxPerMin,
    height: Math.max(20, (endMin - startMin) * pxPerMin - 2),
    duration: endMin - startMin
  }
}

function getLessonTone(s) {
  if (s.status === '停止预约') return 'gray'
  return Number(s.booked || 0) >= Number(s.limit || 1) ? 'purple' : Number(s.booked || 0) > 0 ? 'blue' : 'green'
}

function lessonStateText(s) {
  if (s.status === '停止预约') return '不可预约'
  if (Number(s.booked || 0) >= Number(s.limit || 1)) return `已满 ${s.booked}/${s.limit}`
  if (Number(s.booked || 0) > 0) return `已约 ${s.booked}/${s.limit}`
  return `${s.booked}/${s.limit}`
}

function changeWeek(step) {
  const ws = new Date(weekStart.value)
  ws.setDate(ws.getDate() + step * 7)
  activeDateStr.value = fmtISO(ws)
  coach.currentCalendarWeekStart = fmtISO(ws)
}

function goToday() {
  activeDateStr.value = fmtISO(new Date())
  coach.currentCalendarWeekStart = fmtISO(startOfWeek(new Date()))
}

function selectDateFn(dateStr) {
  activeDateStr.value = dateStr
}

// Schedule operation popup
const showOpMask = ref(false)
const currentSchedule = ref(null)

function openSchedule(s) {
  if (!s || !s.id) return
  currentSchedule.value = s
  showOpMask.value = true
}

function hideOpMask() { showOpMask.value = false; currentSchedule.value = null }

function openDetail() {
  const id = currentSchedule.value?.id
  if (!id) return
  hideOpMask()
  router.push(`/coach/schedule/${id}`)
}

function showMemberPage() {
  const id = currentSchedule.value?.id
  if (!id) return
  hideOpMask()
  router.push(`/coach/schedule/${id}/members`)
}

function editSchedule() {
  const id = currentSchedule.value?.id
  if (!id) return
  hideOpMask()
  router.push(`/coach/schedule/${id}/edit`)
}

function toggleStopBooking() {
  const s = currentSchedule.value
  if (!s) return
  const wasStopped = s.status === '停止预约'
  coach.toggleStopBooking(s.id)
  window.__toast?.(wasStopped ? '已开启预约' : '已停止预约')
  hideOpMask()
}

function cancelSchedule() {
  const s = currentSchedule.value
  if (!s) return
  coach.cancelSchedule(s.id)
  window.__toast?.('已取消课次')
  hideOpMask()
}

function deleteSchedule() {
  const s = currentSchedule.value
  if (!s) return
  coach.deleteSchedule(s.id)
  window.__toast?.('已删除课次')
  hideOpMask()
}

// Work-time tip mask
const showTipMask = ref(false)
const tipMaskText = ref('')

function goNewSchedule() {
  const dateStr = activeDateStr.value
  if (!coach.hasWorkTimeForDate(dateStr)) {
    tipMaskText.value = '请先设置工作时间，再新增排课。'
    showTipMask.value = true
    return
  }
  coach.currentCalendarWeekStart = fmtISO(weekStart.value)
  router.push('/coach/schedule/new')
}

function closeTipMask() { showTipMask.value = false }
function goSetWorkTime() { showTipMask.value = false; router.push('/coach/worktime/edit') }
</script>

<template>
  <div class="phone">
    <div id="calendarPage" class="page active">
      <div class="status-bar"><span>9:41</span><span class="status-icons"><span v-html="icons.signal" style="width:16px;height:12px"></span><span v-html="icons.battery" style="width:27px;height:12px;margin-left:6px"></span></span></div>
      <div class="nav"><div class="back" @click="router.push('/coach')">‹</div>课程日历<div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div></div>
      <div class="calendar-head">
        <div style="display:flex;align-items:center;gap:10px">
          <button class="week-switch" @click="changeWeek(-1)">‹</button>
          <div class="range">{{ rangeText }}</div>
          <button class="week-switch" @click="changeWeek(1)">›</button>
        </div>
        <button class="today" @click="goToday">今天</button>
      </div>
      <div class="calendar-days">
        <div class="weekbar"><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div><div>日</div></div>
        <div class="datebar">
          <div v-for="d in daysData" :key="d.key" @click="selectDateFn(d.key)">
            <span :class="{ 'active-date': d.isActive }">{{ d.isToday && !d.isActive ? '今' : d.date }}</span>
          </div>
        </div>
      </div>
      <div class="cal-wrap">
        <template v-if="!hasDaySchedules">
          <div class="calendar-empty" style="grid-column:1/3">
            <div class="empty-title">暂无排课</div>
            <div class="empty-action" @click="goNewSchedule()">新增排课</div>
          </div>
        </template>
        <template v-else>
          <div class="time-col" :style="{ height: `${trackHeightPx}px` }">
            <div v-for="label in labels" :key="label" class="time-label" :style="{ top: `${minToTop(timeToMin(label))}px` }">{{ label }}</div>
          </div>
          <div class="calendar-track" :style="{ height: `${trackHeightPx}px` }">
            <div v-for="s in daySchedules" :key="s.id"
              :class="['lesson', getLessonTone(s), lessonMetrics(s).duration <= 30 ? 'compact' : '']"
              :style="{ top: `${lessonMetrics(s).top}px`, height: `${lessonMetrics(s).height}px` }"
              @click="openSchedule(s)">
              <div class="lesson-line">
                <strong>{{ s.courseName }}</strong>
                <span class="lesson-meta">{{ s.start }}–{{ s.end }}</span>
                <span class="lesson-meta">{{ lessonStateText(s) }}</span>
              </div>
            </div>
          </div>
        </template>
      </div>
      <div class="legend">
        <span><i class="lg green"></i>可预约</span>
        <span><i class="lg blue"></i>部分已约</span>
        <span><i class="lg purple"></i>已满</span>
        <span><i class="lg gray"></i>不可预约</span>
      </div>
      <div v-if="hasDaySchedules" class="fab" @click="goNewSchedule()">+</div>

      <div class="coach-bottom-nav">
        <div class="coach-bottom-item" @click="router.push('/coach')">
          <div class="coach-bottom-icon" v-html="icons.home"></div><div>首页</div>
        </div>
        <div class="coach-bottom-item" @click="router.push('/coach/courses')">
          <div class="coach-bottom-icon" v-html="icons.course"></div><div>课程</div>
        </div>
        <div class="coach-bottom-item active" @click="router.push('/coach/calendar')">
          <div class="coach-bottom-icon" v-html="icons.schedule"></div><div>排班</div>
        </div>
        <div class="coach-bottom-item" @click="router.push('/coach/mine')">
          <div class="coach-bottom-icon" v-html="icons.mine"></div><div>我的</div>
        </div>
      </div>

      <!-- Work-time tip mask -->
      <div v-if="showTipMask" class="sheet-mask" style="display:block">
        <div class="audit-dialog">
          <div class="audit-title">当前日期未设置工作时间</div>
          <div class="audit-text">{{ tipMaskText }}</div>
          <div class="audit-actions">
            <button @click="closeTipMask">取消</button>
            <button @click="goSetWorkTime">去设置</button>
          </div>
        </div>
      </div>

      <!-- Schedule operation popup -->
      <div v-if="showOpMask" class="sheet-mask" style="display:block">
        <div class="op-dialog">
          <div class="op-head"><span>课次操作</span><span class="op-close" @click="hideOpMask">×</span></div>
          <button class="op-btn" @click="openDetail">查看详情</button>
          <button class="op-btn" @click="showMemberPage">代学员预约</button>
          <button class="op-btn" @click="editSchedule">编辑课次</button>
          <button class="op-btn" @click="toggleStopBooking">{{ currentSchedule?.status === '停止预约' ? '开启预约' : '停止预约' }}</button>
          <button class="op-btn op-danger" @click="cancelSchedule">取消课次</button>
          <button class="op-btn op-danger" @click="deleteSchedule">删除课次</button>
        </div>
      </div>
    </div>
  </div>
</template>
