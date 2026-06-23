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

const GITHUB_USER = "hongyuchen982-cpu";
const GITHUB_API = `https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=20`;

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
    const res = await fetch(GITHUB_API, {
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

    // Filter: only exclude archived repos
    return repos
      .filter((r) => !r.archived)
      .sort((a, b) => b.stargazers_count - a.stargazers_count);
  } catch {
    clearTimeout(timeoutId);
    console.warn("[github] Failed to fetch repos");
    return [];
  }
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
    dbProjects.map((p) => p.github).filter(Boolean) as string[]
  );
  const freshGithubProjects = githubProjects.filter(
    (p) => !dbGithubUrls.has(p.github!)
  );
  return [...dbProjects, ...freshGithubProjects];
}
