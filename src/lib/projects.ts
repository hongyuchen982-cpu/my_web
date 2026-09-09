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

export async function getProjects(): Promise<Project[]> {
  try {
    const projects = await prisma.project.findMany({ orderBy: { sortOrder: "asc" } });
    return projects.map(toProjectView);
  } catch (error) {
    console.warn("[projects] getProjects failed:", (error as Error).message);
    return [];
  }
}

export async function getProjectById(id: string): Promise<Project | null> {
  try {
    const project = await prisma.project.findUnique({ where: { id } });
    return project ? toProjectView(project) : null;
  } catch (error) {
    console.warn("[projects] getProjectById failed:", (error as Error).message);
    return null;
  }
}

function toProjectView(p: {
  id: string; title: string; description: string; category: string; status: string;
  url: string | null; github: string | null; techs: string; sortOrder: number;
}): Project {
  let techs: string[] = [];
  try { techs = JSON.parse(p.techs); } catch { techs = []; }
  return {
    id: p.id, title: p.title, description: p.description,
    category: p.category, status: p.status as Project["status"],
    url: p.url ?? undefined, github: p.github ?? undefined,
    techs, sortOrder: p.sortOrder,
  };
}
