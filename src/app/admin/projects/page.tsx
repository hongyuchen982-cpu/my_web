import { verifySession } from "@/lib/session";
import { getProjects } from "@/lib/projects";
import { deleteProject } from "@/app/actions/projects";
import ProjectsManagement from "@/components/projects-management";

export default async function AdminProjectsPage() {
  await verifySession();
  const projects = await getProjects();

  return <ProjectsManagement projects={projects} deleteAction={deleteProject} />;
}
