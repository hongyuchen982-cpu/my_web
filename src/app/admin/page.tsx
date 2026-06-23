import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getPostCount } from "@/lib/posts";
import { getProjectCount } from "@/lib/projects";
import AdminDashboard from "@/components/admin-dashboard";

export default async function AdminPage() {
  const session = await verifySession();
  const [userCount, postsCount, projectsCount] = await Promise.all([
    prisma.user.count(),
    getPostCount(session.userId),
    getProjectCount(),
  ]);

  return (
    <AdminDashboard
      userName={session.name}
      userCount={userCount}
      postsCount={postsCount}
      projectsCount={projectsCount}
    />
  );
}
