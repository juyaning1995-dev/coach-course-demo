<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { icons } from '@/components/icons'
import { useCoachStore } from '@/stores/coachStore'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const coach = useCoachStore()
const userStore = useUserStore()

const product = computed(() => userStore.getUserProduct(userStore.purchaseProductId))
const course = computed(() => {
  if (!product.value) return null
  return coach.courses.find(c => c.id === product.value.courseId)
})

const price = computed(() => course.value ? course.value.price : '--')

function classSize() {
  if (!course.value) return '--'
  if (course.value.type === '一对多') return course.value.limit || 2
  return 1
}

function typeLabel() {
  if (!course.value) return '--'
  return course.value.type === '一对多' ? '精品小班课' : '一对一私教'
}

function pay() {
  router.push('/user/payment-result')
}

function back() {
  userStore.purchaseProductId = null
  userStore.purchaseCourseType = null
  userStore.persist()
  router.push('/user/coach')
}
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="status-bar"><span>9:41</span><span class="status-icons"><span v-html="icons.signal" style="width:16px;height:12px"></span><span v-html="icons.battery" style="width:27px;height:12px;margin-left:6px"></span></span></div>
      <div class="nav"><div class="back" @click="back">&#8249;</div>确认订单</div>
      <div class="user-shell" style="padding-bottom:120px">
        <!-- 课程信息 -->
        <div class="oc-card">
          <h2>{{ product?.name || '--' }}</h2>
          <div class="oc-row"><span class="oc-row-label">授课教练：</span><span class="oc-row-value">{{ product?.coachName || '--' }}</span></div>
          <div class="oc-row"><span class="oc-row-label">课程类型：</span><span class="oc-row-value">{{ typeLabel() }}</span></div>
          <div class="oc-row"><span class="oc-row-label">上课人数：</span><span class="oc-row-value">{{ classSize() }} 人</span></div>
          <div class="oc-row"><span class="oc-row-label">课时：</span><span class="oc-row-value">{{ course?.hours || '--' }} 节</span></div>
          <div class="oc-row"><span class="oc-row-label">单节时长：</span><span class="oc-row-value">{{ course?.minutes || '--' }} 分钟/节</span></div>
          <div class="oc-row"><span class="oc-row-label">上课门店：</span><span class="oc-row-value">{{ product?.store || '--' }}</span></div>
          <div class="oc-row"><span class="oc-row-label">有效期：</span><span class="oc-row-value">{{ course?.validDays ? course.validDays + ' 天' : '--' }}</span></div>
        </div>
        <!-- 课程说明 -->
        <div class="oc-card">
          <div class="oc-desc-title">课程说明</div>
          <div class="oc-desc-list">
            <template v-if="course?.desc || course?.intro">
              <div class="oc-desc-item">{{ course.desc || course.intro }}</div>
            </template>
            <div v-else class="oc-desc-item">专业教练一对一指导，根据个人情况定制训练计划。</div>
          </div>
        </div>
      </div>
      <div class="oc-bottom-bar">
        <div class="oc-price-box"><span>待支付</span><span>¥{{ price }}</span></div>
        <button class="oc-pay-btn" @click="pay">微信支付</button>
      </div>
    </div>
  </div>
</template>
