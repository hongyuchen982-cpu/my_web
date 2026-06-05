---
title: "零基础看懂这个网站的代码 —— 从「什么是前端」到理解全栈架构"
date: "2026-06-05"
excerpt: "写给代码新手的完整指南：逐文件解释整个网站的架构，每一行代码在做什么，以及你需要按什么顺序学习哪些知识才能独立维护这个项目。"
---

## 前言：如果你不太懂代码，这篇文章是写给你的

这个网站用到了很多技术。如果你刚接触编程，看这些代码就像看天书——每个字母都认识，连在一起完全不知道在说什么。

这篇文章的目标：**用最直白的中文，把所有代码拆开来讲清楚**。

不会讲得很深（也不可能），但至少让你知道：

- 每个文件是干什么的
- 数据是怎么在系统里流动的
- 如果你想学，应该按什么顺序学

> 预计阅读时间：很长。建议收藏起来，边学边回来看。

---

## 第一部分：如果你想看懂这个项目，需要先理解的概念

在看代码之前，有几个概念必须先搞懂。不用精通，但至少要知道"这个东西是干嘛的"。

### 1. 前端 vs 后端

这是一个**全栈**项目，意思是既有前端，也有后端。

| | 前端 | 后端 |
|---|---|---|
| **一句话** | 你在浏览器里看到的东西 | 在服务器上跑的东西 |
| **负责什么** | 页面长什么样、按钮点击、动画 | 存数据、验证密码、读文件 |
| **在这个项目里** | React 组件、Tailwind CSS | Server Actions、Prisma、数据库 |
| **跑在哪里** | 你的浏览器（Chrome/Edge） | 服务器（你的电脑 localhost、或者 Vercel 的云端） |

**关键认知**：浏览器和服务器是两台不同的电脑。它们通过 HTTP 请求（就是你每天在浏览器地址栏看到的 `https://...`）交流。

### 2. 什么是组件（Component）

React 应用是由「组件」拼起来的，就像乐高积木。

```
整个页面 = <Layout>          ← 最外层框架
            <Header />       ← 顶部导航栏
            <main>           ← 中间内容区
              你的文章 / 项目卡片
            </main>
            <Footer />       ← 底部版权信息
          </Layout>
```

这个项目的 `src/components/` 文件夹里每一个 `.tsx` 文件都是一个组件。

### 3. 什么是 Server Component 和 Client Component

Next.js 把组件分成两种：

| | Server Component | Client Component |
|---|---|---|
| **在哪运行** | 服务器上 | 浏览器里 |
| **能做什么** | 读数据库、读文件、调用 API | 处理点击、动画、表单输入 |
| **文件开头** | 什么都不用写（默认） | 必须有 `"use client"` |
| **例子** | `src/app/page.tsx` | `src/components/header.tsx` |

**简单记法**：需要用户交互的（按钮、输入框、动画）→ Client Component。其他统统 Server Component。

### 4. 什么是数据库

数据库就是一个**能永久存数据的 Excel 表格**。

这个项目用的是 SQLite——一个存在你电脑上的文件（`dev.db`）。它不需要安装任何数据库软件，就像一个高级版的 JSON 文件。

这个项目只有一张表——`User` 表：

| id | email | name | passwordHash | createdAt |
|---|---|---|---|---|
| abc-123 | test@qq.com | 张三 | $2a$12$xxxx... | 2026-06-05 |

### 5. 什么是 Cookie 和 JWT

用户登录后，服务器怎么「记住」你是谁？

- **Cookie**：浏览器里存的一小段文字。每次你访问网站，浏览器自动把它带上。
- **JWT**：一段加密的字符串，里面存着你的用户 ID 和邮箱。只有服务器能解密。

```
登录流程：
你输入邮箱+密码 → 服务器验证 → 服务器生成 JWT → 存到你的浏览器 Cookie
                                                 ↓
下次访问 /admin → 浏览器自动带 Cookie → 服务器解密 JWT → 知道是你 → 放行
```

### 6. 什么是 Markdown

就是你写这篇文章用的格式。用 `#` 表示标题，`**加粗**` 表示粗体。这个网站的博客就是 Markdown 写的。

---

## 第二部分：项目文件逐个解释

现在开始逐个文件走一遍。我会按照「你浏览网站时，代码怎么被执行」的顺序来讲。

---

### 入口：你访问 `http://localhost:3000`

当你访问这个地址时，Next.js 首先找 `src/app/layout.tsx`。

#### `src/app/layout.tsx` — 整个网站的壳

```tsx
// ① 导入全局样式
import "./globals.css";
// ② 导入各个功能模块
import ThemeProvider from "@/components/theme-provider";
import LanguageProvider from "@/components/language-provider";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SplashScreen from "@/components/splash-screen";

// ③ 定义 SEO 信息（搜索引擎看到的标题和描述）
export const metadata: Metadata = {
  title: { default: "CHY · Dev", template: "%s — CHY · Dev" },
  description: "个人技术博客 & 项目展示",
};

// ④ 这是一个防止页面闪烁的小脚本
// 如果用户之前选了亮色模式，在页面渲染前就先把 dark class 去掉
const themeScript = `
  (function() {
    var t = localStorage.getItem('theme');
    if (t === 'light') document.documentElement.classList.remove('dark');
  })();
`;

// ⑤ 根布局组件——所有页面都会包在这个里面
export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" className="h-full dark">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>        {/* 管理亮暗主题状态 */}
          <LanguageProvider>   {/* 管理中英文切换状态 */}
            <SplashScreen />   {/* 开屏动画 */}
            <Header />         {/* 顶部导航栏 */}
            <main>{children}</main>  {/* 这里放每个页面的具体内容 */}
            <Footer />         {/* 底部版权信息 */}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**看不懂的词**：

- `import` = 把别的文件里的代码拿过来用
- `export default function` = 定义一个组件，让别的文件可以 import 它
- `{children}` = React 里的「插槽」，每个页面的内容会被塞到这里

---

#### `src/app/globals.css` — 全局样式和颜色定义

```css
/* ① 导入 Tailwind CSS */
@import "tailwindcss";

/* ② 启用 class-based 暗色模式（给 <html> 加 .dark class 就切换暗色） */
@custom-variant dark (&:where(.dark, .dark *));

/* ③ 定义亮色模式的颜色变量（默认） */
:root {
  --color-bg: #fafafa;          /* 背景色：浅灰白 */
  --color-fg: #1a1a2e;          /* 文字色：深蓝黑 */
  --color-accent: #0891b2;       /* 强调色：青色 */
  --color-border: #e4e4e7;       /* 边框色：浅灰 */
  --font-mono: "JetBrains Mono"; /* 等宽字体（用于代码） */
}

/* ④ 暗色模式覆盖 */
.dark {
  --color-bg: #0a0a0f;    /* 背景变黑 */
  --color-fg: #e4e4e7;    /* 文字变白 */
  --color-accent: #06b6d4; /* 强调色变亮青 */
  --color-border: #1e1e2e; /* 边框变深灰 */
}

/* ⑤ 基础样式 */
body {
  background: var(--color-bg);  /* 用上面定义的变量 */
  color: var(--color-fg);
  transition: background-color 0.4s ease; /* 切换主题时有 0.4 秒过渡 */
}

/* ⑥ 自定义工具类 */
.glow-text { /* 文字发光效果 */ }
.card-glow:hover { /* 卡片 hover 时发光 */ }
.section-title::before { content: "// "; } /* 标题前面的双斜线 */
```

**关键理解**：整个网站的颜色都是通过 `var(--color-bg)` 这样的 CSS 变量引用的，而不是写死 `#0a0a0f`。当 `<html>` 上有 `.dark` class 时，变量值自动切换——所有的组件颜色也跟着自动切换。这就是亮暗主题的魔法。

---

#### `src/components/theme-provider.tsx` — 主题管理器

```tsx
"use client";  // ← 这是一个 Client Component（需要用户交互）

export default function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState<"light" | "dark">("dark");

  // ① 页面加载时，读 localStorage 里存的用户偏好
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light") setThemeState("light");
  }, []);

  // ② theme 变化时，给 <html> 添加或移除 dark class
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);  // 记住选择
  }, [theme]);

  // ③ 切换主题的函数
  const toggleTheme = () => {
    setThemeState(prev => prev === "dark" ? "light" : "dark");
  };

  // ④ 把 theme 状态和 toggleTheme 函数传给所有子组件
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

**核心概念——React Context**：`ThemeContext.Provider` 像一个广播站，任何子组件都可以通过 `useTheme()` 收听当前的 `theme` 和 `toggleTheme`，而不需要一层层传 props。

---

#### `src/components/splash-screen.tsx` — 开屏动画

```tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";

const SPLASH_KEY = "splash-shown";  // sessionStorage 的 key

export default function SplashScreen() {
  // stage 有 4 个阶段：typing → ready → exiting → done
  const [stage, setStage] = useState("typing");

  // ① 检查是否已经播过（同一标签页只播一次）
  useEffect(() => {
    if (sessionStorage.getItem(SPLASH_KEY) === "1") {
      setStage("done");  // 直接跳过
    }
  }, []);

  // ② 2.8 秒后从 typing 变成 ready（显示按钮）
  useEffect(() => {
    if (stage !== "typing") return;
    const t = setTimeout(() => setStage("ready"), 2800);
    return () => clearTimeout(t);
  }, [stage]);

  // ③ 用户点击 Enter 按钮
  const handleEnter = () => {
    sessionStorage.setItem(SPLASH_KEY, "1");
    setStage("exiting");  // 触发退出动画
  };

  // ④ 退出动画播完 1 秒后，彻底卸载
  useEffect(() => {
    if (stage !== "exiting") return;
    const t = setTimeout(() => setStage("done"), 1000);
    return () => clearTimeout(t);
  }, [stage]);

  if (stage === "done") return null;  // 不渲染任何东西

  return (
    <motion.div  /* framer-motion 的动画 div */
      exit={{ y: "-100%" }}  /* 退出时向上滑出屏幕 */
      transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}  /* 缓动曲线 */
    >
      {/* 背景网格 + 扫描线 + 打字文字 + Enter 按钮 */}
      {stage === "typing" && <TypingText />}
      {stage === "ready" && <EnterButton onClick={handleEnter} />}
    </motion.div>
  );
}
```

**framer-motion 是干嘛的**：一个动画库。`motion.div` 是加强版的 `<div>`，可以给它加 `animate`（播放）、`exit`（退出）、`whileHover`（鼠标悬停）等动画属性。

---

#### `src/components/header.tsx` — 顶部导航栏

```tsx
"use client";  // 因为有按钮点击、状态管理

export default function Header() {
  const { lang } = useLang();        // 读取当前语言
  const { theme } = useTheme();      // 读取当前主题
  const [session, setSession] = useState(null);  // 当前登录用户

  // 页面加载时，调 API 查当前登录状态
  useEffect(() => {
    getSessionClient().then(setSession);
  }, []);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl">
      {/* 左侧：Logo + 导航链接 */}
      <Link href="/">~/chy</Link>         {/* 点一下跳首页 */}
      <Link href="/posts">Posts</Link>     {/* 点一下跳博客列表 */}
      <Link href="/projects">Projects</Link>

      {/* 右侧：主题切换 + 语言切换 + GitHub + 邮箱 + 登录 */}
      <ThemeToggle />        {/* 太阳/月亮按钮 */}
      <LanguageSwitcher />   {/* EN/中 按钮 */}

      {session ? (
        <button onClick={logout}>退出</button>  // 已登录 → 显示退出
      ) : (
        <Link href="/login">登录</Link>         // 未登录 → 显示登录链接
      )}
    </header>
  );
}
```

**`Link` 和 `<a>` 的区别**：Next.js 的 `<Link>` 切换页面时不会刷新整个浏览器，比 `<a>` 快很多。

---

#### `src/components/footer.tsx` — 页脚

一个纯展示组件，没有复杂逻辑。就是显示版权信息、ICP 备案号。

---

#### `src/app/page.tsx` — 首页

```tsx
// 这是一个 Server Component（没有 "use client"）
import { getAllPosts } from "@/lib/posts";      // 读取博客文章
import { getProjects } from "@/lib/projects";   // 读取项目数据
import HomeContent from "@/components/home-content";

export default async function Home() {
  const posts = getAllPosts().slice(0, 5);   // 取最近 5 篇文章
  const projects = getProjects();            // 取全部项目

  return <HomeContent posts={posts} projects={projects} />;
}
```

**执行过程**：
1. 服务器上执行 `getAllPosts()`——读 `posts/` 文件夹里的 `.md` 文件
2. 服务器上执行 `getProjects()`——读 `src/lib/projects.ts` 里的数组
3. 把数据作为 props 传给 `<HomeContent>` 组件
4. Next.js 把渲染好的 HTML 发给浏览器

---

#### `src/components/home-content.tsx` — 首页的内容组装

```tsx
"use client";  // 因为有统计数字的计数动画

export default function HomeContent({ posts, projects }) {
  return (
    <>
      <HeroSection projectCount={...} postCount={...} />   {/* Hero 区域 */}
      <section>
        <h2 className="section-title">// 精选项目</h2>    {/* 双斜线标题 */}
        {projects.map(p => <ProjectCard project={p} />)}    {/* 项目卡片网格 */}
      </section>
      <section>
        <h2 className="section-title">// 最新文章</h2>
        {posts.map(p => <ArticleListItem post={p} />)}     {/* 文章列表 */}
      </section>
    </>
  );
}
```

---

#### `src/components/hero-section.tsx` — Hero + 统计柱

```tsx
"use client";

function CountUp({ value }) {
  // 数字从 0 滚动到目标值，持续 1.2 秒
}

export default function HeroSection({ projectCount, postCount, techCount }) {
  return (
    <section className="hero-gradient">  {/* 辐射渐变背景 */}
      <h1>欢迎技术交流</h1>
      <p>但积跬步，莫问前程。</p>

      {/* 三个统计数字 */}
      <div>
        <CountUp value={projectCount} />   {/* 4 */}
        <CountUp value={postCount} />       {/* 4 */}
        <CountUp value={techCount} />       {/* 12+ */}
      </div>
    </section>
  );
}
```

---

#### `src/lib/posts.ts` — 读取博客文章

```ts
import fs from "fs";           // Node.js 的文件系统模块
import path from "path";       // 处理文件路径
import matter from "gray-matter"; // 解析 Markdown 的 frontmatter

const postsDirectory = path.join(process.cwd(), "posts");

export function getAllPosts(): Post[] {
  // ① 读取 posts/ 文件夹里所有文件名
  const filenames = fs.readdirSync(postsDirectory);

  // ② 过滤出 .md 文件
  // ③ 逐个文件读取内容
  const posts = filenames
    .filter(f => f.endsWith(".md"))
    .map(filename => {
      const fileContents = fs.readFileSync(路径, "utf8");
      const { data, content } = matter(fileContents);
      //     ↑ frontmatter  ↑ 正文
      return {
        slug: filename.replace(".md", ""),  // URL 用的短名
        title: data.title,
        date: data.date,
        excerpt: data.excerpt,
        content: content,                  // Markdown 原文
      };
    })
    .sort((a, b) => b.date - a.date);  // 按日期从新到旧排

  return posts;
}
```

**frontmatter 是什么**：Markdown 文件最顶部的 `---` 包裹的区域：

```markdown
---
title: "文章标题"
date: "2026-06-05"
excerpt: "摘要"
---
正文从这里开始...
```

`gray-matter` 把 `---` 之间的内容解析成 `data` 对象，下面的正文是 `content`。

---

#### `src/components/mdx-content.tsx` — 把 Markdown 渲染成 HTML

```tsx
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MDXContent({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}    // 支持表格、删除线等扩展语法
      components={{                   // 自定义每个 HTML 标签的样式
        h1: ({ children }) => <h1 className="text-2xl font-bold">{children}</h1>,
        p: ({ children }) => <p className="my-3 leading-relaxed">{children}</p>,
        code: ({ children }) => <code className="bg-gray-100 rounded">{children}</code>,
        // ... 还有 blockquote, pre, a, ul, ol, li, strong, hr, img
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
```

**原理**：`react-markdown` 把 Markdown 字符串解析成 HTML，`components` 参数让你自定义每个标签的 CSS 样式。

---

### 认证系统——注册、登录、保护路由

这部分是这个项目最复杂的逻辑。它涉及四个文件：

| 文件 | 作用 |
|---|---|
| `src/lib/db.ts` | 数据库连接 |
| `src/lib/validations.ts` | 校验用户输入是否合法 |
| `src/lib/session.ts` | JWT 的签发、验证、删除 |
| `src/app/actions/auth.ts` | 注册/登录的具体逻辑 |
| `proxy.ts` | 拦截未登录用户访问 `/admin` |

#### `src/lib/db.ts` — 数据库连接

```ts
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

// 创建一个 Prisma 客户端实例
const adapter = new PrismaLibSql({ url: "file:dev.db" });
export const prisma = new PrismaClient({ adapter });
```

**Prisma 是什么**：一个 ORM（对象关系映射）。简单说就是——你不需要写 SQL 语句，而是写 JavaScript 代码来操作数据库。

```ts
// 不用 Prisma（写 SQL）：
db.run("SELECT * FROM User WHERE email = ?", email);

// 用 Prisma（写 TS）：
prisma.user.findUnique({ where: { email } });
```

Prisma 还会自动检查类型——如果你写错了字段名，编辑器直接就报红线。

#### `src/lib/validations.ts` — 表单校验

```ts
import { z } from "zod";

export const SignupSchema = z.object({
  name: z.string().min(2, "名字至少 2 个字符"),
  email: z.string().email("请输入有效的邮箱地址"),
  password: z
    .string()
    .min(8, "密码至少 8 个字符")
    .regex(/[a-zA-Z]/, "必须包含字母")
    .regex(/[0-9]/, "必须包含数字"),
});
```

**Zod 是什么**：一个校验库。你定义一个 schema（数据的形状），然后 `SignupSchema.safeParse(用户输入)` 会告诉你数据合不合法，不合法的话具体哪里不对。

#### `src/lib/session.ts` — JWT 会话管理

```ts
import { SignJWT, jwtVerify } from "jose";

const secretKey = process.env.SESSION_SECRET;  // 从 .env 读密钥
const encodedKey = new TextEncoder().encode(secretKey);

// ① 签发 JWT：把用户信息加密成一个 token
export async function encrypt(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })   // 加密算法
    .setExpirationTime("7d")                 // 7 天过期
    .sign(encodedKey);
}

// ② 解密 JWT：从 token 里还原用户信息
export async function decrypt(session) {
  const { payload } = await jwtVerify(session, encodedKey);
  return payload;  // { userId, email, name, expiresAt }
}

// ③ 创建会话：加密 → 存到浏览器的 httpOnly Cookie
export async function createSession(user) {
  const session = await encrypt({ userId: user.id, email: user.email, name: user.name });
  (await cookies()).set("session", session, {
    httpOnly: true,   // JS 无法读取（防 XSS 攻击）
    secure: true,     // 只通过 HTTPS 传输
    sameSite: "lax",  // 防 CSRF 攻击
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),  // 7 天
  });
}

// ④ 验证会话：从 Cookie 解密 → 判断是否登录
export async function verifySession() {
  const session = await decrypt((await cookies()).get("session")?.value);
  if (!session?.userId) redirect("/login");  // 没登录就跳转到登录页
  return session;
}

// ⑤ 删除会话（登出）
export async function deleteSession() {
  (await cookies()).delete("session");
}
```

**httpOnly Cookie 的意思**：这个 Cookie 被标记为 `httpOnly`，这意味着浏览器里的 JavaScript 代码**读不到它**。只有浏览器在发 HTTP 请求时才会自动带上。这样做是为了安全——即使你的网站被人注入了恶意脚本（XSS 攻击），对方也偷不走你的登录 token。

#### `src/app/actions/auth.ts` — 注册和登录的 Server Actions

```ts
"use server";  // ← 这个文件只在服务器上执行

export async function signup(prevState, formData) {
  // ① 从表单提取数据并校验
  const validated = SignupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors };

  // ② 检查邮箱是否已经注册
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { errors: { email: ["该邮箱已注册"] } };

  // ③ 密码哈希（绝不存明文！）
  const passwordHash = await bcrypt.hash(password, 12);
  //   "mypassword123" → "$2a$12$R9kL3x...很长的乱码..."

  // ④ 写入数据库
  const user = await prisma.user.create({ data: { name, email, passwordHash } });

  // ⑤ 创建会话（签发 JWT → 存 Cookie）
  await createSession({ id: user.id, email: user.email, name: user.name });

  // ⑥ 跳转到首页
  redirect("/");
}
```

**为什么密码要哈希（hash）**：如果数据库被泄露，攻击者拿到的是 `$2a$12$xxxx...` 这种乱码，不是你的真实密码。哈希是单向的——可以从密码算出哈希，但不能从哈希反推密码。`bcrypt` 是目前最安全的哈希算法之一，12 这个数字代表加密 12 轮，数字越大越安全但也越慢。

**Server Action 是什么**：Next.js 的一种特殊函数。你可以在表单的 `action` 属性里直接引用它，Next.js 会自动处理跨网络通信。你不需要手动写 `fetch("/api/signup")`。

#### `proxy.ts` — 路由保护

```ts
export default async function proxy(req) {
  const path = req.nextUrl.pathname;

  // 如果访问 /admin 且没登录 → 跳转到 /login
  if (path.startsWith("/admin")) {
    const session = await decrypt((await cookies()).get("session")?.value);
    if (!session?.userId) return NextResponse.redirect(new URL("/login", req.url));
  }

  // 如果已登录还访问 /login → 跳转到首页
  if (path.startsWith("/login") && session?.userId) {
    return NextResponse.redirect(new URL("/", req.url));
  }
}
```

**Proxy 是什么**：Next.js 16 的中间件。每一个请求到达服务器时，都会先经过 `proxy.ts`。你可以在这里检查权限、重定向。

---

## 第三部分：完整的数据流——用户登录到底发生了什么

把前面讲的串起来，走一条完整的链路：

```
① 用户在 /login 页面输入邮箱和密码
     ↓
② 表单提交 → 触发 Server Action（login 函数）
     ↓
③ 服务器端执行：
   - Zod 校验邮箱格式 + 密码不为空
   - Prisma 查数据库：SELECT * FROM User WHERE email = ?
   - bcrypt.compare(用户输入的密码, 数据库里的哈希)
   - 匹配成功 ↓
   - jose 签发 JWT：{ userId, email, name } → 加密字符串
   - 把 JWT 写入 httpOnly Cookie：Set-Cookie: session=eyJhbG...
   - redirect("/")  → 浏览器跳转到首页
     ↓
④ 浏览器收到 302 重定向 + Set-Cookie 响应头
     ↓
⑤ 浏览器自动跳转首页，同时带上 Cookie：Cookie: session=eyJhbG...
     ↓
⑥ 用户点击 /admin 链接
     ↓
⑦ proxy.ts 拦截：
   - 读取 Cookie 里的 session
   - 解密 JWT → 拿到 { userId, email, name }
   - userId 存在 → 放行
     ↓
⑧ /admin 页面渲染：显示用户数、文章数、项目数
```

---

## 第四部分：你需要掌握的知识——按难度分级

### 第一层：能看懂静态页面（2-4 周）

这些是基础中的基础，学会了就能看懂组件的 UI 部分：

1. **HTML**：标签、属性、结构
  - 学到：`<div>`, `<h1>`, `<p>`, `<a>`, `<button>` 是什么意思
  - 资源：[MDN HTML 教程](https://developer.mozilla.org/zh-CN/docs/Learn/HTML)（免费，中文）

2. **CSS 基础**：选择器、颜色、布局
  - 学到：`color`, `background`, `margin`, `padding`, `flex`, `grid`
  - 资源：[MDN CSS 教程](https://developer.mozilla.org/zh-CN/docs/Learn/CSS)（免费，中文）

3. **Tailwind CSS**：用 class 写样式
  - 学到：`className="text-white bg-black p-4 rounded-lg"` 的意思
  - 资源：[Tailwind CSS 文档](https://tailwindcss.com/docs)（免费）

### 第二层：能看懂交互逻辑（1-3 个月）

4. **JavaScript 基础**：变量、函数、数组、对象、Promise
  - 学到：`const`, `function`, `=>`, `map`, `filter`, `async/await`
  - 资源：[现代 JavaScript 教程](https://zh.javascript.info/)（免费，中文，强烈推荐）

5. **TypeScript**：给 JavaScript 加上类型
  - 学到：`string`, `number`, `interface`, `type`, `Promise<T>`
  - 资源：[TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)（免费）

6. **React 基础**：组件、JSX、Hooks
  - 学到：`useState`, `useEffect`, `props`, `children`
  - 资源：[React 官方教程](https://zh-hans.react.dev/learn)（免费，中文）

### 第三层：能看懂整体架构（3-6 个月）

7. **Next.js App Router**：路由、Server Components、Server Actions
  - 学到：文件即路由、`layout.tsx`、`page.tsx`、`"use server"`
  - 资源：[Next.js 官方教程](https://nextjs.org/docs)（免费）

8. **Node.js 基础**：理解服务器端
  - 学到：`fs`, `path`, 文件读写
  - 资源：[Node.js 官方文档](https://nodejs.org/en/docs/)

### 第四层：能独立开发和修改（6-12 个月）

9. **数据库和 ORM**：SQL 基础、Prisma
  - 学到：表、行、列、`SELECT`/`INSERT`/`UPDATE`/`DELETE`
  - 资源：[Prisma 官方教程](https://www.prisma.io/docs/getting-started)（免费）

10. **认证原理**：JWT、Cookie、Session、OAuth
  - 学到：加密、签名、httpOnly、SameSite
  - 资源：[The Copenhagen Book](https://thecopenhagenbook.com/)（免费）

11. **安全常识**：哈希、加盐、CSRF、XSS
  - 学到：为什么密码要哈希、为什么要有 CSRF Token
  - 资源：[MDN Web 安全](https://developer.mozilla.org/zh-CN/docs/Web/Security)（免费）

---

## 总结

这个网站的核心代码其实不多——去掉注释和样式，核心逻辑大概就 2000 行。但它涉及的知识面很广，从最基础的 HTML 到后端安全都有。

**最重要的建议**：不要试图一天学完上面列的所有东西。从第一层开始，学一点就回来看一段代码，你会发现自己能看懂的部分越来越多。

当你学到第三层的时候，就可以自信地说：**这个项目我能改、能拆、能重写**。

到那一天，这个网站就不只是我的作品了——它也是你的。
