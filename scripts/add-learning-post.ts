// Add the complete learning roadmap as a published post.
// Run with: npx tsx scripts/add-learning-post.ts

import { prisma } from "../src/lib/db";

const SLUG = "how-to-understand-this-codebase";
const TITLE = "从零看懂这个全栈博客 — 完整学习路线";
const EXCERPT =
  "按知识域分层的 learning roadmap：TypeScript → React 19 → Next.js 16 → Tailwind CSS 4 → Prisma + SQLite → JWT 认证 → framer-motion 动效。附带按文件逐个阅读的顺序指南。";

const CONTENT = `## 技术栈全景图

\`\`\`
┌──────────────────────────────────────────┐
│           前端 (Frontend)                 │
│  React 19 + Next.js 16 App Router        │
│  TypeScript + Tailwind CSS 4             │
│  framer-motion + lucide-react            │
├──────────────────────────────────────────┤
│           状态 & 缓存                      │
│  React Context (Theme / Lang / Auth)     │
│  RSC Cache + revalidatePath              │
│  Server Actions + useActionState         │
├──────────────────────────────────────────┤
│           认证 (Auth)                     │
│  JWT (jose) + bcryptjs + HttpOnly Cookie │
├──────────────────────────────────────────┤
│           数据层                           │
│  Prisma ORM + libsql / SQLite            │
│  Zod 校验 + react-markdown (GFM)         │
├──────────────────────────────────────────┤
│           外部 API                        │
│  GitHub REST API (ISR 缓存)              │
└──────────────────────────────────────────┘
\`\`\`

---

## 一、大方向：按知识域分层学习

### 第 1 层：TypeScript 基础

| 知识点 | 用在网站哪里 |
|---|---|
| 类型注解 \`string / number / boolean\` | 所有 \`.ts\` / \`.tsx\` 文件 |
| 接口 \`interface\` | \`Post\`、\`Project\`、\`SessionPayload\`、\`AuthResult\` |
| 泛型 \`Promise<T>\`、\`useState<T>\` | 异步函数返回类型、React hooks |
| 联合类型 \`"zh" | "en"\` | i18n 语言切换 |
| \`z.infer<typeof schema>\` | 从 Zod schema 推导 TS 类型 |
| \`import type\` | 类型只导入，编译时擦除 |

### 第 2 层：React 19 核心概念

| 知识点 | 用在网站哪里 |
|---|---|
| **Server Components**（默认） | \`page.tsx\`、\`layout.tsx\` — 可直接 \`await\` 数据库查询 |
| **Client Components**（\`"use client"\`） | \`header.tsx\`、所有有 \`onClick\` / \`useState\` 的文件 |
| \`useState\` / \`useEffect\` | Theme / Language / Auth Provider 的挂载和状态 |
| \`useCallback\` | \`toggleTheme\`、\`refresh\` — 避免不必要渲染 |
| \`createContext\` + \`useContext\` | 3 个 Context：Theme、Language、Auth |
| \`useActionState\` | 登录/注册表单 — 管理 Server Action 的 pending / state |
| **组合模式**（Server → Client props） | \`admin/page.tsx\` 查询数据 → 传给 \`AdminDashboard\` |

> **关键理解**：服务端组件不能有 \`onClick\`、\`useState\`、\`useEffect\`。本网站的模式：**Server Component 负责数据获取 → Client Component 负责交互**。

### 第 3 层：Next.js 16 App Router

| 知识点 | 用在网站哪里 |
|---|---|
| **文件路由** | \`app/page.tsx\` → \`/\`、\`app/admin/posts/page.tsx\` → \`/admin/posts\` |
| **动态路由** \`[slug]\`、\`[id]\` | \`posts/[slug]/page.tsx\`、\`admin/posts/[id]/edit/\` |
| **Layout 持久化** | \`layout.tsx\` 在页面切换时不卸载 |
| \`redirect()\` | 登录成功后跳转首页、鉴权失败跳转登录页 |
| \`cookies()\` | \`session.ts\` — 读写 HttpOnly cookie |
| \`revalidatePath()\` | 文章/项目修改后刷新缓存 |
| \`router.refresh()\` | 客户端强制刷新 RSC 缓存（登出时使用） |
| **Route Handler** | \`api/session/route.ts\` (GET)、\`api/logout/route.ts\` (POST) |
| **ISR**（\`next.revalidate\`） | \`github.ts\` — GitHub API 缓存 10 分钟 |

> \`redirect()\` 从 Server Action 调用 → MPA 式硬导航，Layout 重新挂载。\`<Link>\` 导航 → SPA 式软导航，Layout 不重新挂载。这就是为什么需要 \`AuthProvider\` Context 而不是依赖 Layout 重新查询。

### 第 4 层：Tailwind CSS 4 + 设计系统

| 知识点 | 用在网站哪里 |
|---|---|
| \`@theme inline\`（CSS-first 配置） | \`globals.css\` — 注册 CSS 变量到 Tailwind |
| CSS 自定义属性 \`var(--color-bg)\` | 所有组件颜色（亮/暗模式切换的基础） |
| \`@custom-variant dark\` | \`&:where(.dark, .dark *)\` — 暗色模式变体 |
| 响应式 \`sm:\`、\`md:\`、\`hidden md:table-cell\` | Header 导航、管理表格列 |
| \`backdrop-blur-xl\` | Header 毛玻璃效果 |
| 自定义 utilities（\`.glow-text\`、\`.bg-grid\`） | \`globals.css\` 底部 |

**设计令牌体系**（核心设计思路）：

\`\`\`css
:root {           /* 亮色主题 */
  --color-bg: #fafafa;
  --color-fg: #1a1a2e;
  --color-accent: #0891b2;   /* cyan-600 */
}
.dark {           /* 暗色主题 */
  --color-bg: #0a0a0f;
  --color-fg: #e4e4e7;
  --color-accent: #06b6d4;   /* cyan-500 */
}
\`\`\`

所有组件只引用 CSS 变量，不硬编码颜色。切主题 = 在 \`<html>\` 上加/删 \`.dark\` class。

### 第 5 层：数据库 & ORM

| 知识点 | 用在网站哪里 |
|---|---|
| **Prisma Schema** | \`prisma/schema.prisma\` — 定义 User / Post / Project 模型 |
| 关系字段 \`@relation\` | \`Post.author\` ↔ \`User.posts\` |
| Prisma Client CRUD | \`findMany\`、\`findUnique\`、\`create\`、\`update\`、\`delete\` |
| \`include\`（关联查询） | \`getAllPosts()\` — \`include: { author: { select: ... } }\` |
| **libsql 适配器** | \`db.ts\` — Prisma 连接 SQLite |

### 第 6 层：认证体系

| 知识点 | 用在网站哪里 |
|---|---|
| **JWT**（jose 库） | \`session.ts\` — \`SignJWT\` 签发 / \`jwtVerify\` 验证 |
| \`TextEncoder\` | 将 \`SESSION_SECRET\` 转为 Uint8Array 密钥 |
| \`httpOnly\` cookie | 浏览器 JS 不可读写，防 XSS |
| \`sameSite: "lax"\` | 防 CSRF 攻击 |
| **bcryptjs** | 注册时哈希 / 登录时比对 |
| **Zod 校验** | \`validations.ts\` — 用户名/邮箱/密码格式 |

**完整认证流**：

\`\`\`
注册: 表单 → Zod 校验 → bcrypt 哈希 → Prisma 写库 → 签发 JWT → 写 cookie → redirect /
登录: 表单 → Zod 校验 → Prisma 查库 → bcrypt 比对 → 签发 JWT → 写 cookie → redirect /
登出: 删 cookie → router.refresh() → 页面重渲染
鉴权: cookie 中取 JWT → 解密验证 → 提取 userId → 查库/拦截
\`\`\`

### 第 7 层：前端进阶概念

| 知识点 | 用在网站哪里 |
|---|---|
| **framer-motion** | \`splash-screen.tsx\` — 入场动画、扫描线、typing 效果 |
| \`AnimatePresence\` | 组件卸载时的退出动画 |
| **react-markdown** | \`mdx-content.tsx\` — Markdown → React |
| \`remark-gfm\` | 表格、删除线、任务列表等 GitHub 风格 Markdown |
| 自定义渲染组件 | 覆盖 \`blockquote\`、\`code\`、\`pre\`、\`h1\`~\`h6\` 等 |
| **lucide-react** | 所有图标 |
| \`sessionStorage\` | 启动动画本次会话只播一次 |

---

## 二、按文件逐个阅读顺序

| # | 文件 | 重点理解 |
|---|---|---|
| 1 | \`prisma/schema.prisma\` | 数据模型三张表 |
| 2 | \`src/lib/db.ts\` | Prisma 单例 + libsql 适配器 |
| 3 | \`src/lib/validations.ts\` | Zod schema + 类型推导 |
| 4 | \`src/lib/session.ts\` | JWT 签发/解密 + cookie 操作 |
| 5 | \`src/lib/session-client.ts\` | 客户端获取 session |
| 6 | \`src/app/actions/auth.ts\` | 登录/注册 Server Action |
| 7 | \`src/app/login/page.tsx\` | \`useActionState\` 表单模式 |
| 8 | \`src/components/auth-provider.tsx\` | Auth Context 模式 |
| 9 | \`src/lib/i18n.ts\` | 翻译表 + \`t()\` 函数 |
| 10 | \`src/app/globals.css\` | CSS 变量体系 + 暗色模式 |
| 11 | \`src/app/layout.tsx\` | Provider 嵌套顺序 |
| 12 | \`src/app/page.tsx\` | 首页数据获取 |
| 13 | \`src/components/header.tsx\` | 导航栏 + 认证响应 |
| 14 | \`src/components/splash-screen.tsx\` | framer-motion 动画 |
| 15 | \`src/lib/posts.ts\` | Prisma 查询封装 |
| 16 | \`src/app/actions/posts.ts\` | 文章 CRUD Server Actions |
| 17 | \`src/app/admin/page.tsx\` + \`admin-dashboard.tsx\` | Server→Client 数据传递 |
| 18 | \`src/app/admin/posts/page.tsx\` + \`posts-management.tsx\` | 管理表格 + DeleteBtn |
| 19 | \`src/lib/github.ts\` | GitHub API + ISR 缓存 |
| 20 | \`src/app/actions/github-sync.ts\` | 外部 API → 数据库同步 |
| 21 | \`src/components/mdx-content.tsx\` | react-markdown 自定义渲染 |

---

## 三、关键模式速查

### Server Component 模式（数据获取）

\`\`\`tsx
// page.tsx（默认服务端组件）
export default async function Page() {
  const data = await prisma.xxx.findMany();
  return <ClientView data={data} />;
}
\`\`\`

### Client Component 模式（交互 UI）

\`\`\`tsx
"use client";
export default function ClientView({ data }) {
  const [state, setState] = useState(...);
  return <button onClick={...}>...</button>;
}
\`\`\`

### Server Action 模式（数据变更）

\`\`\`tsx
"use server";
export async function myAction(formData: FormData) {
  await verifySession();          // 鉴权
  await prisma.xxx.create(...);   // 写库
  revalidatePath("/xxx");         // 刷新缓存
  redirect("/xxx");               // 跳转
}
\`\`\`

### Context Provider 嵌套（全局状态）

\`\`\`tsx
// layout.tsx
<ThemeProvider>
  <LanguageProvider>
    <AuthProvider>       ← 从外到内，层层包裹
      <Header />         ← 任意子组件可 useAuth()
      {children}
    </AuthProvider>
  </LanguageProvider>
</ThemeProvider>
\`\`\`

---

## 四、学习路径建议

| 阶段 | 时长 | 内容 |
|---|---|---|
| ① 基础 | 2-3 周 | TypeScript 类型系统 + React 官方教程（重点：hooks + context） |
| ② 框架 | 2 周 | Next.js App Router 官方教程（路由 → 数据获取 → Server Actions） |
| ③ 样式 | 3-5 天 | Tailwind CSS 4（utility-first + CSS 变量 + dark mode） |
| ④ 数据 | 1 周 | Prisma 官方 Quickstart + Zod 校验 |
| ⑤ 认证 | 1 周 | JWT 原理 + bcrypt + HttpOnly Cookie 安全模型 |
| ⑥ 进阶 | 1 周 | framer-motion 动效 + react-markdown 自定义渲染 |
| ⑦ 实战 | 持续 | 对照本网站代码，按第二节的顺序逐个文件阅读 |

---

> **提示**：每个阶段看完后，回到对应的文件中追读源码，理论和实践结合效果最好。
`;

async function main() {
  console.log("Adding learning roadmap post...\n");

  // Check if already exists
  const existing = await prisma.post.findUnique({ where: { slug: SLUG } });
  if (existing) {
    console.log(`Post "${SLUG}" already exists. Updating content...`);
    await prisma.post.update({
      where: { slug: SLUG },
      data: {
        title: TITLE,
        excerpt: EXCERPT,
        content: CONTENT,
        published: true,
      },
    });
    console.log("Post updated.");
  } else {
    await prisma.post.create({
      data: {
        slug: SLUG,
        title: TITLE,
        excerpt: EXCERPT,
        content: CONTENT,
        published: true,
      },
    });
    console.log("Post created.");
  }

  console.log(`\nDone. Visit: /posts/${SLUG}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
