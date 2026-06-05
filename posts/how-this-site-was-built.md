---
title: "这个网站是怎么做出来的？—— 从零搭建全栈博客的完整指南"
date: "2026-06-05"
excerpt: "详解本网站的技术架构：Next.js 16 App Router、亮暗主题切换、开屏动画、JWT 认证系统、Prisma + SQLite 数据库、Markdown 博客引擎。附带所有需要的前置知识。"
---

## 先看一眼整体架构

这个网站不是静态页面，而是一个 **全栈 Web 应用**，具备：

- 🎨 亮色 / 暗色自由切换
- 🎬 开屏动画（Splash Screen）
- 👤 邮箱注册 + 密码登录（数据库存储，bcrypt 加密）
- 📝 Markdown 博客系统（直接往 `posts/` 文件夹扔 `.md` 文件就能发文章）
- 🛡️ 受保护的管理后台（未登录自动拦截）
- 📊 首页统计柱 + 项目卡片 + 文章列表

一张图看数据流：

```
浏览器 → Next.js Server → Prisma → SQLite
                ↓
           JWT Cookie ← 登录/注册
                ↓
         proxy.ts 拦截 /admin → 未登录跳转 /login
```

---

## 你需要哪些前置知识

按重要性排序：

### 必会

| 知识 | 用在哪里 | 推荐学习资源 |
|---|---|---|
| **TypeScript** | 全部代码，类型安全 | [TypeScript 官方 Handbook](https://www.typescriptlang.org/docs/handbook/) |
| **React 19** | 组件、Hooks、Server Components | [React 官方文档](https://react.dev/) |
| **Next.js App Router** | 路由、布局、Server Actions | [Next.js 官方教程](https://nextjs.org/docs) |
| **Tailwind CSS** | 全部样式 | [Tailwind CSS 文档](https://tailwindcss.com/docs) |
| **Node.js 基础** | 理解服务端运行环境 | Node.js 官方文档 |

### 进阶

| 知识 | 用在哪里 |
|---|---|
| **JWT (JSON Web Token)** | 登录后签发 token，存 httpOnly cookie |
| **bcrypt** | 密码哈希，不存明文 |
| **Zod** | 表单校验（注册/登录） |
| **Prisma ORM** | 数据库操作，类型安全的查询 |
| **SQLite** | 本地数据库，零配置 |
| **framer-motion** | 开屏动画，页面过渡效果 |
| **gray-matter** | 解析 Markdown 文件的 frontmatter |
| **react-markdown** | 渲染 Markdown 为 HTML |
| **CSS 自定义属性** | 亮色/暗色主题切换 |

---

## 核心模块详解

### 1. 亮暗主题系统

**原理**：CSS 自定义属性 + Tailwind `dark` class 切换。

```css
/* globals.css */
:root {
  --color-bg: #fafafa;        /* 亮色背景 */
  --color-fg: #1a1a2e;        /* 亮色文字 */
}
.dark {
  --color-bg: #0a0a0f;        /* 暗色背景 */
  --color-fg: #e4e4e7;        /* 暗色文字 */
}
```

`ThemeProvider` 组件做的事：
1. 读取 `localStorage` 获取用户偏好
2. 给 `<html>` 元素添加/移除 `dark` class
3. 所有组件直接用 `var(--color-bg)` 引用颜色，自动跟随主题

**关键技巧**：在 `<head>` 里注入一小段同步脚本，阻止页面闪烁：

```html
<script>
  (function() {
    var t = localStorage.getItem('theme');
    if (t === 'light') {
      document.documentElement.classList.remove('dark');
    }
  })();
</script>
```

### 2. 开屏动画 (Splash Screen)

**依赖**：`framer-motion`

**流程**：

```
页面加载 → 显示全屏黑色遮罩
       → 0.5s: Logo 弹入（spring 动画）
       → 0-2.8s: "INITIALIZING SYSTEM..." 逐字打出
       → 2.8s: 显示 "Enter Lab" 按钮
       → 点击: 整屏向上滑出（y: '-100%'）
       → 1s 后卸载组件
```

**防重复**：`sessionStorage.setItem('splash-shown', '1')`，同一标签页只播一次。

```tsx
// 核心退出动画
<motion.div
  exit={{ y: "-100%" }}
  transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
>
```

### 3. 认证系统（注册 + 登录）

**完整流程**：

```
注册页 → 用户填写 name/email/password
      → Zod 校验（邮箱格式、密码强度）
      → bcrypt.hash(password, 12) 哈希密码
      → Prisma 写入 SQLite 数据库
      → jose 签发 JWT → 写入 httpOnly cookie
      → redirect('/') 跳转首页

登录页 → 用户填写 email/password
      → Prisma 查数据库找用户
      → bcrypt.compare(password, hash) 验证
      → 签发 JWT → 写入 cookie
      → redirect('/')
```

**为什么不用 next-auth？** next-auth v5 beta 对 credentials 支持有限，且自定义数据库适配器配置复杂。自己用 jose + bcrypt 实现更轻量、更可控。

**安全问题**：
- 密码用 bcrypt 12 轮哈希，永不明文存储
- JWT 存 httpOnly cookie（JS 无法读取，防 XSS）
- `sameSite: 'lax'` 防 CSRF
- `proxy.ts` 拦截 `/admin` 路由，未登录直接 302

### 4. Markdown 博客系统

**如何发文章**——在 `posts/` 文件夹创建一个 `.md` 文件：

```markdown
---
title: "你的文章标题"
date: "2026-06-05"
excerpt: "一段简短的摘要，会显示在文章列表里。"
---

## 正文从这里开始

支持 **加粗**、*斜体*、`行内代码`、代码块、引用、列表等。

> 这是一段引用。

​```ts
// 代码块自动高亮
console.log("hello");
​```
```

**渲染流程**：

```
posts/*.md → fs.readFileSync 读取文件
          → gray-matter 解析 frontmatter（title, date, excerpt）
          → react-markdown + remarkGfm 渲染 Markdown → HTML
          → Prose 样式排版
```

### 5. 数据库设计

仅一张 `User` 表：

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  name         String
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

用的是 SQLite（文件数据库），无需安装任何数据库服务。数据库文件就是 `dev.db`。

**切换为 PostgreSQL（生产环境）**：修改 `prisma/schema.prisma` 的 datasource provider，然后改 `DATABASE_URL` 即可。

### 6. 路由保护

`proxy.ts` 是 Next.js 16 的中间件机制：

```ts
// 保护 /admin 路由
if (isProtected && !session?.userId) {
  return NextResponse.redirect(new URL("/login", req.nextUrl));
}
// 已登录用户访问 /login → 跳回首页
if (isAuthRoute && session?.userId) {
  return NextResponse.redirect(new URL("/", req.nextUrl));
}
```

---

## 项目文件结构

```
my_web/
├── posts/                  # 📝 博客文章（放 .md 文件）
│   ├── hello-world.md
│   ├── notion-style-design-notes.md
│   └── how-this-site-was-built.md   ← 你正在读的这篇
├── prisma/
│   ├── schema.prisma       # 数据库模型
│   └── migrations/         # 数据库迁移记录
├── src/
│   ├── app/
│   │   ├── layout.tsx      # 根布局（主题、语言 Provider）
│   │   ├── page.tsx        # 首页
│   │   ├── globals.css     # 全局样式 + CSS 变量
│   │   ├── actions/
│   │   │   └── auth.ts     # 注册/登录/登出 Server Actions
│   │   ├── admin/          # 🛡️ 受保护的管理后台
│   │   ├── login/          # 登录页
│   │   ├── register/       # 注册页
│   │   ├── posts/          # 博客列表 + [slug] 详情
│   │   ├── projects/       # 项目展示页
│   │   └── api/
│   │       └── session/    # 获取当前会话的 API
│   ├── components/
│   │   ├── splash-screen.tsx   # 🎬 开屏动画
│   │   ├── theme-provider.tsx  # 主题状态管理
│   │   ├── theme-toggle.tsx    # 亮暗切换按钮
│   │   ├── header.tsx         # 导航栏
│   │   ├── footer.tsx         # 页脚
│   │   ├── hero-section.tsx   # 首页 Hero + 统计柱
│   │   ├── project-card.tsx   # 项目卡片
│   │   ├── article-list-item.tsx  # 文章条目
│   │   ├── mdx-content.tsx    # Markdown 渲染器
│   │   └── ...
│   └── lib/
│       ├── db.ts            # Prisma 客户端
│       ├── session.ts       # JWT 签发/验证/删除
│       ├── validations.ts   # Zod 校验规则
│       ├── posts.ts         # 读取 posts/*.md
│       ├── projects.ts      # 项目数据
│       └── i18n.ts          # 中英文翻译
├── proxy.ts                 # 路由拦截（保护 /admin）
├── prisma.config.ts         # Prisma 配置
└── package.json
```

---

## 本地运行

```bash
# 1. 安装依赖
npm install

# 2. 初始化数据库（首次运行）
npx prisma migrate dev --name init

# 3. 生成 Prisma 客户端
npx prisma generate

# 4. 启动开发服务器
npm run dev

# 5. 浏览器打开
open http://localhost:3000
```

## 部署到 Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel

# 注意：SQLite 在 Vercel Serverless 上不可用
# 需要切换为 Vercel Postgres 或 PlanetScale
# 只需修改 prisma/schema.prisma 的 datasource
```

## 如何自定义

| 想改什么 | 改哪个文件 |
|---|---|
| 网站名字 | `src/app/layout.tsx` → `metadata.title` |
| 首页标题/副标题 | `src/lib/i18n.ts` → `heroTitle` / `heroSubtitle` |
| 项目数据 | `src/lib/projects.ts` → `projects` 数组 |
| 主题颜色 | `src/app/globals.css` → `:root` 和 `.dark` 里的 `--color-*` |
| 导航栏链接 | `src/components/header.tsx` |
| 开屏动画文字 | `src/components/splash-screen.tsx` → `fullText` 和按钮文字 |
| 页脚 ICP 号 | `src/components/footer.tsx` |
| GitHub/Email 链接 | `src/components/header.tsx` |
| 新增文章 | 在 `posts/` 文件夹新建 `.md` 文件 |

---

## 总结

这个网站的核心思路是 **尽量简单、可控**：

- 不用 CMS（直接写 Markdown）
- 不用第三方 Auth 服务（自己实现 JWT）
- 不用外部数据库（SQLite 本地文件）
- 不用组件库（手写 Tailwind）

这样做的代价是需要自己处理认证安全、数据库迁移等问题，但换来的是完全的掌控和零外部依赖。适合个人项目和小型团队。

如果你想把某个模块替换成更成熟的方案（比如换成 NextAuth.js + PostgreSQL + Contentlayer），每个模块都是独立的，可以逐个替换而不影响其他部分。
