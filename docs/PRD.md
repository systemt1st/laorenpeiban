# 老人陪伴助手 — 产品需求文档（PRD）

版本: v1.0.0 | 日期: 2026-03-21

## 1. 产品概述

### 1.1 产品定位
面向60+老年人的移动Web应用，语音交互为主，提供日常陪伴对话、生活提醒、应急求助引导。

### 1.2 产品愿景
降低老年人独居时的孤独感与生活风险门槛，让语音成为最自然的交互方式，实现"像孙子孙女一样陪聊、关键时刻能救命"的体验。

### 1.3 核心价值

| 维度 | 价值 |
|------|------|
| 陪伴 | 7x24语音陪聊，缓解孤独 |
| 辅助 | 吃药、喝水、复诊智能提醒 |
| 安全 | 识别高风险表达，自动进入紧急模式 |
| 连接 | 家属远程查看对话摘要和应急事件 |
| 包容 | 超大字体、高对比度、语音优先 |

### 1.4 竞品分析

| 竞品 | 优势 | 不足 | 差异化 |
|------|------|------|--------|
| 智能音箱 | 硬件集成 | 无紧急模式、无家属追溯 | 专注老年+紧急引导+家属后台 |
| 微信语音 | 用户基数大 | 需对方在线 | AI全天候陪伴 |
| 健康App | 数据专业 | 操作复杂 | 语音优先+情感陪伴 |

## 2. 用户画像与场景

### 2.1 画像A — 独居老人
- 年龄: 65-85岁
- 技术能力: 能用微信基本功能
- 生活状态: 独居或白天独居
- 核心需求: 聊天解闷、吃药提醒、突发求助
- 典型场景: 早上聊天、按时吃药、突然胸闷求助

### 2.2 画像B — 关注型家属
- 年龄: 30-55岁
- 角色: 子女
- 核心需求: 远程了解老人状态、查看事件记录
- 典型场景: 每周查看对话摘要、收到紧急通知

### 2.3 场景矩阵

| 场景 | 频率 | 优先级 | 交互方式 |
|------|------|--------|----------|
| 日常闲聊 | 每天多次 | P0 | 语音 |
| 吃药提醒 | 每天2-6次 | P0 | 语音播报+确认 |
| 天气查询 | 每天1-2次 | P1 | 语音问答 |
| 紧急求助 | 偶发 | P0 | 语音+一键呼叫 |
| 家属查看 | 每周1-3次 | P1 | 文字界面 |
| 配置联系人 | 初次+偶尔 | P1 | 文字表单 |

## 3. 功能需求

### 3.1 功能全景图

```
老人陪伴助手
├── F1 语音对话系统（P0）
│   ├── F1.1 语音识别（STT）- Web Speech API, zh-CN
│   ├── F1.2 语音合成（TTS）- 语速0.9, 分段播报
│   ├── F1.3 多轮对话 - 20轮上下文
│   ├── F1.4 连续对话模式
│   └── F1.5 方言/口音容错
├── F2 AI 陪伴引擎（P0）
│   ├── F2.1 闲聊对话 - 温暖晚辈人设
│   ├── F2.2 情感识别 - happy/sad/anxious/lonely/neutral
│   ├── F2.3 话题引导
│   ├── F2.4 个性化记忆
│   └── F2.5 信息查询（天气/时间/常识）
├── F3 紧急模式（P0）
│   ├── F3.1 三级语义检测
│   ├── F3.2 紧急确认流程
│   ├── F3.3 应急指导播报
│   ├── F3.4 一键拨号（tel:协议）
│   ├── F3.5 事件记录与通知
│   └── F3.6 SOS按钮（70px, 长按2秒）
├── F4 智能提醒（P0）
│   ├── F4.1 吃药提醒
│   ├── F4.2 喝水提醒
│   ├── F4.3 复诊提醒
│   ├── F4.4 自定义提醒
│   ├── F4.5 语音播报通知
│   └── F4.6 确认机制（15min再提醒, 30min标记未确认）
├── F5 用户画像（P1）
│   ├── F5.1 基本信息（称呼/年龄/性别）
│   ├── F5.2 健康档案
│   ├── F5.3 偏好设置
│   └── F5.4 紧急联系人（最多5位）
└── F6 家属后台（P1）
    ├── F6.1 对话摘要查看
    ├── F6.2 提醒执行记录
    ├── F6.3 应急事件追溯
    └── F6.4 远程配置管理
```

### 3.2 F3 紧急关键词检测表

| 风险等级 | 关键词 | 触发动作 |
|---------|--------|---------|
| 极高(critical) | 胸痛、胸闷、喘不上气、摔倒、晕倒、呼吸困难、大出血、中风 | 立即进入紧急模式 |
| 高(high) | 头很痛、剧痛、出血、看不清、高烧、抽搐、吞咽困难 | 确认后进入紧急模式 |
| 中(medium) | 不舒服、难受、没力气、头晕、恶心、肚子痛 | 关心询问+持续监测 |

## 4. 用户流程

### 4.1 首次使用
打开URL → 欢迎页(语音播报) → 设置称呼 → 添加紧急联系人(至少1位) → 进入主页

### 4.2 日常对话
打开应用 → 问候语 → 点击麦克风 → 语音识别 → AI处理 → 是否紧急? → 否:正常回复+TTS播报 / 是:进入紧急模式

### 4.3 紧急模式
检测到高风险 → 紧急确认弹窗("需要帮助吗?") → 拨打120 / 联系家人 / 我没事 → 事件记录+通知家属

### 4.4 提醒执行
定时触发 → 语音播报 → 等待确认 → 已确认:记录完成 / 15min未响应:再次提醒 / 30min未响应:标记未确认+通知家属

### 4.5 家属查看
打开应用 → 输入验证码 → 进入仪表盘 → 查看今日概览/对话摘要/提醒记录/紧急事件

## 5. 核心页面设计

### 5.1 主页/对话页
```
┌──────────────────────────┐
│  老人陪伴助手    ⚙设置   │
├──────────────────────────┤
│ [AI] 早上好，王爷爷！     │
│      今天天气不错呢       │
│                          │
│        王爷爷的消息 [用户]│
│        今天吃什么好呢    │
│                          │
│ [AI] 今天可以试试...     │
├──────────────────────────┤
│   [ 🎤 按住说话 ]        │
│   或者打字... [发送]      │
├──────────────────────────┤
│ 💬对话  ⏰提醒  👤我的   │
└──────────────────────────┘
                     [SOS]
```

### 5.2 紧急求助页
```
┌──────────────────────────┐
│  ⚠ 紧急求助              │
├──────────────────────────┤
│   您是否需要紧急帮助？    │
│                          │
│  ┌────────────────────┐  │
│  │  🔴 拨打 120       │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │  🟠 联系家人        │  │
│  └────────────────────┘  │
│  ┌────────────────────┐  │
│  │  🟢 我没事          │  │
│  └────────────────────┘  │
│                          │
│  急救提示:保持冷静...     │
└──────────────────────────┘
```

### 5.3 家属仪表盘
```
┌──────────────────────────┐
│  📊 家属后台   [退出]    │
├──────────────────────────┤
│  今日概览 — 王爷爷       │
│  对话8次 | 情绪😊        │
│  吃药3/4 | 无紧急事件    │
│                          │
│  最近对话摘要:           │
│  今天聊了天气和孙子...   │
│                          │
│  提醒执行:               │
│  ✅ 08:00 降压药         │
│  ✅ 12:00 降糖药         │
│  ❌ 14:00 喝水(未确认)   │
└──────────────────────────┘
```

## 6. 交互规范

### 6.1 适老化设计原则

| 原则 | 实现 |
|------|------|
| 大字体 | 正文≥20px, 标题≥24px, 按钮≥18px |
| 高对比度 | 文字与背景对比度≥7:1 (WCAG AAA) |
| 大按钮 | 可点击区域≥48x48px, 核心按钮≥64px |
| 简单布局 | 每页核心操作≤3个 |
| 语音优先 | 所有关键操作可语音完成 |
| 即时反馈 | 点击后200ms内有视觉反馈 |
| 容错设计 | 删除需二次确认 |

### 6.2 色彩规范

| 用途 | 色值 |
|------|------|
| 主色 | #1976D2 |
| 辅助色 | #4CAF50 |
| 警告色 | #FF9800 |
| 危险色 | #F44336 |
| 背景色 | #FAFAFA |
| 文字色 | #212121 |
| 次要文字 | #616161 |
| AI气泡 | #E3F2FD |
| 用户气泡 | #E8F5E9 |

### 6.3 动画规范
- 页面切换: 滑动300ms ease
- 弹窗: 从底部滑入250ms
- 按钮反馈: 缩放0.95→1.0, 100ms
- 语音脉冲: 800ms循环
- 加载: 三点跳动

## 7. 技术架构

### 7.1 架构图
```
┌─────────────────────────────────┐
│         客户端 (PWA)            │
│  React 18 + TS + TailwindCSS   │
│  Web Speech API (STT/TTS)      │
├─────────────────────────────────┤
│         服务端                   │
│  Node.js + Express              │
│  RESTful API + WebSocket        │
├─────────────────────────────────┤
│         数据层                   │
│  SQLite + 文件存储              │
├─────────────────────────────────┤
│         外部服务                 │
│  LLM API | 天气API | 短信服务   │
└─────────────────────────────────┘
```

### 7.2 技术栈

**前端**: React 18, TypeScript, Vite 5, TailwindCSS 3, React Router 6, Zustand, Axios, Lucide React, Web Speech API, PWA (Workbox)

**后端**: Node.js 20, Express 4, better-sqlite3, node-cron, ws, winston, Joi, helmet, OpenAI SDK

**部署**: Docker, Nginx, PM2

## 8. 数据模型

### 8.1 ER关系
```
Users 1──N Conversations
Users 1──N Messages
Users 1──N Reminders
Users 1──N EmergencyContacts
Users 1──N EmergencyEvents
Users 1──N ReminderLogs
Users 1──1 UserPreferences
Users 1──1 HealthProfile
```

### 8.2 数据表

#### users
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| nickname | TEXT | 称呼 |
| age | INTEGER | 年龄 |
| gender | TEXT | 性别 |
| address | TEXT | 地址 |
| family_code | TEXT UNIQUE | 家属验证码 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### conversations
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| user_id | TEXT FK | 用户ID |
| title | TEXT | 标题 |
| summary | TEXT | AI摘要 |
| mood | TEXT | 情绪 |
| message_count | INTEGER | 消息数 |
| started_at | DATETIME | 开始时间 |
| ended_at | DATETIME | 结束时间 |

#### messages
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| conversation_id | TEXT FK | 对话ID |
| user_id | TEXT FK | 用户ID |
| role | TEXT | user/assistant/system |
| content | TEXT | 内容 |
| created_at | DATETIME | 时间 |

#### reminders
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| user_id | TEXT FK | 用户ID |
| type | TEXT | medicine/water/checkup/custom |
| title | TEXT | 标题 |
| description | TEXT | 描述 |
| time | TEXT | 时间HH:mm |
| days | TEXT | 星期JSON |
| repeat | BOOLEAN | 是否重复 |
| enabled | BOOLEAN | 是否启用 |
| created_at | DATETIME | 创建时间 |

#### reminder_logs
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| reminder_id | TEXT FK | 提醒ID |
| user_id | TEXT FK | 用户ID |
| triggered_at | DATETIME | 触发时间 |
| confirmed | BOOLEAN | 是否确认 |
| confirmed_at | DATETIME | 确认时间 |

#### emergency_contacts
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| user_id | TEXT FK | 用户ID |
| name | TEXT | 姓名 |
| relationship | TEXT | 关系 |
| phone | TEXT | 电话 |
| priority | INTEGER | 优先级 |

#### emergency_events
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| user_id | TEXT FK | 用户ID |
| trigger_keyword | TEXT | 触发词 |
| user_description | TEXT | 用户描述 |
| risk_level | TEXT | critical/high/medium |
| action_taken | TEXT | 采取行动 |
| resolved | BOOLEAN | 是否解决 |
| created_at | DATETIME | 时间 |

#### user_preferences
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| user_id | TEXT UNIQUE FK | 用户ID |
| voice_speed | REAL | 语速0.8-1.2 |
| voice_volume | REAL | 音量0-1 |
| font_size | TEXT | large/xlarge/xxlarge |
| interests | TEXT | 兴趣JSON |

#### health_profiles
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT PK | UUID |
| user_id | TEXT UNIQUE FK | 用户ID |
| conditions | TEXT | 疾病JSON |
| medications | TEXT | 药物JSON |
| allergies | TEXT | 过敏信息 |

## 9. 接口设计

### 9.1 接口总览

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/users | 创建用户 |
| GET | /api/users/:id | 获取用户 |
| PUT | /api/users/:id | 更新用户 |
| PUT | /api/users/:id/preferences | 更新偏好 |
| PUT | /api/users/:id/health | 更新健康档案 |
| POST | /api/chat/send | 发送消息 |
| GET | /api/chat/conversations | 对话列表 |
| GET | /api/chat/conversations/:id/messages | 对话消息 |
| POST | /api/reminders | 创建提醒 |
| GET | /api/reminders | 提醒列表 |
| PUT | /api/reminders/:id | 更新提醒 |
| DELETE | /api/reminders/:id | 删除提醒 |
| POST | /api/reminders/:id/confirm | 确认提醒 |
| GET | /api/reminders/logs | 提醒记录 |
| POST | /api/emergency/contacts | 添加联系人 |
| GET | /api/emergency/contacts | 联系人列表 |
| PUT | /api/emergency/contacts/:id | 更新联系人 |
| DELETE | /api/emergency/contacts/:id | 删除联系人 |
| POST | /api/emergency/events | 记录事件 |
| GET | /api/emergency/events | 事件列表 |
| POST | /api/family/verify | 家属验证 |
| GET | /api/family/dashboard/:userId | 仪表盘 |
| GET | /api/family/summary/:userId | 对话摘要 |

### 9.2 核心接口示例

**POST /api/chat/send**
```json
// 请求
{ "userId": "uuid", "message": "今天天气怎么样", "conversationId": null }

// 响应
{
  "success": true,
  "data": {
    "reply": "今天天气不错呢，适合出去走走。记得加件外套哦。",
    "conversationId": "uuid",
    "mood": "neutral",
    "isEmergency": false,
    "emergencyLevel": null
  }
}
```

**POST /api/emergency/events**
```json
// 请求
{ "userId": "uuid", "triggerKeyword": "胸口痛", "riskLevel": "critical", "actionTaken": "call_120" }

// 响应
{
  "success": true,
  "data": {
    "eventId": "uuid",
    "guidance": ["请坐下休息", "含服速效救心丸", "等待120"],
    "emergencyContacts": [{"name": "王明", "phone": "138****1234"}]
  }
}
```

## 10. 安全与合规

### 10.1 数据安全
- HTTPS加密传输
- 手机号脱敏存储
- 90天以上对话详情自动清理，保留摘要

### 10.2 隐私合规
- 首次使用展示隐私协议
- 用户可导出/删除个人数据
- 语音数据仅用于识别，不永久存储
- 符合《个人信息保护法》

### 10.3 医疗免责
- 不做医疗诊断
- 紧急模式优先引导就医/拨打120
- 所有健康回答标注免责声明

### 10.4 内容安全
- AI回复过滤不当内容
- 紧急模式下限制话题范围

## 11. 运营指标

### 11.1 KPI

| 指标 | 定义 | 目标 |
|------|------|------|
| DAU | 日活跃用户 | 首月100+ |
| 日均对话轮次 | 每用户每天 | ≥5轮 |
| 提醒确认率 | 已确认/已触发 | ≥80% |
| 紧急响应率 | 成功触发率 | 100% |
| 语音识别成功率 | 成功/总次数 | ≥90% |
| 7日留存 | | ≥60% |

### 11.2 监控指标
- API响应 P95 < 2s
- 语音识别延迟 < 3s
- AI回复延迟 < 5s
- 服务可用性 ≥ 99.5%
- 错误率 < 1%

## 12. 版本规划

### v1.0 — MVP（当前版本）
- [x] 语音对话（STT + TTS + AI）
- [x] 紧急模式（检测+确认+拨号）
- [x] 智能提醒（吃药/喝水/复诊）
- [x] 用户画像管理
- [x] 紧急联系人
- [x] 家属后台
- [x] 适老化UI + PWA
- [x] Docker部署

### v1.1 — 增强版（规划中）
- [ ] 方言识别增强
- [ ] 情绪趋势分析报告
- [ ] 家属微信小程序通知
- [ ] 多用户管理

### v2.0 — 扩展版（远期）
- [ ] 智能硬件对接
- [ ] 视频通话集成
- [ ] 社区互动功能
- [ ] 专业健康咨询对接

---
文档编制完成。
