import { prisma } from "@/lib/db";
import { estimateReadTime } from "@/lib/read-time";

export interface Author {
  name: string;
  email: string;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  content: string;
  category: string;
  published: boolean;
  readTime: string;
  authorId?: string | null;
  author?: Author | null;
}

export async function getPostCount(userId?: string): Promise<number> {
  return prisma.post.count({
    where: userId ? { authorId: userId } : { published: true },
  });
}

export async function getAllPosts(limit?: number): Promise<Post[]> {
  const posts = await prisma.post.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { author: { select: { name: true, email: true } } },
  });

  return posts.map(toPostView);
}

export async function getAllPostsAdmin(userId: string): Promise<Post[]> {
  const posts = await prisma.post.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true, email: true } } },
  });

  return posts.map(toPostView);
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  const post = await prisma.post.findFirst({
    where: { slug, published: true },
    include: { author: { select: { name: true, email: true } } },
  });
  if (!post) return undefined;
  return toPostView(post);
}

export async function getPostById(id: string): Promise<Post | undefined> {
  const post = await prisma.post.findUnique({
    where: { id },
    include: { author: { select: { name: true, email: true } } },
  });
  if (!post) return undefined;
  return toPostView(post);
}

function toPostView(p: {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
  authorId?: string | null;
  author?: { name: string; email: string } | null;
}): Post {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    date: p.createdAt.toISOString(),
    excerpt: p.excerpt,
    content: p.content,
    category: p.category,
    published: p.published,
    readTime: estimateReadTime(p.content),
    authorId: p.authorId ?? null,
    author: p.author
      ? { name: p.author.name, email: p.author.email }
      : null,
  };
}
