<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { icons } from '@/components/icons'

const router = useRouter()

// ============ Tabs ============
const tabs = [
  { key: 'signed', label: '已签约门店' },
  { key: 'available', label: '可签约门店' },
  { key: 'pending', label: '待通过门店' }
]
const activeTab = ref('signed')

// ============ Demo store data ============
const stores = ref([
  { id: 1, name: '大明湖店', avatar: '', address: '山东省济南市历下区大明湖路1号', distance: '1.2km', status: 'signed', phone: '0531-86089999', reason: '' },
  { id: 2, name: '万达广场店', avatar: '', address: '山东省烟台市芝罘区南大街128号', distance: '2.5km', status: 'signed', phone: '0535-6218888', reason: '' },
  { id: 3, name: '万象汇店', avatar: '', address: '山东省烟台市莱山区迎春大街188号', distance: '5.8km', status: 'available', phone: '0535-6789001', reason: '' },
  { id: 4, name: '大悦城店', avatar: '', address: '山东省烟台市芝罘区北马路150号', distance: '3.3km', status: 'available', phone: '0535-6890111', reason: '' },
  { id: 5, name: '永旺梦乐城店', avatar: '', address: '山东省烟台市开发区长江路99号', distance: '8.6km', status: 'available', phone: '0535-6900222', reason: '' },
  { id: 6, name: '新世界百货店', avatar: '', address: '山东省烟台市芝罘区青年南路66号', distance: '4.1km', status: 'pending', phone: '0535-6556677', reason: '' },
  { id: 7, name: '阳光100店', avatar: '', address: '山东省烟台市莱山区黄海路50号', distance: '6.2km', status: 'rejected', phone: '0535-6889933', reason: '暂不接收新教练入驻' }
])

const filteredStores = computed(() => {
  if (activeTab.value === 'pending') {
    return stores.value.filter(s => s.status === 'pending' || s.status === 'rejected')
  }
  return stores.value.filter(s => s.status === activeTab.value)
})

// ============ Sign dialog ============
const showSignDialog = ref(false)
const signStore = ref(null)

function openSignDialog(store) {
  signStore.value = store
  showSignDialog.value = true
}

function confirmSign() {
  if (signStore.value) {
    const idx = stores.value.findIndex(s => s.id === signStore.value.id)
    if (idx > -1) stores.value[idx] = { ...stores.value[idx], status: 'pending' }
    window.__toast?.('签约申请已提交，等待门店审核')
  }
  showSignDialog.value = false
}

// ============ Withdraw dialog ============
const showWithdrawDialog = ref(false)
const withdrawStore = ref(null)

function openWithdrawDialog(store) {
  withdrawStore.value = store
  showWithdrawDialog.value = true
}

function confirmWithdraw() {
  if (withdrawStore.value) {
    const idx = stores.value.findIndex(s => s.id === withdrawStore.value.id)
    if (idx > -1) stores.value[idx] = { ...stores.value[idx], status: 'available' }
    window.__toast?.('已撤回签约申请')
  }
  showWithdrawDialog.value = false
}

// ============ Helpers ============
function avatarChar(name) {
  return (name || '?').charAt(0)
}

function statusLabel(status) {
  const map = { signed: '已签约', available: '可签约', pending: '待通过', rejected: '已拒绝' }
  return map[status] || status
}

function statusClass(status) {
  const map = { signed: 'completed', available: 'upcoming', pending: 'pending_confirm', rejected: 'canceled' }
  return map[status] || 'upcoming'
}
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="status-bar"><span>9:41</span><span class="status-icons"><span v-html="icons.signal" style="width:16px;height:12px"></span><span v-html="icons.battery" style="width:27px;height:12px;margin-left:6px"></span></span></div>
      <div class="nav"><div class="back" @click="router.push('/coach')">&#8249;</div>门店签约<div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div></div>

      <!-- Tabs -->
      <div class="booking-tabs">
        <div v-for="t in tabs" :key="t.key" :class="['booking-tab', { active: activeTab === t.key }]" @click="activeTab = t.key">{{ t.label }}</div>
      </div>

      <!-- Store list -->
      <div class="booking-list">
        <template v-if="filteredStores.length">
          <div v-for="s in filteredStores" :key="s.id" class="booking-card">
            <div style="display:flex;align-items:center;gap:14px">
              <!-- Avatar -->
              <div style="width:48px;height:48px;border-radius:12px;background:var(--muted);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:600;color:var(--brand);flex:none">{{ avatarChar(s.name) }}</div>
              <!-- Info -->
              <div style="flex:1;min-width:0">
                <div style="display:flex;align-items:center;gap:8px">
                  <div class="booking-course-name">{{ s.name }}</div>
                  <span :class="['booking-status', statusClass(s.status)]">{{ statusLabel(s.status) }}</span>
                </div>
                <div style="font-size:12.5px;color:var(--muted-foreground);margin-top:4px;line-height:1.5">{{ s.address }}</div>
                <div style="font-size:12px;color:var(--muted-foreground);margin-top:2px">距离 {{ s.distance }}</div>
              </div>
            </div>
            <!-- Rejection reason -->
            <div v-if="s.status === 'rejected' && s.reason" style="margin-top:10px;padding:8px 12px;background:rgba(239,68,68,.06);border-radius:10px;font-size:12.5px;color:var(--destructive);line-height:1.6">
              拒绝原因：{{ s.reason }}
            </div>
            <!-- Actions -->
            <div v-if="activeTab === 'available'" class="booking-actions">
              <button class="booking-action-btn primary" @click="openSignDialog(s)">签约</button>
            </div>
            <div v-if="s.status === 'pending'" class="booking-actions">
              <button class="booking-action-btn ghost" @click="openWithdrawDialog(s)">撤回</button>
            </div>
          </div>
        </template>
        <div v-else class="booking-empty">暂无门店数据</div>
      </div>
    </div>

    <!-- Sign confirmation dialog -->
    <div v-if="showSignDialog" class="sheet-mask" style="display:block">
      <div class="op-dialog">
        <div class="op-head"><span>确认签约</span><span class="op-close" @click="showSignDialog = false">×</span></div>
        <div style="font-size:14px;color:var(--muted-foreground);line-height:1.7;margin-bottom:8px">
          确认签约 <b style="color:var(--foreground)">{{ signStore?.name }}</b> ？
        </div>
        <div style="font-size:12.5px;color:var(--muted-foreground);line-height:1.6;padding:10px 12px;background:var(--muted);border-radius:10px">
          <div>{{ signStore?.address }}</div>
          <div>距离 {{ signStore?.distance }}</div>
          <div>{{ signStore?.phone }}</div>
        </div>
        <div style="display:flex;gap:10px;margin-top:18px">
          <button class="op-btn" style="flex:1;background:transparent;color:var(--foreground);border:1px solid var(--border);margin:0" @click="showSignDialog = false">取消</button>
          <button class="op-btn" style="flex:1;background:var(--brand);color:var(--brand-foreground);font-weight:600;margin:0" @click="confirmSign">确认签约</button>
        </div>
      </div>
    </div>

    <!-- Withdraw confirmation dialog -->
    <div v-if="showWithdrawDialog" class="sheet-mask" style="display:block">
      <div class="op-dialog">
        <div class="op-head"><span>确认撤回</span><span class="op-close" @click="showWithdrawDialog = false">×</span></div>
        <div style="font-size:14px;color:var(--muted-foreground);line-height:1.7">
          确认撤回对 <b style="color:var(--foreground)">{{ withdrawStore?.name }}</b> 的签约申请？
        </div>
        <div style="font-size:12.5px;color:var(--muted-foreground);margin-top:4px">撤回后该门店将回到可签约列表</div>
        <div style="display:flex;gap:10px;margin-top:18px">
          <button class="op-btn" style="flex:1;background:transparent;color:var(--foreground);border:1px solid var(--border);margin:0" @click="showWithdrawDialog = false">取消</button>
          <button class="op-btn" style="flex:1;background:var(--brand);color:var(--brand-foreground);font-weight:600;margin:0" @click="confirmWithdraw">确认撤回</button>
        </div>
      </div>
    </div>
  </div>
</template>
