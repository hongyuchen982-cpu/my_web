import "server-only";

import { createHash, randomUUID } from "node:crypto";
import {
  RecursiveCharacterTextSplitter,
  type SupportedTextSplitterLanguage,
} from "@langchain/textsplitters";
import { prisma } from "@/lib/db";

const CHUNK_SIZE = 1_400;
const CHUNK_OVERLAP = 200;
const MAX_CHUNKS = 800;

const LANGUAGE_MAP: Record<string, SupportedTextSplitterLanguage> = {
  TypeScript: "js",
  JavaScript: "js",
  Python: "python",
  Java: "java",
  Go: "go",
  Rust: "rust",
  C: "cpp",
  "C++": "cpp",
  Markdown: "markdown",
  MDX: "markdown",
  HTML: "html",
};

interface EmbeddingConfig {
  provider: "ollama" | "openai-compatible";
  apiKey?: string;
  baseUrl: string;
  model: string;
}

interface PreparedChunk {
  id: string;
  sourceId: string;
  fileId: string;
  chunkIndex: number;
  startLine: number;
  endLine: number;
  content: string;
  contentHash: string;
  embedding: string;
  embeddingModel: string;
  githubUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IndexResult {
  chunkCount: number;
  embeddingModel: string;
  embedded: boolean;
}

export interface KnowledgeMatch {
  kind: "project" | "post";
  projectId: string;
  repository: string;
  path: string;
  language: string;
  content: string;
  githubUrl: string;
  startLine: number;
  endLine: number;
  score: number;
  vector: number[];
}

function embeddingConfig(): EmbeddingConfig {
  const provider = (process.env.EMBEDDING_PROVIDER || process.env.AI_PROVIDER || "ollama").trim().toLowerCase();
  if (provider === "ollama") {
    return {
      provider: "ollama",
      baseUrl: (process.env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434").replace(/\/$/, ""),
      model: process.env.OLLAMA_EMBEDDING_MODEL?.trim() || "qwen3-embedding:0.6b",
    };
  }

  const apiKey = process.env.EMBEDDING_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("尚未配置本地 Ollama 或 EMBEDDING_API_KEY；设置 AI_PROVIDER=ollama 可免费向量化");
  }

  const rawBaseUrl = process.env.EMBEDDING_BASE_URL?.trim() || "https://api.openai.com/v1";
  const parsed = new URL(rawBaseUrl);
  if (parsed.protocol !== "https:") throw new Error("云端 EMBEDDING_BASE_URL 必须使用 https");

  return {
    provider: "openai-compatible",
    apiKey,
    baseUrl: rawBaseUrl.replace(/\/$/, ""),
    model: process.env.EMBEDDING_MODEL?.trim() || "text-embedding-3-small",
  };
}

function splitterFor(language: string) {
  const supported = LANGUAGE_MAP[language];
  const options = { chunkSize: CHUNK_SIZE, chunkOverlap: CHUNK_OVERLAP };
  return supported
    ? RecursiveCharacterTextSplitter.fromLanguage(supported, options)
    : new RecursiveCharacterTextSplitter({
        ...options,
        separators: ["\n\n", "\n", "。", "；", ". ", " ", ""],
      });
}

async function prepareChunks(source: {
  id: string;
  files: Array<{ id: string; path: string; language: string; content: string; githubUrl: string }>;
}): Promise<PreparedChunk[]> {
  const chunks: PreparedChunk[] = [];
  const now = new Date();

  for (const file of source.files) {
    const documents = await splitterFor(file.language).createDocuments(
      [file.content],
      [{ path: file.path, language: file.language }]
    );
    for (let index = 0; index < documents.length && chunks.length < MAX_CHUNKS; index += 1) {
      const document = documents[index];
      const content = document.pageContent.trim();
      if (!content) continue;
      const lines = document.metadata.loc?.lines as { from?: number; to?: number } | undefined;
      const startLine = Math.max(1, lines?.from ?? 1);
      const endLine = Math.max(startLine, lines?.to ?? startLine);
      chunks.push({
        id: randomUUID(),
        sourceId: source.id,
        fileId: file.id,
        chunkIndex: index,
        startLine,
        endLine,
        content,
        contentHash: createHash("sha256").update(`${file.path}\n${content}`).digest("hex"),
        embedding: "",
        embeddingModel: "",
        githubUrl: `${file.githubUrl}#L${startLine}-L${endLine}`,
        createdAt: now,
        updatedAt: now,
      });
    }
    if (chunks.length >= MAX_CHUNKS) break;
  }
  return chunks;
}

async function requestEmbeddings(inputs: string[], config: EmbeddingConfig): Promise<number[][]> {
  const ollama = config.provider === "ollama";
  const response = await fetch(`${config.baseUrl}${ollama ? "/api/embed" : "/embeddings"}`, {
    method: "POST",
    headers: {
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: config.model, input: inputs }),
    signal: AbortSignal.timeout(ollama ? 120_000 : 30_000),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Embedding API ${response.status}`);
  }

  const payload = await response.json() as {
    data?: Array<{ index: number; embedding: number[] }>;
    embeddings?: number[][];
  };
  if (ollama) {
    const vectors = payload.embeddings ?? [];
    if (vectors.length !== inputs.length || vectors.some((vector) => !Array.isArray(vector) || vector.length === 0)) {
      throw new Error("Ollama 返回了不完整的向量结果");
    }
    return vectors;
  }
  const ordered = [...(payload.data ?? [])].sort((a, b) => a.index - b.index);
  if (ordered.length !== inputs.length || ordered.some((item) => !Array.isArray(item.embedding) || item.embedding.length === 0)) {
    throw new Error("Embedding API 返回了不完整的向量结果");
  }
  return ordered.map((item) => item.embedding);
}

async function embedChunks(chunks: PreparedChunk[], config: EmbeddingConfig) {
  const batchSize = config.provider === "ollama" ? 16 : 10;
  for (let start = 0; start < chunks.length; start += batchSize) {
    const batch = chunks.slice(start, start + batchSize);
    const vectors = await requestEmbeddings(
      batch.map((chunk) => `Repository file\n${chunk.githubUrl}\n\n${chunk.content}`),
      config
    );
    batch.forEach((chunk, index) => {
      chunk.embedding = JSON.stringify(vectors[index]);
      chunk.embeddingModel = config.model;
    });
  }
}

/** Split the synced repository, optionally calling an OpenAI-compatible embedding endpoint. */
export async function buildProjectIndex(projectId: string, withEmbeddings: boolean): Promise<IndexResult> {
  const source = await prisma.knowledgeSource.findUnique({
    where: { projectId },
    include: { files: { orderBy: { path: "asc" } } },
  });
  if (!source?.enabled || source.status !== "ready") throw new Error("请先启用并同步 GitHub 知识库");
  if (source.files.length === 0) throw new Error("知识库中还没有可切片的文件");

  const chunks = await prepareChunks(source);
  if (chunks.length === 0) throw new Error("没有生成有效的知识切片");
  const config = withEmbeddings ? embeddingConfig() : null;

  try {
    if (config) await embedChunks(chunks, config);
    await prisma.$transaction(async (transaction) => {
      await transaction.knowledgeChunk.deleteMany({ where: { sourceId: source.id } });
      for (let start = 0; start < chunks.length; start += 40) {
        await transaction.knowledgeChunk.createMany({ data: chunks.slice(start, start + 40) });
      }
      await transaction.knowledgeSource.update({
        where: { id: source.id },
        data: {
          chunkCount: chunks.length,
          embeddingModel: config?.model ?? "",
          indexedCommitSha: source.lastCommitSha,
          indexedAt: new Date(),
          error: null,
        },
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "知识索引构建失败";
    await prisma.knowledgeSource.update({ where: { id: source.id }, data: { error: message.slice(0, 500) } });
    throw error;
  }

  return { chunkCount: chunks.length, embeddingModel: config?.model ?? "", embedded: Boolean(config) };
}

/** Split and embed one published article so the same RAG workflow can retrieve it. */
export async function buildPostIndex(slug: string, withEmbeddings: boolean): Promise<IndexResult> {
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post?.published) throw new Error("没有找到已发布的文章");
  if (!post.content.trim()) throw new Error("文章没有可索引的正文");

  const documents = await splitterFor("Markdown").createDocuments(
    [`# ${post.title}\n\n${post.excerpt}\n\n${post.content}`],
    [{ slug: post.slug, title: post.title }]
  );
  const now = new Date();
  const chunks = documents
    .map((document, chunkIndex) => {
      const content = document.pageContent.trim();
      const lines = document.metadata.loc?.lines as { from?: number; to?: number } | undefined;
      const startLine = Math.max(1, lines?.from ?? 1);
      return {
        id: randomUUID(),
        postId: post.id,
        chunkIndex,
        startLine,
        endLine: Math.max(startLine, lines?.to ?? startLine),
        content,
        contentHash: createHash("sha256").update(`${post.slug}\n${content}`).digest("hex"),
        embedding: "",
        embeddingModel: "",
        createdAt: now,
        updatedAt: now,
      };
    })
    .filter((chunk) => chunk.content);
  if (chunks.length === 0) throw new Error("没有生成有效的文章切片");

  const config = withEmbeddings ? embeddingConfig() : null;
  if (config) {
    const batchSize = config.provider === "ollama" ? 16 : 10;
    for (let start = 0; start < chunks.length; start += batchSize) {
      const batch = chunks.slice(start, start + batchSize);
      const vectors = await requestEmbeddings(
        batch.map((chunk) => `Published article\n${post.title}\n\n${chunk.content}`),
        config
      );
      batch.forEach((chunk, index) => {
        chunk.embedding = JSON.stringify(vectors[index]);
        chunk.embeddingModel = config.model;
      });
    }
  }

  await prisma.$transaction(async (transaction) => {
    await transaction.postKnowledgeChunk.deleteMany({ where: { postId: post.id } });
    await transaction.postKnowledgeChunk.createMany({ data: chunks });
  });
  return { chunkCount: chunks.length, embeddingModel: config?.model ?? "", embedded: Boolean(config) };
}

export function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length !== right.length || left.length === 0) return -1;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }
  const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
  return denominator ? dot / denominator : -1;
}

/**
 * A portfolio visitor will often ask about words copied directly from an article
 * title. Embedding similarity alone can under-rank those short queries, especially
 * when they mix Chinese and English (for example "Agent 等于 RAG 吗").
 */
export function titleMatchScore(query: string, title: string): number {
  const normalize = (value: string) => value.normalize("NFKC").toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu, "");
  const normalizedQuery = normalize(query);
  const normalizedTitle = normalize(title);
  if (normalizedQuery.length >= 4 && (normalizedTitle.includes(normalizedQuery) || normalizedQuery.includes(normalizedTitle))) {
    return 1;
  }

  const latinTerms = [...new Set(query.toLocaleLowerCase().match(/[a-z][a-z0-9.+#-]{1,}/g) ?? [])];
  if (latinTerms.length >= 2 && latinTerms.every((term) => normalizedTitle.includes(normalize(term)))) {
    return 0.98;
  }
  return 0;
}

/**
 * Preserve a direct textual hit alongside semantic search.  This matters for
 * section-heading questions in Chinese: punctuation and spaces can change the
 * embedding score even when the exact heading is present in an article.
 */
export function directTextMatchScore(query: string, text: string): number {
  const normalize = (value: string) => value.normalize("NFKC").toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu, "");
  const normalizedQuery = normalize(query);
  const normalizedText = normalize(text);
  return normalizedQuery.length >= 6 && normalizedText.includes(normalizedQuery) ? 0.99 : 0;
}

export async function embedKnowledgeTexts(inputs: string[]): Promise<number[][]> {
  if (inputs.length === 0) return [];
  return requestEmbeddings(inputs, embeddingConfig());
}

/** Exact cosine search is intentionally simple and reliable for a small portfolio knowledge base. */
export async function searchKnowledge(query: string, projectId?: string, limit = 8): Promise<KnowledgeMatch[]> {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length < 2 || normalizedQuery.length > 500) throw new Error("检索问题需要 2–500 个字符");
  const config = embeddingConfig();
  const [queryVector] = await requestEmbeddings([normalizedQuery], config);
  const chunks = await prisma.knowledgeChunk.findMany({
    where: {
      embedding: { not: "" },
      embeddingModel: config.model,
      source: { enabled: true, ...(projectId ? { projectId } : {}) },
    },
    include: {
      source: { select: { projectId: true, repository: true } },
      file: { select: { path: true, language: true } },
    },
  });

  const postChunks = projectId ? [] : await prisma.postKnowledgeChunk.findMany({
    where: {
      embedding: { not: "" },
      embeddingModel: config.model,
      post: { published: true },
    },
    include: { post: { select: { slug: true, title: true } } },
  });

  const projectMatches: KnowledgeMatch[] = chunks
    .map((chunk) => {
      let vector: number[] = [];
      try { vector = JSON.parse(chunk.embedding) as number[]; } catch { /* ignore malformed rows */ }
      return {
        kind: "project" as const,
        projectId: chunk.source.projectId,
        repository: chunk.source.repository,
        path: chunk.file.path,
        language: chunk.file.language,
        content: chunk.content,
        githubUrl: chunk.githubUrl,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        score: cosineSimilarity(queryVector, vector),
        vector,
      };
    });
  const articleMatches: KnowledgeMatch[] = postChunks.map((chunk) => {
    let vector: number[] = [];
    try { vector = JSON.parse(chunk.embedding) as number[]; } catch { /* ignore malformed rows */ }
    return {
      kind: "post" as const,
      projectId: "",
      repository: "article",
      path: chunk.post.title,
      language: "Markdown",
      content: chunk.content,
      githubUrl: `/posts/${chunk.post.slug}`,
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      score: Math.max(
        cosineSimilarity(queryVector, vector),
        titleMatchScore(normalizedQuery, chunk.post.title),
        directTextMatchScore(normalizedQuery, chunk.content)
      ),
      vector,
    };
  });

  return [...projectMatches, ...articleMatches]
    .filter((match) => match.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(Math.max(limit, 1), 20));
}
