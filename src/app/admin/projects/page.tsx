import { verifySession } from "@/lib/session";
import { getProjectsAdmin } from "@/lib/projects";
import { deleteProject } from "@/app/actions/projects";
import ProjectsManagement from "@/components/projects-management";

export default async function AdminProjectsPage() {
  const session = await verifySession();
  const projects = await getProjectsAdmin(session.userId);

  return <ProjectsManagement projects={projects} deleteAction={deleteProject} />;
}
