<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCoachStore } from '@/stores/coachStore'
import { useUserStore } from '@/stores/userStore'
import { icons } from '@/components/icons'
import { fmtISO } from '@/utils/date'

const router = useRouter()
const coach = useCoachStore()
const user = useUserStore()

// ============ Search ============
const searchText = ref('')

// ============ Aggregate students ============
const students = computed(() => {
  const map = new Map()
  coach.schedules.forEach(s => {
    coach.ensureScheduleMembers(s)
    ;(s.members || []).forEach(m => {
      if (m.status === '已取消') return
      const key = (m.phone || '').trim()
      if (!key) return
      if (!map.has(key)) {
        const products = new Map()
        map.set(key, { name: m.name || '', phone: m.phone || '', products })
      }
      const entry = map.get(key)
      if (m.name && m.name !== '用户本人' && m.name !== '当前用户' && !entry.name) entry.name = m.name
      if (m.productId) {
        const p = user.userProducts.find(x => String(x.id) === String(m.productId))
        if (p) entry.products.set(m.productId, p)
      }
    })
  })
  return Array.from(map.values()).map(s => {
    let total = 0, remain = 0
    s.products.forEach(p => {
      // count non-canceled bookings for this student + this product
      let used = 0
      coach.schedules.forEach(sch => {
        coach.ensureScheduleMembers(sch)
        ;(sch.members || []).forEach(m => {
          if ((m.phone || '').trim() !== s.phone) return
          if (String(m.productId) !== String(p.id)) return
          if (m.status !== '已取消') used++
        })
      })
      const r = Number(p.remain || 0)
      total += used + r
      remain += r
    })
    // Also find products purchased by this phone but not yet booked
    user.userProducts.forEach(p => {
      if ((p.buyerPhone || '').trim() === s.phone) {
        const already = s.products.has(p.id)
        if (!already) {
          // count used bookings for this product
          let used = 0
          coach.schedules.forEach(sch => {
            coach.ensureScheduleMembers(sch)
            ;(sch.members || []).forEach(m => {
              if ((m.phone || '').trim() !== s.phone) return
              if (String(m.productId) !== String(p.id)) return
              if (m.status !== '已取消') used++
            })
          })
          const r = Number(p.remain || 0)
          total += used + r
          remain += r
        }
      }
    })
    const noteEntry = coach.studentNotes[s.phone] || {}
    const displayName = noteEntry.displayName || s.name
    return { name: displayName, phone: s.phone, total, remain }
  })
})

const filteredStudents = computed(() => {
  if (!searchText.value.trim()) return students.value
  const kw = searchText.value.trim().toLowerCase()
  return students.value.filter(s =>
    (s.name || '').toLowerCase().includes(kw) ||
    (s.phone || '').toLowerCase().includes(kw)
  )
})

// ============ Booking dialog ============
const showBookDialog = ref(false)
const bookName = ref('')
const bookPhone = ref('')
const bookDate = ref(fmtISO(new Date()))
const bookScheduleId = ref(null)

const availableSchedules = computed(() => {
  return coach.schedules
    .filter(s => s.status !== '已取消')
    .filter(s => !bookDate.value || s.date === bookDate.value)
    .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`))
})

function openBookDialog(student) {
  bookName.value = student ? student.name : ''
  bookPhone.value = student ? student.phone : ''
  bookDate.value = fmtISO(new Date())
  bookScheduleId.value = null
  showBookDialog.value = true
}

function doBook() {
  if (!bookName.value.trim() || !bookPhone.value.trim()) {
    window.__toast?.('请填写姓名和手机号')
    return
  }
  if (!bookScheduleId.value) {
    window.__toast?.('请选择课次')
    return
  }
  const result = coach.confirmMemberBook(bookName.value.trim(), bookPhone.value.trim(), bookScheduleId.value)
  window.__toast?.(result.msg)
  if (result.ok) showBookDialog.value = false
}

// ============ Helpers ============
function avatarChar(name) {
  return (name || '?').charAt(0)
}
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="status-bar"><span>9:41</span><span class="status-icons"><span v-html="icons.signal" style="width:16px;height:12px"></span><span v-html="icons.battery" style="width:27px;height:12px;margin-left:6px"></span></span></div>
      <div class="nav"><div class="back" @click="router.push('/coach')">&#8249;</div>学员管理<div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div></div>

      <!-- Search + count -->
      <div class="booking-filter-bar">
        <div class="booking-filter-input">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 20 20"/></svg>
          <input v-model="searchText" placeholder="搜索学员姓名 / 手机号" class="booking-search-field" />
        </div>
      </div>
      <div style="padding:0 20px 12px;font-size:12.5px;color:var(--muted-foreground)">共 {{ filteredStudents.length }} 名会员</div>

      <!-- Student list -->
      <div class="booking-list">
        <template v-if="filteredStudents.length">
          <div v-for="s in filteredStudents" :key="s.phone" class="booking-card" style="cursor:pointer" @click="router.push('/coach/student/' + encodeURIComponent(s.phone))">
            <div style="display:flex;align-items:center;gap:14px">
              <!-- Avatar -->
              <div style="width:48px;height:48px;border-radius:50%;background:var(--muted);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:600;color:var(--brand);flex:none">{{ avatarChar(s.name) }}</div>
              <!-- Info -->
              <div style="flex:1;min-width:0">
                <div class="booking-course-name">{{ s.name }}</div>
                <div style="font-size:12.5px;color:var(--muted-foreground);margin-top:2px;font-variant-numeric:tabular-nums;letter-spacing:-.02em">{{ s.phone }}</div>
              </div>
            </div>
            <!-- Stats -->
            <div style="font-size:12.5px;color:var(--muted-foreground);margin-top:10px">共 {{ s.total }} 节课 · 剩余 {{ s.remain }} 节课</div>
            <!-- Actions -->
            <div class="booking-actions">
              <button class="booking-action-btn ghost" @click.stop="window.open('tel:' + s.phone)">拨打电话</button>
              <button class="booking-action-btn primary" @click.stop="openBookDialog(s)">预约课程</button>
            </div>
          </div>
        </template>
        <div v-else class="booking-empty">暂无学员数据</div>
      </div>
    </div>

    <!-- Booking dialog -->
    <div v-if="showBookDialog" class="sheet-mask" style="display:block">
      <div class="op-dialog">
        <div class="op-head"><span>新增预约</span><span class="op-close" @click="showBookDialog = false">×</span></div>
        <div class="form-row"><span class="label">日期</span><input type="date" v-model="bookDate" class="box-field" style="width:160px" /></div>
        <div class="form-row"><span class="label">姓名</span><input v-model="bookName" class="box-field" style="width:160px" placeholder="请输入" /></div>
        <div class="form-row"><span class="label">手机号</span><input v-model="bookPhone" class="box-field" style="width:160px" placeholder="请输入" /></div>
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
