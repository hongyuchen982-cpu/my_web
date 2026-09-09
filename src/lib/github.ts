/**
 * GitHub REST API client — fetches public repos for the portfolio.
 * Cached via Next.js fetch for ISR-compatible revalidation.
 */

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  created_at: string;
  archived: boolean;
  fork: boolean;
}

export interface GitHubReadme {
  content: string;
  htmlUrl: string;
}

const DEFAULT_GITHUB_USER = "hongyuchen982-cpu";
const DEFAULT_INCLUDED_FORKS = ["hongyuchen982-cpu/workflowWithComfyUI"];

function includedForks(): Set<string> {
  const configured = process.env.GITHUB_INCLUDED_FORKS
    ?.split(",")
    .map((name) => name.trim())
    .filter(Boolean);
  return new Set((configured?.length ? configured : DEFAULT_INCLUDED_FORKS).map((name) => name.toLowerCase()));
}

/** Keep original repositories plus forks the owner explicitly selected for the portfolio. */
export function isPortfolioRepository(repo: Pick<GitHubRepo, "full_name" | "fork" | "archived">): boolean {
  return !repo.archived && (!repo.fork || includedForks().has(repo.full_name.toLowerCase()));
}

function getGitHubApiUrl(): string {
  const username = process.env.GITHUB_USERNAME?.trim() || DEFAULT_GITHUB_USER;
  return `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=100`;
}

/**
 * Fetch public repos from GitHub.
 * Uses `next.revalidate` to cache for 10 minutes.
 * If GITHUB_TOKEN is set in env, authenticated requests get 5000/hr vs 60/hr.
 */
export async function fetchGitHubRepos(): Promise<GitHubRepo[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(getGitHubApiUrl(), {
      headers,
      next: { revalidate: 600 }, // cache 10 min
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[github] API returned ${res.status}: ${res.statusText}`);
      return [];
    }

    const repos: GitHubRepo[] = await res.json();

    // Portfolio candidates: originals plus explicitly selected, active forks.
    return repos
      .filter(isPortfolioRepository)
      .sort((a, b) => b.stargazers_count - a.stargazers_count);
  } catch {
    clearTimeout(timeoutId);
    console.warn("[github] Failed to fetch repos");
    return [];
  }
}

/** Load a public repository README for the project detail page. */
export async function fetchGitHubReadme(
  githubUrl?: string | null
): Promise<GitHubReadme | null> {
  if (!githubUrl) return null;

  let parsed: URL;
  try {
    parsed = new URL(githubUrl);
  } catch {
    return null;
  }
  if (parsed.hostname.toLowerCase() !== "github.com") return null;

  const [owner, repoWithSuffix] = parsed.pathname.split("/").filter(Boolean);
  const repo = repoWithSuffix?.replace(/\.git$/i, "");
  if (!owner || !repo) return null;

  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`,
      { headers, next: { revalidate: 1800 }, signal: controller.signal }
    );
    if (!response.ok) return null;

    const data: { content?: string; encoding?: string; html_url?: string } = await response.json();
    if (!data.content || data.encoding !== "base64") return null;

    const content = Buffer.from(data.content.replace(/\s/g, ""), "base64")
      .toString("utf8")
      .replace(/^#\s+.+(?:\r?\n)+/, "");
    return {
      content,
      htmlUrl: data.html_url || `${githubUrl.replace(/\/$/, "")}/#readme`,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Normalize GitHub URLs before comparing DB selections with API repositories. */
export function normalizeGitHubUrl(url?: string | null): string {
  if (!url) return "";
  return url.trim().replace(/\.git$/i, "").replace(/\/$/, "").toLowerCase();
}

/** Map a GitHub repo to a shape compatible with the ProjectCard component. */
export function repoToProjectView(repo: GitHubRepo) {
  return {
    id: `gh-${repo.id}`,
    title: repo.name,
    description: repo.description ?? "暂无描述",
    category: repo.language ?? "Code",
    status: "active" as const,
    url: repo.homepage ?? undefined,
    github: repo.html_url,
    techs: repo.topics.slice(0, 6),
    sortOrder: 0,
  };
}

export interface GitHubProjectView {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "active" | "wip" | "maintained" | "archived";
  url?: string;
  github?: string;
  techs: string[];
  sortOrder: number;
}

/** Merge DB projects with GitHub projects, deduplicating by github URL. */
export function mergeProjects<T extends { github?: string | null }>(
  dbProjects: T[],
  githubProjects: GitHubProjectView[]
): (T | GitHubProjectView)[] {
  const dbGithubUrls = new Set(
    dbProjects.map((p) => normalizeGitHubUrl(p.github)).filter(Boolean)
  );
  const freshGithubProjects = githubProjects.filter(
    (p) => !dbGithubUrls.has(normalizeGitHubUrl(p.github))
  );
  return [...dbProjects, ...freshGithubProjects];
}
