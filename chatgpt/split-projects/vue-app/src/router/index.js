import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Entry', component: () => import('@/views/EntryPage.vue') },
  // Coach routes
  { path: '/coach', name: 'CoachHome', component: () => import('@/views/coach/CoachHome.vue') },
  { path: '/coach/courses', name: 'CourseList', component: () => import('@/views/coach/CourseList.vue') },
  { path: '/coach/courses/new', name: 'CourseForm', component: () => import('@/views/coach/CourseForm.vue') },
  { path: '/coach/courses/:id/detail', name: 'CourseDetail', component: () => import('@/views/coach/CourseDetail.vue') },
  { path: '/coach/courses/:id/edit', name: 'CourseEdit', component: () => import('@/views/coach/CourseForm.vue') },
  { path: '/coach/worktime', name: 'WorkTime', component: () => import('@/views/coach/WorkTime.vue') },
  { path: '/coach/worktime/edit', name: 'WorkTimeEdit', component: () => import('@/views/coach/WorkTimeEdit.vue') },
  { path: '/coach/calendar', name: 'Calendar', component: () => import('@/views/coach/CalendarPage.vue') },
  { path: '/coach/schedule/new', name: 'ScheduleForm', component: () => import('@/views/coach/ScheduleForm.vue') },
  { path: '/coach/schedule/:id/edit', name: 'ScheduleEdit', component: () => import('@/views/coach/ScheduleForm.vue') },
  { path: '/coach/schedule/:id', name: 'ScheduleDetail', component: () => import('@/views/coach/ScheduleDetail.vue') },
  { path: '/coach/schedule/:id/members', name: 'MemberPage', component: () => import('@/views/coach/MemberPage.vue') },
  { path: '/coach/schedule/:id/stop', name: 'StopPage', component: () => import('@/views/coach/StopPage.vue') },
  { path: '/coach/mine', name: 'MinePage', component: () => import('@/views/coach/MinePage.vue') },
  { path: '/coach/contracts', name: 'MemberContracts', component: () => import('@/views/coach/MemberContracts.vue') },
  { path: '/coach/info', name: 'CoachInfo', component: () => import('@/views/coach/CoachInfo.vue') },
  { path: '/coach/user/courses', name: 'CoachUserCourses', component: () => import('@/views/coach/UserCourses.vue') },
  { path: '/coach/user/booking', name: 'CoachUserBooking', component: () => import('@/views/coach/UserBooking.vue') },
  { path: '/coach/user/success', name: 'CoachUserSuccess', component: () => import('@/views/coach/UserSuccess.vue') },
  { path: '/coach/user/bookings', name: 'CoachUserBookings', component: () => import('@/views/coach/UserBookings.vue') },
  // User routes
  { path: '/user', name: 'UserHome', component: () => import('@/views/user/UserHome.vue') },
  { path: '/user/courses', name: 'UserCourses', component: () => import('@/views/user/UserCourses.vue') },
  { path: '/user/coach', name: 'UserCoach', component: () => import('@/views/user/UserCoach.vue') },
  { path: '/user/order-confirm', name: 'UserOrderConfirm', component: () => import('@/views/user/UserOrderConfirm.vue') },
  { path: '/user/payment-result', name: 'UserPaymentResult', component: () => import('@/views/user/UserPaymentResult.vue') },
  { path: '/user/booking', name: 'UserBooking', component: () => import('@/views/user/UserBooking.vue') },
  { path: '/user/success', name: 'UserSuccess', component: () => import('@/views/user/UserSuccess.vue') },
  { path: '/user/bookings', name: 'UserBookings', component: () => import('@/views/user/UserBookings.vue') },
  { path: '/user/contract', name: 'UserContract', component: () => import('@/views/user/UserContract.vue') }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
