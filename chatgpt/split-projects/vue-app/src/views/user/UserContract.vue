<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { icons } from '@/components/icons'
import { useCoachStore } from '@/stores/coachStore'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const coach = useCoachStore()
const userStore = useUserStore()

const canvas = ref(null)
const checkAgreed = ref(false)
let drawing = false
let hasStroke = false

const productId = computed(() => userStore.currentContractProductId || userStore.currentUserProductId)
const product = computed(() => userStore.getUserProduct(productId.value))
const record = computed(() => userStore.getContract(productId.value))
const signed = computed(() => !!record.value)

function startDraw(e) {
  drawing = true
  hasStroke = true
  const ctx = canvas.value?.getContext('2d')
  if (ctx) {
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }
}

function draw(e) {
  if (!drawing) return
  e.preventDefault()
  const ctx = canvas.value?.getContext('2d')
  if (ctx) {
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }
}

function stopDraw() { drawing = false }

function getPos(e) {
  const rect = canvas.value?.getBoundingClientRect()
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  return { x: (clientX - rect.left) * (640 / rect.width), y: (clientY - rect.top) * (640 / rect.width * 260 / 640) }
}

function clearSign() {
  const ctx = canvas.value?.getContext('2d')
  if (ctx) ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  hasStroke = false
}

function fmtContractTime(val) {
  if (!val) return ''
  return new Date(val).toLocaleString('zh-CN', { hour12: false })
}

function submitContract() {
  if (!product.value) { router.push('/user/courses'); return }
  if (signed.value) {
    if (userStore.pendingBookingAfterContract) {
      userStore.pendingBookingAfterContract = false
      userStore.currentContractProductId = null
      userStore.persist()
      router.push('/user/booking')
    } else {
      backFromContract()
    }
    return
  }
  if (!hasStroke) { window.__toast?.('请先完成手写签名'); return }
  if (!checkAgreed.value) { window.__toast?.('请先勾选同意合同'); return }
  userStore.signContract(productId.value, canvas.value?.toDataURL('image/png'))
  userStore.pendingBookingAfterContract = false
  userStore.currentContractProductId = null
  userStore.persist()
  router.push('/user/booking')
}

function backFromContract() {
  userStore.pendingBookingAfterContract = false
  userStore.currentContractProductId = null
  userStore.persist()
  router.push('/user/courses')
}

onMounted(async () => {
  await nextTick()
  if (canvas.value && !signed.value) {
    const ctx = canvas.value.getContext('2d')
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2.2
  }
})
</script>

<template>
  <div class="phone">
    <div class="page active">
      <div class="status-bar"><span>9:41</span><span class="status-icons"><span v-html="icons.signal" style="width:16px;height:12px"></span><span v-html="icons.battery" style="width:27px;height:12px;margin-left:6px"></span></span></div>
      <div class="nav"><div class="back" @click="backFromContract">‹</div>电子合同</div>
      <div class="user-shell">
        <div class="user-contract-sheet">
          <template v-if="!product">
            <div class="user-empty">未找到合同对应课程</div>
          </template>
          <template v-else>
            <div class="user-contract-badge">{{ signed ? '已签约' : '预约前需签约' }}</div>
            <div class="user-contract-title">{{ product.name }}电子合同</div>
            <div class="user-contract-meta">
              {{ product.coachName }} · {{ product.store }}
              <template v-if="signed && record"><br/>签署时间：{{ fmtContractTime(record.signedAt) }}</template>
            </div>
            <div class="user-contract-card">
              <strong>课程约定</strong>
              <div>甲方购买并预约 {{ product.name }} 课程后，需按预约时间到店上课。</div>
              <div>乙方将依据预约记录为甲方提供对应训练服务。</div>
              <div>每次成功预约将按规则核销 1 节对应课时。</div>
            </div>
            <div class="user-contract-list">
              1. 学员需遵守预约与取消规则，并保证签署信息真实有效。<br/>
              2. 门店将基于已签署合同和预约记录提供训练服务。<br/>
              3. 课程开始前未按规则取消的，按当前业务规则处理。<br/>
              4. 完成签署后，可继续进行当前课程预约。
            </div>
            <div class="user-contract-sign">
              <template v-if="signed">
                <template v-if="record.signatureData">
                  <label>手写签名</label>
                  <div class="user-sign-preview"><img :src="record.signatureData" alt="手写签名" /></div>
                </template>
                <template v-else>
                  <label>手写签名</label>
                  <input class="user-contract-input" :value="record.signer || '已签署'" disabled />
                </template>
              </template>
              <template v-else>
                <label for="userContractCanvas">手写签名</label>
                <canvas id="userContractCanvas" ref="canvas" class="user-sign-board" width="640" height="260" @mousedown="startDraw" @mousemove="draw" @mouseup="stopDraw" @mouseleave="stopDraw" @touchstart="startDraw" @touchmove="draw" @touchend="stopDraw"></canvas>
                <div class="user-sign-actions">
                  <button class="mini-btn ghost" @click="clearSign">重签</button>
                </div>
                <label class="user-contract-check"><input id="userContractAgree" type="checkbox" v-model="checkAgreed" />我已阅读并同意上述课程预约电子合同内容</label>
              </template>
            </div>
            <div class="user-contract-foot">{{ signed ? '当前课程已完成签约，可直接预约。' : '签署完成后，当前课程后续预约将直接跳过本页面。' }}</div>
          </template>
        </div>
        <button class="user-book-btn" style="position:static;transform:none;width:100%;max-width:none;margin-top:22px" @click="submitContract">
          {{ !product ? '返回' : (signed ? (userStore.pendingBookingAfterContract ? '继续预约' : '关闭') : '完成签署并继续预约') }}
        </button>
      </div>
    </div>
  </div>
</template>
