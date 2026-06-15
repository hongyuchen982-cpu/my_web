import { verifySession } from "@/lib/session";
import { getPostById } from "@/lib/posts";
import { notFound } from "next/navigation";
import EditPostForm from "./edit-post-form";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await verifySession();
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  return (
    <EditPostForm
      initialData={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category ?? "",
        published: post.published,
      }}
    />
  );
}
