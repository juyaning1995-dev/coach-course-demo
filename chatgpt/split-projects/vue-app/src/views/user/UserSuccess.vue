<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { useCoachStore } from '@/stores/coachStore'
import { icons } from '@/components/icons'
import { fmtUserDateTime } from '@/utils/date'

const router = useRouter()
const userStore = useUserStore()
const coach = useCoachStore()

const booking = computed(() => {
  return userStore.userBookings.find(b => String(b.id) === String(userStore.newBookingId)) || userStore.userBookings[userStore.userBookings.length - 1]
})

const course = computed(() => {
  if (!booking.value) return null
  return coach.courses.find(c => String(c.id) === String(booking.value.courseId))
})

const courseDesc = computed(() => course.value?.desc || course.value?.intro || '')
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="status-bar"><span>9:41</span><span class="status-icons"><span v-html="icons.signal" style="width:16px;height:12px"></span><span v-html="icons.battery" style="width:27px;height:12px;margin-left:6px"></span></span></div>
      <!-- Dark overlay -->
      <div class="us-mask"></div>
      <!-- Bottom sheet -->
      <div class="us-bottom-sheet">
        <div class="us-drag-bar"></div>
        <div class="us-icon-wrap"><div class="us-check">&#10003;</div></div>
        <div class="us-title">预约成功</div>
        <div v-if="booking" class="us-info-card">
          <div class="us-info-row">
            <span class="us-info-label">课程</span>
            <span class="us-info-value">{{ booking.courseName }}</span>
          </div>
          <div class="us-info-row">
            <span class="us-info-label">教练</span>
            <span class="us-info-value">{{ booking.coachName }}</span>
          </div>
          <div class="us-info-row">
            <span class="us-info-label">上课时间</span>
            <span class="us-info-value">{{ fmtUserDateTime(booking.date, booking.start, booking.end) }}</span>
          </div>
          <div class="us-info-row">
            <span class="us-info-label">上课门店</span>
            <span class="us-info-value">{{ booking.store }}</span>
          </div>
        </div>
        <div v-else class="us-info-card">
          <div class="us-info-row"><span class="us-info-value">暂无预约信息</span></div>
        </div>
        <!-- 课程说明卡片 -->
        <div v-if="booking && courseDesc" class="us-desc-card">
          <div class="us-desc-title">课程说明</div>
          <div class="us-desc-text">{{ courseDesc }}</div>
        </div>
        <div class="us-actions">
          <button class="us-btn secondary" @click="router.push('/user')">返回首页</button>
          <button class="us-btn primary" @click="router.push('/user/bookings')">查看预约</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Dark overlay */
.us-mask{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:20}

/* Bottom sheet */
.us-bottom-sheet{position:fixed;left:50%;transform:translateX(-50%);bottom:0;width:min(390px,100vw);background:var(--surface);border-radius:24px 24px 0 0;padding:14px 20px 30px;z-index:21}

.us-info-label{font-size:13px;color:var(--muted-foreground);flex:none;width:64px}
.us-info-value{font-size:14px;color:var(--foreground);line-height:1.5}

/* 课程说明卡片 */
.us-desc-card{margin-top:12px;padding:14px 16px;background:var(--muted);border:1px solid var(--border);border-radius:14px}
.us-desc-title{font-size:14px;font-weight:600;color:var(--foreground);margin-bottom:8px}
.us-desc-text{font-size:13px;color:var(--muted-foreground);line-height:1.7}

.us-actions{display:flex;gap:12px;margin-top:20px}
.us-btn{flex:1;height:48px;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer}
.us-btn.primary{background:var(--brand);color:var(--brand-foreground);border:0}
.us-btn.secondary{background:var(--muted);color:var(--foreground);border:1px solid var(--border)}
</style>
