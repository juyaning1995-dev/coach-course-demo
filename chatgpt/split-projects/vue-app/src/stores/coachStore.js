import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { load, save, remove, deleteRaw } from '@/services/storage'
import { fmtISO, startOfWeek, normalizeUserCourseName, makeBookingId, hoursUntilBooking } from '@/utils/date'
import { useUserStore } from './userStore'

const DEFAULT_COACH_PROFILE = { name: '王美丽', gender: '女', phone: '182****8474', birthDate: '1995-03-18', idCard: '4108*****5689', tags: ['减脂', '塑形', '瑜伽', '普拉提'], bio: '从业8年，擅长体态矫正与产后恢复训练。注重科学训练方法，为每位学员量身定制训练计划。', avatar: '', photos: [] }
const DEFAULT_STORE_INFO = { name: '振华商厦店', address: '山东省烟台市芝罘区西大街8号', phone: '0535-6580333' }

export const useCoachStore = defineStore('coach', () => {
  // ============ State ============
  const courses = ref(load('courses', []))
  const WORKTIME_VERSION = 2
  const savedVersion = load('workTimeVersion', 0)
  if (savedVersion < WORKTIME_VERSION) {
    save('workTimeVersion', WORKTIME_VERSION)
    save('workTimes', { 一: [], 二: [], 三: [], 四: [], 五: [], 六: [], 日: [] })
    save('courses', [])
    save('schedules', [])
    deleteRaw('coach_workDraft')
    deleteRaw('coach_scheduleDraft')
  }
  const workTimes = ref(load('workTimes', { 一: [], 二: [], 三: [], 四: [], 五: [], 六: [], 日: [] }))
  const repeatWorkTime = ref(load('repeatWorkTime', true))
  const workTimeWeekStart = ref(load('workTimeWeekStart', ''))
  const schedules = ref(load('schedules', []))
  const coachProfile = ref(load('coachProfile', DEFAULT_COACH_PROFILE))
  const storeInfo = ref(load('storeInfo', DEFAULT_STORE_INFO))
  const editingId = ref(null)
  const pendingAuditId = ref(null)
  const currentScheduleId = ref(null)
  const editingScheduleId = ref(null)
  const coachInfoEditing = ref(false)
  const currentCalendarWeekStart = ref(fmtISO(startOfWeek(new Date())))

  // ============ Getters ============
  const onlineCourses = computed(() => courses.value.filter(c => c.status === '已上架'))
  const today = computed(() => new Date())
  const todayKey = computed(() => fmtISO(today.value))

  // ============ Persistence ============
  function persist() {
    save('courses', courses.value)
    save('workTimes', workTimes.value)
    save('schedules', schedules.value)
    save('coachProfile', coachProfile.value)
    save('storeInfo', storeInfo.value)
    save('repeatWorkTime', repeatWorkTime.value)
    save('workTimeWeekStart', workTimeWeekStart.value)
  }

  function checkAndClearWorkTime() {
    if (repeatWorkTime.value) return
    const currentWeekStart = fmtISO(startOfWeek(new Date()))
    if (workTimeWeekStart.value && workTimeWeekStart.value !== currentWeekStart) {
      workTimes.value = { 一: [], 二: [], 三: [], 四: [], 五: [], 六: [], 日: [] }
      workTimeWeekStart.value = ''
      persist()
    }
  }
  checkAndClearWorkTime()

  // ============ Course Management ============
  function openCreate() {
    editingId.value = null
    return { title: '新增课程', btnText: '创建', fields: {} }
  }

  function editCourse(id) {
    const c = courses.value.find(x => x.id === id)
    if (!c) return null
    editingId.value = id
    return { title: '新增课程', btnText: c.status === '审核驳回' ? '重新提交' : '保存', fields: { ...c } }
  }

  function submitCourse(data) {
    if (editingId.value) {
      const idx = courses.value.findIndex(x => x.id === editingId.value)
      const needAudit = true
      courses.value[idx] = { ...courses.value[idx], ...data, reason: '', status: '待审核' }
      pendingAuditId.value = needAudit ? courses.value[idx].id : null
      persist()
      syncUserProducts()
      return { ok: true, msg: needAudit ? '已提交审核' : '已保存', needAudit }
    }
    const c = { id: Date.now(), ...data, status: '待审核' }
    courses.value.unshift(c)
    pendingAuditId.value = c.id
    persist()
    syncUserProducts()
    return { ok: true, msg: '创建成功，已进入待审核', needAudit: true }
  }

  function auditPass() {
    const c = courses.value.find(x => x.id === pendingAuditId.value)
    if (c) { c.status = '已上架'; c.reason = '' }
    pendingAuditId.value = null
    persist()
    syncUserProducts()
  }

  function auditReject() {
    const c = courses.value.find(x => x.id === pendingAuditId.value)
    if (c) { c.status = '审核驳回'; c.reason = '演示驳回：课程信息需补充' }
    pendingAuditId.value = null
    persist()
    syncUserProducts()
  }

  function changeCourseStatus(id, status) {
    const c = courses.value.find(x => x.id === id)
    if (c) c.status = status
    persist()
    syncUserProducts()
  }

  function removeCourse(id) {
    courses.value = courses.value.filter(x => x.id !== id)
    persist()
    syncUserProducts()
  }

  // ============ Work Time ============
  function saveWorkTime(days, times) {
    ['一', '二', '三', '四', '五', '六', '日'].forEach(d => {
      workTimes.value[d] = days.includes(d) ? [...times] : []
    })
    workTimeWeekStart.value = fmtISO(startOfWeek(new Date()))
    persist()
  }

  function setRepeatWorkTime(val) {
    repeatWorkTime.value = val
    persist()
  }

  function getWorkRangesForDate(dateInput) {
    const dateStr = typeof dateInput === 'string' ? dateInput : fmtISO(dateInput)
    const d = ['日', '一', '二', '三', '四', '五', '六'][new Date(dateStr + 'T00:00:00').getDay()]
    return workTimes.value[d] || []
  }

  function hasWorkTimeForDate(dateInput) {
    return getWorkRangesForDate(dateInput).length > 0
  }

  // ============ Schedule Management ============
  function reloadSchedules() {
    schedules.value = load('schedules', [])
  }

  function saveSchedule(data, editingId = null) {
    const payload = {
      courseId: data.courseId,
      courseType: data.courseType,
      courseName: data.courseName + (data.courseType === '一对多' ? '小班' : ''),
      date: data.date,
      week: ['日', '一', '二', '三', '四', '五', '六'][new Date(data.date + 'T00:00:00').getDay()],
      start: data.start,
      end: data.end,
      store: data.store || '未选择门店',
      limit: +data.limit || (data.courseType === '一对多' ? 2 : 1)
    }
    if (editingId) {
      const idx = schedules.value.findIndex(x => x.id === editingId)
      if (idx > -1) schedules.value[idx] = { ...schedules.value[idx], ...payload }
    } else {
      schedules.value.push({ id: Date.now(), ...payload, booked: 0, status: '可预约', members: [] })
    }
    persist()
  }

  function cancelSchedule(id) {
    const s = schedules.value.find(x => x.id === id)
    if (s) s.status = '已取消'
    persist()
  }

  function deleteSchedule(id) {
    schedules.value = schedules.value.filter(x => x.id !== id)
    persist()
  }

  function toggleStopBooking(id) {
    const s = schedules.value.find(x => x.id === id)
    if (!s) return
    if (s.status === '停止预约') {
      s.status = Number(s.booked || 0) >= Number(s.limit || 1) ? '已满' : '可预约'
    } else {
      s.status = '停止预约'
    }
    persist()
  }

  // ============ Member / Booking ============
  function ensureScheduleMembers(schedule) {
    if (!Array.isArray(schedule.members)) schedule.members = []
    schedule.members = schedule.members.map((m, i) => {
      if (m.bookingId && m.status && m.source) return m
      return {
        bookingId: m.bookingId || `${schedule.id}-member-${i + 1}`,
        name: m.name || '学员', phone: m.phone || '',
        time: m.time || '教练端预约', status: m.status || '待上课',
        source: m.source || 'coach', isCurrentUser: m.isCurrentUser ?? (m.name === '小明' || m.phone === '188****0000'),
        productId: m.productId || '',
        createdAt: m.createdAt || new Date().toISOString(),
        cancelRequestedAt: m.cancelRequestedAt || '',
        completeConfirmExpireAt: m.completeConfirmExpireAt || '',
        completedAt: m.completedAt || ''
      }
    })
    syncScheduleBookedCount(schedule)
  }

  function getScheduleActiveMembers(schedule) {
    ensureScheduleMembers(schedule)
    return schedule.members.filter(m => m.status !== '已取消')
  }

  function syncScheduleBookedCount(schedule) {
    schedule.booked = (schedule.members || []).filter(m => m.status !== '已取消').length
    if (schedule.status !== '停止预约' && schedule.status !== '已取消') {
      schedule.status = schedule.booked >= Number(schedule.limit || 1) ? '已满' : '可预约'
    }
  }

  function confirmMemberBook(name, phone, scheduleId) {
    reloadSchedules()
    const userStore = useUserStore()
    const s = schedules.value.find(x => x.id === scheduleId)
    if (!s) return { ok: false, msg: '课次不存在' }
    ensureScheduleMembers(s)
    if (s.status === '停止预约') return { ok: false, msg: '该课次已停止预约' }
    if (s.booked >= s.limit) return { ok: false, msg: '该课次已满' }
    if (s.members.some(m => m.name === name && m.status !== '已取消')) return { ok: false, msg: '该会员已预约本课次' }

    const isCurrentUser = name === '小明' || phone === '188****0000'
    const product = userStore.getFirstAvailableProduct(s.courseId)
    if (isCurrentUser && (!product || Number(product.remain || 0) <= 0)) return { ok: false, msg: '小明课时不足' }

    const booking = {
      bookingId: makeBookingId(), name, phone,
      time: '教练端预约', status: '待上课', source: 'coach',
      isCurrentUser, productId: product ? product.id : '',
      createdAt: new Date().toISOString(),
      cancelRequestedAt: '', completeConfirmExpireAt: '', completedAt: ''
    }
    s.members.push(booking)
    if (isCurrentUser && product) product.remain = Math.max(0, Number(product.remain || 0) - 1)
    userStore.upsertBookingMirror(s, booking)
    syncScheduleBookedCount(s)
    persist()
    userStore.persist()
    return { ok: true, msg: '代约成功' }
  }

  function updateBookingRecord(bookingId, changes) {
    const userStore = useUserStore()
    schedules.value.forEach(s => {
      ensureScheduleMembers(s)
      const idx = s.members.findIndex(m => String(m.bookingId) === String(bookingId))
      if (idx > -1) { s.members[idx] = { ...s.members[idx], ...changes }; userStore.upsertBookingMirror(s, s.members[idx]); syncScheduleBookedCount(s) }
    })
    userStore.updateBookingInList(bookingId, changes)
    persist()
    userStore.persist()
  }

  function cancelBookingSeat(bookingId) {
    reloadSchedules()
    const userStore = useUserStore()
    schedules.value.forEach(s => {
      ensureScheduleMembers(s)
      const idx = s.members.findIndex(m => String(m.bookingId) === String(bookingId))
      if (idx > -1) { s.members[idx] = { ...s.members[idx], status: '已取消', completedAt: new Date().toISOString() }; userStore.upsertBookingMirror(s, s.members[idx]); syncScheduleBookedCount(s) }
    })
    const b = userStore.userBookings.find(item => String(item.id) === String(bookingId))
    if (b) {
      const p = userStore.userProducts.find(p => String(p.id) === String(b.productId))
      if (p) p.remain = Number(p.remain || 0) + 1
      userStore.updateBookingInList(bookingId, { status: '已取消', completedAt: new Date().toISOString() })
    }
    persist()
    userStore.persist()
  }

  // ============ Data Sync ============
  function syncScheduleCourseData() {
    schedules.value.forEach(s => {
      const course = courses.value.find(c => String(s.courseId ?? '') === String(c.id) || (!s.courseId && s.courseName && s.courseName.includes(c.name)))
      if (!course) return
      if (s.courseId !== course.id) s.courseId = course.id
      if (s.courseType !== course.type) s.courseType = course.type
      if (!s.store && course.stores) s.store = course.stores
    })
  }

  function syncUserProducts() {
    syncScheduleCourseData()
    const userStore = useUserStore()
    userStore.reload()
    userStore.userProducts = userStore.userProducts.filter(p => {
      const course = courses.value.find(c => String(c.id) === String(p.courseId))
      if (!course) return true
      if (p.name !== normalizeUserCourseName(course)) p.name = normalizeUserCourseName(course)
      if (p.type !== course.type) p.type = course.type
      if (!p.store && course.stores) p.store = course.stores
      return true
    })
    userStore.persist()
  }

  // ============ Coach Home Stats ============
  function getHomeStats() {
    const tk = todayKey.value
    const todayAll = schedules.value.filter(s => s.date === tk && s.status !== '已取消')
    let todayBooked = 0, todayPendingBooked = 0
    todayAll.forEach(s => { const active = getScheduleActiveMembers(s); todayBooked += active.length; todayPendingBooked += active.filter(m => m.status === '待上课').length })
    const completed = schedules.value.filter(s => s.date === tk && s.status !== '已取消' && getScheduleActiveMembers(s).every(m => ['已完课', '未到场'].includes(m.status)) && getScheduleActiveMembers(s).length > 0)
    const revenue = completed.reduce((sum, s) => { const c = courses.value.find(x => x.id === s.courseId); return sum + (c ? Number(c.price || 0) : 0) }, 0)
    return [
      { icon: 'calendarCheck', label: '今日排课', value: todayAll.length, unit: '节', note: todayAll.length ? `${todayAll.length}个课次` : '暂无' },
      { icon: 'chart', label: '今日约课', value: todayBooked, unit: '节', note: todayPendingBooked ? `${todayPendingBooked}节待上课` : '暂无待上课' },
      { icon: 'income', label: '今日收入', value: '￥' + revenue, unit: '', note: revenue > 0 ? `${completed.length}笔完成` : '暂无' }
    ]
  }

  function getTodaySchedules() {
    return schedules.value.filter(s => s.date === todayKey.value && s.status !== '已取消' && getScheduleActiveMembers(s).length > 0).sort((a, b) => timeToMin_inline(a.start) - timeToMin_inline(b.start))
  }

  function getCoachStudentCount() {
    const keys = new Set()
    schedules.value.forEach(s => { (s.members || []).forEach(m => { if (m.status === '已取消') return; const k = (m.phone || m.name || '').trim(); if (k) keys.add(k) }) })
    return keys.size
  }

  function getMineStats() {
    const monthKey = `${today.value.getFullYear()}-${String(today.value.getMonth() + 1).padStart(2, '0')}`
    const monthSchedules = schedules.value.filter(s => String(s.date || '').startsWith(monthKey) && s.status !== '已取消')
    const studentCount = getCoachStudentCount()
    const revenue = monthSchedules.reduce((sum, s) => {
      const c = courses.value.find(x => x.id === s.courseId)
      return sum + (c ? Number(c.price || 0) : 0) * Math.max(1, getScheduleActiveMembers(s).length)
    }, 0)
    return [
      { value: monthSchedules.length, label: '本月排课', unit: '节' },
      { value: studentCount, label: '学员总数', unit: '人' },
      { value: '￥' + revenue, label: '本月收入', unit: '' }
    ]
  }

  return {
    courses, workTimes, schedules, coachProfile, storeInfo,
    editingId, pendingAuditId, currentScheduleId, editingScheduleId, coachInfoEditing, currentCalendarWeekStart,
    repeatWorkTime, workTimeWeekStart,
    onlineCourses, today, todayKey,
    persist, reloadSchedules,
    openCreate, editCourse, submitCourse, auditPass, auditReject, changeCourseStatus, removeCourse,
    saveWorkTime, setRepeatWorkTime, getWorkRangesForDate, hasWorkTimeForDate,
    saveSchedule, cancelSchedule, deleteSchedule, toggleStopBooking,
    ensureScheduleMembers, getScheduleActiveMembers, syncScheduleBookedCount,
    confirmMemberBook, updateBookingRecord, cancelBookingSeat,
    syncScheduleCourseData, syncUserProducts,
    getHomeStats, getTodaySchedules, getMineStats
  }
})

function timeToMin_inline(t) { const [h, m] = String(t || '00:00').split(':').map(Number); return h * 60 + (m || 0) }
