import { verifySession } from "@/lib/session";
import { getProjectByIdForUser } from "@/lib/projects";
import { notFound } from "next/navigation";
import EditProjectForm from "./edit-project-form";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await verifySession();
  const { id } = await params;
  const project = await getProjectByIdForUser(id, session.userId);
  if (!project) notFound();

  return (
    <EditProjectForm
      initialData={{
        id: project.id,
        title: project.title,
        description: project.description,
        category: project.category,
        status: project.status,
        url: project.url ?? "",
        github: project.github ?? "",
        techs: JSON.stringify(project.techs),
        sortOrder: project.sortOrder,
      }}
    />
  );
}
