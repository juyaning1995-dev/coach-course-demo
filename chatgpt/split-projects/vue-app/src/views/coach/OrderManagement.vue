<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCoachStore } from '@/stores/coachStore'
import { useUserStore } from '@/stores/userStore'
import { load } from '@/services/storage'
import { icons } from '@/components/icons'

const router = useRouter()
const coach = useCoachStore()
const user = useUserStore()

// Merge orders from localStorage (coach side) + userProducts (purchases)
const allOrders = computed(() => {
  const orders = [...load('orders', [])]
  const seen = new Set(orders.map(o => String(o.id)))
  user.userProducts.forEach(p => {
    if (seen.has(String(p.id))) return
    seen.add(String(p.id))
    const ts = parseInt(String(p.id).replace('product-', ''))
    orders.push({
      id: String(ts),
      courseName: p.name,
      coachName: p.coachName || '',
      amount: 0,
      paidAt: ts ? new Date(ts).toISOString() : '',
      buyerName: '',
      buyerPhone: p.buyerPhone || '',
      status: '已支付',
      _fromProduct: true
    })
  })
  return orders
})

// ============ Tabs ============
const tabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待支付' },
  { key: 'paid', label: '已支付' },
  { key: 'refunded', label: '已退款' }
]
const activeTab = ref('all')

const tabStatusMap = {
  all: ['待支付', '已支付', '已退款'],
  pending: ['待支付'],
  paid: ['已支付'],
  refunded: ['已退款']
}

// ============ Filtered orders ============
const filteredOrders = computed(() => {
  const statuses = tabStatusMap[activeTab.value] || tabStatusMap.all
  return allOrders.value
    .filter(o => statuses.includes(o.status))
    .sort((a, b) => (b.paidAt || '').localeCompare(a.paidAt || ''))
})

const tabCounts = computed(() => ({
  all: allOrders.value.length,
  pending: allOrders.value.filter(o => o.status === '待支付').length,
  paid: allOrders.value.filter(o => o.status === '已支付').length,
  refunded: allOrders.value.filter(o => o.status === '已退款').length
}))

// ============ Helpers ============
function statusKey(status) {
  const map = { '待支付': 'pending', '已支付': 'paid', '已退款': 'refunded' }
  return map[status] || 'paid'
}

function formatPaidTime(iso) {
  if (!iso) return '--'
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="status-bar"><span>9:41</span><span class="status-icons"><span v-html="icons.signal" style="width:16px;height:12px"></span><span v-html="icons.battery" style="width:27px;height:12px;margin-left:6px"></span></span></div>
      <div class="nav"><div class="back" @click="router.push('/coach')">&#8249;</div>私教订单<div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div></div>

      <!-- Tabs -->
      <div class="booking-tabs">
        <div v-for="t in tabs" :key="t.key" :class="['booking-tab', { active: activeTab === t.key }]" @click="activeTab = t.key">
          {{ t.label }}<span class="booking-tab-count">{{ tabCounts[t.key] }}</span>
        </div>
      </div>

      <!-- Order list -->
      <div class="booking-list">
        <template v-if="filteredOrders.length">
          <div v-for="o in filteredOrders" :key="o.id" class="booking-card">
            <!-- Row 1: order id + status -->
            <div class="booking-card-row1">
              <div class="booking-course-name">{{ o.id }}</div>
              <span :class="['booking-status', statusKey(o.status)]">{{ o.status }}</span>
            </div>
            <!-- Meta rows -->
            <div class="booking-meta" style="margin-top:8px">
              <div class="booking-meta-row">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8"/><path d="m22 10-8 8-3-3"/><path d="M14 20h6v-6"/></svg>
                <span class="booking-meta-label">课程：</span>
                <span class="booking-meta-text">{{ o.courseName }}</span>
              </div>
              <div class="booking-meta-row">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M5.3 19c1.3-3.3 4.7-5 6.7-5s5.4 1.7 6.7 5"/></svg>
                <span class="booking-meta-label">教练：</span>
                <span class="booking-meta-text">{{ o.coachName }}</span>
              </div>
              <div class="booking-meta-row">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 8h.01"/></svg>
                <span class="booking-meta-label">金额：</span>
                <span class="booking-meta-text" style="color:var(--brand);font-weight:600">￥{{ o.amount }}</span>
              </div>
              <div class="booking-meta-row">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.2"/><path d="M12 6.8v5.2l3.5 2"/></svg>
                <span class="booking-meta-label">支付时间：</span>
                <span class="booking-meta-text">{{ o.paidAt ? formatPaidTime(o.paidAt) : '--' }}</span>
              </div>
              <div class="booking-meta-row">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>
                <span class="booking-meta-label">联系方式：</span>
                <span class="booking-meta-text booking-member-phone">{{ o.buyerPhone }}</span>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="booking-empty">暂无符合条件的订单</div>
      </div>
    </div>
  </div>
</template>
