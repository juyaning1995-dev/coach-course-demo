<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCoachStore } from '@/stores/coachStore'
import { normalizeUserCourseName } from '@/utils/date'

const router = useRouter()
const coach = useCoachStore()

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
  <div class="phone cp-phone">
    <div class="page active cp-page">
      <!-- Status bar over hero -->
      <div class="cp-status"><span>9:41</span><span style="display:flex;align-items:center"><svg width="16" height="12" viewBox="0 0 16 12"><rect x="0" y="8" width="3" height="4" rx="0.5" fill="currentColor"/><rect x="5" y="6" width="3" height="6" rx="0.5" fill="currentColor"/><rect x="10" y="3" width="3" height="9" rx="0.5" fill="currentColor"/><rect x="15" y="0" width="3" height="12" rx="0.5" fill="currentColor"/></svg><svg width="27" height="12" viewBox="0 0 27 12" style="margin-left:6px"><rect x="0" y="2" width="24" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="1"/><rect x="2" y="4" width="20" height="4" rx="1" fill="currentColor"/><rect x="26" y="4" width="2.5" height="4" rx="1" fill="currentColor"/></svg></span></div>

      <!-- Nav over hero -->
      <div class="cp-nav">
        <div class="cp-back" @click="router.push('/coach/mine')">&#8249;</div>
        <div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div>
      </div>

      <!-- Hero carousel at top -->
      <div class="cp-hero">
        <div class="cp-hero-track" :style="{ transform: `translateX(-${heroIdx * 100}%)` }">
          <div v-for="(img, i) in heroPhotos" :key="i" class="cp-hero-slide" :style="{ backgroundImage: `url(${img})` }"></div>
        </div>
        <div v-if="heroPhotos.length > 1" class="cp-hero-dots">
          <span v-for="(_, i) in heroPhotos" :key="i" :class="['cp-hero-dot', { active: i === heroIdx }]" @click="goSlide(i)"></span>
        </div>
      </div>

      <!-- Profile -->
      <div class="cp-profile">
        <div class="cp-profile-top">
          <div class="cp-avatar-lg" :style="{ backgroundImage: `url(${avatarUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }"></div>
          <div class="cp-profile-main">
            <div class="cp-profile-name">{{ coach.coachProfile?.name || '王美丽' }}</div>
            <div class="cp-tags">
              <span v-for="(t, i) in tags" :key="i" class="cp-tag">{{ t }}</span>
            </div>
          </div>
        </div>
        <div class="cp-desc">{{ coach.coachProfile?.bio || '资深健身教练，专注学员塑形与体能提升。' }}</div>
      </div>

      <!-- Private courses -->
      <div class="cp-courses">
        <div class="cp-section-head"><h2>私教课</h2></div>
        <div v-if="!privateCourses.length" class="cp-course-card">
          <div class="cp-course-name">暂无私教课</div>
          <div class="cp-course-sub">上架私教课后，这里会自动展示</div>
        </div>
        <div v-for="c in privateCourses" :key="c.id" class="cp-course-card">
          <div class="cp-course-name">{{ normalizeUserCourseName(c) }}</div>
          <div class="cp-course-meta">{{ c.type }}｜{{ c.hours || 0 }}节｜{{ c.minutes || '--' }}分钟/节</div>
          <div class="cp-course-price">{{ c.unit === '按时间' ? `¥${((c.price || 0) / Math.max(1, c.hours || 1)).toFixed(1)}/节` : `¥${c.price || '--'}` }}</div>
        </div>
      </div>

      <!-- Group courses -->
      <div class="cp-courses" style="margin-top:2px">
        <div class="cp-section-head"><h2>精品小班课</h2></div>
        <div v-if="!groupCourses.length" class="cp-course-card">
          <div class="cp-course-name">暂无小班课</div>
          <div class="cp-course-sub">上架小班课后，这里会自动展示</div>
        </div>
        <div v-for="c in groupCourses" :key="c.id" class="cp-course-card">
          <div class="cp-course-name">{{ normalizeUserCourseName(c) }}</div>
          <div class="cp-course-sub">{{ c.intro || '暂无简介' }}</div>
          <div class="cp-course-price">¥{{ c.price || '--' }}</div>
        </div>
      </div>

      <!-- Stores -->
      <div class="cp-courses" style="margin-top:2px">
        <div class="cp-section-head"><h2>上课门店</h2></div>
        <template v-if="stores.length">
          <div v-for="(st, i) in stores" :key="i" class="cp-store-card">
            <div>
              <div class="cp-store-name">{{ st }}</div>
              <div class="cp-store-dist">距您 2.5km</div>
            </div>
          </div>
        </template>
        <div v-else class="cp-store-card">
          <div class="cp-store-name">暂无门店信息</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Override phone/page for full-bleed hero */
.cp-phone{background:var(--background)!important}
.cp-page{position:relative}

/* Status bar — over hero, transparent */
.cp-status{height:32px;padding:6px 16px 0;display:flex;align-items:center;justify-content:space-between;position:absolute;top:0;left:0;right:0;z-index:10;font-size:12px;font-weight:600;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.3);pointer-events:none}
.cp-status>*{pointer-events:auto}

/* Nav — over hero, transparent */
.cp-nav{height:56px;display:flex;align-items:center;justify-content:center;position:absolute;top:32px;left:0;right:0;z-index:10;background:transparent}
.cp-back{position:absolute;left:12px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.25);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;color:#fff;cursor:pointer;font-size:18px;line-height:1}
.cp-nav :deep(.nav-capsule){background:rgba(255,255,255,.25);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border-color:rgba(255,255,255,.3)}
.cp-nav :deep(.nav-capsule-btn){color:#fff}
.cp-nav :deep(.nav-capsule-divider){background:rgba(255,255,255,.3)}

/* Hero at top */
.cp-hero{height:280px;position:relative;overflow:hidden}

/* Track & slides */
.cp-hero-track{display:flex;height:100%;transition:transform .4s cubic-bezier(.25,.8,.25,1)}
.cp-hero-slide{min-width:100%;height:100%;background-size:cover;background-position:top center;flex:none}
.cp-hero-dots{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:2}
.cp-hero-dot{width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,.4);transition:all .25s;cursor:pointer}
.cp-hero-dot.active{background:#fff;width:18px;border-radius:3px}

/* Profile below hero */
.cp-profile{padding:16px 20px;background:var(--surface);border-bottom:1px solid var(--border)}
.cp-profile-top{display:flex;align-items:flex-start;gap:14px}
.cp-avatar-lg{width:64px;height:64px;border-radius:50%;border:2px solid var(--surface);background:var(--muted);flex:none;overflow:hidden;margin-top:-32px;position:relative;z-index:2}
.cp-profile-main{flex:1;min-width:0}
.cp-profile-name{font-size:20px;font-weight:600;color:var(--foreground)}
.cp-tags{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
.cp-tag{display:inline-flex;height:28px;padding:0 12px;border-radius:999px;border:1px solid var(--border);color:var(--muted-foreground);font-size:12px;align-items:center}
.cp-desc{margin-top:14px;font-size:13px;line-height:1.8;color:var(--muted-foreground)}

/* Course sections */
.cp-courses{margin-top:2px;padding:16px 20px;background:var(--surface)}
.cp-section-head{margin-bottom:14px}
.cp-section-head h2{font-size:16px;font-weight:600;color:var(--foreground);border-left:4px solid var(--brand);padding-left:10px;margin:0}
.cp-course-card{background:var(--muted);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:12px}
.cp-course-card:last-child{margin-bottom:0}
.cp-course-name{font-size:15px;font-weight:600;color:var(--foreground);margin-bottom:4px}
.cp-course-sub{font-size:12px;color:var(--muted-foreground);margin-bottom:6px}
.cp-course-meta{font-size:13px;color:var(--foreground);margin-bottom:12px}
.cp-course-price{font-size:16px;font-weight:600;color:var(--brand)}

/* Store cards */
.cp-store-card{background:var(--muted);border:1px solid var(--border);border-radius:14px;padding:16px;margin-bottom:8px}
.cp-store-card:last-child{margin-bottom:0}
.cp-store-name{font-size:15px;font-weight:500;color:var(--foreground)}
.cp-store-dist{font-size:12px;color:var(--muted-foreground);margin-top:4px}
</style>
