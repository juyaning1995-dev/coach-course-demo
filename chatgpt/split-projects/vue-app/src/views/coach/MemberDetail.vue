<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCoachStore } from '@/stores/coachStore'
import { useUserStore } from '@/stores/userStore'
import { icons } from '@/components/icons'
import { fmtISO } from '@/utils/date'

const route = useRoute()
const router = useRouter()
const coach = useCoachStore()
const user = useUserStore()

// Reload from localStorage to pick up latest bookings
coach.reloadSchedules()
user.reload()

const phone = computed(() => decodeURIComponent(route.params.phone || ''))

// ============ Student data ============
const student = computed(() => {
  let name = ''
  const productIds = new Set()
  coach.schedules.forEach(s => {
    coach.ensureScheduleMembers(s)
    ;(s.members || []).forEach(m => {
      if ((m.phone || '').trim() !== phone.value) return
      if (m.status === '已取消') return
      if (m.name && m.name !== '用户本人' && m.name !== '当前用户' && !name) name = m.name
      if (m.productId) productIds.add(m.productId)
    })
  })
  // Also find products purchased by this phone but not yet booked
  user.userProducts.forEach(p => {
    if ((p.buyerPhone || '').trim() === phone.value) productIds.add(p.id)
  })
  const origName = name || '未命名'
  const entry = coach.studentNotes[phone.value] || {}
  if (entry.displayName) name = entry.displayName
  return { name: name || '未命名', origName, phone: phone.value, productIds: [...productIds] }
})

const note = computed({
  get: () => (coach.studentNotes[phone.value] || {}).note || '',
  set: (val) => {
    const entry = coach.studentNotes[phone.value] || {}
    coach.studentNotes[phone.value] = { ...entry, note: val }
    coach.persist()
  }
})

const displayName = computed({
  get: () => student.value.name,
  set: (val) => {
    const entry = coach.studentNotes[phone.value] || {}
    coach.studentNotes[phone.value] = { ...entry, displayName: val }
    coach.persist()
  }
})

// ============ Tab state ============
const tabs = [
  { key: 'rights', label: '已购课程' },
  { key: 'bookings', label: '预约记录' },
  { key: 'records', label: '上课记录' },
  { key: 'orders', label: '订单记录' }
]
const activeTab = ref('rights')

// ============ 课程权益 ============
const courseRights = computed(() => {
  const result = []
  student.value.productIds.forEach(pid => {
    const p = user.userProducts.find(x => String(x.id) === String(pid))
    if (!p) return
    const course = coach.courses.find(c => String(c.id) === String(p.courseId))
    // 已用 = all non-canceled bookings (待上课/上课中/待确认/已完课/未到场)
    let used = 0
    coach.schedules.forEach(s => {
      (s.members || []).forEach(m => {
        if ((m.phone || '').trim() !== phone.value) return
        if (String(m.productId) !== String(p.id)) return
        if (m.status !== '已取消') used++
      })
    })
    const remain = Number(p.remain || 0)
    const total = used + remain
    const pct = total > 0 ? Math.round(used / total * 100) : 0
    // expiry: product created + course validDays
    let expiry = ''
    const ts = parseInt(p.id.replace('product-', ''))
    if (ts && course?.validDays) {
      const d = new Date(ts + Number(course.validDays) * 86400000)
      expiry = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    }
    result.push({
      ...p,
      total,
      used,
      remain,
      pct,
      expiry,
      unit: course?.unit || '按节',
      unitPrice: course?.unitPrice || '',
      price: course?.price || '',
      type: p.type || course?.type || '一对一',
      validDays: course?.validDays || ''
    })
  })
  // Sort: available (remain > 0) first, then by id desc
  result.sort((a, b) => {
    const aAvail = a.remain > 0 ? 1 : 0
    const bAvail = b.remain > 0 ? 1 : 0
    if (aAvail !== bAvail) return bAvail - aAvail
    return String(b.id).localeCompare(String(a.id))
  })
  return result
})

// ============ All bookings for this student ============
const allMemberBookings = computed(() => {
  const result = []
  const seen = new Set()
  // From schedule members
  coach.schedules.forEach(s => {
    coach.ensureScheduleMembers(s)
    ;(s.members || []).forEach(m => {
      if ((m.phone || '').trim() !== phone.value) return
      const bid = String(m.bookingId)
      if (seen.has(bid)) return
      seen.add(bid)
      result.push({
        bookingId: m.bookingId,
        name: m.name || '',
        phone: m.phone || '',
        status: m.status || '',
        source: m.source || 'coach',
        createdAt: m.createdAt || '',
        completedAt: m.completedAt || '',
        productId: m.productId || '',
        scheduleId: s.id,
        courseName: s.courseName || '',
        scheduleDate: s.date || '',
        scheduleStart: s.start || '',
        scheduleEnd: s.end || '',
        store: s.store || ''
      })
    })
  })
  // Also from userBookings (user-side bookings)
  user.userBookings.forEach(b => {
    if ((b.customerPhone || '').trim() !== phone.value) return
    const bid = String(b.id)
    if (seen.has(bid)) return
    seen.add(bid)
    result.push({
      bookingId: b.id,
      name: b.customerName || '',
      phone: b.customerPhone || '',
      status: b.status || '',
      source: b.source || 'user',
      createdAt: b.createdAt || '',
      completedAt: b.completedAt || '',
      productId: b.productId || '',
      scheduleId: b.scheduleId,
      courseName: b.courseName || '',
      scheduleDate: b.date || '',
      scheduleStart: b.start || '',
      scheduleEnd: b.end || '',
      store: b.store || ''
    })
  })
  return result.sort((a, b) => (b.scheduleDate || '').localeCompare(a.scheduleDate || ''))
})

// 预约记录: all bookings except canceled
const bookingRecords = computed(() => allMemberBookings.value.filter(b =>
  b.status !== '已取消'
))

// 上课记录: 已完课, 未到场, 已取消
const classRecords = computed(() => allMemberBookings.value.filter(b =>
  ['已完课', '未到场', '已取消'].includes(b.status)
))

// ============ Order records ============
const orderRecords = computed(() => {
  const orders = [...coach.orders.filter(o => (o.buyerPhone || '').trim() === phone.value)]
  // Also include userProducts as orders for this student
  user.userProducts.forEach(p => {
    if ((p.buyerPhone || '').trim() !== phone.value) return
    if (orders.some(o => String(o.id) === String(p.id))) return
    const ts = parseInt(String(p.id).replace('product-', ''))
    orders.push({
      id: p.id,
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
  return orders.sort((a, b) => (b.paidAt || '').localeCompare(a.paidAt || ''))
})

// ============ Helpers ============
function avatarChar(name) {
  return (name || '?').charAt(0)
}

function statusKey(status) {
  const map = {
    '待上课': 'upcoming', '上课中': 'ongoing', '待学员确认完课': 'pending_confirm',
    '待教练处理取消': 'pending_confirm', '已完课': 'completed', '已取消': 'canceled', '未到场': 'no_show'
  }
  return map[status] || 'completed'
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatDateMD(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, '0')}`
}

function statusLabel(status) {
  const map = { '待学员确认完课': '待确认完课', '待教练处理取消': '待处理取消' }
  return map[status] || status
}

// ============ Remark name dialog ============
const showRemarkName = ref(false)
const remarkNameDraft = ref('')
function openRemarkName() {
  remarkNameDraft.value = displayName.value !== student.value.origName ? displayName.value : ''
  showRemarkName.value = true
}
function saveRemarkName() {
  const v = remarkNameDraft.value.trim()
  if (v) displayName.value = v
  showRemarkName.value = false
}
function clearRemarkName() {
  displayName.value = student.value.origName
  showRemarkName.value = false
}

// ============ Note dialog ============
const showNote = ref(false)
const noteDraft = ref('')
function openNote() {
  noteDraft.value = note.value
  showNote.value = true
}
function saveNote() {
  note.value = noteDraft.value
  showNote.value = false
}

// ============ Booking dialog ============
const showBookDialog = ref(false)
const bookDate = ref(fmtISO(new Date()))
const bookScheduleId = ref(null)
const bookProductId = ref('')

const availableSchedules = computed(() => {
  return coach.schedules
    .filter(s => s.status !== '已取消')
    .filter(s => !bookDate.value || s.date === bookDate.value)
    .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`))
})

function openBookDialog(product) {
  bookDate.value = fmtISO(new Date())
  bookScheduleId.value = null
  bookProductId.value = product ? product.id : ''
  showBookDialog.value = true
}

function doBook() {
  if (!bookScheduleId.value) { window.__toast?.('请选择课次'); return }
  const result = coach.confirmMemberBook(displayName.value, phone.value, bookScheduleId.value)
  window.__toast?.(result.msg)
  if (result.ok) showBookDialog.value = false
}
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="status-bar"><span>9:41</span><span class="status-icons"><span v-html="icons.signal" style="width:16px;height:12px"></span><span v-html="icons.battery" style="width:27px;height:12px;margin-left:6px"></span></span></div>
      <div class="nav"><div class="back" @click="router.push('/coach/students')">&#8249;</div>学员详情<div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div></div>

      <!-- Personal Info Card -->
      <div style="padding:12px 20px 14px">
        <div class="booking-card" style="margin-bottom:0">
          <div style="display:flex;align-items:center;gap:14px">
            <div style="width:56px;height:56px;border-radius:50%;background:var(--muted);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:600;color:var(--brand);flex:none">{{ avatarChar(displayName) }}</div>
            <div style="flex:1;min-width:0">
              <div style="font-size:17px;font-weight:600;color:var(--foreground)">{{ displayName }}</div>
              <div v-if="displayName !== student.origName" style="font-size:12px;color:var(--muted-foreground);margin-top:2px">昵称: {{ student.origName }}</div>
              <div style="font-size:13px;color:var(--muted-foreground);margin-top:3px;font-variant-numeric:tabular-nums;letter-spacing:-.02em">{{ phone }}</div>
            </div>
          </div>
          <!-- Actions -->
          <div class="booking-actions">
            <button class="booking-action-btn ghost" @click="openRemarkName">{{ displayName !== (student.origName || '未命名') ? '编辑备注名' : '备注名' }}</button>
            <button class="booking-action-btn ghost" @click="openNote">{{ note ? '编辑备忘' : '备忘' }}</button>
            <button class="booking-action-btn ghost" @click="window.open('tel:' + phone)">拨打电话</button>
          </div>
          <div v-if="note" style="margin-top:8px;padding:8px 12px;background:var(--muted);border-radius:10px;font-size:13px;color:var(--muted-foreground);line-height:1.6">{{ note }}</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="booking-tabs">
        <div v-for="t in tabs" :key="t.key" :class="['booking-tab', { active: activeTab === t.key }]" @click="activeTab = t.key">{{ t.label }}</div>
      </div>

      <!-- Tab Content -->
      <div class="booking-list">
        <!-- 课程权益 -->
        <template v-if="activeTab === 'rights'">
          <div v-if="!courseRights.length" class="booking-empty">暂无已购课程</div>
          <div v-for="p in courseRights" :key="p.id" class="booking-card">
            <!-- Row 1: course name -->
            <div class="booking-course-name">{{ p.name }}</div>
            <!-- Row 2: 单价时长 + 授课形式 -->
            <div style="display:flex;align-items:center;gap:16px;margin-top:6px;font-size:12.5px;color:var(--muted-foreground)">
              <span>{{ p.unitPrice ? '￥' + p.unitPrice + '/' + (p.unit === '按时间' ? '时' : '节') : (p.price ? '￥' + p.price : '') }} · {{ p.type }}</span>
              <span v-if="p.unit === '按节'">按节</span>
              <span v-if="p.expiry">有效期至 {{ p.expiry }}</span>
            </div>
            <!-- Row 3: 总课时 已用课时 剩余 已用 + 进度条 -->
            <div style="display:flex;align-items:center;gap:14px;margin-top:10px;font-size:13px">
              <div style="flex:none;white-space:nowrap"><span style="color:var(--muted-foreground)">总课时 </span><span style="font-weight:600;color:var(--foreground)">{{ p.total }}节</span></div>
              <div style="flex:none;white-space:nowrap"><span style="color:var(--muted-foreground)">已用课时 </span><span style="font-weight:600;color:var(--foreground)">{{ p.used }}节</span></div>
              <div style="flex:none;white-space:nowrap"><span style="color:var(--muted-foreground)">剩余 </span><span style="font-weight:600;color:var(--brand)">{{ p.remain }}节</span></div>
              <div style="flex:1;display:flex;align-items:center;gap:6px;min-width:0">
                <span style="font-size:11px;color:var(--muted-foreground);flex:none">已用</span>
                <div style="flex:1;height:6px;background:var(--muted);border-radius:3px;overflow:hidden">
                  <div :style="{ width: p.pct + '%', height: '100%', background: 'var(--brand)', borderRadius: '3px', transition: 'width .3s' }"></div>
                </div>
              </div>
            </div>
            <!-- Actions -->
            <div class="booking-actions">
              <button class="booking-action-btn ghost" @click="window.__toast?.('功能建设中')">转让</button>
              <button class="booking-action-btn ghost" @click="window.__toast?.('功能建设中')">延期</button>
              <button class="booking-action-btn ghost" @click="window.__toast?.('功能建设中')">退费</button>
              <button class="booking-action-btn primary" :disabled="p.remain <= 0" @click="openBookDialog(p)">约课</button>
            </div>
          </div>
        </template>

        <!-- 预约记录 -->
        <template v-if="activeTab === 'bookings'">
          <div v-if="!bookingRecords.length" class="booking-empty">暂无预约记录</div>
          <div v-for="b in bookingRecords" :key="b.bookingId" class="booking-card">
            <div class="booking-card-row1">
              <div class="booking-course-name">{{ b.courseName }}</div>
              <span :class="['booking-status', statusKey(b.status)]">{{ statusLabel(b.status) }}</span>
            </div>
            <div class="booking-meta" style="margin-top:8px">
              <div class="booking-meta-row">
                <span class="booking-meta-label">上课时间：</span>
                <span class="booking-meta-text booking-class-time">{{ formatDateMD(b.scheduleDate) }} {{ b.scheduleStart }} – {{ b.scheduleEnd }}</span>
              </div>
              <div class="booking-meta-row">
                <span class="booking-meta-label">约课时间：</span>
                <span class="booking-meta-text">{{ formatTime(b.createdAt) }}</span>
              </div>
              <div class="booking-meta-row">
                <span class="booking-meta-label">上课门店：</span>
                <span class="booking-meta-text">{{ b.store || '未设置门店' }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- 上课记录 -->
        <template v-if="activeTab === 'records'">
          <div v-if="!classRecords.length" class="booking-empty">暂无上课记录</div>
          <div v-for="b in classRecords" :key="b.bookingId" class="booking-card">
            <div class="booking-card-row1">
              <div class="booking-course-name">{{ b.courseName }}</div>
              <span :class="['booking-status', statusKey(b.status)]">{{ statusLabel(b.status) }}</span>
            </div>
            <div class="booking-meta" style="margin-top:8px">
              <div class="booking-meta-row">
                <span class="booking-meta-label">上课时间：</span>
                <span class="booking-meta-text">{{ formatDateMD(b.scheduleDate) }} {{ b.scheduleStart }} – {{ b.scheduleEnd }}</span>
              </div>
              <div v-if="b.completedAt" class="booking-meta-row">
                <span class="booking-meta-label">{{ b.status === '已取消' ? '取消时间：' : '完课时间：' }}</span>
                <span class="booking-meta-text">{{ formatTime(b.completedAt) }}</span>
              </div>
              <div class="booking-meta-row">
                <span class="booking-meta-label">上课门店：</span>
                <span class="booking-meta-text">{{ b.store || '未设置门店' }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- 订单记录 -->
        <template v-if="activeTab === 'orders'">
          <div v-if="!orderRecords.length" class="booking-empty">暂无订单记录</div>
          <div v-for="o in orderRecords" :key="o.id" class="booking-card">
            <div class="booking-course-name">{{ o.id }}</div>
            <div class="booking-meta" style="margin-top:8px">
              <div class="booking-meta-row">
                <span class="booking-meta-label">课程：</span>
                <span class="booking-meta-text">{{ o.courseName }}</span>
              </div>
              <div class="booking-meta-row">
                <span class="booking-meta-label">金额：</span>
                <span class="booking-meta-text" style="color:var(--brand);font-weight:600">￥{{ o.amount }}</span>
              </div>
              <div class="booking-meta-row">
                <span class="booking-meta-label">支付时间：</span>
                <span class="booking-meta-text">{{ o.paidAt ? formatTime(o.paidAt) : '--' }}</span>
              </div>
            </div>
            <div style="margin-top:8px">
              <span :class="['booking-status', o.status === '已支付' ? 'paid' : o.status === '待支付' ? 'pending' : 'refunded']">{{ o.status }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- Remark name dialog -->
    <div v-if="showRemarkName" class="sheet-mask" style="display:block">
      <div class="op-dialog">
        <div class="op-head"><span>备注名</span><span class="op-close" @click="showRemarkName = false">×</span></div>
        <input v-model="remarkNameDraft" placeholder="输入备注名..." style="width:100%;height:44px;border:1px solid var(--border);border-radius:12px;padding:0 12px;font-size:15px;outline:none;background:var(--muted);color:var(--foreground);box-sizing:border-box" @keyup.enter="saveRemarkName" />
        <div style="display:flex;gap:10px;margin-top:14px">
          <button v-if="displayName !== student.origName" class="op-btn" style="flex:1;background:transparent;color:var(--destructive);border:1px solid var(--border);margin:0" @click="clearRemarkName">清除</button>
          <button class="op-btn" style="flex:1;background:var(--brand);color:var(--brand-foreground);font-weight:600;margin:0" @click="saveRemarkName">保存</button>
        </div>
      </div>
    </div>

    <!-- Note dialog -->
    <div v-if="showNote" class="sheet-mask" style="display:block">
      <div class="op-dialog">
        <div class="op-head"><span>备忘</span><span class="op-close" @click="showNote = false">×</span></div>
        <textarea v-model="noteDraft" placeholder="输入备注信息..." style="width:100%;height:100px;border:1px solid var(--border);border-radius:12px;padding:12px;font-size:14px;font-family:inherit;resize:none;outline:none;background:var(--muted);color:var(--foreground);box-sizing:border-box"></textarea>
        <button class="op-btn" style="margin-top:14px;background:var(--brand);color:var(--brand-foreground);font-weight:600" @click="saveNote">保存备注</button>
      </div>
    </div>

    <!-- Booking dialog -->
    <div v-if="showBookDialog" class="sheet-mask" style="display:block">
      <div class="op-dialog">
        <div class="op-head"><span>新增预约</span><span class="op-close" @click="showBookDialog = false">×</span></div>
        <div class="form-row"><span class="label">日期</span><input type="date" v-model="bookDate" class="box-field" style="width:160px" /></div>
        <div class="form-row"><span class="label">课次</span>
          <select v-model="bookScheduleId" class="box-field" style="width:160px">
            <option :value="null" disabled>请选择课次</option>
            <option v-for="s in availableSchedules" :key="s.id" :value="s.id">{{ s.courseName }} {{ s.date }} {{ s.start }}</option>
          </select>
        </div>
        <button class="op-btn" style="margin-top:14px;background:var(--brand);color:var(--brand-foreground);font-weight:600" @click="doBook">确认预约</button>
      </div>
    </div>
  </div>
</template>
