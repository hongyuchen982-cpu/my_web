import "server-only";

import { gunzipSync } from "node:zlib";
import { prisma } from "@/lib/db";

const MAX_FILES = 160;
const MAX_FILE_BYTES = 150_000;
const MAX_TOTAL_BYTES = 4_000_000;
const MAX_ARCHIVE_BYTES = 25_000_000;
const MAX_UNPACKED_BYTES = 60_000_000;

const ALLOWED_EXTENSIONS = new Set([
  ".md", ".mdx", ".txt",
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".py", ".java", ".go", ".rs", ".cs", ".c", ".h", ".cpp", ".hpp",
  ".sql", ".prisma", ".graphql", ".gql",
  ".json", ".yaml", ".yml", ".toml",
  ".css", ".scss", ".html", ".vue", ".svelte",
  ".sh", ".ps1",
]);

const EXCLUDED_DIRECTORIES = new Set([
  ".git", ".next", ".turbo", ".cache", ".idea", ".vscode",
  "node_modules", "dist", "build", "coverage", "vendor", "generated",
]);

const EXCLUDED_FILES = new Set([
  "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb",
  "migration_lock.toml", "credentials.json", "service-account.json",
  "agents.md", "claude.md", "gemini.md",
  "backup.sql", "dump.sql", "database.sql", "data.sql",
]);

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  ".md": "Markdown", ".mdx": "MDX", ".txt": "Text",
  ".ts": "TypeScript", ".tsx": "TypeScript", ".js": "JavaScript",
  ".jsx": "JavaScript", ".mjs": "JavaScript", ".cjs": "JavaScript",
  ".py": "Python", ".java": "Java", ".go": "Go", ".rs": "Rust",
  ".cs": "C#", ".c": "C", ".h": "C/C++", ".cpp": "C++", ".hpp": "C++",
  ".sql": "SQL", ".prisma": "Prisma", ".graphql": "GraphQL", ".gql": "GraphQL",
  ".json": "JSON", ".yaml": "YAML", ".yml": "YAML", ".toml": "TOML",
  ".css": "CSS", ".scss": "SCSS", ".html": "HTML", ".vue": "Vue",
  ".svelte": "Svelte", ".sh": "Shell", ".ps1": "PowerShell",
};

interface GitTreeEntry {
  path: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
}

interface DownloadedFile {
  path: string;
  sha: string;
  language: string;
  size: number;
  content: string;
  githubUrl: string;
}

export interface SyncResult {
  status: "synced" | "unchanged";
  fileCount: number;
  totalBytes: number;
  commitSha: string;
}

export function parseGitHubRepositoryUrl(githubUrl: string): { owner: string; repo: string; fullName: string } | null {
  try {
    const parsed = new URL(githubUrl);
    if (parsed.hostname.toLowerCase() !== "github.com") return null;
    const [owner, repoWithSuffix] = parsed.pathname.split("/").filter(Boolean);
    const repo = repoWithSuffix?.replace(/\.git$/i, "");
    if (!owner || !repo) return null;
    return { owner, repo, fullName: `${owner}/${repo}` };
  } catch {
    return null;
  }
}

function extension(path: string): string {
  const filename = path.split("/").at(-1) ?? "";
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.slice(dot).toLowerCase() : "";
}

function isSafeKnowledgeFile(entry: GitTreeEntry): boolean {
  if (entry.type !== "blob" || !entry.size || entry.size > MAX_FILE_BYTES) return false;
  const parts = entry.path.toLowerCase().split("/");
  const filename = parts.at(-1) ?? "";
  if (parts.some((part) => EXCLUDED_DIRECTORIES.has(part))) return false;
  if (EXCLUDED_FILES.has(filename)) return false;
  if (filename === ".env" || filename.startsWith(".env.")) return false;
  if (/\.(pem|key|p12|pfx|crt|cer)$/i.test(filename)) return false;
  return ALLOWED_EXTENSIONS.has(extension(entry.path));
}

function filePriority(path: string): number {
  const lower = path.toLowerCase();
  if (/^readme(?:\.|$)/.test(lower)) return 0;
  if (lower.startsWith("docs/") || lower.includes("/docs/")) return 1;
  if (lower.startsWith("src/") || lower.includes("/src/")) return 2;
  if (lower.startsWith("app/") || lower.includes("/app/")) return 3;
  if (lower.includes("prisma") || lower.includes("schema")) return 4;
  if (lower.includes("test") || lower.includes("spec")) return 6;
  return 5;
}

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return headers;
}

async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  attempts = 2,
  timeoutMs = 4_000
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (response.status < 500 || attempt === attempts - 1) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 150 * (attempt + 1)));
  }
  throw lastError instanceof Error ? lastError : new Error("网络请求失败");
}

async function githubJson<T>(path: string): Promise<T> {
  const response = await fetchWithRetry(
    `https://api.github.com${path}`,
    { headers: githubHeaders(), cache: "no-store" },
    3,
    8_000
  );
  if (!response.ok) {
    throw new Error(`GitHub API ${response.status}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

function tarText(buffer: Buffer, offset: number, length: number): string {
  const end = buffer.indexOf(0, offset);
  const safeEnd = end >= offset && end < offset + length ? end : offset + length;
  return buffer.toString("utf8", offset, safeEnd).trim();
}

async function downloadRepositoryFiles(
  owner: string,
  repo: string,
  commitSha: string,
  candidates: GitTreeEntry[]
): Promise<DownloadedFile[]> {
  const archiveUrl = `https://codeload.github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/tar.gz/${commitSha}`;
  const response = await fetchWithRetry(archiveUrl, { cache: "no-store" }, 3, 20_000);
  if (!response.ok) throw new Error(`GitHub archive ${response.status}: ${response.statusText}`);

  const declaredSize = Number(response.headers.get("content-length") || 0);
  if (declaredSize > MAX_ARCHIVE_BYTES) throw new Error("仓库压缩包超过 25 MB 安全限制");
  const compressed = Buffer.from(await response.arrayBuffer());
  if (compressed.length > MAX_ARCHIVE_BYTES) throw new Error("仓库压缩包超过 25 MB 安全限制");
  const archive = gunzipSync(compressed, { maxOutputLength: MAX_UNPACKED_BYTES });

  const wanted = new Map(candidates.map((entry) => [entry.path, entry]));
  const files: DownloadedFile[] = [];
  let offset = 0;

  while (offset + 512 <= archive.length && wanted.size > 0) {
    const name = tarText(archive, offset, 100);
    if (!name) break;
    const prefix = tarText(archive, offset + 345, 155);
    const fullName = prefix ? `${prefix}/${name}` : name;
    const sizeText = tarText(archive, offset + 124, 12).replace(/\0/g, "");
    const size = Number.parseInt(sizeText || "0", 8) || 0;
    const type = archive[offset + 156];
    const firstSlash = fullName.indexOf("/");
    const path = firstSlash >= 0 ? fullName.slice(firstSlash + 1) : fullName;
    const entry = wanted.get(path);

    if (entry && (type === 0 || type === 48) && size <= MAX_FILE_BYTES) {
      const content = archive.toString("utf8", offset + 512, offset + 512 + size);
      if (content.trim() && !content.includes("\u0000")) {
        const encodedPath = path.split("/").map(encodeURIComponent).join("/");
        files.push({
          path,
          sha: entry.sha,
          language: LANGUAGE_BY_EXTENSION[extension(path)] ?? "Text",
          size: Buffer.byteLength(content, "utf8"),
          content,
          githubUrl: `https://github.com/${owner}/${repo}/blob/${commitSha}/${encodedPath}`,
        });
      }
      wanted.delete(path);
    }

    offset += 512 + Math.ceil(size / 512) * 512;
  }

  return files;
}

export async function enableProjectKnowledge(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project?.github) throw new Error("项目没有配置 GitHub 地址");
  const repository = parseGitHubRepositoryUrl(project.github);
  if (!repository) throw new Error("GitHub 地址格式无效");

  return prisma.knowledgeSource.upsert({
    where: { projectId },
    create: { projectId, repository: repository.fullName, status: "pending", enabled: true },
    update: { repository: repository.fullName, enabled: true, status: "pending", error: null },
  });
}

export async function syncProjectRepository(projectId: string, force = false): Promise<SyncResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { knowledgeSource: true },
  });
  if (!project?.github) throw new Error("项目没有配置 GitHub 地址");
  const repository = parseGitHubRepositoryUrl(project.github);
  if (!repository) throw new Error("GitHub 地址格式无效");

  const source = await prisma.knowledgeSource.upsert({
    where: { projectId },
    create: { projectId, repository: repository.fullName, status: "syncing", enabled: true },
    update: { repository: repository.fullName, status: "syncing", enabled: true, error: null },
  });

  try {
    const metadata = await githubJson<{ default_branch: string }>(
      `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}`
    );
    const branch = metadata.default_branch;
    const commit = await githubJson<{ sha: string }>(
      `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}/commits/${encodeURIComponent(branch)}`
    );

    if (!force && source.lastCommitSha === commit.sha && project.knowledgeSource?.status === "ready") {
      await prisma.knowledgeSource.update({
        where: { id: source.id },
        data: { status: "ready", lastSyncedAt: new Date(), error: null },
      });
      return { status: "unchanged", fileCount: source.fileCount, totalBytes: source.totalBytes, commitSha: commit.sha };
    }

    const tree = await githubJson<{ tree: GitTreeEntry[]; truncated: boolean }>(
      `/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}/git/trees/${commit.sha}?recursive=1`
    );
    if (tree.truncated) throw new Error("仓库文件树过大，GitHub 返回了截断结果");

    let selectedBytes = 0;
    const candidates = tree.tree
      .filter(isSafeKnowledgeFile)
      .sort((a, b) => filePriority(a.path) - filePriority(b.path) || a.path.localeCompare(b.path))
      .filter((entry) => {
        if (selectedBytes + (entry.size ?? 0) > MAX_TOTAL_BYTES) return false;
        selectedBytes += entry.size ?? 0;
        return true;
      })
      .slice(0, MAX_FILES);

    const downloaded = await downloadRepositoryFiles(
      repository.owner,
      repository.repo,
      commit.sha,
      candidates
    );

    if (downloaded.length === 0) throw new Error("没有找到符合安全规则的文本或代码文件");
    if (downloaded.length < candidates.length * 0.8) {
      throw new Error(`只成功下载 ${downloaded.length}/${candidates.length} 个文件，已保留旧知识库`);
    }
    const totalBytes = downloaded.reduce((sum, file) => sum + file.size, 0);

    await prisma.$transaction(async (transaction) => {
      await transaction.knowledgeFile.deleteMany({ where: { sourceId: source.id } });
      await transaction.knowledgeFile.createMany({
        data: downloaded.map((file) => ({ ...file, sourceId: source.id })),
      });
      await transaction.knowledgeSource.update({
        where: { id: source.id },
        data: {
          repository: repository.fullName,
          defaultBranch: branch,
          lastCommitSha: commit.sha,
          status: "ready",
          enabled: true,
          fileCount: downloaded.length,
          totalBytes,
          chunkCount: 0,
          embeddingModel: "",
          indexedCommitSha: "",
          indexedAt: null,
          lastSyncedAt: new Date(),
          error: null,
        },
      });
    });

    return { status: "synced", fileCount: downloaded.length, totalBytes, commitSha: commit.sha };
  } catch (error) {
    const message = error instanceof Error ? error.message : "未知同步错误";
    await prisma.knowledgeSource.update({
      where: { id: source.id },
      data: { status: "failed", error: message.slice(0, 500) },
    });
    throw error;
  }
}
