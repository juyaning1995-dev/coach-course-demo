<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="nav"><div class="back" @click="router.push('/user/order-confirm')">‹</div>支付结果</div>
      <div class="pr-stage">
        <div class="pr-check">&#10003;</div>
        <div class="pr-title">支付成功</div>
        <div class="pr-actions">
          <button class="pr-btn secondary" @click="router.push('/user/bookings')">订单详情</button>
          <button class="pr-btn primary" @click="router.push('/user/booking')">预约课程</button>
        </div>
      </div>
    </div>
  </div>
</template>
