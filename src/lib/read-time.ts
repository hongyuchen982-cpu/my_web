/**
 * Estimate reading time for a text (Markdown or plain).
 * Chinese: ~400 chars/min. English: ~200 words/min.
 * Returns e.g. "5 min read" or "1 min read".
 */

const CHARS_PER_MIN_ZH = 400;
const WORDS_PER_MIN_EN = 200;

export function estimateReadTime(text: string): string {
  if (!text) return "1 min read";

  // Count Chinese characters
  const zhChars = (text.match(/[一-鿿㐀-䶿]/g) || []).length;

  // Count English words (non-CJK text)
  const nonZh = text.replace(/[一-鿿㐀-䶿]/g, " ");
  const enWords = nonZh
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  const zhMinutes = zhChars / CHARS_PER_MIN_ZH;
  const enMinutes = enWords / WORDS_PER_MIN_EN;
  const totalMinutes = Math.max(1, Math.ceil(zhMinutes + enMinutes));

  return `${totalMinutes} min read`;
}
