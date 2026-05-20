<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { icons } from '@/components/icons'

const router = useRouter()
const userStore = useUserStore()

function goBook() {
  const pid = userStore.purchaseProductId
  if (!pid) { router.push('/user/booking'); return }
  userStore.currentUserProductId = pid
  if (userStore.hasContract(pid)) {
    userStore.pendingBookingAfterContract = false
    userStore.currentContractProductId = null
    userStore.persist()
    router.push('/user/booking')
  } else {
    userStore.currentContractProductId = pid
    userStore.pendingBookingAfterContract = true
    userStore.persist()
    router.push('/user/contract')
  }
}
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="status-bar"><span>9:41</span><span class="status-icons"><span v-html="icons.signal" style="width:16px;height:12px"></span><span v-html="icons.battery" style="width:27px;height:12px;margin-left:6px"></span></span></div>
      <div class="nav"><div class="back" @click="router.push('/user/order-confirm')">‹</div>支付结果</div>
      <div class="pr-stage">
        <div class="pr-check">&#10003;</div>
        <div class="pr-title">支付成功</div>
        <div class="pr-actions">
          <button class="pr-btn secondary" @click="router.push('/user/bookings')">订单详情</button>
          <button class="pr-btn primary" @click="goBook">预约课程</button>
        </div>
      </div>
    </div>
  </div>
</template>
