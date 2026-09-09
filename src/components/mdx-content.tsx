import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ComponentPropsWithoutRef } from "react";

const border = "border-[var(--color-border)]";
const surface = "bg-[var(--color-surface)]";

function Blockquote({ children }: ComponentPropsWithoutRef<"blockquote">) {
  return (
    <blockquote className="my-6 border-l-2 border-[var(--color-accent)]/40 pl-5 text-base leading-8 text-[var(--color-fg-dim)] not-italic">
      {children}
    </blockquote>
  );
}

function CodeSpan({ children }: ComponentPropsWithoutRef<"code">) {
  return (
    <code className={`${surface} text-[var(--color-accent)] rounded px-1.5 py-0.5 text-[0.88em] font-mono before:content-none after:content-none border ${border}`}>
      {children ?? ""}
    </code>
  );
}

function PreBlock({ children }: ComponentPropsWithoutRef<"pre">) {
  return (
    <pre className={`bg-[var(--color-bg)] border ${border} rounded-xl p-5 my-5 overflow-x-auto text-sm text-[var(--color-fg)] leading-relaxed font-mono`}>
      {children}
    </pre>
  );
}

const components = {
  blockquote: Blockquote,
  code: CodeSpan,
  pre: PreBlock,
  h1: ({ children, ...props }: ComponentPropsWithoutRef<"h1">) => (
    <h1 className="mb-5 mt-12 text-3xl font-bold leading-snug tracking-tight text-[var(--color-fg)]" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }: ComponentPropsWithoutRef<"h2">) => (
    <h2 className="mb-4 mt-10 text-2xl font-semibold leading-snug tracking-tight text-[var(--color-fg)]" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: ComponentPropsWithoutRef<"h3">) => (
    <h3 className="mb-3 mt-8 text-xl font-semibold leading-snug text-[var(--color-fg)]" {...props}>{children}</h3>
  ),
  p: ({ children, ...props }: ComponentPropsWithoutRef<"p">) => (
    <p className="my-4 text-base leading-8 text-[var(--color-fg-dim)]" {...props}>{children}</p>
  ),
  a: ({ children, ...props }: ComponentPropsWithoutRef<"a">) => (
    <a className="text-[var(--color-accent)] underline underline-offset-2 decoration-[var(--color-accent)]/30 hover:decoration-[var(--color-accent)] transition-colors" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
  ),
  ul: ({ children, ...props }: ComponentPropsWithoutRef<"ul">) => (
    <ul className="my-4 list-disc space-y-2 pl-6 text-base text-[var(--color-fg-dim)]" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: ComponentPropsWithoutRef<"ol">) => (
    <ol className="my-4 list-decimal space-y-2 pl-6 text-base text-[var(--color-fg-dim)]" {...props}>{children}</ol>
  ),
  li: ({ children, ...props }: ComponentPropsWithoutRef<"li">) => (
    <li className="leading-relaxed" {...props}>{children}</li>
  ),
  strong: ({ children, ...props }: ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold text-[var(--color-fg)]" {...props}>{children}</strong>
  ),
  hr: (props: ComponentPropsWithoutRef<"hr">) => (
    <hr className={`my-8 ${border}`} {...props} />
  ),
  img: ({ alt, ...props }: ComponentPropsWithoutRef<"img">) => (
    <img className={`rounded-xl my-6 max-w-full border ${border}`} alt={alt} {...props} />
  ),
};

export default function MDXContent({ content }: { content: string }) {
  if (!content) return null;
  return (
    <div className="max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
