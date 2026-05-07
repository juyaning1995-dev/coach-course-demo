<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCoachStore } from '@/stores/coachStore'
import { icons } from '@/components/icons'

const router = useRouter()
const coach = useCoachStore()
const keyword = ref('')
const statusFilter = ref('全部')

const filtered = computed(() => coach.courses.filter(c =>
  (!keyword.value || c.name.includes(keyword.value)) &&
  (statusFilter.value === '全部' || c.status === statusFilter.value)
))

function meta(c) {
  return c.unit === '按时间'
    ? `${c.type} | ${c.hours || 0}节 | ${c.limit || 2}人 | ¥${c.price || 0}/${c.validDays || 30}天`
    : `${c.type} | ${c.hours || 0}节 | ¥${c.price || 0}/节`
}

function actions(c) {
  if (c.status === '待审核') return [
    { label: '编辑', action: () => router.push(`/coach/courses/${c.id}/edit`) },
    { label: '撤回', action: () => { coach.changeCourseStatus(c.id, '已下架'); window.__toast?.('已撤回') } }
  ]
  if (c.status === '已上架') return [
    { label: '编辑', action: () => router.push(`/coach/courses/${c.id}/edit`) },
    { label: '下架', action: () => { coach.changeCourseStatus(c.id, '已下架'); window.__toast?.('已下架') } },
    { label: '删除', action: () => { coach.removeCourse(c.id); window.__toast?.('已删除') } }
  ]
  if (c.status === '审核驳回') return [
    { label: '编辑', action: () => router.push(`/coach/courses/${c.id}/edit`) },
    { label: '删除', action: () => { coach.removeCourse(c.id); window.__toast?.('已删除') } }
  ]
  return [
    { label: '编辑', action: () => router.push(`/coach/courses/${c.id}/edit`) },
    { label: '上架', action: () => { coach.changeCourseStatus(c.id, '待审核'); window.__toast?.('已提交上架审核') } },
    { label: '删除', action: () => { coach.removeCourse(c.id); window.__toast?.('已删除') } }
  ]
}

function statusClass(status) {
  return { '待审核': 'pending', '已上架': 'online', '审核驳回': 'reject', '已下架': 'offline' }[status] || 'offline'
}
</script>

<template>
  <div class="phone">
    <div id="listPage" class="page active">
      <div class="nav"><div class="back" @click="router.push('/coach')">‹</div>课程管理<div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div></div>
      <div class="search-row">
        <div class="search-box"><span class="magnifier"></span><input v-model="keyword" placeholder="搜索课程名称" /></div>
        <div class="filter-label">状态:</div>
        <select v-model="statusFilter" class="status-select">
          <option value="全部">全部</option><option value="待审核">待审核</option><option value="已上架">已上架</option><option value="审核驳回">审核驳回</option><option value="已下架">已下架</option>
        </select>
      </div>
      <div class="course-list">
        <div v-if="!filtered.length" class="empty">
          <div class="empty-title">暂无课程</div>
          <div>点击下方按钮创建课程，审核通过后可用于课程排班</div>
          <div class="empty-action" @click="router.push('/coach/courses/new')">新增课程</div>
        </div>
        <div v-for="c in filtered" :key="c.id" class="course-card">
          <div class="course-main">
            <div class="course-name">{{ c.name }}</div>
            <div class="course-meta">{{ meta(c) }}</div>
            <div v-if="c.reason" class="reason">驳回原因：{{ c.reason }}</div>
            <div :class="`tag ${statusClass(c.status)}`">{{ c.status }}</div>
          </div>
          <div class="course-actions">
            <span v-for="a in actions(c)" :key="a.label" @click="a.action">{{ a.label }}</span>
          </div>
        </div>
      </div>
      <div v-if="filtered.length" class="fab" @click="router.push('/coach/courses/new')">+</div>

      <!-- Bottom Nav -->
      <div class="coach-bottom-nav">
        <div class="coach-bottom-item" @click="router.push('/coach')">
          <div class="coach-bottom-icon" v-html="icons.home"></div><div>首页</div>
        </div>
        <div class="coach-bottom-item active" @click="router.push('/coach/courses')">
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
