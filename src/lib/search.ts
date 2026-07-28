/**
 * RAG 检索层 — 中文二元组（bigram）分词 + 全文关键词匹配。
 * 12 篇文章 + 5 个项目，不需要向量数据库。
 */
import { prisma } from "@/lib/db";

export interface SearchResult {
  type: "post" | "project";
  title: string;
  slug?: string;
  content: string;
  url: string;
  score: number;
}

/**
 * 中文分词：生成二元组，同时保留空格分隔的英文关键词。
 * "什么是三重殖民" → ["什么","么是","是三","三重","重殖","殖民"]
 */
function tokenize(text: string): string[] {
  const lower = text.toLowerCase().trim();
  const tokens: string[] = [];

  // 1. 提取空格分隔的英文/数字词
  const spaceWords = lower.split(/\s+/).filter(Boolean);
  for (const w of spaceWords) {
    tokens.push(w);
  }

  // 2. 对整个文本做汉字/字母的二元组（覆盖中文和无空格英文）
  // 去掉空格和标点后，每连续2个字符做成一个 bigram
  const stripped = lower.replace(/[\s，。！？、；：""''（）《》【】\[\]{}.,!?;:'"()<>]/g, "");
  if (stripped.length >= 2) {
    for (let i = 0; i < stripped.length - 1; i++) {
      tokens.push(stripped.slice(i, i + 2));
    }
  }

  // 3. 去重
  return [...new Set(tokens)];
}

/**
 * 计算单篇内容的匹配分数。
 * 关键词精确命中 +1 分，标题命中额外 +2 分。
 */
function scoreText(
  tokens: string[],
  title: string,
  body: string
): number {
  const t = title.toLowerCase();
  const b = body.toLowerCase();
  let s = 0;
  for (const tok of tokens) {
    if (t.includes(tok)) s += 3; // 标题命中权重高
    else if (b.includes(tok)) s += 1;
  }
  return s;
}

/** 始终返回 top 5，确保 query 无效时也有兜底结果 */
const TOP_K = 5;

export async function searchRelevant(query: string): Promise<{
  results: SearchResult[];
  context: string;
}> {
  const tokens = tokenize(query);
  console.log(`[search] query="${query}" tokens=[${tokens.slice(0, 20)}]`);

  // 查文章
  let posts: { title: string; slug: string; content: string; category: string }[];
  try {
    posts = await prisma.post.findMany({
      where: { published: true },
      select: { title: true, slug: true, content: true, category: true },
    });
  } catch (e) {
    console.error("[search] 文章查询失败:", (e as Error).message);
    posts = [];
  }

  // 查项目
  let projects: { title: string; description: string; category: string; techs: string }[];
  try {
    projects = await prisma.project.findMany({
      select: { title: true, description: true, category: true, techs: true },
    });
  } catch (e) {
    console.error("[search] 项目查询失败:", (e as Error).message);
    projects = [];
  }

  console.log(`[search] fetched posts=${posts.length} projects=${projects.length}`);

  // 打分
  const scored: SearchResult[] = [];

  for (const p of posts) {
    const s = scoreText(tokens, p.title, `${p.category} ${p.content}`);
    scored.push({
      type: "post",
      title: p.title,
      slug: p.slug,
      content: p.content.slice(0, 2000),
      url: `/posts/${p.slug}`,
      score: s,
    });
  }

  for (const p of projects) {
    const s = scoreText(tokens, p.title, `${p.category} ${p.description} ${p.techs}`);
    scored.push({
      type: "project",
      title: p.title,
      content: `${p.title}: ${p.description}。技术栈: ${p.techs}`,
      url: "/projects",
      score: s,
    });
  }

  // 按分数降序，取 top K，但至少返回最高分的
  scored.sort((a, b) => b.score - a.score);
  const cut = Math.max(TOP_K, scored.findIndex((r) => r.score === 0));
  const top = scored.slice(0, Math.min(cut, TOP_K) || TOP_K);
  // 如果真的全是 0 分，至少给 top 3 让 AI 有东西可读
  const final = top.length > 0 ? top : scored.slice(0, 3);

  console.log(`[search] results: ${final.map(r => `${r.title}(${r.score})`).join(", ") || "(none)"}`);

  const context = final
    .map(
      (r, i) =>
        `[${i + 1}] ${r.type === "post" ? "文章" : "项目"}：${r.title}\n链接：${r.url}\n内容：${r.content}`
    )
    .join("\n\n");

  return { results: final, context };
}
