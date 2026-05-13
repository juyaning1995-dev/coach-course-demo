<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCoachStore } from '@/stores/coachStore'
import { useUserStore } from '@/stores/userStore'
import { icons } from '@/components/icons'

const router = useRouter()
const coach = useCoachStore()
const user = useUserStore()

const contracts = computed(() => {
  const now = new Date()
  const yy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = now.getDate()
  return user.userProducts
    .filter(p => {
      const c = coach.courses.find(x => String(x.id) === String(p.courseId))
      return c && c.status === '已上架'
    })
    .map((p, i) => {
      const c = coach.courses.find(x => String(x.id) === String(p.courseId))
      const signDay = String(Math.min(28, dd - i * 3)).padStart(2, '0')
      return {
        no: `HT${yy}${mm}${String(i + 1).padStart(4, '0')}`,
        name: p.name || c?.name || '未知课程',
        date: `${yy}-${mm}-${signDay}`,
        remain: p.remain || 0,
        store: p.store || '未指定',
        status: '已签署'
      }
    })
})
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="status-bar"><span>9:41</span><span class="status-icons"><span v-html="icons.signal" style="width:16px;height:12px"></span><span v-html="icons.battery" style="width:27px;height:12px;margin-left:6px"></span></span></div>
      <div class="nav"><div class="back" @click="router.push('/coach/mine')">‹</div>会员合同<div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div></div>
      <div class="mine-shell">
        <div v-if="!contracts.length" class="empty" style="padding-top:60px">
          <div class="empty-title">暂无会员合同</div>
          <div>会员购买课程后将自动生成电子合同</div>
        </div>
        <div v-else class="mine-contract-list">
          <div v-for="c in contracts" :key="c.no" class="mine-contract-card">
            <div class="mine-contract-name">{{ c.name }}</div>
            <div class="mine-contract-meta">合同编号：{{ c.no }}<br/>签署日期：{{ c.date }}<br/>剩余课时：{{ c.remain }}节 · 门店：{{ c.store }}</div>
            <div class="mine-contract-status">{{ c.status }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
