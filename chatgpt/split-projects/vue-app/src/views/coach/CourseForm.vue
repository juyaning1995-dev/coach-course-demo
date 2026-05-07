<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCoachStore } from '@/stores/coachStore'
import { load, save, remove } from '@/services/storage'

const router = useRouter()
const route = useRoute()
const coach = useCoachStore()

const COURSE_FIELDS = ['name', 'type', 'unit', 'limit', 'minutes', 'hours', 'price', 'buyLimit', 'giftHours', 'validDays', 'activeWay', 'advanceHour', 'giftDays', 'stores', 'intro', 'desc']

const form = reactive({
  name: '', type: '一对一', unit: '按节', limit: '', minutes: '', hours: '',
  price: '', buyLimit: '', giftHours: '', validDays: '', activeWay: '',
  advanceHour: '', giftDays: '', stores: '', intro: '', desc: ''
})

const isEdit = ref(false)
const formTitle = ref('新增课程')
const btnText = ref('创建')
const showAudit = ref(false)

const limitRow = ref(false)
const minuteRow = ref(true)
const giftHoursRow = ref(true)
const giftDaysRow = ref(false)

function updateRows() {
  limitRow.value = form.type === '一对多'
  minuteRow.value = form.unit === '按节'
  giftDaysRow.value = form.unit === '按时间'
}

function collect() {
  return { ...form }
}

function submit() {
  const data = collect()
  const result = coach.submitCourse(data)
  window.__toast?.(result.msg)
  remove('coach_courseDraft')
  if (result.needAudit) setTimeout(() => { showAudit.value = true }, 450)
  else router.push('/coach/courses')
}

function auditPass() {
  coach.auditPass()
  showAudit.value = false
  window.__toast?.('审核通过，课程已上架')
  router.push('/coach/courses')
}

function auditReject() {
  coach.auditReject()
  showAudit.value = false
  window.__toast?.('已驳回')
  router.push('/coach/courses')
}

// Draft persistence
watch(form, () => {
  save('coach_courseDraft', JSON.stringify({ ...form }))
}, { deep: true })

onMounted(() => {
  const id = route.params.id
  if (id) {
    const info = coach.editCourse(Number(id))
    if (info) {
      Object.assign(form, info.fields)
      formTitle.value = info.title
      btnText.value = info.btnText
      isEdit.value = true
    }
  } else {
    // Load draft for new courses
    const draft = load('coach_courseDraft', null)
    if (draft) {
      COURSE_FIELDS.forEach(k => {
        if (draft[k] !== undefined) form[k] = draft[k]
      })
    }
  }
  updateRows()
})
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="nav"><div class="back" @click="router.push('/coach/courses')">‹</div>{{ formTitle }}<div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div></div>
      <div class="form">
        <div class="form-row"><div class="label">课程名称</div><input v-model="form.name" class="field" placeholder="请输入课程名称" /></div>
        <div class="form-row"><div class="label">授课形式</div><select v-model="form.type" class="field" @change="updateRows"><option>一对一</option><option>一对多</option></select></div>
        <div v-if="limitRow" class="form-row"><div class="label">限制人数</div><input v-model="form.limit" class="field" type="number" placeholder="2" /></div>
        <div class="form-row"><div class="label">计费单位</div><select v-model="form.unit" class="field" @change="updateRows"><option>按节</option><option>按时间</option></select></div>
        <div v-if="minuteRow" class="form-row"><div class="label">单节时长（分钟）</div><input v-model="form.minutes" class="field" type="number" placeholder="请输入时长" /></div>
        <div class="form-row"><div class="label">课时</div><input v-model="form.hours" class="field" type="number" placeholder="请输入课时" /></div>
        <div class="form-row"><div class="label">售价</div><input v-model="form.price" class="field" type="number" placeholder="请输入售价" /></div>
        <div class="form-row"><div class="label">限购次数</div><input v-model="form.buyLimit" class="field" type="number" placeholder="请输入限购次数" /></div>
        <div v-if="giftHoursRow" class="form-row"><div class="label">赠送课时</div><input v-model="form.giftHours" class="field" type="number" placeholder="请输入赠送课时" /></div>
        <div v-if="giftDaysRow" class="form-row"><div class="label">赠送天数</div><input v-model="form.giftDays" class="field" type="number" placeholder="请输入赠送天数" /></div>
        <div class="form-row split-top"><div class="label">有效期（固定天数）</div><input v-model="form.validDays" class="field" type="number" placeholder="请输入天数" /></div>
        <div class="form-row"><div class="label">激活方式</div><select v-model="form.activeWay" class="field"><option value="">请选择激活方式</option><option>购买即生效</option><option>首次预约生效</option><option>指定天数后生效</option></select></div>
        <div class="form-row"><div class="label">提前预约时间（小时）</div><input v-model="form.advanceHour" class="field" type="number" placeholder="请输入时间" /></div>
        <div class="form-row"><div class="label">适用门店</div><input v-model="form.stores" class="field" placeholder="请选择门店" /></div>
        <div class="form-row textarea-row"><div class="label">课程简介</div><textarea v-model="form.intro" placeholder="请输入课程简介"></textarea></div>
        <div class="form-row textarea-row"><div class="label">课程说明</div><textarea v-model="form.desc" placeholder="请输入课程说明（购买时展示给学员）"></textarea></div>
      </div>
      <button class="orange-btn" @click="submit">{{ btnText }}</button>
    </div>

    <!-- Audit Mask -->
    <div v-if="showAudit" class="sheet-mask">
      <div class="audit-dialog">
        <div class="audit-title">课程审核演示</div>
        <div class="audit-text">课程已创建并进入「待审核」。为了演示完整流程，可以直接模拟平台审核结果。</div>
        <div class="audit-actions">
          <button @click="auditReject">驳回</button>
          <button @click="auditPass">通过</button>
        </div>
      </div>
    </div>
  </div>
</template>
