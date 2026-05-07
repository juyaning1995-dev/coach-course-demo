<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="nav"><div class="back" @click="router.push('/user/order-confirm')">‹</div>支付结果<div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div></div>
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
