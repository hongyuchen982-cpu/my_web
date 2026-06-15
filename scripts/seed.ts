// Seed script: migrate existing markdown posts and hardcoded projects into the database.
// Run with: npx tsx scripts/seed.ts

import { prisma } from "../src/lib/db";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

async function seedPosts() {
  const postsDir = path.join(process.cwd(), "posts");
  if (!fs.existsSync(postsDir)) {
    console.log("No posts directory found, skipping post migration.");
    return;
  }

  const filenames = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"));

  for (const filename of filenames) {
    const slug = filename.replace(/\.md$/, "");
    const filePath = path.join(postsDir, filename);
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);

    const existing = await prisma.post.findUnique({ where: { slug } });
    if (existing) {
      console.log(`  Post "${slug}" already exists, skipping.`);
      continue;
    }

    await prisma.post.create({
      data: {
        slug,
        title: data.title ?? slug,
        excerpt: data.excerpt ?? content.slice(0, 160).replace(/#/g, "").trim(),
        content,
        published: true,
        createdAt: data.date ? new Date(data.date) : new Date(),
      },
    });
    console.log(`  Created post: "${data.title ?? slug}"`);
  }
}

async function seedProjects() {
  const existingCount = await prisma.project.count();
  if (existingCount > 0) {
    console.log("Projects already exist in database, skipping.");
    return;
  }

  const projects = [
    {
      title: "Smart Grid — 智能电网调度系统",
      description:
        "基于 AI 预测的电力负载调度系统，支持实时监控与动态路由分配，面向新能源并网场景。",
      category: "AI / Energy",
      status: "active",
      url: "https://github.com",
      techs: JSON.stringify(["Python", "PyTorch", "React", "WebSocket"]),
      sortOrder: 0,
    },
    {
      title: "BMS 电池管理系统",
      description:
        "下一代电池管理系统前端面板，实时 SOC/SOH 可视化，支持多电芯级联监控与故障预警。",
      category: "IoT / Energy",
      status: "wip",
      github: "https://github.com",
      techs: JSON.stringify(["TypeScript", "Next.js", "D3.js", "MQTT"]),
      sortOrder: 1,
    },
    {
      title: "Code Vault — 代码片段管理器",
      description:
        "面向开发者的本地优先代码片段管理工具，支持标签分类、全文搜索与 VS Code 插件集成。",
      category: "DevTools",
      status: "maintained",
      url: "https://github.com",
      techs: JSON.stringify(["Rust", "Tauri", "React", "SQLite"]),
      sortOrder: 2,
    },
    {
      title: "NetProbe 网络探测工具",
      description:
        "轻量级网络质量探测 CLI，支持延迟/丢包/抖动多维监控，输出 Prometheus 格式指标。",
      category: "Infra / Net",
      status: "archived",
      github: "https://github.com",
      techs: JSON.stringify(["Go", "gRPC", "Prometheus"]),
      sortOrder: 3,
    },
  ];

  for (const project of projects) {
    await prisma.project.create({ data: project });
    console.log(`  Created project: "${project.title}"`);
  }
}

async function main() {
  console.log("Seeding database…\n");

  console.log("Posts:");
  await seedPosts();

  console.log("\nProjects:");
  await seedProjects();

  console.log("\nDone.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
