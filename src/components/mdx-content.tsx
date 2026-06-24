import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ComponentPropsWithoutRef } from "react";

const border = "border-[var(--color-border)]";
const surface = "bg-[var(--color-surface)]";

function Blockquote({ children }: ComponentPropsWithoutRef<"blockquote">) {
  return (
    <blockquote className="border-l-2 border-[var(--color-accent)]/40 pl-5 my-5 text-[var(--color-fg-dim)] not-italic text-sm leading-relaxed">
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
    <h1 className="text-2xl font-bold text-[var(--color-fg)] mt-10 mb-4 leading-snug tracking-tight" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }: ComponentPropsWithoutRef<"h2">) => (
    <h2 className="text-xl font-semibold text-[var(--color-fg)] mt-8 mb-3 leading-snug tracking-tight" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: ComponentPropsWithoutRef<"h3">) => (
    <h3 className="text-lg font-semibold text-[var(--color-fg)] mt-6 mb-2 leading-snug" {...props}>{children}</h3>
  ),
  p: ({ children, ...props }: ComponentPropsWithoutRef<"p">) => (
    <p className="my-3 leading-relaxed text-[var(--color-fg-dim)] text-[0.9375rem]" {...props}>{children}</p>
  ),
  a: ({ children, ...props }: ComponentPropsWithoutRef<"a">) => (
    <a className="text-[var(--color-accent)] underline underline-offset-2 decoration-[var(--color-accent)]/30 hover:decoration-[var(--color-accent)] transition-colors" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>
  ),
  ul: ({ children, ...props }: ComponentPropsWithoutRef<"ul">) => (
    <ul className="list-disc pl-6 my-3 space-y-1.5 text-[var(--color-fg-dim)] text-[0.9375rem]" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: ComponentPropsWithoutRef<"ol">) => (
    <ol className="list-decimal pl-6 my-3 space-y-1.5 text-[var(--color-fg-dim)] text-[0.9375rem]" {...props}>{children}</ol>
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
