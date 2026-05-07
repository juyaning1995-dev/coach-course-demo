<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="entry-shell">
    <div class="entry-head">
      <div class="entry-title">预约演示项目</div>
      <div class="entry-sub">教练端和用户端使用同一套课程、排班、预约数据，但各自的停留页面和草稿状态独立保存。</div>
    </div>
    <div class="entry-grid">
      <div class="entry-card" @click="router.push('/coach')">
        <span class="entry-tag">Coach App</span>
        <h2>教练端</h2>
        <p>课程管理、工作时间、课程日历、排班、代学员预约、课次详情都从这里进入。</p>
        <div class="entry-jump">进入教练端 ›</div>
      </div>
      <div class="entry-card" @click="router.push('/user')">
        <span class="entry-tag entry-tag-user">User App</span>
        <h2>用户端</h2>
        <p>用户端预约、时段选择、预约确认、我的预约记录在这里独立演示。</p>
        <div class="entry-jump">进入用户端 ›</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.entry-shell {
  width: min(920px, 100%);
  margin: 0 auto;
  padding: 80px 24px 60px;
  display: grid;
  gap: 18px;
  min-height: 100vh;
  align-content: center;
}
.entry-head {
  margin-bottom: 4px;
}
.entry-title {
  font-size: 34px;
  font-weight: 800;
  line-height: 1.2;
  color: #fff;
}
.entry-sub {
  margin-top: 10px;
  color: #9a9a9a;
  font-size: 15px;
  line-height: 1.8;
}
.entry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 18px;
}
.entry-card {
  background: #141414;
  border: 1px solid #2b2b2b;
  border-radius: 20px;
  padding: 24px 22px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22);
  cursor: pointer;
  transition: border-color 0.2s;
}
.entry-card:hover {
  border-color: rgba(248, 201, 0, 0.3);
}
.entry-card h2 {
  margin: 18px 0 10px;
  font-size: 26px;
  color: #fff;
}
.entry-card p {
  margin: 0;
  color: #a5a5a5;
  font-size: 14px;
  line-height: 1.8;
}
.entry-jump {
  margin-top: 22px;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
}
.entry-tag {
  display: inline-flex;
  height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: rgba(255, 116, 55, 0.12);
  color: #ff9a6e;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
}
.entry-tag-user {
  background: rgba(248, 201, 0, 0.12);
  color: #F8C900;
}
</style>
