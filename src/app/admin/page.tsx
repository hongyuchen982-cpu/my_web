import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/db";
import { getAllPostsAdmin } from "@/lib/posts";
import { getProjects } from "@/lib/projects";
import AdminDashboard from "@/components/admin-dashboard";

export default async function AdminPage() {
  const session = await verifySession();
  const [userCount, posts, projects] = await Promise.all([
    prisma.user.count(),
    getAllPostsAdmin(session.userId),
    getProjects(),
  ]);

  return (
    <AdminDashboard
      userName={session.name}
      userCount={userCount}
      postsCount={posts.length}
      projectsCount={projects.length}
    />
  );
}
