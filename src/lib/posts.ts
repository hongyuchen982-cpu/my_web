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

export async function getAllPosts(limit?: number): Promise<Post[]> {
  try {
    const posts = await prisma.post.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { author: { select: { name: true, email: true } } },
    });
    return posts.map(toPostView);
  } catch (error) {
    console.warn("[posts] getAllPosts failed:", (error as Error).message);
    return [];
  }
}

export async function getPublishedPostCount(): Promise<number> {
  try {
    return await prisma.post.count({ where: { published: true } });
  } catch (error) {
    console.warn("[posts] getPublishedPostCount failed:", (error as Error).message);
    return 0;
  }
}

export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  try {
    const post = await prisma.post.findFirst({
      where: { slug, published: true },
      include: { author: { select: { name: true, email: true } } },
    });
    if (!post) return undefined;
    return toPostView(post);
  } catch (error) {
    console.warn("[posts] getPostBySlug failed:", (error as Error).message);
    return undefined;
  }
}

function toPostView(p: {
  id: string; slug: string; title: string; excerpt: string; content: string;
  category: string; published: boolean; createdAt: Date; updatedAt: Date;
  authorId?: string | null; author?: { name: string; email: string } | null;
}): Post {
  return {
    id: p.id, slug: p.slug, title: p.title,
    date: p.createdAt.toISOString(), excerpt: p.excerpt, content: p.content,
    category: p.category, published: p.published,
    readTime: estimateReadTime(p.content),
    authorId: p.authorId ?? null,
    author: p.author ? { name: p.author.name, email: p.author.email } : null,
  };
}
