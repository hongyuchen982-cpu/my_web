import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import matter from "gray-matter";

const cloud = process.argv.includes("--cloud");
if (cloud) Reflect.set(process.env, "NODE_ENV", "production");
loadEnvConfig(process.cwd(), !cloud);

const POST_FILES = [
  "agent-memory-beyond-rag.md",
  "ai-agent-rules-practice-notes.md",
  "pip-proxy-network-troubleshooting.md",
] as const;

const FORK_URLS = [
  "https://github.com/hongyuchen982-cpu/design-patterns",
  "https://github.com/hongyuchen982-cpu/chatbot",
  "https://github.com/hongyuchen982-cpu/infocenter",
  "https://github.com/hongyuchen982-cpu/jstraining",
  "https://github.com/hongyuchen982-cpu/marx-perspective",
  "https://github.com/hongyuchen982-cpu/workflowWithComfyUI",
] as const;

const PROJECTS = [
  {
    github: "https://github.com/hongyuchen982-cpu/my_web",
    title: "my_web",
    description: "我持续开发的个人技术博客与项目展示站，使用 Next.js 16、React 19、Prisma 与 Turso，已经接入多模型 RAG、引用校验、知识库同步和管理后台。",
    category: "TypeScript",
    status: "active",
    url: "https://my-web-eta-eight.vercel.app",
    techs: ["Next.js", "React", "Prisma", "Turso", "RAG"],
    sortOrder: 10,
  },
  {
    github: "https://github.com/hongyuchen982-cpu/ainame",
    title: "一念 AI Name",
    description: "我开发的智能起名全栈应用，围绕人名、企业名和宠物名生成，实践 FastAPI、React、LangGraph、多轮记忆、用户私有 RAG、异步任务和品牌资产工作流。",
    category: "AI 应用",
    status: "active",
    url: null,
    techs: ["FastAPI", "React", "LangGraph", "RAG", "Python"],
    sortOrder: 20,
  },
  {
    github: "https://github.com/hongyuchen982-cpu/enterprise-procurement-platform",
    title: "Enterprise Procurement Platform",
    description: "我参与构建的企业采购与供应链协同平台工程骨架，采用 FastAPI、Vue 3、MySQL、Redis、RabbitMQ、MinIO 与 Qdrant，当前重点是模块边界、基础设施和可扩展的 RAG／Agent 架构。",
    category: "企业应用",
    status: "wip",
    url: null,
    techs: ["FastAPI", "Vue 3", "MySQL", "RabbitMQ", "Qdrant"],
    sortOrder: 30,
  },
  {
    github: "https://github.com/hongyuchen982-cpu/my-portal",
    title: "my-portal",
    description: "我早期制作的静态个人门户，使用 HTML、CSS 和 JavaScript 组织首页、关于、笔记与项目页面，用于练习多页面网站结构和前端交互。",
    category: "HTML",
    status: "maintained",
    url: null,
    techs: ["HTML", "CSS", "JavaScript"],
    sortOrder: 40,
  },
] as const;

async function main() {
  const { prisma } = await import("../src/lib/db");
  try {
    const author = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });

    for (const file of POST_FILES) {
      const source = await readFile(path.join(process.cwd(), "posts", file), "utf8");
      const parsed = matter(source);
      const slug = file.replace(/\.md$/, "");
      const date = new Date(String(parsed.data.date));
      const data = {
        title: String(parsed.data.title),
        excerpt: String(parsed.data.excerpt),
        category: String(parsed.data.category),
        content: parsed.content.trim(),
        published: true,
        createdAt: date,
        authorId: author?.id ?? null,
      };
      await prisma.post.upsert({
        where: { slug },
        update: data,
        create: { slug, ...data },
      });
    }

    const removed = await prisma.project.deleteMany({
      where: { github: { in: [...FORK_URLS] } },
    });

    for (const project of PROJECTS) {
      const existing = await prisma.project.findFirst({ where: { github: project.github } });
      const data = {
        title: project.title,
        description: project.description,
        category: project.category,
        status: project.status,
        url: project.url,
        github: project.github,
        techs: JSON.stringify(project.techs),
        sortOrder: project.sortOrder,
        authorId: author?.id ?? null,
      };
      if (existing) await prisma.project.update({ where: { id: existing.id }, data });
      else await prisma.project.create({ data });
    }

    console.log(`${cloud ? "云端" : "本地"}同步完成：3 篇个人文章，4 个原创项目，移除 ${removed.count} 个 Fork 项目。`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "个人内容同步失败");
  process.exitCode = 1;
});
