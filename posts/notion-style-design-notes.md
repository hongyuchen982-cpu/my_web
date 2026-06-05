---
title: "Notion-Style Design Notes"
date: "2026-06-03"
excerpt: "A breakdown of the design principles behind this blog's Notion-inspired aesthetic."
---

## Typography First

Notion's design language is fundamentally **typography-driven**. It uses a single sans-serif typeface (Inter) across the entire product, relying on weight, size, and spacing — not color — to establish hierarchy.

### The Principles

1. **One typeface, many weights** — Inter at 400, 500, 600 covers everything
2. **Generous line height** — body text sits at `leading-relaxed` (1.625)
3. **Constrained width** — content never exceeds `max-w-3xl` (48rem / ~768px)
4. **Subtle color palette** — `text-neutral-800` on white, nothing loud

> Design is not just what it looks like and feels like. Design is how it works.

## Blockquote Treatment

Notion blockquotes use a simple left border accent — no background fill, no italics. This creates a clean visual break without pulling too much attention:

> This is what a blockquote looks like. Notice the left border and the absence of a background color or italic styling. It's understated but clear.

## Inline Code

For `inline code`, Notion uses a light gray background with colored text. The contrast is subtle enough to not interrupt reading flow but distinct enough to be noticed.

## Cards & Surfaces

Cards in Notion have:
- No box shadow
- A light border (`border-neutral-200`)
- Slight rounding (`rounded-lg`)
- Hover state that darkens the border

This keeps surfaces flat and minimal, avoiding the "floating card" look.
