import type { ReactNode } from "react";
import Markdown, { type Components } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(textOf).join("");
  }
  if (typeof node === "object" && node !== null && "props" in node) {
    return textOf((node.props as { children?: ReactNode }).children);
  }
  return "";
}

/** "Add 6529's two sentries" becomes "add-6529s-two-sentries". */
function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replaceAll(/['’]/g, "")
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");
}

/** The page's second-level headings, for its table of contents. */
export function getMarkdownSections(
  markdown: string
): { readonly id: string; readonly title: string }[] {
  return markdown
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => {
      const title = line.slice(3).trim();
      return { id: slugifyHeading(title), title };
    });
}

const components: Components = {
  h2: ({ children }) => (
    <h2
      id={slugifyHeading(textOf(children))}
      className="tw-mb-4 tw-mt-12 tw-scroll-mt-24 tw-text-2xl tw-font-semibold tw-leading-8 tw-tracking-tight tw-text-iron-50 first:tw-mt-0"
    >
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3
      id={slugifyHeading(textOf(children))}
      className="tw-mb-3 tw-mt-8 tw-scroll-mt-24 tw-text-lg tw-font-semibold tw-leading-7 tw-text-iron-50"
    >
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="tw-mb-4 tw-text-base tw-leading-7 tw-text-iron-300">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="tw-mb-5 tw-list-disc tw-space-y-2 tw-pl-6 tw-text-iron-300">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="tw-mb-5 tw-list-decimal tw-space-y-3 tw-pl-6 tw-text-iron-300">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="tw-pl-1 tw-leading-7 marker:tw-text-iron-500">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="tw-font-semibold tw-text-iron-100">{children}</strong>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="tw-font-medium tw-text-primary-300 tw-underline tw-decoration-primary-300/40 tw-underline-offset-4 hover:tw-decoration-primary-300"
    >
      {children}
    </a>
  ),
  code: ({ children, className }) =>
    className ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="tw-break-words tw-rounded tw-bg-iron-900 tw-px-1.5 tw-py-0.5 tw-font-mono tw-text-[0.85em] tw-text-iron-100">
        {children}
      </code>
    ),
  pre: ({ children }) => (
    <pre className="tw-mb-5 tw-overflow-x-auto tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-950 tw-p-4 tw-font-mono tw-text-[13px] tw-leading-6 tw-text-iron-100">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="tw-mb-6 tw-overflow-x-auto tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.08]">
      <table className="tw-w-full tw-border-collapse tw-text-left tw-text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="tw-bg-iron-900/70 tw-text-iron-100">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.08] tw-px-3 tw-py-2 tw-font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="tw-min-w-[9rem] tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.06] tw-px-3 tw-py-2 tw-align-top tw-leading-6 tw-text-iron-300">
      {children}
    </td>
  ),
  blockquote: ({ children }) => (
    <blockquote className="tw-my-5 tw-border-0 tw-border-l-4 tw-border-solid tw-border-primary-400/60 tw-pl-4 tw-text-iron-200">
      {children}
    </blockquote>
  ),
};

export default function ValidatorMarkdown({
  markdown,
}: {
  readonly markdown: string;
}) {
  return (
    <div className="tw-w-full tw-min-w-0 tw-break-words">
      <Markdown
        rehypePlugins={[[rehypeSanitize]]}
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {markdown}
      </Markdown>
    </div>
  );
}
