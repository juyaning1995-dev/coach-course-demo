<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCoachStore } from '@/stores/coachStore'
import { icons } from '@/components/icons'

const router = useRouter()
const coach = useCoachStore()

const editing = ref(false)
const profile = computed(() => coach.coachProfile)

const form = reactive({ name: '', gender: '', phone: '', birthDate: '', idCard: '', bio: '', tags: '' })
const tagArray = ref([])
const photoArray = ref([])

const defaultAvatar = '/coach-photo.jpg'

function startEdit() {
  form.name = profile.value.name || ''
  form.gender = profile.value.gender || '女'
  form.phone = profile.value.phone || ''
  form.birthDate = profile.value.birthDate || profile.value.birthday || ''
  form.idCard = profile.value.idCard || ''
  form.bio = profile.value.bio || ''
  form.tags = (profile.value.tags || []).join('，')
  tagArray.value = [...(profile.value.tags || [])]
  photoArray.value = [...(profile.value.photos || [])]
  editing.value = true
}

function cancelEdit() {
  editing.value = false
}

function save() {
  coach.coachProfile = {
    ...coach.coachProfile,
    name: form.name,
    gender: form.gender,
    phone: form.phone,
    birthDate: form.birthDate,
    idCard: form.idCard,
    bio: form.bio,
    tags: form.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean),
    photos: [...photoArray.value]
  }
  coach.persist()
  editing.value = false
  window.__toast?.('已保存')
}

function addTagText() {
  form.tags = form.tags.trim()
  if (form.tags) form.tags += '，新标签'
  else form.tags = '新标签'
}

let uploadTarget = ''

function handleAvatarUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    const img = new Image()
    img.onload = () => {
      const max = 800
      let w = img.width, h = img.height
      if (w > max || h > max) { const r = Math.min(max / w, max / h); w = Math.round(w * r); h = Math.round(h * r) }
      const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.75)
      if (uploadTarget === 'avatar') {
        coach.coachProfile = { ...coach.coachProfile, avatar: dataUrl }
      } else {
        if (!coach.coachProfile.photos) coach.coachProfile.photos = []
        coach.coachProfile.photos.push(dataUrl)
        photoArray.value = [...coach.coachProfile.photos]
      }
      coach.persist()
    }
    img.src = ev.target.result
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

function removePhoto(idx) {
  if (!coach.coachProfile.photos) return
  coach.coachProfile.photos.splice(idx, 1)
  photoArray.value = [...coach.coachProfile.photos]
  coach.persist()
}
function addPhoto() { const el = document.getElementById('ciPhotoInput'); if (el) { uploadTarget = 'photos'; el.click() } }
function uploadAvatar() { const el = document.getElementById('ciAvatarInput'); if (el) { uploadTarget = 'avatar'; el.click() } }
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="status-bar"><span>9:41</span><span class="status-icons"><span v-html="icons.signal" style="width:16px;height:12px"></span><span v-html="icons.battery" style="width:27px;height:12px;margin-left:6px"></span></span></div>
      <div class="nav">
        <div class="back" @click="router.push('/coach/mine')">‹</div>
        教练信息
      <div class="nav-capsule"><button class="nav-capsule-btn" aria-label="更多"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="4" cy="8" r="1.5" fill="currentColor"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/></svg></button><div class="nav-capsule-divider"></div><button class="nav-capsule-btn" aria-label="关闭"><svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.2" fill="currentColor"/></svg></button></div></div>
      <div class="mine-shell">
        <div class="ci-avatar-stage">
          <div class="ci-avatar-lg" :style="{ backgroundImage: `url(${profile.avatar || defaultAvatar})`, cursor: editing ? 'pointer' : 'default' }" @click="editing && uploadAvatar()">
            <div class="ci-avatar-badge">📷</div>
          </div>
        </div>
        <div v-if="coach.coachProfile.photos?.length || editing" class="ci-photo-strip">
          <div v-for="(p, i) in (coach.coachProfile.photos || [])" :key="i" class="ci-photo-thumb" :style="{ backgroundImage: `url(${p})` }" @click="editing && removePhoto(i)" :title="editing ? '点击删除' : ''"></div>
          <div v-if="editing" class="ci-photo-add" @click="addPhoto()">+</div>
        </div>
        <div class="ci-section">
          <div class="ci-section-title"><i></i>教练信息<span class="ci-edit-btn" @click="editing ? cancelEdit() : startEdit()">{{ editing ? '取消' : '编辑' }}</span></div>
          <div class="ci-row">
            <span class="ci-label">姓名</span>
            <input v-if="editing" id="ci_name" v-model="form.name" class="ci-input" />
            <span v-else class="ci-value">{{ profile.name || '--' }}</span>
          </div>
          <div class="ci-row">
            <span class="ci-label">性别</span>
            <select v-if="editing" id="ci_gender" v-model="form.gender" class="ci-input">
              <option>男</option><option>女</option>
            </select>
            <span v-else class="ci-value">{{ profile.gender || '--' }}</span>
          </div>
          <div class="ci-row">
            <span class="ci-label">手机号</span>
            <input v-if="editing" id="ci_phone" v-model="form.phone" class="ci-input" />
            <span v-else class="ci-value">{{ profile.phone || '--' }}</span>
          </div>
          <div class="ci-row">
            <span class="ci-label">出生日期</span>
            <input v-if="editing" id="ci_birthDate" v-model="form.birthDate" class="ci-input" placeholder="YYYY-MM-DD" />
            <span v-else class="ci-value">{{ profile.birthDate || profile.birthday || '--' }}</span>
          </div>
          <div class="ci-row">
            <span class="ci-label">身份证号</span>
            <input v-if="editing" id="ci_idCard" v-model="form.idCard" class="ci-input" />
            <span v-else class="ci-value">{{ profile.idCard || '--' }}</span>
          </div>
          <div class="ci-row">
            <span class="ci-label">个人标签</span>
            <input v-if="editing" id="ci_tags" v-model="form.tags" class="ci-input" placeholder="用逗号分隔多个标签" />
            <div v-else class="ci-tags">
              <span v-for="(t, i) in (profile.tags || [])" :key="i" class="ci-tag" style="cursor:default">{{ t }}</span>
              <span v-if="!profile.tags?.length" class="ci-value">--</span>
            </div>
          </div>
          <div class="ci-row ci-textarea-row">
            <span class="ci-label">个人简介</span>
            <textarea v-if="editing" id="ci_bio" v-model="form.bio" class="ci-input" placeholder="介绍你的教学理念、擅长领域等"></textarea>
            <span v-else class="ci-value" style="text-align:left;width:100%">{{ profile.bio || '--' }}</span>
          </div>
        </div>

        <input id="ciAvatarInput" type="file" accept="image/*" style="display:none" @change="handleAvatarUpload" />
        <input id="ciPhotoInput" type="file" accept="image/*" style="display:none" @change="handleAvatarUpload" />

        <div v-if="editing" class="ci-save-bar" style="display:block">
          <button class="ci-save-btn" @click="save">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>
