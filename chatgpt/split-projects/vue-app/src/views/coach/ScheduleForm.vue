<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCoachStore } from '@/stores/coachStore'
import { fmtISO, dayName, fmtMD as fmtMD_util, timeToMin as timeToMin_util } from '@/utils/date'
import { load, save as saveDraftStorage, remove } from '@/services/storage'
import { icons } from '@/components/icons'

const router = useRouter()
const route = useRoute()
const coach = useCoachStore()

const isEdit = ref(false)
const formTitle = ref('新增课次')

const schCourse = ref('')
const schStart = ref('')
const schEnd = ref('')
const schStore = ref('')
const schLimit = ref('')

const onlineCourses = computed(() => coach.courses.filter(c => c.status === '已上架'))

function fillCourseInfo() {
  const c = onlineCourses.value.find(x => String(x.id) === String(schCourse.value))
  if (c) {
    schStore.value = c.stores || ''
    schLimit.value = c.type === '一对多' ? String(c.limit || 2) : '1'
    if (schStart.value && !schEnd.value) {
      const dateStr = schStart.value.slice(0, 10)
      const startTime = schStart.value.slice(11, 16)
      const endTime = addMinutes(startTime, Number(c.minutes || 60))
      schEnd.value = `${dateStr}T${endTime}`
    }
  }
}

function save() {
  const c = onlineCourses.value.find(x => String(x.id) === String(schCourse.value))
  if (!c) { window.__toast?.('请先创建并审核通过课程'); return }
  if (!schStart.value || !schEnd.value) { window.__toast?.('请选择开始和结束时间'); return }
  const dateStr = schStart.value.slice(0, 10)
  const start = schStart.value.slice(11, 16)
  const endt = schEnd.value.slice(11, 16)
  if (timeToMin_util(endt) <= timeToMin_util(start)) { window.__toast?.('结束时间必须晚于开始时间'); return }
  // const ranges = coach.getWorkRangesForDate(dateStr)
  // const ok = ranges.some(r => { const [s1, e1] = String(r).split('–'); return start >= s1 && endt <= e1 })
  // if (!ok) { window.__toast?.('不在工作时间范围内'); return }
  const data = {
    courseId: c.id, courseType: c.type, courseName: c.name,
    date: dateStr,
    start, end: endt, store: schStore.value || c.stores || '未选择门店',
    limit: +schLimit.value || (c.type === '一对多' ? +(c.limit || 2) : 1)
  }
  if (isEdit.value) {
    coach.saveSchedule(data, Number(route.params.id))
    window.__toast?.('课次已修改')
  } else {
    coach.saveSchedule(data)
    window.__toast?.('课次已保存')
  }
  remove('coach_scheduleDraft')
  router.push('/coach/calendar')
}

// datetime picker
const pickerOpen = ref(false)
const pickerTarget = ref('')
const pickerDate = ref('')
const pickerTime = ref('')

const pickerDates = computed(() => {
  const arr = []
  const ws = new Date(coach.currentCalendarWeekStart + 'T00:00:00')
  for (let i = 0; i < 7; i++) {
    const d = new Date(ws)
    d.setDate(d.getDate() + i)
    arr.push(fmtISO(d))
  }
  return arr
})

const pickerTimes = computed(() => {
  const arr = []
  for (let h = 8; h <= 22; h++) {
    ['00', '30'].forEach(m => {
      if (h === 22 && m === '30') return
      arr.push(`${String(h).padStart(2, '0')}:${m}`)
    })
  }
  return arr
})

function openPicker(target) {
  pickerTarget.value = target
  const val = target === 'schStart' ? schStart.value : schEnd.value
  if (val) {
    pickerDate.value = val.slice(0, 10)
    pickerTime.value = val.slice(11, 16)
  } else {
    pickerDate.value = fmtISO(new Date())
    if (target === 'schStart') {
      const now = new Date()
      const h = String(now.getHours()).padStart(2, '0')
      const m = now.getMinutes() < 30 ? '00' : '30'
      pickerTime.value = `${h}:${m}`
    } else if (target === 'schEnd' && schStart.value) {
      pickerTime.value = addMinutes(schStart.value.slice(11, 16), getCourseDuration())
    } else {
      pickerTime.value = '10:00'
    }
  }
  pickerOpen.value = true
}

function addMinutes(t, mins) {
  const [h, m] = String(t || '10:00').split(':').map(Number)
  const total = h * 60 + m + (mins || 60)
  const eh = Math.min(22, Math.floor(total / 60))
  const em = total % 60
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`
}

function getCourseDuration() {
  const c = onlineCourses.value.find(x => String(x.id) === String(schCourse.value))
  return c ? Number(c.minutes || 60) : 60
}

function confirmPicker() {
  const val = pickerDate.value + 'T' + pickerTime.value
  if (pickerTarget.value === 'schStart') { schStart.value = val; fillCourseInfo() }
  else schEnd.value = val
  pickerOpen.value = false
  saveDraft()
}

function fmtMD(d) {
  return `${new Date(d + 'T00:00:00').getMonth() + 1}月${new Date(d + 'T00:00:00').getDate()}日`
}

// Draft persistence
function collectDraft() {
  return { schCourse: schCourse.value, schStart: schStart.value, schEnd: schEnd.value, schStore: schStore.value, schLimit: schLimit.value }
}
function saveDraft() {
  saveDraftStorage('coach_scheduleDraft', JSON.stringify(collectDraft()))
}

watch([schCourse, schStart, schEnd, schStore, schLimit], () => {
  if (!isEdit.value) saveDraft()
}, { deep: false })

onMounted(() => {
  const id = route.params.id
  if (id) {
    const s = coach.schedules.find(s => s.id === Number(id))
    if (s) {
      const matched = onlineCourses.value.find(c => s.courseName && s.courseName.includes(c.name))
      schCourse.value = matched ? String(matched.id) : String(s.courseId || '')
      schStart.value = s.date ? `${s.date}T${s.start}` : ''
      schEnd.value = s.date ? `${s.date}T${s.end}` : ''
      schStore.value = s.store || ''
      schLimit.value = String(s.limit || 1)
      formTitle.value = '编辑课次'
      isEdit.value = true
    }
  } else {
    const draft = load('coach_scheduleDraft', null)
    if (draft) {
      if (draft.schCourse && onlineCourses.value.some(c => String(c.id) === String(draft.schCourse))) schCourse.value = draft.schCourse
      if (draft.schStart) schStart.value = draft.schStart
      if (draft.schEnd) schEnd.value = draft.schEnd
      if (draft.schStore) schStore.value = draft.schStore
      if (draft.schLimit) schLimit.value = draft.schLimit
    }
    if (!schStore.value || !schLimit.value) fillCourseInfo()
  }
})
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="status-bar"><span>9:41</span><span class="status-icons"><span v-html="icons.signal" style="width:16px;height:12px"></span><span v-html="icons.battery" style="width:27px;height:12px;margin-left:6px"></span></span></div>
      <div class="nav"><div class="back" @click="router.push('/coach/calendar')">‹</div>{{ formTitle }}<div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div></div>
      <div class="form lightpad create-form">
        <label>选择课程</label>
        <select v-model="schCourse" class="box-field" @change="fillCourseInfo">
          <option value="">请选择课程</option>
          <option v-for="c in onlineCourses" :key="c.id" :value="c.id">{{ c.name }}{{ c.type === '一对多' ? '小班' : '' }}</option>
        </select>
        <label>开始时间</label>
        <input v-model="schStart" class="box-field" readonly @click="openPicker('schStart')" placeholder="请选择开始时间" />
        <label>结束时间</label>
        <input v-model="schEnd" class="box-field" readonly @click="openPicker('schEnd')" placeholder="根据课程时长自动计算" />
        <label>上课门店</label>
        <input v-model="schStore" class="box-field" placeholder="根据课程适用门店带入" />
        <label>人数限制</label>
        <input v-model="schLimit" class="box-field" placeholder="根据授课形式带入" />
        <button class="orange-btn" @click="save">{{ isEdit ? '保存修改' : '保存' }}</button>
      </div>
    </div>

    <!-- DateTime Picker Mask -->
    <div v-if="pickerOpen" class="sheet-mask" style="display:block">
      <div class="picker-dialog">
        <div class="picker-title">选择时间</div>
        <select v-model="pickerDate" class="picker-select">
          <option v-for="d in pickerDates" :key="d" :value="d">{{ fmtMD(d) }}</option>
        </select>
        <select v-model="pickerTime" class="picker-select">
          <option v-for="t in pickerTimes" :key="t" :value="t">{{ t }}</option>
        </select>
        <div class="picker-actions">
          <button @click="pickerOpen = false">取消</button>
          <button class="ok" @click="confirmPicker">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>
