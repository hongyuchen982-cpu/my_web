# ~/chy — 个人技术博客与项目展示

`my_web` 是一个面向技术交流与作品展示的个人网站。它将已发布的技术文章和经过站长筛选的项目资料聚合到同一个 Next.js 应用中。

> 当前版本包含项目后台、RAG 问答、多云端聊天模型、引用检查、反馈评测和后台知识库任务。公网部署以 [DEPLOYMENT.md](DEPLOYMENT.md) 为准；本地构建通过不代表云端账号和模型已联调。

## 2026-09 上线准备

- 聊天模型：Ollama、OpenRouter 免费目录、硅基流动与 HTTPS 兼容接口；聊天和 Embedding 分别配置。
- `/api/rag/models` 提供服务端允许的模型列表；客户端不能指定任意付费模型或上游地址。
- 后台同步、切片、向量化进入持久化任务表；运行 `npm run jobs:work` 启动唯一 Worker。
- 数据库限流、登录尝试限制、签名反馈凭证；`/api/health` 检查数据库。
- `/projects` 新增五个注明原作者的开源学习参考，与个人作品分开。
- `npm test`、`npm run lint`、`npm run build` 是本地检查；`npm run deploy:check` 检查生产配置与当前模型索引。
- Docker Compose、Nginx、数据库迁移、备份恢复及生产配置模板参见部署文档。

## 当前功能

- 首页展示个人介绍、项目总数、已发布文章总数和技术标签数量
- 博客列表支持分类筛选，以及按标题和摘要搜索
- Markdown 文章详情支持 GFM 表格、列表、引用、代码块和图片
- 自动估算中英文混合内容的阅读时间
- 公开页面只展示管理员确认过的精选项目
- 后台支持新增、编辑、删除，以及从原创 GitHub 仓库一键加入
- GitHub 候选仓库自动排除 Fork 和归档仓库，并按标准化地址去重
- 项目卡片可进入独立详情页，自动展示仓库 README、GitHub、在线演示和文档入口
- 深色/亮色主题和部分中英文界面，选择保存在浏览器本地
- 响应式桌面与移动端导航

## 页面

| 路由 | 说明 |
| --- | --- |
| `/` | 首页、项目概览、最新 5 篇文章 |
| `/posts` | 全部已发布文章、分类和搜索 |
| `/posts/[slug]` | Markdown 文章详情 |
| `/projects` | 精选项目 |
| `/projects/[id]` | 项目介绍、README 与相关入口 |
| `/admin/login` | 项目管理登录 |
| `/admin/projects` | 精选项目管理 |

## 技术栈

| 层 | 技术 |
| --- | --- |
| 框架 | Next.js 16 App Router、React 19、TypeScript |
| 样式 | Tailwind CSS 4、CSS 自定义属性 |
| 数据库 | Prisma 7、SQLite / Turso libSQL |
| 内容 | react-markdown、remark-gfm |
| 图标 | lucide-react |
| 部署 | Vercel |

## 数据流

```text
GitHub REST API ──→ 原创仓库候选 ──→ 管理员选择
                                          │
SQLite / Turso ←── Prisma ←── 精选项目 ────┘
       │
       └──→ Next.js Server Components ──→ 公开页面
```

运行时文章来自数据库。`posts/` 中的 Markdown 文件是历史内容和导入源，不会被页面直接读取。

## 本地运行

```bash
npm install
npx prisma generate
npm run dev
```

打开 <http://localhost:3000>。

提交前建议执行：

```bash
npm run lint
npm run build
```

## 环境变量

复制 `.env.example` 为 `.env.local`，再填写本地值。不要提交真实密钥。

```env
# 本地开发固定优先使用，避免开发时绕到远程数据库
DATABASE_URL="file:./dev.db"

# 生产环境优先使用 Turso
TURSO_DATABASE_URL="libsql://your-database.turso.io"
TURSO_AUTH_TOKEN="your-token"

# 要展示的 GitHub 用户，未配置时使用项目内默认值
GITHUB_USERNAME="hongyuchen982-cpu"

# 可选；公开仓库无需 Token，但配置后可提高 GitHub API 限额
GITHUB_TOKEN="your-read-only-token"

# 允许作为作品展示的 Fork 完整仓库名，多个值使用逗号分隔
GITHUB_INCLUDED_FORKS="hongyuchen982-cpu/workflowWithComfyUI"

# /admin/projects 的管理密码
ADMIN_PASSWORD="your-private-password"

# 至少 32 位的随机字符串，用于签署 HttpOnly 登录 Cookie
ADMIN_SESSION_SECRET="replace-with-a-long-random-secret"

# OpenAI 兼容的向量模型；API Key 留空时只生成免费文本切片
AI_PROVIDER="ollama"
OLLAMA_BASE_URL="http://127.0.0.1:11434"
OLLAMA_CHAT_MODEL="qwen2.5:3b"
OLLAMA_EMBEDDING_MODEL="qwen3-embedding:0.6b"

# 切换到 openai-compatible 后再填写以下三项
EMBEDDING_API_KEY=""
EMBEDDING_BASE_URL="https://api.openai.com/v1"
EMBEDDING_MODEL="text-embedding-3-small"
```

所有变量都只在服务端读取，不需要也不应该使用 `NEXT_PUBLIC_` 前缀。

## 数据模型

- `User`：保留作者资料和文章/项目归属关系
- `Post`：文章 slug、标题、摘要、Markdown 正文、分类、发布状态和作者
- `Project`：项目描述、状态、链接、技术标签和排序

数据库查询失败时，公开页面会降级为空列表，避免整个网站崩溃。

## 项目管理

访问 `/admin/projects`，使用 `ADMIN_PASSWORD` 登录。后台可以从 GitHub 原创公开仓库和明确允许的精选 Fork 加入项目，也可以手动新增、编辑和删除。删除操作只移除网站数据库记录，不会删除 GitHub 仓库。

管理密码和会话密钥必须同时配置在本地 `.env.local` 与 Vercel 环境变量中。它们只在服务端使用，不要提交进 Git。

## GitHub 知识库同步

项目管理后台可以将带 GitHub 地址的精选项目加入知识库。同步流程读取默认分支和最新 Commit，下载一次仓库归档，只保存通过安全白名单的文本、文档与源码。环境变量、构建目录、依赖目录、锁文件、数据库备份、二进制文件和代理指令文件会被排除。

本地数据库使用 Prisma migration。已有 Turso 数据库首次升级时执行：

```bash
node --env-file=.env scripts/apply-knowledge-schema.mjs
```

同步结果会记录仓库、分支、Commit、文件数量、总大小、时间和失败原因。同一 Commit 再次检查不会重复下载；强制重建失败时会保留上一版文件。

同步后可先免费“生成切片”，确认分块数量；配置 embedding 环境变量后再“生成向量”。切片由 LangChain 按 Markdown/代码结构处理，向量保存在现有数据库，当前小型作品集使用精确余弦相似度检索。

本地模式使用 Ollama：`qwen2.5:3b` 负责结构化引用回答，`qwen3-embedding:0.6b` 负责代码检索和引用一致性比较。Ollama 必须保持运行；云端请分别配置 `CHAT_PROVIDER` 与 `EMBEDDING_PROVIDER`。持久化 Worker 推荐使用本文的 Linux/Docker 部署，不直接套用 Vercel Serverless。

也可以在命令行验证：`npm run rag:sync -- owner/repository` 同步仓库；`npm run rag:index -- owner/repository` 只生成切片，追加 `--embeddings` 才会调用向量模型。

本地问答测试：`npm run rag:ask -- "这个网站如何同步 GitHub 仓库？"`。它会通过 LangGraph 先检索，再调用本地 Qwen 回答，最后打印可点击的 GitHub 源码引用。

网页右下角提供同一套 RAG 问答入口。默认 `RAG_MIN_SCORE=0.45`；最高余弦相似度低于阈值时直接回答“不知道”，不会让聊天模型自由补充事实。非拒答回答必须包含有效的 `[1]` 来源编号，否则同样安全拒答。

运行 `npm run rag:evaluate` 可执行固定的已知问题/未知问题评测集。后台 `/admin/rag` 展示问答分数、拒答记录和用户赞踩；这些指标用于发现失败案例，不能证明模型答案绝对正确。

追加 `-- --full` 会同时运行答案生成和逐段引用一致性检查。模型先返回“结论文本 + 引用编号数组”的结构化结果，服务端再把每条结论与其引用切片做语义相似度验证；低于 `RAG_CITATION_MIN_SCORE` 的答案在一次自动重写后仍不通过则安全拒答。

## 目录结构

```text
src/
├── app/                  # App Router 页面与全局样式
├── components/           # 展示和交互组件
├── generated/prisma/     # Prisma 生成客户端
└── lib/                  # 数据访问、GitHub、国际化和工具函数
prisma/
├── schema.prisma         # 当前数据模型
└── migrations/           # SQLite 迁移历史
posts/                    # Markdown 导入源与历史内容
scripts/                  # 数据导入、更新和迁移脚本
```

## 下一阶段方向

接入公网可用的云端聊天与向量模型，将本地评测集加入发布检查，并增加 GitHub Webhook、线上持久化限流与模型不可用时的降级提示。

## License

MIT
