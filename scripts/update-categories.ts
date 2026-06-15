// Add categories to existing posts
// Run with: npx tsx scripts/update-categories.ts

import { prisma } from "../src/lib/db";

async function main() {
  const posts = await prisma.post.findMany({ select: { slug: true, title: true } });
  console.log("Existing posts:");
  posts.forEach((p) => console.log(" ", p.slug, "-", p.title));

  const updates: Record<string, string> = {
    "how-to-understand-this-codebase": "Tech",
    "how-this-site-was-built": "Tech",
    "zero-to-understand-this-codebase": "Tech",
    untitled: "Notes",
  };

  for (const [slug, category] of Object.entries(updates)) {
    try {
      await prisma.post.update({
        where: { slug },
        data: { category },
      });
      console.log(`  Updated: ${slug} → ${category}`);
    } catch {
      console.log(`  Skipped: ${slug} (not found)`);
    }
  }

  await prisma.$disconnect();
  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
