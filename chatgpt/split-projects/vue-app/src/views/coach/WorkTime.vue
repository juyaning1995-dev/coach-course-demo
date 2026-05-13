<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCoachStore } from '@/stores/coachStore'
import { icons } from '@/components/icons'

const router = useRouter()
const coach = useCoachStore()

const days = ['一', '二', '三', '四', '五', '六', '日']

const dayList = computed(() => days.map(d => ({ day: d, ranges: coach.workTimes[d] || [] })))

const hasAny = computed(() => Object.values(coach.workTimes).some(v => v.length))
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="status-bar"><span>9:41</span><span class="status-icons"><span v-html="icons.signal" style="width:16px;height:12px"></span><span v-html="icons.battery" style="width:27px;height:12px;margin-left:6px"></span></span></div>
      <div class="nav"><div class="back" @click="router.push('/coach')">‹</div>工作时间<div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div></div>
      <div class="work-list">
        <template v-if="!hasAny">
          <div class="empty">
            <div class="empty-title">暂无工作时间</div>
            <div class="empty-action" @click="router.push('/coach/worktime/edit')">设置工作时间</div>
            <div class="empty-hint" style="white-space:nowrap">设置可排课时间范围，新增课次时按该时间进行排班</div>
          </div>
        </template>
        <template v-else>
          <div v-for="d in dayList" :key="d.day" class="work-row">
            <div class="work-day">周{{ d.day }}</div>
            <div class="work-times">{{ d.ranges.length ? d.ranges.join('&nbsp;&nbsp;&nbsp;') : '休息' }}</div>
          </div>
        </template>
      </div>
      <div v-if="hasAny" class="work-edit" @click="router.push('/coach/worktime/edit')">添加时间段</div>
    </div>
  </div>
</template>
