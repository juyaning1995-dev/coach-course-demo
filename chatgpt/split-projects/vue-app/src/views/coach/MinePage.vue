<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCoachStore } from '@/stores/coachStore'
import { icons } from '@/components/icons'

const router = useRouter()
const coach = useCoachStore()

const stats = computed(() => coach.getMineStats())
const profile = computed(() => coach.coachProfile)
const store = computed(() => coach.storeInfo)

const defaultAvatar = '/coach-photo.jpg'

const menuItems = [
  { key: 'profile', label: '我的主页', icon: icons.mine },
  { key: 'contract', label: '门店签约', icon: icons.contract },
  { key: 'contracts', label: '会员合同', icon: icons.order },
  // { key: 'work', label: '工作时间', icon: icons.clock },
  { key: 'course', label: '课程管理', icon: icons.course }
]

function onMenu(key) {
  if (key === 'profile') router.push('/coach/profile')
  else if (key === 'contract') router.push('/coach/store-contracts')
  else if (key === 'contracts') router.push('/coach/contracts')
  // else if (key === 'work') router.push('/coach/worktime')
  else if (key === 'course') router.push('/coach/courses')
}
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="status-bar"><span>9:41</span><span class="status-icons"><span v-html="icons.signal" style="width:16px;height:12px"></span><span v-html="icons.battery" style="width:27px;height:12px;margin-left:6px"></span></span></div>
      <div class="nav"><div class="back" @click="router.push('/coach')">‹</div>我的<div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div></div>
      <div class="mine-shell">
        <div class="mine-header" @click="router.push('/coach/info')" style="cursor:pointer">
          <div class="mine-avatar-lg" :style="{ backgroundImage: `url(${profile.avatar || defaultAvatar})` }"></div>
          <div class="mine-header-info">
            <div class="mine-header-name">{{ profile.name || '王美丽' }}</div>
            <div class="mine-header-store">{{ store.name || '大明湖店' }}</div>
          </div>
          <span class="mine-menu-arrow" style="flex:none">›</span>
        </div>
        <div class="mine-stat-grid">
          <div v-for="s in stats" :key="s.label" class="mine-stat-box">
            <div class="mine-stat-value">{{ s.value }}<small style="font-size:13px;color:var(--text-3);font-weight:500;margin-left:4px">{{ s.unit }}</small></div>
            <div class="mine-stat-label">{{ s.label }}</div>
          </div>
        </div>
        <div class="mine-menu">
          <div v-for="m in menuItems" :key="m.key" class="mine-menu-item" @click="onMenu(m.key)">
            <div class="mine-menu-icon" v-html="m.icon"></div>
            <span>{{ m.label }}</span>
            <span class="mine-menu-arrow">›</span>
          </div>
        </div>
      </div>
      <div class="coach-bottom-nav">
        <div class="coach-bottom-item" @click="router.push('/coach')"><div class="coach-bottom-icon" v-html="icons.home"></div><div>首页</div></div>
        <div class="coach-bottom-item" @click="router.push('/coach/courses')"><div class="coach-bottom-icon" v-html="icons.course"></div><div>课程</div></div>
        <div class="coach-bottom-item" @click="router.push('/coach/calendar')"><div class="coach-bottom-icon" v-html="icons.schedule"></div><div>排班</div></div>
        <div class="coach-bottom-item active"><div class="coach-bottom-icon" v-html="icons.mine"></div><div>我的</div></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.phone{background:linear-gradient(180deg,#FEE7E3 0%,#F4F2F5 100%) top/100% 280px no-repeat, #F4F2F5!important}
</style>
