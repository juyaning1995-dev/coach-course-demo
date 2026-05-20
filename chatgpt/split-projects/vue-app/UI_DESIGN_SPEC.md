# Gym Coaching App · UI 设计规范 v2

> 移动端（iPhone 393px 基准）。语言栈：Vue 3 + Pinia + Vue Router。
> 设计语言：**克制、清晰、留白、一致、反馈**。
> 颜色统一使用语义化 CSS 变量，禁止硬编码 hex；数字使用 `tabular-nums`。

---

## 1. 设计 Token

### 1.1 颜色

```css
:root {
  /* 品牌色（暖珊瑚） */
  --brand:            oklch(0.66 0.13 32);
  --brand-foreground: oklch(0.99 0 0);
  --accent:           oklch(0.965 0.012 35);   /* 品牌浅底 */
  --ring:             oklch(0.68 0.18 35);      /* 焦点环 */

  /* 中性色 */
  --background:       #F4F2F5;
  --gradient-top:     #FEE7E3;                  /* 首页渐变起点 */
  --gradient-bottom:  #F4F2F5;                  /* 首页渐变终点 */
  --surface:          oklch(1 0 0);             /* 卡片白 */
  --foreground:       oklch(0.22 0.02 250);     /* 主文字 */
  --muted-foreground: oklch(0.55 0.012 250);    /* 辅助文字 */
  --border:           oklch(0.92 0.008 60);     /* 边框 */
  --card-border:      rgba(82,61,44,0.07);      /* 卡片边框（暖棕） */
  --muted:            oklch(0.965 0.005 60);    /* 浅灰底 */

  /* 功能色 */
  --info:         #3B82F6;
  --info-soft:    #EFF6FF;
  --warning:      #D97706;
  --warning-soft: #FFFBEB;
  --success:      #16A34A;
  --success-soft: #F0FDF4;
  --pending:      #7C3AED;
  --pending-soft: #F5F3FF;
  --destructive:  #EF4444;
}
```

### 1.2 字体 / 字号

| 层级 | 字号 | 字重 | 用途 |
|---|---|---|---|
| 页面标题 H1 | 17px | 600 | 导航栏标题 |
| 卡片标题 | 15px | 500 | 课程名、订单号 |
| 正文 | 13-14px | 400-500 | 会员名、教练名 |
| 辅助信息 | 12.5px | 400 | meta 行、时间、电话 |
| 标签/按钮 | 11.5-12.5px | 500 | 状态徽章、操作按钮 |
| 角标 | 11-12px | 500-600 | 数字角标、状态栏 |

- 字体族：`Inter, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif`
- 数字（时间、电话、统计）：`font-variant-numeric: tabular-nums; letter-spacing: -0.02em;`
- 教练端默认启用 `font-feature-settings: "cv11","ss01","tnum"`

### 1.3 间距 / 圆角 / 阴影

| Token | 值 | 用途 |
|---|---|---|
| `--s1` | 4px | 微间距 |
| `--s2` | 8px | 小间距 |
| `--s3` | 12px | 卡片内间距 |
| `--s4` | 16px | 标准间距 |
| `--s5` | 20px | 页面水平 padding |
| `--s6` | 24px | 大间距 |
| 圆角 card | 16-18px | 卡片 |
| 圆角 input | 12px | 输入框 / 筛选条 |
| 圆角 pill | 999px | 标签 / 按钮 / Tab |
| 圆角 frame | 44px | 手机外框 |
| `--shadow-card` | `0 1px 1px rgba(16,24,40,.025), 0 6px 18px rgba(16,24,40,.035)` | 卡片 |
| `--shadow-brand` | `0 2px 6px -2px oklch(0.66 0.13 32 / 0.5)` | 主按钮 / 激活 Tab |
| `--shadow-frame` | `0 20px 60px -20px rgba(16,24,40,.25)` | 手机外框 |

---

## 2. 页面背景规则

**仅首页（`/coach`）和我的页面（`/coach/mine`）使用渐变背景：**

```css
background: linear-gradient(180deg, #FEE7E3 0%, #F4F2F5 100%) top/100% 280px no-repeat, #F4F2F5;
```

**其余所有教练端和用户端页面背景色统一为 `#F4F2F5`（`var(--background)`）。**

---

## 3. 通用组件样式

### 3.1 卡片

```css
background: var(--surface);
border: 1px solid var(--card-border);   /* 教练端用 card-border */
border: 1px solid var(--border);        /* 用户端用 border */
border-radius: 16px;                     /* 或 18px */
box-shadow: var(--shadow-card);
padding: 16px;
margin-bottom: 10px;
```

### 3.2 Tab 标签栏

```css
display: flex;
gap: 6px;
padding: 8px 20px 12px;
overflow-x: auto;                       /* 横向滚动 */
scrollbar-width: none;                  /* 隐藏滚动条 */
```

- 单个 Tab：`padding: 5px 10px; border-radius: 999px; font-size: 12px; font-weight: 500`
- 默认态：`background: var(--surface); border: 1px solid var(--border); color: var(--foreground); opacity: 0.75`
- 激活态：`background: var(--brand); color: var(--brand-foreground); border-color: transparent; opacity: 1; box-shadow: var(--shadow-brand)`

### 3.3 状态徽章

统一 pill 样式：
```css
display: inline-flex; align-items: center;
min-height: 24px; padding: 4px 10px;
border-radius: 999px; font-size: 11.5px; font-weight: 500;
white-space: nowrap;
```

| 业务状态 | CSS key | 文字色 | 背景色 | 备注 |
|---|---|---|---|---|
| 待上课/待支付 | `upcoming` / `pending` | `var(--brand)` | `var(--accent)` | |
| 上课中 | `ongoing` | `var(--success)` | `var(--success-soft)` | + 1px inset ring |
| 待确认完课 | `pending_confirm` | `var(--pending)` | `var(--pending-soft)` | |
| 已完课/已支付 | `completed` / `paid` | `var(--success)` | `var(--success-soft)` | |
| 已取消/已退款 | `canceled` / `refunded` | `var(--muted-foreground)` | `var(--muted)` | |
| 未到场 | `no_show` | `var(--warning)` | `var(--warning-soft)` | |
| 待处理取消 | `review` | `var(--warning)` | `var(--warning-soft)` | |

### 3.4 按钮

| 变体 | 样式 |
|---|---|
| **primary** | `background: var(--brand); color: var(--brand-foreground); box-shadow: var(--shadow-brand); border: 0` |
| **ghost / secondary** | `background: var(--surface) 或 var(--muted); color: var(--foreground); border: 1px solid var(--border); opacity: 0.8` |
| **disabled** | `background: var(--muted); color: var(--muted-foreground); opacity: 0.5; box-shadow: none` |
| **danger** | `background: rgba(239,68,68,0.08); color: var(--destructive); border: 1px solid rgba(239,68,68,0.15)` |

- 通用：`height: 30px; padding: 0 14px; border-radius: 999px; font-size: 12.5px; font-weight: 500`
- 交互反馈：`active: scale(0.95)` + `transition: transform .1s`

### 3.5 顶部导航

- 教练端：44px 高，毛玻璃效果（`backdrop-filter: blur(14px)`），sticky `top: 32px`
- 用户端：56px 高，`var(--background)` 底色，`var(--border)` 底边线
- 返回按钮：32px 圆形，`var(--border)` 边框，绝对定位 `left: 16px`

### 3.6 底部导航（仅教练端）

- 固定底部，最大 390px 宽，居中
- 毛玻璃效果：`background: rgba(255,255,255,.88); backdrop-filter: blur(14px)`
- 4 项：首页 / 课程 / 排班 / 我的，激活项 `var(--brand)` 色

### 3.7 筛选条

```css
display: flex; align-items: center; gap: 8px;
padding: 14px 20px;
/* 输入框 */
height: 36px; background: var(--surface);
border: 1px solid var(--border); border-radius: 12px;
```

### 3.8 空状态

```css
padding: 48px 16px; text-align: center;
color: var(--muted-foreground); font-size: 13px;
background: var(--surface); border: 1px solid var(--border);
border-radius: 16px;
```

---

## 4. 图标

所有图标统一规格：`viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"`

| 用途 | 尺寸 |
|---|---|
| 导航 / 筛选图标 | 16-18px |
| Meta 行图标 | 13px，`stroke-width: 1.8` |
| 快速入口图标 | 24px，`stroke-width: 1.95` |
| 统计图标 | 24px |

---

## 5. 交互规范

- 点击反馈：`active: scale-95` + `transition`
- 不使用大面积品牌色背景 — 品牌色仅用于：主按钮、激活 Tab、上课时间文字、待上课/待支付徽章
- 不使用 transform 入场动画
- Tab / 按钮 / 状态徽章统一 `white-space: nowrap`
- 课程名 / 地点：`overflow: hidden; text-overflow: ellipsis; white-space: nowrap`
- 隐藏滚动条但保留滚动：`overflow-x: auto; scrollbar-width: none` + `::-webkit-scrollbar{display:none}`

---

## 6. 页面清单

### 教练端（22 页）

| 路由 | 页面 | 说明 |
|---|---|---|
| `/coach` | CoachHome | 首页仪表盘（渐变背景） |
| `/coach/courses` | CourseList | 课程列表 |
| `/coach/courses/new` | CourseForm | 新增课程 |
| `/coach/courses/:id/detail` | CourseDetail | 课程详情 |
| `/coach/courses/:id/edit` | CourseEdit | 编辑课程 |
| `/coach/worktime` | WorkTime | 工作时间 |
| `/coach/worktime/edit` | WorkTimeEdit | 编辑工作时间 |
| `/coach/calendar` | CalendarPage | 排课日历 |
| `/coach/schedule/new` | ScheduleForm | 新增课次 |
| `/coach/schedule/:id/edit` | ScheduleEdit | 编辑课次 |
| `/coach/schedule/:id` | ScheduleDetail | 课次详情 |
| `/coach/schedule/:id/members` | MemberPage | 学员列表 |
| `/coach/schedule/:id/stop` | StopPage | 停约 |
| `/coach/bookings` | BookingManagement | 预约管理 |
| `/coach/orders` | OrderManagement | 私教订单 |
| `/coach/contracts` | MemberContracts | 会员合同 |
| `/coach/mine` | MinePage | 我的页面（渐变背景） |
| `/coach/info` | CoachInfo | 教练信息编辑 |
| `/coach/user/courses` | CoachUserCourses | 用户端课程（教练视角） |
| `/coach/user/booking` | CoachUserBooking | 用户端预约（教练视角） |
| `/coach/user/success` | CoachUserSuccess | 用户端成功页（教练视角） |
| `/coach/user/bookings` | CoachUserBookings | 用户端预约列表（教练视角） |

### 用户端（9 页）

| 路由 | 页面 | 说明 |
|---|---|---|
| `/user` | UserHome | 用户首页 |
| `/user/courses` | UserCourses | 课程列表 |
| `/user/coach` | UserCoach | 教练主页 |
| `/user/order-confirm` | UserOrderConfirm | 订单确认 |
| `/user/payment-result` | UserPaymentResult | 支付结果 |
| `/user/booking` | UserBooking | 预约 |
| `/user/success` | UserSuccess | 预约成功 |
| `/user/bookings` | UserBookings | 我的预约 |
| `/user/contract` | UserContract | 合同签署 |

---

## 7. 实现约束

1. **禁止硬编码颜色** — 所有颜色使用 `var(--token)`
2. **数字字段加 tabular** — 时间、电话、金额、统计统一 `font-variant-numeric: tabular-nums`
3. **品牌色克制使用** — 仅主按钮、激活 Tab、上课时间文字、待上课/待支付徽章
4. **背景色统一** — 除首页和我的页面外，全部使用 `#F4F2F5`
5. **不要改业务逻辑** — 样式改动仅限于颜色、字体、间距、圆角、背景、阴影、边框
6. **单行截断** — 课程名、地点等长文本 `truncate`
7. **隐藏滚动条** — Tab 等横向滚动容器统一隐藏滚动条
