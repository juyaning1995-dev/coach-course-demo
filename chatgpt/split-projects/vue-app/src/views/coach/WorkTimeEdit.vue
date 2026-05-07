<script setup>
import { reactive, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCoachStore } from '@/stores/coachStore'
import { load, save as saveDraftStorage, remove } from '@/services/storage'

const router = useRouter()
const coach = useCoachStore()

const dayNames = ['一', '二', '三', '四', '五', '六', '日']
const selectedDays = reactive([])
const timeLines = reactive([
  { name: '上午', value: '09:00–12:00', off: false },
  { name: '下午', value: '14:00–18:00', off: false },
  { name: '晚上', value: '18:30–21:30', off: false }
])

function collectDraft() {
  return {
    days: [...selectedDays],
    lines: timeLines.map(l => ({ name: l.name, value: l.value, off: l.off }))
  }
}

function saveDraft() {
  saveDraftStorage('coach_workDraft', JSON.stringify(collectDraft()))
}

function toggleDay(d) {
  const idx = selectedDays.indexOf(d)
  if (idx >= 0) selectedDays.splice(idx, 1)
  else selectedDays.push(d)
  saveDraft()
}

function toggleSwitch(line) {
  line.off = !line.off
  saveDraft()
}

function addTimeLine() {
  timeLines.push({ name: '新增', value: '22:00–23:00', off: false })
  saveDraft()
}

function save() {
  const times = timeLines.filter(l => !l.off).map(l => l.value).filter(Boolean)
  coach.saveWorkTime([...selectedDays], times)
  remove('coach_workDraft')
  window.__toast?.('工作时间已保存')
  router.push('/coach/worktime')
}

function buildDraftFromSaved() {
  const wt = coach.workTimes
  const activeDays = Object.keys(wt).filter(day => wt[day] && wt[day].length)
  if (!activeDays.length) return { days: [], lines: [] }
  const baseDay = activeDays[0]
  const lines = (wt[baseDay] || []).map(value => ({ name: '新增', value, off: false }))
  return { days: activeDays, lines: lines.length ? lines : [{ name: '上午', value: '09:00–12:00', off: false }, { name: '下午', value: '14:00–18:00', off: false }, { name: '晚上', value: '18:30–21:30', off: false }] }
}

// Watch for time-line input changes to save draft
watch(timeLines, () => saveDraft(), { deep: true })

onMounted(() => {
  const draft = load('coach_workDraft', null)
  if (draft && draft.days && draft.lines) {
    selectedDays.splice(0, selectedDays.length, ...draft.days)
    timeLines.length = 0
    draft.lines.forEach(l => timeLines.push({ name: l.name, value: l.value, off: l.off }))
  } else {
    const built = buildDraftFromSaved()
    if (built.days.length) {
      selectedDays.splice(0, selectedDays.length, ...built.days)
      timeLines.length = 0
      built.lines.forEach(l => timeLines.push({ name: l.name, value: l.value, off: l.off }))
    }
  }
})
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="nav"><div class="back" @click="router.push('/coach/worktime')">‹</div>工作时间<div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div></div>
      <div class="day-select">
        <div class="day-title">选择时间</div>
        <div class="days" id="editDays">
          <div v-for="d in dayNames" :key="d" :class="['day', { on: selectedDays.includes(d) }]" @click="toggleDay(d)">{{ d }}</div>
        </div>
      </div>
      <div class="time-section">
        <div class="time-section-title">设置工作时间段</div>
        <div id="timeLines">
          <div v-for="(line, i) in timeLines" :key="i" class="time-line">
            <div class="time-name">{{ line.name }}</div>
            <input v-model="line.value" class="time-input" />
            <div :class="['switch', { off: line.off }]" @click="toggleSwitch(line)"></div>
          </div>
        </div>
        <div class="work-edit" @click="addTimeLine">添加时间段</div>
        <button class="orange-btn" @click="save">保存</button>
        <div class="tips">设置的时间将作为可排课时间范围</div>
      </div>
    </div>
  </div>
</template>
