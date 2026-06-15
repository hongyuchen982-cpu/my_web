"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import MDXContent from "@/components/mdx-content";
import { useLang } from "@/components/language-provider";
import { t } from "@/lib/i18n";

const inputClass =
  "w-full px-3.5 py-2.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-fg)] placeholder-[var(--color-fg-muted)] focus:outline-none focus:border-[var(--color-accent)]/50 focus:ring-1 focus:ring-[var(--color-accent)]/20 transition-all font-mono";
const labelClass = "block text-xs font-mono text-[var(--color-fg-muted)] mb-1.5";

interface PostEditorProps {
  initialTitle?: string;
  initialSlug?: string;
  initialExcerpt?: string;
  initialContent?: string;
  initialCategory?: string;
  initialPublished?: boolean;
  submitLabel: string;
}

export default function PostEditor({
  initialTitle = "",
  initialSlug = "",
  initialExcerpt = "",
  initialContent = "",
  initialCategory = "",
  initialPublished = false,
  submitLabel,
}: PostEditorProps) {
  const { lang } = useLang();
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [excerpt, setExcerpt] = useState(initialExcerpt);
  const [content, setContent] = useState(initialContent);
  const [category, setCategory] = useState(initialCategory);
  const [published, setPublished] = useState(initialPublished);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Sync scroll between editor and preview
  const syncScroll = useCallback(() => {
    if (!editorRef.current || !previewRef.current) return;
    const editor = editorRef.current;
    const preview = previewRef.current;
    const ratio =
      editor.scrollTop / (editor.scrollHeight - editor.clientHeight || 1);
    preview.scrollTop =
      ratio * (preview.scrollHeight - preview.clientHeight);
  }, []);

  const generateSlug = useCallback((t: string) => {
    const s = t
      .toLowerCase()
      .replace(/[^a-z0-9一-鿿]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/[一-鿿]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
    return s || "untitled";
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!initialSlug || slug === generateSlug(initialTitle)) {
      setSlug(generateSlug(newTitle));
    }
  };

  // Tab key support in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = textarea.value.substring(0, start);
      const after = textarea.value.substring(end);
      setContent(before + "  " + after);
      // Restore cursor after the inserted spaces
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Title + Slug row */}
      <div className="grid grid-cols-[1fr_auto] gap-4">
        <div>
          <label htmlFor="title" className={labelClass}>
            {t("title", lang)}
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={title}
            onChange={handleTitleChange}
            className={inputClass}
            placeholder={t("title", lang)}
          />
        </div>
        <div className="w-52">
          <label htmlFor="slug" className={labelClass}>
            {t("slug", lang)}
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className={inputClass}
            placeholder="my-post-slug"
            pattern="^[a-z0-9-]+$"
          />
          <p className="text-[10px] text-[var(--color-fg-muted)] mt-1 font-mono">
            a-z, 0-9, -
          </p>
        </div>
      </div>

      {/* Excerpt */}
      <div>
        <label htmlFor="excerpt" className={labelClass}>
          {t("excerpt", lang)}
        </label>
        <input
          id="excerpt"
          name="excerpt"
          type="text"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className={inputClass}
          placeholder={lang === "zh" ? "简短描述…" : "A brief description…"}
        />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className={labelClass}>
          {lang === "zh" ? "分类" : "Category"}
        </label>
        <input
          id="category"
          name="category"
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputClass}
          placeholder={lang === "zh" ? "Tech / Life / Notes…" : "Tech / Life / Notes…"}
        />
      </div>

      {/* ── Side-by-side MD Editor + Preview ── */}
      <div>
        <label className={labelClass}>
          {lang === "zh" ? "正文 (Markdown)" : "Content (Markdown)"}
        </label>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-bg)]">
          {/* Editor pane */}
          <div className="flex flex-col min-h-[420px] max-h-[600px]">
            <div className="px-3 py-1.5 border-b border-[var(--color-border)] bg-[var(--color-surface)] shrink-0">
              <span className="text-[10px] font-mono text-[var(--color-fg-muted)] tracking-wider uppercase">
                MARKDOWN
              </span>
            </div>
            <textarea
              ref={editorRef}
              id="content"
              name="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onScroll={syncScroll}
              onKeyDown={handleKeyDown}
              className="flex-1 w-full resize-none bg-transparent px-4 py-3 text-sm text-[var(--color-fg)] placeholder-[var(--color-fg-muted)] focus:outline-none font-mono leading-relaxed"
              placeholder={
                lang === "zh"
                  ? "# 开始写 Markdown…\n\n输入内容，右侧实时渲染预览。"
                  : "# Start writing Markdown…\n\nType here, preview renders on the right."
              }
              spellCheck={false}
            />
          </div>

          {/* Preview pane */}
          <div
            ref={previewRef}
            className="overflow-y-auto min-h-[420px] max-h-[600px] px-5 py-4 border-l border-[var(--color-border)] bg-[var(--color-bg)]"
          >
            <div className="px-2 py-1 mb-3 border-b border-[var(--color-border)] -mx-3 -mt-1">
              <span className="text-[10px] font-mono text-[var(--color-fg-muted)] tracking-wider uppercase">
                PREVIEW
              </span>
            </div>
            {content ? (
              <MDXContent content={content} />
            ) : (
              <p className="text-sm text-[var(--color-fg-muted)] font-mono mt-8 text-center">
                {lang === "zh"
                  ? "← 在左侧输入 Markdown，这里实时预览"
                  : "← Write Markdown on the left, preview shows here"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Published toggle */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="published"
            value="true"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="w-4 h-4 rounded border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]/20"
          />
          <span className="text-xs font-mono text-[var(--color-fg-muted)]">
            {lang === "zh"
              ? "公开发布（对所有人可见）"
              : "Published (visible to everyone)"}
          </span>
        </label>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full py-2.5 px-4 bg-[var(--color-accent)] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 transition-all tracking-wide font-mono"
      >
        {submitLabel}
      </button>
    </div>
  );
}
