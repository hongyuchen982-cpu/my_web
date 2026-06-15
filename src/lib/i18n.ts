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
  searchPosts: { zh: "搜索文章…", en: "Search posts…" },
  all: { zh: "全部", en: "All" },
  noResults: { zh: "没有找到匹配的文章", en: "No posts matching" },
  postsCount: { zh: "篇文章", en: "posts" },

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

  // Admin — Dashboard
  adminDashboard: { zh: "管理后台", en: "Admin Dashboard" },
  welcome: { zh: "欢迎回来", en: "Welcome" },
  adminUsers: { zh: "用户", en: "Users" },
  adminPosts: { zh: "文章", en: "Posts" },
  adminProjects: { zh: "项目", en: "Projects" },
  adminStats: { zh: "数据概览", en: "Stats" },
  quickActions: { zh: "快捷操作", en: "Quick Actions" },
  management: { zh: "内容管理", en: "Management" },
  managePosts: { zh: "管理文章", en: "Manage Posts" },
  manageProjects: { zh: "管理项目", en: "Manage Projects" },
  registerNewUser: { zh: "注册新用户", en: "Register New User" },
  backToDashboard: { zh: "← 返回后台", en: "← Back to Dashboard" },
  confirmDelete: { zh: "确定删除？此操作不可撤销。", en: "Delete? This cannot be undone." },

  // Admin — Actions
  newPost: { zh: "新建文章", en: "New Post" },
  newPostDesc: { zh: "撰写或上传 Markdown 文章", en: "Write or upload MD content" },
  newProject: { zh: "新建项目", en: "New Project" },
  newProjectDesc: { zh: "手动添加项目信息", en: "Manually add project info" },
  syncGitHub: { zh: "同步 GitHub", en: "Sync GitHub" },
  syncGitHubDesc: { zh: "从 GitHub 拉取最新仓库", en: "Fetch latest repos from GitHub" },
  syncSuccess: { zh: "同步成功", en: "Sync Successful" },
  syncFail: { zh: "同步失败", en: "Sync Failed" },
  syncing: { zh: "同步中…", en: "Syncing…" },
  noRepos: { zh: "未获取到 GitHub 仓库数据，请检查 GITHUB_TOKEN 或网络连接。", en: "No GitHub repos found. Check GITHUB_TOKEN or network." },
  syncError: { zh: "同步失败，请查看服务器日志。", en: "Sync failed. Check server logs." },
  syncTip: { zh: "同步 GitHub 项目前请确保已配置 GITHUB_TOKEN 环境变量。", en: "Configure GITHUB_TOKEN env var before syncing." },

  // Admin — Posts Management
  managePostsTitle: { zh: "文章管理", en: "Manage Posts" },
  noPostsYet: { zh: "暂无文章，立即创建第一篇！", en: "No posts yet. Create your first one!" },
  title: { zh: "标题", en: "Title" },
  status: { zh: "状态", en: "Status" },
  actions: { zh: "操作", en: "Actions" },
  published: { zh: "已发布", en: "Published" },
  draft: { zh: "草稿", en: "Draft" },
  edit: { zh: "编辑", en: "Edit" },
  delete: { zh: "删除", en: "Delete" },
  slug: { zh: "路径", en: "Slug" },
  excerpt: { zh: "摘要", en: "Excerpt" },
  date: { zh: "日期", en: "Date" },
  save: { zh: "保存", en: "Save" },
  cancel: { zh: "取消", en: "Cancel" },

  // Admin — Projects Management
  manageProjectsTitle: { zh: "项目管理", en: "Manage Projects" },
  noProjectsYet: { zh: "暂无项目，添加或同步 GitHub 仓库！", en: "No projects yet. Add or sync from GitHub!" },
  uncategorized: { zh: "未分类", en: "Uncategorized" },
  active: { zh: "活跃", en: "Active" },
  wip: { zh: "开发中", en: "WIP" },
  maintained: { zh: "维护中", en: "Maintained" },
  archived: { zh: "归档", en: "Archived" },

  // Admin — Editor
  createPost: { zh: "新建文章", en: "New Post" },
  createProject: { zh: "新建项目", en: "New Project" },
  editPost: { zh: "编辑文章", en: "Edit Post" },
  editProject: { zh: "编辑项目", en: "Edit Project" },
  saving: { zh: "保存中…", en: "Saving…" },
  createBtn: { zh: "创建", en: "Create" },
  updateBtn: { zh: "更新", en: "Update" },
  backToPosts: { zh: "返回文章列表", en: "Back to Posts" },
  backToProjects: { zh: "返回项目列表", en: "Back to Projects" },
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
