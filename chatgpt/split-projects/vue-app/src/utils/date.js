export function startOfWeek(d) { const x = new Date(d); const day = x.getDay() || 7; x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - day + 1); return x }
export function fmtMD(d) { return `${d.getMonth() + 1}月${d.getDate()}日` }
export function fmtISO(d) { const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0'); return `${y}-${m}-${day}` }
export function timeToMin(t) { const [h, m] = String(t || '00:00').split(':').map(Number); return h * 60 + (m || 0) }
export function addOneHour(t) { const [h, m] = String(t || '10:00').split(':').map(Number); return `${String(Math.min(22, h + 1)).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}` }
export function dayName(dateStr) { return ['日', '一', '二', '三', '四', '五', '六'][new Date(dateStr + 'T00:00:00').getDay()] }
export function fmtUserDate(dateStr) { const d = new Date(dateStr + 'T00:00:00'); return `${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日` }
export function fmtUserDateTime(dateStr, start, end) { return `${fmtUserDate(dateStr)} 星期${dayName(dateStr)} ${start}–${end}` }
export function userSlotPeriod(start) { const hour = parseInt(String(start).split(':')[0], 10); return hour < 12 ? '上午' : hour < 18 ? '下午' : '晚上' }
export function normalizeUserCourseName(course) { if (!course) return ''; if (course.type === '一对多' && !/小班|团课|小组/.test(course.name)) return `${course.name}小班课`; return course.name }
export function hoursUntilBooking(booking) { return (new Date(`${booking.date}T${booking.start}:00`).getTime() - Date.now()) / 36e5 }
export function makeBookingId() { return `booking-${Date.now()}-${Math.floor(Math.random() * 1000)}` }
