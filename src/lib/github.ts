export interface GitHubRepo {
  name: string;
  description: string;
  stars: number;
  url: string;
  language: string;
}

export async function getGitHubRepos(): Promise<GitHubRepo[]> {
  const username = process.env.GITHUB_USERNAME;
  if (!username) return [];

  try {
    const res = await fetch(
      `https://api.github.com/users/${username}/repos?sort=updated&per_page=6`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          ...(process.env.GITHUB_TOKEN
            ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
            : {}),
        },
        next: { revalidate: 3600 },
      }
    );

    if (!res.ok) return [];

    const repos = await res.json();

    return repos.map((repo: Record<string, unknown>) => ({
      name: repo.name as string,
      description: (repo.description as string) ?? "",
      stars: repo.stargazers_count as number,
      url: repo.html_url as string,
      language: (repo.language as string) ?? "",
    }));
  } catch {
    return [];
  }
}
