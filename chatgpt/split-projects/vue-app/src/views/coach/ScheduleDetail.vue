<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCoachStore } from '@/stores/coachStore'
import { icons } from '@/components/icons'

const router = useRouter()
const route = useRoute()
const coach = useCoachStore()

const s = computed(() => coach.schedules.find(s => String(s.id) === String(route.params.id)))

function memberDisplayName(m) {
  const key = (m.phone || '').trim()
  const entry = key ? (coach.studentNotes[key] || {}) : {}
  if (entry.displayName) return entry.displayName
  if (m.name === '用户本人' || m.name === '当前用户') return '小明'
  return m.name || ''
}

const members = computed(() => {
  if (!s.value) return []
  coach.ensureScheduleMembers(s.value)
  return coach.getScheduleActiveMembers(s.value)
})

function memberStatusChip(m) {
  const map = { '待上课': 'pending', '上课中': 'active', '待学员确认完课': 'review', '待教练处理取消': 'review', '已完课': 'done', '未到场': 'done' }
  return map[m.status] || 'done'
}

function coachBookingWay(m) {
  return m.source === 'user' ? '学员约教练' : '教练约学员'
}

function coachBookingNote(m) {
  if (m.status === '待教练处理取消') return '学员发起了开课 3 小时内取消申请，等待教练处理。'
  if (m.status === '待学员确认完课' && m.completeConfirmExpireAt) return '学员需在 24 小时内确认完课，超时将自动完课。'
  if (m.status === '未到场') return '教练未同意取消，课程按未到场处理并正常核销。'
  if (m.status === '已完课' && m.completedAt) return `完课时间：${new Date(m.completedAt).toLocaleString('zh-CN', { hour12: false })}`
  return ''
}

function memberActions(m) {
  const a = []
  if (m.status === '待教练处理取消') a.push(
    { label: '同意取消', cls: '', fn: () => { coach.cancelBookingSeat(m.bookingId); window.__toast?.('已同意取消') } },
    { label: '记为未到场', cls: 'secondary', fn: () => { coach.updateBookingRecord(m.bookingId, { status: '未到场', completedAt: new Date().toISOString() }); window.__toast?.('已记为未到场') } }
  )
  else if (m.status === '待上课') a.push({ label: '确认上课', cls: '', fn: () => { coach.updateBookingRecord(m.bookingId, { status: '上课中' }); window.__toast?.('已确认上课') } })
  else if (m.status === '上课中' && m.source === 'user') a.push({ label: '确认完课', cls: '', fn: () => { coach.updateBookingRecord(m.bookingId, { status: '已完课', completedAt: new Date().toISOString() }); window.__toast?.('已确认完课') } })
  else if (m.status === '上课中' && m.source === 'coach') a.push({ label: '发起完课确认', cls: '', fn: () => { coach.updateBookingRecord(m.bookingId, { status: '待学员确认完课', completeConfirmExpireAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() }); window.__toast?.('已发起完课确认') } })
  return a
}

function cancelThisSchedule() {
  if (!s.value) return
  coach.cancelSchedule(s.value.id)
  window.__toast?.('已取消课次')
  router.push('/coach/calendar')
}

function deleteThisSchedule() {
  if (!s.value) return
  coach.deleteSchedule(s.value.id)
  window.__toast?.('已删除课次')
  router.push('/coach/calendar')
}
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="status-bar"><span>9:41</span><span class="status-icons"><span v-html="icons.signal" style="width:16px;height:12px"></span><span v-html="icons.battery" style="width:27px;height:12px;margin-left:6px"></span></span></div>
      <div class="nav"><div class="back" @click="router.push('/coach/calendar')">‹</div>课次详情<div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div></div>
      <div v-if="s">
        <div class="detail-card">
          <div class="detail-top">
            <div class="detail-title">{{ s.courseName }}</div>
            <div class="detail-status">{{ s.status }}</div>
          </div>
          <div class="detail-line">
            {{ s.date }} {{ s.start }}–{{ s.end }}<br/>
            {{ s.store || '' }}<br/>
            上课人数限制&nbsp; {{ s.limit }}人<br/>
            已约&nbsp; {{ s.booked }}人<br/>
            状态&nbsp; {{ s.status }}
          </div>
        </div>
        <div class="student-card">
          <div class="student-title">预约学员</div>
          <div v-if="!members.length" style="color:#888;margin-top:12px">暂无预约学员</div>
          <div v-for="m in members" :key="m.bookingId" class="student-block">
            <div class="student-head">
              <div class="avatar"></div>
              <div class="student-main">
                <div class="student-name">{{ memberDisplayName(m) }}</div>
                <div class="student-meta">{{ m.phone || '未留手机号' }}<br/>预约方式：{{ coachBookingWay(m) }}<br/>预约时间：{{ m.time || '--' }}</div>
              </div>
              <div class="student-status">{{ m.status }}</div>
            </div>
            <div v-if="memberActions(m).length" class="student-actions">
              <button v-for="a in memberActions(m)" :key="a.label" :class="['mini-btn', a.cls]" @click="a.fn">{{ a.label }}</button>
            </div>
            <div v-if="coachBookingNote(m)" class="student-note">{{ coachBookingNote(m) }}</div>
          </div>
        </div>
      </div>
      <div v-else style="padding:40px;text-align:center;color:var(--text-3)">课次不存在</div>
    </div>
  </div>
</template>
