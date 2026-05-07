<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCoachStore } from '@/stores/coachStore'
import { icons } from '@/components/icons'

const router = useRouter()
const coach = useCoachStore()

const stats = computed(() => coach.getHomeStats())

const quickFeatures = [
  { key: 'contract', label: '门店签约', icon: icons.contract },
  { key: 'work', label: '工作时间', icon: icons.clock },
  { key: 'course', label: '课程管理', icon: icons.course },
  { key: 'booking', label: '预约管理', icon: icons.booking },
  { key: 'calendar', label: '排课日历', icon: icons.schedule },
  { key: 'student', label: '学员管理', icon: icons.student },
  { key: 'order', label: '私教订单', icon: icons.order }
]

function onQuick(key) {
  switch (key) {
    case 'work': router.push('/coach/worktime'); break
    case 'course': router.push('/coach/courses'); break
    case 'calendar': router.push('/coach/calendar'); break
    default: window.__toast?.('该功能正在建设中')
  }
}

const todaySchedules = computed(() => coach.getTodaySchedules())

function memberDisplayName(m) {
  if (m.name === '用户本人' || m.name === '当前用户') return '小明'
  return m.name || ''
}

function memberStatusChip(m) {
  const map = { '待上课': 'pending', '上课中': 'active', '待学员确认完课': 'review', '待教练处理取消': 'review', '已完课': 'done', '未到场': 'done' }
  return map[m.status] || 'done'
}

function memberActions(m, sid) {
  const arr = []
  if (m.status === '待上课') arr.push({ label: '确认上课', cls: 'primary', fn: () => { coach.updateBookingRecord(m.bookingId, { status: '上课中' }); window.__toast?.('已确认上课') } })
  else if (m.status === '待教练处理取消') {
    arr.push({ label: '同意取消', cls: 'primary', fn: () => { coach.cancelBookingSeat(m.bookingId); window.__toast?.('已同意取消') } })
    arr.push({ label: '未到场', cls: 'secondary', fn: () => { coach.updateBookingRecord(m.bookingId, { status: '未到场', completedAt: new Date().toISOString() }); window.__toast?.('已记为未到场') } })
  } else if (m.status === '上课中' && m.source === 'user') arr.push({ label: '确认下课', cls: 'primary', fn: () => { coach.updateBookingRecord(m.bookingId, { status: '已完课', completedAt: new Date().toISOString() }); window.__toast?.('已确认完课') } })
  else if (m.status === '上课中' && m.source === 'coach') arr.push({ label: '发起确认', cls: 'primary', fn: () => { coach.updateBookingRecord(m.bookingId, { status: '待学员确认完课', completeConfirmExpireAt: new Date(Date.now() + 24*60*60*1000).toISOString() }); window.__toast?.('已发起完课确认') } })
  return arr
}

function memberNote(m) {
  if (m.status === '待学员确认完课') return '待学员确认完课，超时自动完成'
  return ''
}

function goDetail(sid) { router.push(`/coach/schedule/${sid}`) }
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="nav">课程设置<div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div></div>
      <div class="coach-dashboard">
        <!-- Stats -->
        <div class="coach-stat-grid">
          <div v-for="s in stats" :key="s.label" class="coach-stat-box">
            <div class="coach-stat-title">
              <div class="coach-stat-icon" v-html="icons[s.icon]"></div>
              <div class="coach-stat-name">{{ s.label }}</div>
            </div>
            <div class="coach-stat-number">{{ s.value }}<small>{{ s.unit }}</small></div>
            <div class="coach-stat-note">{{ s.note }}</div>
          </div>
        </div>

        <!-- Quick Features -->
        <div class="coach-panel">
          <div class="coach-quick-grid">
            <div v-for="f in quickFeatures" :key="f.key" class="coach-quick-item" @click="onQuick(f.key)">
              <div class="coach-quick-icon" v-html="f.icon"></div>
              <div class="coach-quick-label">{{ f.label }}</div>
            </div>
          </div>
        </div>

        <!-- Today's Courses -->
        <div class="coach-panel">
          <div class="coach-panel-head">
            <div class="coach-panel-title">今日课程</div>
            <div class="coach-panel-link" @click="router.push('/coach/calendar')">查看全部</div>
          </div>
          <div v-if="!todaySchedules.length" class="coach-empty-state">今天还没有已预约的课程，新的预约会自动回填到这里。</div>
          <div v-else class="ctc-list">
            <template v-for="s in todaySchedules" :key="s.id">
              <div v-for="m in coach.getScheduleActiveMembers(s)" :key="m.bookingId" class="ctc-card" @click="goDetail(s.id)">
                <div class="ctc-top">
                  <div class="ctc-course">{{ s.courseName }}</div>
                  <span :class="['ctc-status', memberStatusChip(m)]">{{ m.status }}</span>
                </div>
                <div class="ctc-time">{{ s.start }} - {{ s.end }}</div>
                <div class="ctc-meta-row">
                  <div class="ctc-meta">
                    <span class="ctc-meta-name">{{ memberDisplayName(m) }}</span>
                    <span>·</span>
                    <span>{{ s.store || '未设置门店' }}</span>
                  </div>
                  <div v-if="memberActions(m, s.id).length" class="ctc-actions">
                    <button v-for="a in memberActions(m, s.id)" :key="a.label" :class="['ctc-btn', a.cls]" @click.stop="a.fn">{{ a.label }}</button>
                  </div>
                </div>
                <div v-if="memberNote(m)" class="ctc-note">{{ memberNote(m) }}</div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Bottom Nav -->
      <div class="coach-bottom-nav">
        <div class="coach-bottom-item active" @click="router.push('/coach')">
          <div class="coach-bottom-icon" v-html="icons.home"></div><div>首页</div>
        </div>
        <div class="coach-bottom-item" @click="router.push('/coach/courses')">
          <div class="coach-bottom-icon" v-html="icons.course"></div><div>课程</div>
        </div>
        <div class="coach-bottom-item" @click="router.push('/coach/calendar')">
          <div class="coach-bottom-icon" v-html="icons.schedule"></div><div>排班</div>
        </div>
        <div class="coach-bottom-item" @click="router.push('/coach/mine')">
          <div class="coach-bottom-icon" v-html="icons.mine"></div><div>我的</div>
        </div>
      </div>
    </div>
  </div>
</template>
