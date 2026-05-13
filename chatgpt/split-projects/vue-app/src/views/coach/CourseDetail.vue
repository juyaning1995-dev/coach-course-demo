<script setup>
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCoachStore } from '@/stores/coachStore'
import { icons } from '@/components/icons'

const router = useRouter()
const route = useRoute()
const coach = useCoachStore()

const course = computed(() => coach.courses.find(c => String(c.id) === String(route.params.id)))

function meta(c) {
  return c.unit === '按时间'
    ? `${c.type} | ${c.hours || 0}节 | ${c.limit || 2}人 | ¥${c.price || 0}/${c.validDays || 30}天`
    : `${c.type} | ${c.hours || 0}节 | ¥${c.price || 0}/节`
}

function statusClass(status) {
  return { '待审核': 'pending', '已上架': 'online', '审核驳回': 'reject', '已下架': 'offline' }[status] || 'offline'
}
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="status-bar"><span>9:41</span><span class="status-icons"><span v-html="icons.signal" style="width:16px;height:12px"></span><span v-html="icons.battery" style="width:27px;height:12px;margin-left:6px"></span></span></div>
      <div class="nav"><div class="back" @click="router.push('/coach/courses')">‹</div>课程详情<div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div></div>
      <div v-if="!course" class="empty" style="padding-top:120px">
        <div class="empty-title">课程不存在</div>
      </div>
      <template v-else>
        <div class="detail-card">
          <div class="detail-top">
            <div class="detail-title">{{ course.name }}</div>
            <div :class="`tag ${statusClass(course.status)}`" style="position:static">{{ course.status }}</div>
          </div>
          <div class="detail-line">授课形式：{{ course.type }}</div>
          <div v-if="course.type === '一对多'" class="detail-line">限制人数：{{ course.limit || '--' }}人</div>
          <div class="detail-line">计费单位：{{ course.unit }}</div>
          <div v-if="course.unit === '按节'" class="detail-line">单节时长：{{ course.minutes || '--' }}分钟</div>
          <div v-if="course.unit === '按时间'" class="detail-line">服务周期：{{ course.validDays || '--' }}天</div>
          <div class="detail-line">{{ course.unit === '按时间' ? '周期内课时' : '课时' }}：{{ course.hours || '--' }}节</div>
          <div class="detail-line">售价：¥{{ course.price || '--' }}</div>
          <div class="detail-line">限购次数：{{ course.buyLimit || '不限' }}</div>
          <div v-if="course.unit === '按节'" class="detail-line">赠送课时：{{ course.giftHours || '0' }}节</div>
          <div v-if="course.unit === '按时间'" class="detail-line">赠送天数：{{ course.giftDays || '0' }}天</div>
          <div v-if="course.unit !== '按时间'" class="detail-line">有效期：{{ course.validDays || '--' }}天</div>
          <div class="detail-line">激活方式：{{ course.activeWay || '未设置' }}</div>
          <div v-if="course.activeWay === '购买后指定天数生效'" class="detail-line">指定购买天数：{{ course.activeDays || '--' }}天</div>
          <div class="detail-line">提前预约时间：{{ course.advanceHour || '--' }}小时</div>
          <div class="detail-line">适用门店：{{ course.stores || '未设置' }}</div>
          <div v-if="course.intro" class="detail-line" style="margin-top:16px">课程简介：{{ course.intro }}</div>
          <div v-if="course.desc" class="detail-line">课程说明：{{ course.desc }}</div>
        </div>
        <button class="orange-btn" @click="router.push(`/coach/courses/${course.id}/edit`)">编辑课程</button>
      </template>
    </div>
  </div>
</template>
