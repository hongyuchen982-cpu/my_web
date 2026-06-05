export type Lang = "zh" | "en";

export const translations = {
  // Header
  posts: { zh: "博客", en: "Blog" },
  projects: { zh: "项目", en: "Projects" },
  signIn: { zh: "登录", en: "Sign in" },
  signOut: { zh: "退出", en: "Sign out" },
  loading: { zh: "…", en: "…" },

  // Home - Hero
  heroTitle: { zh: "欢迎技术交流", en: "Welcome to my Lab" },
  heroSubtitle: {
    zh: "但积跬步，莫问前程。专注于 Web 开发、系统设计与开源分享。",
    en: "Step by step, never ask how far. Focused on Web dev, system design & open source.",
  },
  statsProjects: { zh: "精选项目", en: "Projects" },
  statsPosts: { zh: "技术文章", en: "Posts" },
  statsTechs: { zh: "技术栈", en: "Tech Stack" },

  // Home - Sections
  featuredProjects: { zh: "精选项目", en: "Featured Projects" },
  latestArticles: { zh: "最新文章", en: "Latest Articles" },
  viewAll: { zh: "查看全部 →", en: "View all →" },

  // Project tags
  tagActive: { zh: "活跃", en: "Active" },
  tagWIP: { zh: "开发中", en: "WIP" },
  tagMaintained: { zh: "维护中", en: "Maintained" },
  tagArchive: { zh: "归档", en: "Archived" },

  // Posts list
  allPosts: { zh: "所有文章", en: "All Posts" },
  noPosts: { zh: "暂无文章。", en: "No posts yet." },
  readMore: { zh: "阅读全文", en: "Read more" },

  // Post detail
  notFound: { zh: "文章不存在", en: "Not Found" },
  backToBlog: { zh: "← 返回博客", en: "← Back to blog" },

  // Auth
  signInTitle: { zh: "登录", en: "Sign in" },
  registerTitle: { zh: "注册", en: "Register" },
  username: { zh: "用户名", en: "Name" },
  email: { zh: "邮箱", en: "Email" },
  password: { zh: "密码", en: "Password" },
  usernamePlaceholder: { zh: "输入用户名", en: "Enter your name" },
  emailPlaceholder: { zh: "your@email.com", en: "your@email.com" },
  passwordPlaceholder: { zh: "至少 8 个字符", en: "At least 8 characters" },
  loginButton: { zh: "登 录", en: "Sign in" },
  registerButton: { zh: "注 册", en: "Register" },
  loginError: {
    zh: "邮箱或密码错误，请重试。",
    en: "Invalid credentials. Please try again.",
  },
  alreadyHaveAccount: { zh: "已有账号？去登录", en: "Already have an account? Sign in" },
  noAccount: { zh: "没有账号？去注册", en: "No account? Register" },

  // GitHub repos
  noDescription: { zh: "暂无描述", en: "No description" },

  // Footer
  copyright: { zh: "版权所有", en: "All rights reserved" },
} as const;

export type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang: Lang): string {
  return translations[key][lang];
}

// Date formatters by locale
export function formatDate(
  dateStr: string,
  lang: Lang,
  style: "short" | "long" = "short"
): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";

  const locale = lang === "zh" ? "zh-CN" : "en-US";

  if (style === "long") {
    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
