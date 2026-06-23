// Add the Python to AI learning roadmap as a published post.
// Run with: npx tsx scripts/add-ai-roadmap.ts

import { prisma } from "../src/lib/db";
import * as fs from "fs";
import * as path from "path";

const SLUG = "python-to-ai-roadmap";
const CATEGORY = "AI";

// Read the markdown file
const mdPath = path.resolve("posts/ai-learning-roadmap/python-to-ai-roadmap.md");
const mdContent = fs.readFileSync(mdPath, "utf-8");

// Parse frontmatter
const fmMatch = mdContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
if (!fmMatch) {
  console.error("Invalid frontmatter format");
  process.exit(1);
}

const frontmatter = fmMatch[1];
const body = fmMatch[2];

function getField(key: string): string {
  const m = frontmatter.match(new RegExp(`^${key}:\\s*"(.*)"$`, "m"));
  return m ? m[1] : "";
}

const title = getField("title");
const excerpt = getField("excerpt");

async function main() {
  console.log(`Adding AI roadmap post...`);
  console.log(`  Title: ${title}`);
  console.log(`  Content length: ${mdContent.length} chars\n`);

  const existing = await prisma.post.findUnique({ where: { slug: SLUG } });
  if (existing) {
    console.log(`Post "${SLUG}" already exists. Updating content...`);
    await prisma.post.update({
      where: { slug: SLUG },
      data: {
        title,
        excerpt,
        content: mdContent,
        category: CATEGORY,
        published: true,
      },
    });
    console.log("Post updated.");
  } else {
    await prisma.post.create({
      data: {
        slug: SLUG,
        title,
        excerpt,
        content: mdContent,
        category: CATEGORY,
        published: true,
      },
    });
    console.log("Post created.");
  }

  console.log(`\nDone. Visit: /posts/${SLUG}\n`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
