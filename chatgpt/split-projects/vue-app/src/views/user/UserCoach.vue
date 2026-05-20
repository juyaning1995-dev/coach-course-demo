<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCoachStore } from '@/stores/coachStore'
import { useUserStore } from '@/stores/userStore'
import { icons } from '@/components/icons'
import { normalizeUserCourseName } from '@/utils/date'

const router = useRouter()
const coach = useCoachStore()
const userStore = useUserStore()

const heroIdx = ref(0)
let heroTimer = null

const avatarUrl = computed(() => coach.coachProfile?.avatar || '/coach-photo.jpg')
const heroPhotos = computed(() => {
  const photos = coach.coachProfile?.photos
  if (photos && photos.length) return photos
  return [avatarUrl.value]
})

const onlineCourses = computed(() => coach.courses.filter(c => c.status === '已上架'))
const privateCourses = computed(() => onlineCourses.value.filter(c => c.type === '一对一'))
const groupCourses = computed(() => onlineCourses.value.filter(c => c.type === '一对多'))
const tags = computed(() => {
  const t = coach.coachProfile?.tags
  return (t && t.length) ? t : ['专业教练']
})

function startPurchase(course) {
  const addRemain = Math.max(1, Number(course.hours) || 1)
  const product = {
    id: `product-${Date.now()}`,
    courseId: course.id,
    name: normalizeUserCourseName(course),
    type: course.type,
    remain: addRemain,
    coachName: coach.coachProfile?.name || '王美丽',
    store: course.stores || coach.storeInfo?.name || '大明湖店',
    buyerPhone: '188****0000'
  }
  userStore.userProducts.push(product)
  userStore.persist()
  userStore.purchaseProductId = product.id
  userStore.purchaseCourseType = product.type === '一对多' ? 'group' : 'private'
  router.push('/user/order-confirm')
}

const CN_NUM = ['零','一','二','三','四','五','六','七','八','九','十']

function formatCourseType(c) {
  if (c.type === '一对多') return `一对${CN_NUM[c.limit] || CN_NUM[2]}`
  return c.type
}

function startHero() {
  if (heroPhotos.value.length <= 1) return
  heroTimer = setInterval(() => {
    heroIdx.value = (heroIdx.value + 1) % heroPhotos.value.length
  }, 3500)
}

function goSlide(i) {
  heroIdx.value = i
  if (heroTimer) { clearInterval(heroTimer); heroTimer = null }
  startHero()
}

onMounted(() => startHero())
onUnmounted(() => { if (heroTimer) clearInterval(heroTimer) })
</script>

<template>
  <div class="phone">
    <div class="page active" style="position:relative">
      <!-- Status bar over hero -->
      <div class="uh-status"><span>9:41</span><span class="status-icons"><span v-html="icons.signal" style="width:16px;height:12px"></span><span v-html="icons.battery" style="width:27px;height:12px;margin-left:6px"></span></span></div>
      <!-- Nav over hero -->
      <div class="uh-nav"><div class="uh-back" @click="router.push('/user')">&#8249;</div><div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div></div>
      <div class="uh-hero">
        <div class="uh-hero-track" :style="{ transform: `translateX(-${heroIdx * 100}%)` }">
          <div v-for="(img, i) in heroPhotos" :key="i" class="uh-hero-slide" :style="{ backgroundImage: `url(${img})` }"></div>
        </div>
        <div v-if="heroPhotos.length > 1" class="uh-hero-dots">
          <span v-for="(_, i) in heroPhotos" :key="i" :class="['uh-hero-dot', { active: i === heroIdx }]" @click="goSlide(i)"></span>
        </div>
      </div>
      <div class="uh-profile">
        <div class="uh-profile-top">
          <div class="uh-avatar-lg" :style="{ backgroundImage: `url(${avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }"></div>
          <div class="uh-profile-main">
            <div class="uh-profile-name">{{ coach.coachProfile?.name || '王美丽' }}</div>
            <div class="uh-tags">
              <span v-for="(t, i) in tags" :key="i" class="uh-tag">{{ t }}</span>
            </div>
          </div>
          <div class="uh-phone-btn"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
        </div>
        <div class="uh-desc">{{ coach.coachProfile?.bio || '资深健身教练，专注学员塑形与体能提升。' }}</div>
      </div>
      <div class="uh-courses">
        <div class="uh-section-head"><h2>私教课</h2></div>
        <div v-if="!privateCourses.length" class="uh-course-card">
          <div class="uh-course-name">暂无私教课</div>
          <div class="uh-course-sub">教练尚未上架课程</div>
        </div>
        <div v-for="c in privateCourses" :key="c.id" class="uh-course-card">
          <div class="uh-course-name">{{ normalizeUserCourseName(c) }}</div>
          <div class="uh-course-meta">{{ formatCourseType(c) }}｜{{ c.hours || 0 }}节｜{{ c.minutes || '--' }}分钟/节</div>
          <div class="uh-course-store">适用门店：{{ c.stores || coach.storeInfo?.name || '大明湖店' }}｜距你 2.5km</div>
          <div class="uh-course-row">
            <span class="uh-course-price">{{ c.unit === '按时间' ? `¥${((c.price || 0) / Math.max(1, c.hours || 1)).toFixed(1)}/节` : `¥${c.price || '--'}` }}</span>
            <button class="uh-buy-btn" @click="startPurchase(c)">购买</button>
          </div>
        </div>
      </div>
      <div v-if="groupCourses.length" class="uh-courses" style="margin-top:2px">
        <div class="uh-section-head"><h2>精品小班课</h2></div>
        <div v-for="c in groupCourses" :key="c.id" class="uh-course-card">
          <div class="uh-course-name">{{ normalizeUserCourseName(c) }}</div>
          <div class="uh-course-meta">{{ formatCourseType(c) }}｜{{ c.hours || 0 }}节｜{{ c.minutes || '--' }}分钟/节</div>
          <div class="uh-course-store">适用门店：{{ c.stores || coach.storeInfo?.name || '大明湖店' }}｜距你 2.5km</div>
          <div class="uh-course-row">
            <span class="uh-course-price">{{ c.unit === '按时间' ? `¥${((c.price || 0) / Math.max(1, c.hours || 1)).toFixed(1)}/节` : `¥${c.price || '--'}` }}</span>
            <button class="uh-buy-btn" @click="startPurchase(c)">购买</button>
          </div>
        </div>
      </div>
      <div v-else class="uh-courses" style="margin-top:2px">
        <div class="uh-section-head"><h2>精品小班课</h2></div>
        <div class="uh-course-card">
          <div class="uh-course-name">暂无小班课</div>
          <div class="uh-course-sub">教练尚未上架课程</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Status bar — over hero */
.uh-status{height:32px;padding:6px 16px 0;display:flex;align-items:center;justify-content:space-between;position:absolute;top:0;left:0;right:0;z-index:10;font-size:12px;font-weight:600;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.3);pointer-events:none}
.uh-status>*{pointer-events:auto}
.uh-status :deep(.status-icons){color:#fff}

/* Nav — over hero */
.uh-nav{height:56px;display:flex;align-items:center;justify-content:center;position:absolute;top:32px;left:0;right:0;z-index:10;background:transparent}
.uh-back{position:absolute;left:12px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.25);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;color:#fff;cursor:pointer;font-size:18px;line-height:1}

/* Frosted capsule */
.uh-nav :deep(.nav-capsule){background:rgba(255,255,255,.25);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-color:rgba(255,255,255,.3)}
.uh-nav :deep(.nav-capsule-btn){color:#fff}
.uh-nav :deep(.nav-capsule-divider){background:rgba(255,255,255,.3)}

/* Hero without top rounded corners */
:deep(.uh-hero){border-radius:0!important}
</style>
