<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCoachStore } from '@/stores/coachStore'
import { useUserStore } from '@/stores/userStore'
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

const stores = computed(() => [...new Set(onlineCourses.value.map(c => c.stores).filter(Boolean))])

function startPurchase(course) {
  const addRemain = Math.max(1, Number(course.hours) || 1)
  const product = {
    id: `product-${Date.now()}`,
    courseId: course.id,
    name: normalizeUserCourseName(course),
    type: course.type,
    remain: addRemain,
    coachName: coach.coachProfile?.name || '王美丽',
    store: course.stores || coach.storeInfo?.name || '振华商厦店'
  }
  userStore.userProducts.push(product)
  userStore.persist()
  userStore.purchaseProductId = product.id
  userStore.purchaseCourseType = product.type === '一对多' ? 'group' : 'private'
  router.push('/user/order-confirm')
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
    <div class="page active">
      <div class="nav"><div class="back" @click="router.push('/user')">‹</div>教练主页<div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div></div>
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
          <div class="uh-phone-btn">&#128222;</div>
        </div>
        <div class="uh-desc">{{ coach.coachProfile?.bio || '资深健身教练，专注学员塑形与体能提升。' }}</div>
      </div>
      <div class="uh-courses">
        <div class="uh-section-head"><h2>私教课</h2></div>
        <div v-if="!privateCourses.length" class="uh-course-card">
          <div class="uh-course-name">暂无私教课</div>
          <div class="uh-course-sub">教练端上架私教课后，这里会自动回填</div>
        </div>
        <div v-for="c in privateCourses" :key="c.id" class="uh-course-card">
          <div class="uh-course-name">{{ normalizeUserCourseName(c) }}</div>
          <div class="uh-course-sub">{{ c.intro || '暂无简介' }}</div>
          <div class="uh-course-row">
            <span class="uh-course-price">¥{{ c.price || '--' }}</span>
            <button class="uh-buy-btn" @click="startPurchase(c)">购买</button>
          </div>
        </div>
      </div>
      <div v-if="groupCourses.length" class="uh-courses" style="margin-top:2px">
        <div class="uh-section-head"><h2>精品小班课</h2></div>
        <div v-for="c in groupCourses" :key="c.id" class="uh-course-card">
          <div class="uh-course-name">{{ normalizeUserCourseName(c) }}</div>
          <div class="uh-course-sub">{{ c.intro || '暂无简介' }}</div>
          <div class="uh-course-row">
            <span class="uh-course-price">¥{{ c.price || '--' }}</span>
            <button class="uh-buy-btn" @click="startPurchase(c)">购买</button>
          </div>
        </div>
      </div>
      <div v-else class="uh-courses" style="margin-top:2px">
        <div class="uh-section-head"><h2>精品小班课</h2></div>
        <div class="uh-course-card">
          <div class="uh-course-name">暂无小班课</div>
          <div class="uh-course-sub">教练端上架小班课后，这里会自动回填</div>
        </div>
      </div>
      <div class="uh-courses" style="margin-top:2px">
        <div class="uh-section-head"><h2>上课门店</h2></div>
        <template v-if="stores.length">
          <div v-for="(st, i) in stores" :key="i" class="uh-store-card">
            <div>
              <div class="uh-store-name">{{ st }}</div>
              <div class="uh-store-dist">距您 2.5km</div>
            </div>
            <span class="uh-store-count">1家门店</span>
          </div>
        </template>
        <div v-else class="uh-store-card">
          <div class="uh-store-name">暂无门店信息</div>
        </div>
      </div>
    </div>
  </div>
</template>
