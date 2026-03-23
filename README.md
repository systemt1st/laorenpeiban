# 老人陪伴助手

面向 60 岁以上老年人的智能陪伴 Web 应用，以语音交互为主要方式，提供日常陪伴对话、生活提醒、应急求助引导三大核心能力。

## 核心功能

- **语音对话** - 语音识别 + AI 陪伴对话 + 语音播报，支持连续多轮交流
- **紧急模式** - 高风险语义检测，自动进入紧急求助流程，一键拨打 120 / 联系家人
- **智能提醒** - 吃药、喝水、复诊等定时提醒，语音播报通知
- **家属后台** - 对话摘要、提醒执行记录、应急事件追溯
- **适老化设计** - 超大字体、高对比度、大按钮、语音优先

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite + TailwindCSS + PWA |
| 后端 | Node.js + Express + SQLite (better-sqlite3) |
| 语音 | Web Speech API (STT + TTS) |
| AI | OpenAI 兼容 API / 内置回复引擎 |
| 部署 | Docker + Nginx |

## 快速开始

### 环境要求

- Node.js 20+
- npm 9+

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/systemt1st/laorenpeiban.git
cd laorenpeiban

# 首次启动会自动安装依赖，并在缺少配置时创建 server/.env
./start.sh

# 停止服务
./stop.sh

# 重启服务
./restart.sh
```

前端访问 http://localhost:5173，后端 API 在 http://localhost:8004。

### Docker 部署

```bash
# 构建并启动
docker-compose up -d

# 访问
http://your-server-ip
```

## 项目结构

```
├── docs/               # 产品文档
│   └── PRD.md          # 产品需求文档
├── client/             # 前端 (React + TypeScript)
│   ├── src/
│   │   ├── components/ # 通用组件 (Layout, NavBar, SOSButton, VoiceButton)
│   │   ├── pages/      # 页面 (Chat, Reminders, Profile, Emergency, Setup, Family)
│   │   ├── hooks/      # 自定义 Hooks (语音识别, 语音合成, 对话管理)
│   │   ├── stores/     # Zustand 状态管理
│   │   ├── services/   # API 服务层
│   │   ├── utils/      # 工具函数
│   │   └── types/      # TypeScript 类型定义
│   └── public/         # 静态资源 + PWA
├── server/             # 后端 (Node.js + Express)
│   └── src/
│       ├── routes/     # API 路由 (users, chat, reminders, emergency, family)
│       ├── services/   # 业务服务 (AI 对话, 紧急检测)
│       ├── models/     # 数据库模型
│       ├── middleware/  # 中间件 (认证, 错误处理)
│       └── utils/      # 工具 (日志, 验证)
├── docker-compose.yml  # Docker 编排
├── Dockerfile          # Docker 镜像
└── nginx.conf          # Nginx 配置
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| PORT | 服务端口 | 3001 |
| AI_API_KEY | AI API 密钥 | - |
| AI_API_BASE_URL | AI API 地址 | https://api.openai.com/v1 |
| AI_MODEL | AI 模型 | gpt-3.5-turbo |
| DB_PATH | 数据库路径 | ./data/companion.db |

## 许可证

MIT
