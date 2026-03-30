# 老人陪伴助手

老人陪伴助手是一个面向 60 岁以上老年人的智能陪伴 Web 应用，
以语音交互为主，围绕闲聊陪伴、生活提醒、紧急预警和家属协同
构建完整闭环。

当前仓库对应的是 `v1` 可运行基线：前端采用 `React + TypeScript`，
后端采用 `Node.js + Express`，数据层基于 `SQLite`。在此基础上，
项目正在向内部下一代架构 `GoldenAge Guardian（金色年华守护者）`
演进，目标是从“被动对话”升级为“主动感知”的养老守护系统。

## 项目定位

- 面向独居或白天独居老人，降低孤独感与突发风险处置门槛
- 通过语音优先的交互方式，提升老人对数字产品的可用性
- 通过提醒、风险识别和家属侧追踪能力，形成照护闭环

## 当前实现与目标态

### 当前实现（v1 基线）

- 语音对话：支持 STT、AI 回复和 TTS 播报
- 智能提醒：支持吃药、喝水、复诊等提醒能力
- 紧急模式：支持高风险关键词检测、SOS 页面和紧急联系人流程
- 家属后台：支持查看摘要、提醒记录和应急事件
- 轻量部署：支持本地启动与 Docker 部署

### 目标态（GoldenAge Guardian）

- 主动感知：从被动回复升级为持续风险感知与上下文回溯
- 多智能体协同：引入 Supervisor + 核心业务 Agent 的任务分发模型
- 分层记忆：构建热记忆、长程记忆、事实库和本地灾备
- 医学 RAG：通过受控知识库约束健康类回答与预警逻辑
- 工程化增强：补足可观测性、安全沙箱与异步通知闭环

## 核心能力

- **闲聊陪伴**：通过温和、自然的语音对话缓解孤独感
- **健康关注**：围绕身体不适表达与风险信号进行非诊断式关注与提示
- **紧急预警**：对高风险表达进行分级响应，必要时触发求助流程
- **生活助记**：围绕吃药、喝水、复诊等场景建立提醒闭环
- **家属协同**：让家属查看摘要、提醒执行情况与异常事件记录

## 系统概览

### v1 当前架构

- 前端：`React 18`、`TypeScript`、`Vite`、`TailwindCSS`、`PWA`
- 后端：`Node.js`、`Express`
- 数据：`SQLite (better-sqlite3)`
- 语音：`Web Speech API`
- AI：`OpenAI 兼容 API / 内置回复引擎`
- 部署：`Docker + Nginx`

### v2 目标架构

- 感知层：语音输入、文字输入，以及可扩展的多终端接入能力
- 编排层：基于 `Spring AI Advisor` 链或类 `LangGraph` 状态机，由 Supervisor 统一分发到陪伴智能体、健康哨兵、生活助手
- 执行层：医学 RAG 检索、提醒调度、通知联络、天气查询等工具适配与安全沙箱
- 数据层：`Redis + PostgreSQL/pgvector + 结构化事实库 + 本地灾备`

## 文档导航

- [产品需求文档](docs/PRD.md)
- [GoldenAge Guardian 架构设计](docs/architecture/goldenage-guardian.md)

建议阅读顺序：

1. 先看 `README` 了解项目现状与目标态
2. 再看 `docs/PRD.md` 了解业务场景、能力边界与路线图
3. 最后看 `docs/architecture/goldenage-guardian.md` 理解下一代系统设计

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

前端访问 `http://localhost:5173`，后端 API 在 `http://localhost:8004`。

### Docker 部署

```bash
docker-compose up -d
```

访问：

```text
http://your-server-ip
```

## 项目结构

```text
├── docs/
│   ├── PRD.md
│   └── architecture/
│       └── goldenage-guardian.md
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── types/
│   │   └── utils/
│   └── public/
├── server/
│   └── src/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── services/
│       └── utils/
├── docker-compose.yml
├── Dockerfile
└── nginx.conf
```

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| PORT | 服务端口 | 3001 |
| AI_API_KEY | AI API 密钥 | - |
| AI_API_BASE_URL | AI API 地址 | https://api.openai.com/v1 |
| AI_MODEL | AI 模型 | Qwen/Qwen3.5-4B |
| DB_PATH | 数据库路径 | ./data/companion.db |

## Roadmap

- Phase 1：迁移到 `PostgreSQL + Redis`，建立分层记忆与持久化基座
- Phase 2：引入工具调用，落地提醒、预警、通知等闭环动作
- Phase 3：引入 Supervisor 模式，完成多 Agent 分流与协同编排
- Phase 4：补齐 `Kryo + 本地文件灾备` 与极端环境鲁棒性能力

## 许可证

MIT
