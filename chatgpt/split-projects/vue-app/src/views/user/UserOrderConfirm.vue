<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
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
      <div class="nav"><div class="back" @click="back">‹</div>确认订单</div>
      <div class="user-shell" style="padding-bottom:120px">
        <div class="oc-card">
          <h2>{{ product?.name || '--' }}</h2>
          <div class="oc-row"><span class="oc-row-label">教练</span><span class="oc-row-value">{{ product?.coachName || '--' }}</span></div>
          <div class="oc-row"><span class="oc-row-label">类型</span><span class="oc-row-value">{{ product?.type === '一对多' ? '精品小班课' : '一对一私教' }}</span></div>
          <div class="oc-row"><span class="oc-row-label">门店</span><span class="oc-row-value">{{ product?.store || '--' }}</span></div>
          <div class="oc-row"><span class="oc-row-label">单价</span><span class="oc-row-value">¥{{ price }}</span></div>
          <div class="oc-row"><span class="oc-row-label">数量</span><span class="oc-row-value">1</span></div>
        </div>
        <div class="oc-card">
          <div class="oc-desc-title">订单说明：</div>
          <div class="oc-desc-list">
            <div v-if="course?.desc" class="oc-desc-item">{{ course.desc }}</div>
            <div v-else class="oc-desc-item">暂无订单说明</div>
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
