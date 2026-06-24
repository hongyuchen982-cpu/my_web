import { prisma } from "@/lib/db";

export interface Project {
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

export async function getProjectCount(): Promise<number> {
  return prisma.project.count();
}

export async function getProjects(): Promise<Project[]> {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return projects.map(toProjectView);
  } catch (error) {
    console.warn("[projects] getProjects failed, returning []:", (error as Error).message);
    return [];
  }
}

export async function getProjectsAdmin(userId: string): Promise<Project[]> {
  const projects = await prisma.project.findMany({
    where: { OR: [{ authorId: userId }, { authorId: null }] },
    orderBy: { sortOrder: "asc" },
  });

  return projects.map(toProjectView);
}

export async function getProjectById(
  id: string
): Promise<Project | undefined> {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return undefined;
  return toProjectView(project);
}

export async function getProjectByIdForUser(
  id: string,
  userId: string
): Promise<Project | undefined> {
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return undefined;
  // Allow access only if user owns it or it's legacy data (null authorId)
  if (project.authorId && project.authorId !== userId) return undefined;
  return toProjectView(project);
}

function toProjectView(p: {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  url: string | null;
  github: string | null;
  techs: string;
  sortOrder: number;
}): Project {
  let techs: string[] = [];
  try {
    techs = JSON.parse(p.techs);
  } catch {
    techs = [];
  }

  return {
    id: p.id,
    title: p.title,
    description: p.description,
    category: p.category,
    status: p.status as Project["status"],
    url: p.url ?? undefined,
    github: p.github ?? undefined,
    techs,
      sortOrder: p.sortOrder,
  };
}
