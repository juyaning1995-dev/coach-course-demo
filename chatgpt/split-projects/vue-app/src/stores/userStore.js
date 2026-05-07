import { defineStore } from 'pinia'
import { ref } from 'vue'
import { load, save } from '@/services/storage'
import { makeBookingId, normalizeUserCourseName, fmtISO } from '@/utils/date'

export const useUserStore = defineStore('user', () => {
  const userProducts = ref(load('userProducts', []))
  const userBookings = ref(load('userBookings', []))
  const userContracts = ref(load('userContracts', {}))

  const currentUserProductId = ref(null)
  const currentUserBookingId = ref(null)
  const selectedUserScheduleId = ref(null)
  const selectedUserDate = ref('')
  const currentContractProductId = ref(null)
  const pendingBookingAfterContract = ref(false)
  const purchaseProductId = ref(null)
  const purchaseCourseType = ref(null)
  const selectedTimelineDate = ref('')
  const selectedTimelineScheduleId = ref(null)
  const newBookingId = ref(null)
  const contractDrawing = ref(false)
  const contractHasStroke = ref(false)

  function reload() {
    userProducts.value = load('userProducts', [])
    userBookings.value = load('userBookings', [])
    userContracts.value = load('userContracts', {})
  }

  function persist() {
    save('userProducts', userProducts.value)
    save('userBookings', userBookings.value)
    save('userContracts', userContracts.value)
  }

  function reloadContracts() {
    userContracts.value = load('userContracts', {})
  }

  function getUserProduct(productId) {
    return userProducts.value.find(p => String(p.id) === String(productId))
  }

  function getFirstAvailableProduct(courseId) {
    return userProducts.value.find(p => String(p.courseId) === String(courseId) && Number(p.remain || 0) > 0)
  }

  function getUserRemainingSeats(slot) {
    return Math.max(0, Number(slot.limit || 1) - Number(slot.booked || 0))
  }

  function hasCurrentUserBookedSlot(scheduleId) {
    return userBookings.value.some(b => String(b.scheduleId) === String(scheduleId) && !['已取消'].includes(b.status))
  }

  function canUserBookSlot(slot, product) {
    return !!slot && !!product && Number(product.remain || 0) > 0 && slot.status !== '停止预约' && slot.status !== '已取消' && getUserRemainingSeats(slot) > 0
  }

  function startPurchase(course, coachName, coachStoreName) {
    const addRemain = Math.max(1, Number(course.hours) || 1)
    const product = {
      id: `product-${Date.now()}`,
      courseId: course.id,
      name: normalizeUserCourseName(course),
      type: course.type,
      remain: addRemain,
      coachName: coachName,
      store: course.stores || coachStoreName
    }
    userProducts.value.push(product)
    persist()
    purchaseProductId.value = product.id
    purchaseCourseType.value = product.type === '一对多' ? 'group' : 'private'
    return product
  }

  function confirmBooking(slot, product) {
    if (!canUserBookSlot(slot, product)) return { ok: false, msg: '当前时段已不可预约' }
    if (!Array.isArray(slot.members)) slot.members = []
    if (userBookings.value.some(b => String(b.scheduleId) === String(slot.id) && b.status !== '已取消')) {
      return { ok: false, msg: '这个时段已经预约过了' }
    }
    product.remain = Math.max(0, Number(product.remain || 0) - 1)
    const booking = {
      bookingId: makeBookingId(), name: '小明', phone: '188****0000',
      time: '用户端预约', status: '待上课', source: 'user', isCurrentUser: true,
      productId: product.id, createdAt: new Date().toISOString(),
      cancelRequestedAt: '', completeConfirmExpireAt: '', completedAt: ''
    }
    slot.members.push(booking)
    upsertBookingMirror(slot, booking)
    newBookingId.value = booking.bookingId
    persist()
    return { ok: true, booking }
  }

  function confirmGroupBooking(product, schedule) {
    product.remain = Math.max(0, Number(product.remain || 0) - 1)
    if (!Array.isArray(schedule.members)) schedule.members = []
    const member = {
      bookingId: makeBookingId(), name: '小明', phone: '188****0000',
      time: '用户端预约', status: '待上课', source: 'user', isCurrentUser: true,
      productId: product.id, createdAt: new Date().toISOString(),
      cancelRequestedAt: '', completeConfirmExpireAt: '', completedAt: ''
    }
    schedule.members.push(member)
    upsertBookingMirror(schedule, member)
    newBookingId.value = member.bookingId
    persist()
    return { ok: true, booking: member }
  }

  function upsertBookingMirror(schedule, member) {
    if (!member.isCurrentUser) return
    const booking = {
      id: member.bookingId,
      productId: member.productId || `product-${schedule.courseId}`,
      courseId: schedule.courseId,
      courseName: normalizeUserCourseName({ name: (schedule.courseName || '').replace(/小班$/, ''), type: schedule.courseType }),
      coachName: schedule._coachName || '王美丽',
      store: schedule.store,
      scheduleId: schedule.id,
      date: schedule.date, start: schedule.start, end: schedule.end,
      type: schedule.courseType,
      status: member.status, source: member.source || 'user',
      customerName: member.name, customerPhone: member.phone,
      createdAt: member.createdAt || new Date().toISOString(),
      cancelRequestedAt: member.cancelRequestedAt || '',
      completeConfirmExpireAt: member.completeConfirmExpireAt || '',
      completedAt: member.completedAt || '',
      isCurrentUser: true
    }
    const idx = userBookings.value.findIndex(item => String(item.id) === String(member.bookingId))
    if (idx > -1) userBookings.value[idx] = { ...userBookings.value[idx], ...booking }
    else userBookings.value.unshift(booking)
  }

  function updateBookingInList(bookingId, changes) {
    const idx = userBookings.value.findIndex(item => String(item.id) === String(bookingId))
    if (idx > -1) userBookings.value[idx] = { ...userBookings.value[idx], ...changes }
  }

  function cancelBooking(bookingId) {
    const booking = userBookings.value.find(item => String(item.id) === String(bookingId))
    if (!booking) return
    const product = getUserProduct(booking.productId)
    if (product) product.remain = Number(product.remain || 0) + 1
    updateBookingInList(bookingId, { status: '已取消', completedAt: new Date().toISOString() })
    persist()
  }

  function getContract(productId) {
    return userContracts.value[String(productId)] || null
  }

  function hasContract(productId) {
    return !!getContract(productId)
  }

  function signContract(productId, signatureData) {
    userContracts.value[String(productId)] = {
      productId, signer: '手写签名',
      signatureData, signedAt: new Date().toISOString()
    }
    persist()
  }

  function getTodayStr() { return fmtISO(new Date()) }

  function getCourseSchedules(product, schedules) {
    if (!product) return []
    return schedules.filter(s => String(s.courseId ?? '') === String(product.courseId) && s.status !== '已取消')
      .sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`))
  }

  function getAvailableDates(product, schedules) {
    const ts = getTodayStr()
    return [...new Set(getCourseSchedules(product, schedules).filter(s => s.date >= ts).map(s => s.date))].slice(0, 7)
  }

  function settleBookingTimeouts(schedulesRef) {
    let changed = false
    schedulesRef.forEach(s => {
      if (!Array.isArray(s.members)) return
      s.members = s.members.map(m => {
        if (m.status === '待学员确认完课' && m.completeConfirmExpireAt && new Date(m.completeConfirmExpireAt).getTime() <= Date.now()) {
          changed = true
          const next = { ...m, status: '已完课', completedAt: m.completeConfirmExpireAt || new Date().toISOString() }
          upsertBookingMirror(s, next)
          return next
        }
        return m
      })
    })
    return changed
  }

  return {
    userProducts, userBookings, userContracts,
    currentUserProductId, currentUserBookingId, selectedUserScheduleId, selectedUserDate,
    currentContractProductId, pendingBookingAfterContract,
    purchaseProductId, purchaseCourseType, selectedTimelineDate, selectedTimelineScheduleId, newBookingId,
    contractDrawing, contractHasStroke,
    reload, persist, reloadContracts,
    getUserProduct, getFirstAvailableProduct, getUserRemainingSeats,
    hasCurrentUserBookedSlot, canUserBookSlot,
    startPurchase, confirmBooking, confirmGroupBooking,
    upsertBookingMirror, updateBookingInList, cancelBooking,
    getContract, hasContract, signContract,
    getTodayStr, getCourseSchedules, getAvailableDates, settleBookingTimeouts
  }
})
