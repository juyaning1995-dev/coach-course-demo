# 设计规范 — 明亮主题

## 色彩系统

### 背景色
| Token | 色值 | 用途 |
|-------|------|------|
| `--bg` | #F5F5F5 | 页面底色 |
| `--bg-card` | #FFFFFF | 卡片/面板背景 |
| `--bg-input` | #F8F8F8 | 输入框背景 |
| `--bg-nav` | #FFFFFF | 导航栏/状态栏背景 |

### 文字色
| Token | 色值 | 用途 |
|-------|------|------|
| `--text-1` | #1A1A1A | 主标题、重要文字 |
| `--text-2` | #666666 | 正文、次要信息 |
| `--text-3` | #999999 | 辅助文字、占位符 |

### 强调色（橙色系）
| Token | 色值 | 用途 |
|-------|------|------|
| `--accent` | #FF6B35 | 主强调色（按钮、选中态） |
| `--accent-light` | #FFF0E8 | 强调色浅底 |
| `--accent-dark` | #E55A2B | 强调色深色（按下态） |

### 边框与分割
| Token | 色值 | 用途 |
|-------|------|------|
| `--border` | #EBEBEB | 卡片边框 |
| `--divider` | #F0F0F0 | 列表分割线 |
| `--hairline` | #E5E5E5 | 细分割线 |

### 功能色
| Token | 色值 | 用途 |
|-------|------|------|
| `--success` | #52C41A | 成功/已完成 |
| `--warning` | #FAAD14 | 警告/待处理 |
| `--danger` | #FF4D4F | 危险/删除 |
| `--info` | #1890FF | 信息/链接 |

### 标签色
| Token | 色值 | 用途 |
|-------|------|------|
| `--tag-pending-text` | #B8860B | 待审核-文字 |
| `--tag-pending-bg` | #FFF8E1 | 待审核-背景 |
| `--tag-online-text` | #1A6FB5 | 已上架-文字 |
| `--tag-online-bg` | #E6F4FF | 已上架-背景 |
| `--tag-reject-text` | #C53030 | 驳回-文字 |
| `--tag-reject-bg` | #FFF0F0 | 驳回-背景 |
| `--tag-offline-text` | #888888 | 已下架-文字 |
| `--tag-offline-bg` | #F0F0F0 | 已下架-背景 |

### 按钮色
| Token | 色值 | 用途 |
|-------|------|------|
| `--btn-primary-bg` | #FF6B35 | 主按钮背景 |
| `--btn-primary-text` | #FFFFFF | 主按钮文字 |
| `--btn-disabled-bg` | #E0E0E0 | 禁用按钮背景 |
| `--btn-disabled-text` | #BBBBBB | 禁用按钮文字 |

### 阴影
| Token | 值 | 用途 |
|-------|-----|------|
| `--shadow-card` | 0 2px 12px rgba(0,0,0,.06) | 卡片阴影 |
| `--shadow-fab` | 0 6px 20px rgba(255,107,53,.28) | FAB 阴影 |
| `--shadow-btn` | 0 4px 14px rgba(255,107,53,.22) | 按钮阴影 |

### 圆角
| Token | 值 | 用途 |
|-------|-----|------|
| `--radius-sm` | 8px | 小元素（标签、输入框） |
| `--radius-md` | 12px | 卡片 |
| `--radius-lg` | 16px | 大卡片、面板 |
| `--radius-full` | 999px | 胶囊、圆形按钮 |

---

## 换肤开关

- 入口：教练端 → 我的 → 一键换肤（下拉选择暗黑/明亮）
- 实现：`body[data-skin="light"]` 覆盖 CSS 变量
- 持久化：localStorage key `appSkin`
- 影响范围：仅视觉（背景色、文字色、辅助色），不动布局
