<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCoachStore } from '@/stores/coachStore'
import { useUserStore } from '@/stores/userStore'
import { icons } from '@/components/icons'

const router = useRouter()
const route = useRoute()
const coach = useCoachStore()
const user = useUserStore()

const s = computed(() => coach.schedules.find(s => String(s.id) === String(route.params.id)))
const currentRemain = computed(() => {
  if (!s.value) return 0
  return user.userProducts.filter(p => String(p.courseId) === String(s.value.courseId)).reduce((sum, p) => sum + Number(p.remain || 0), 0)
})

const members = computed(() => [
  { name: '小明', phone: '188****0000', remain: currentRemain.value, canBook: currentRemain.value > 0 },
  { name: '李三', phone: '139****6666', remain: 3, canBook: true },
  { name: '王五', phone: '138****3321', remain: 2, canBook: true },
  { name: '赵敏', phone: '137****2208', remain: 1, canBook: true },
  { name: '孙超', phone: '136****1188', remain: 0, canBook: false }
])

const showConfirm = ref(false)
const pendingName = ref('')
const pendingPhone = ref('')

function openConfirm(m) {
  if (!m.canBook) return
  pendingName.value = m.name
  pendingPhone.value = m.phone
  showConfirm.value = true
}

function confirmBook() {
  if (!s.value) return
  const result = coach.confirmMemberBook(pendingName.value, pendingPhone.value, s.value.id)
  showConfirm.value = false
  window.__toast?.(result.msg)
  if (result.ok) router.push('/coach/calendar')
}
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="status-bar"><span>9:41</span><span class="status-icons"><span v-html="icons.signal" style="width:16px;height:12px"></span><span v-html="icons.battery" style="width:27px;height:12px;margin-left:6px"></span></span></div>
      <div class="nav"><div class="back" @click="router.push('/coach/calendar')">‹</div>代学员预约<div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div></div>
      <div class="member-list">
        <div class="member-search">搜索会员姓名/手机号</div>
        <div class="member-note">仅显示购买本课程的会员</div>
        <div v-if="!s" style="padding-top:48px;text-align:center;color:var(--text-3)">
          <div style="font-size:18px;font-weight:600;margin-bottom:8px">暂无课次信息</div>
          <div>请返回后重新选择要操作的课次</div>
        </div>
        <div v-for="m in members" :key="m.phone" :class="['member-row', { disabled: !m.canBook }]" @click="openConfirm(m)">
          <div class="avatar"></div>
          <div class="member-info">
            <b>{{ m.name }}</b><br/>{{ m.phone }}
          </div>
          <div :class="['remain', { bad: !m.canBook }]">{{ m.canBook ? `剩余：${m.remain}次` : '无可用课时' }}</div>
        </div>
      </div>
    </div>
    <!-- Confirm Dialog -->
    <div v-if="showConfirm" class="sheet-mask" style="display:block">
      <div class="audit-dialog">
        <div class="audit-title">确认代约</div>
        <div class="audit-text">
          将为 <b>{{ pendingName }}</b>（{{ pendingPhone }}）<br/>
          预约 <b>{{ s?.courseName }}</b><br/>
          {{ s?.date }} {{ s?.start }}–{{ s?.end }}
        </div>
        <div class="audit-actions">
          <button @click="showConfirm = false">取消</button>
          <button @click="confirmBook">确认代约</button>
        </div>
      </div>
    </div>
  </div>
</template>
