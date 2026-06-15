import { verifySession } from "@/lib/session";
import { getAllPostsAdmin } from "@/lib/posts";
import { deletePost } from "@/app/actions/posts";
import PostsManagement from "@/components/posts-management";

export default async function AdminPostsPage() {
  const session = await verifySession();
  const posts = await getAllPostsAdmin(session.userId);

  return <PostsManagement posts={posts} deleteAction={deletePost} />;
}
