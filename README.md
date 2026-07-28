# ~/chy — 个人技术实验室

## 这是什么

全栈个人博客 & 项目展示平台。注册登录、写 Markdown 文章、展示项目、AI 问答——全部在一个 Next.js 应用里跑。

## 已完成 ✅

### 核心功能
- 🎨 暗色/亮色主题，刷新不丢失
- 🎬 赛博朋克开屏动画
- 📝 在线 Markdown 编辑器（后台实时预览）
- 👤 邮箱注册 + JWT 登录
- 🛡️ 管理后台（路由保护 + 权限校验）
- 🌐 中/英文切换
- 📊 首页动态统计

### AI 对话（RAG）
- 🤖 **右下角浮动 AI 聊天**——点 🐶 按钮打开
- 🔍 **中文二元组分词检索**——12 篇文章 + 5 个项目作为知识库
- 🧠 **DeepSeek / 硅基流动 / Groq / Gemini 多模型**——聊天窗口顶部下拉切换
- 🔐 **AI 独立权限**——`canUseAI` 字段控制谁能用
- ⏱️ **每日 20 次限制**——`AICallLog` 表追踪
- 🚫 **未登录 401 / 无权限 403 / 超次数 429**——全部后端校验

### 数据库
- 🗄️ **Turso 云数据库**（libSQL）——Vercel Serverless 兼容
- 📦 **本地 SQLite**——开发环境自动回退
- 🔄 **一键迁移脚本**——`scripts/migrate-to-turso.ts`

### 基础设施
- ✅ TypeScript 全栈类型安全
- ✅ Turbopack 构建（Next.js 16）
- ✅ Vercel 部署
- ✅ `/api/debug` 诊断接口

## 技术栈

| 层 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router + Turbopack) |
| 样式 | Tailwind CSS 4 + CSS 自定义属性 |
| 动画 | framer-motion |
| 数据库 | Turso (libSQL) + SQLite，Prisma 7 ORM |
| 认证 | JWT (jose) + bcryptjs |
| AI | DeepSeek / 硅基流动 / Groq / Gemini — 多模型切换 |
| RAG | 中文 bigram 分词 + 关键词评分匹配 |
| 校验 | Zod |
| 博客 | react-markdown + remark-gfm |
| 图标 | lucide-react |
| 部署 | Vercel |

## 本地运行

```bash
npm install
npx prisma generate
npm run dev
```

打开 http://localhost:3000，注册账号即可使用。

## 环境变量

`.env` 文件需配置：

```env
# 数据库（Turso 生产，SQLite 本地）
TURSO_DATABASE_URL="libsql://xxx.turso.io"
TURSO_AUTH_TOKEN="your-token"
DATABASE_URL="file:./dev.db"

# JWT
SESSION_SECRET="随机32位字符串"

# AI（改 AI_PROVIDER 切换模型）
AI_PROVIDER=deepseek
DEEPSEEK_API_KEY="sk-xxx"
SILICONFLOW_API_KEY="sk-xxx"    # 可选
GROQ_API_KEY="gsk_xxx"          # 可选
GEMINI_API_KEY="xxx"            # 可选
```

## 项目结构

```
src/
├── app/
│   ├── actions/          # Server Actions（auth/posts/projects/github）
│   ├── admin/            # 管理后台
│   ├── api/
│   │   ├── chat/         # AI 聊天 + 模型列表
│   │   ├── debug/        # 诊断接口
│   │   ├── logout/       # 登出
│   │   └── session/      # 会话检查
│   ├── login/            # 登录页
│   ├── register/         # 注册页
│   ├── posts/            # 博客列表 & 详情
│   └── projects/         # 项目展示
├── components/
│   ├── chat-widget.tsx   # 右下角 AI 聊天窗口
│   ├── mdx-content.tsx   # Markdown 渲染
│   ├── admin-dashboard.tsx
│   └── ...
├── lib/
│   ├── ai.ts             # 多模型适配（DeepSeek/硅基/Groq/Gemini）
│   ├── ai-permission.ts  # AI 权限 + 次数限制
│   ├── search.ts         # RAG 中文 bigram 搜索
│   ├── db.ts             # Prisma 懒加载客户端
│   ├── session.ts        # JWT 签发/校验
│   ├── posts.ts          # 文章查询
│   ├── projects.ts       # 项目查询
│   ├── github.ts         # GitHub API
│   ├── i18n.ts           # 中英文翻译
│   └── validations.ts    # Zod 校验
├── generated/prisma/     # Prisma 生成的类型安全客户端
prisma/
├── schema.prisma         # 数据模型（User/Post/Project/AICallLog）
└── migrations/           # 数据库迁移历史
scripts/
└── migrate-to-turso.ts   # 本地 → Turso 数据迁移
proxy.ts                  # 路由中间件（权限保护）
```

## License

MIT
