import Markdown, { type Components } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

const isExternalHttpUrl = (href: string | undefined): boolean =>
  href?.startsWith("http://") === true || href?.startsWith("https://") === true;

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h3 className="tw-mb-3 tw-mt-7 tw-text-2xl tw-font-semibold tw-text-iron-50">
      {children}
    </h3>
  ),
  h2: ({ children }) => (
    <h3 className="tw-mb-3 tw-mt-8 tw-text-xl tw-font-semibold tw-text-iron-50">
      {children}
    </h3>
  ),
  h3: ({ children }) => (
    <h4 className="tw-mb-2 tw-mt-6 tw-text-lg tw-font-semibold tw-text-iron-100">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="tw-mb-4 tw-leading-7 tw-text-iron-300">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="tw-mb-4 tw-list-disc tw-space-y-2 tw-pl-6 tw-text-iron-300">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="tw-mb-4 tw-list-decimal tw-space-y-2 tw-pl-6 tw-text-iron-300">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="tw-leading-7">{children}</li>,
  a: ({ href, children }) => {
    const external = isExternalHttpUrl(href);

    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "nofollow noopener noreferrer" : undefined}
        className="hover:tw-text-primary-200 tw-font-semibold tw-text-primary-300 tw-underline tw-decoration-primary-300/50 tw-underline-offset-4"
      >
        {children}
      </a>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="tw-my-5 tw-border-l-4 tw-border-iron-700 tw-pl-4 tw-text-iron-300">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="tw-rounded tw-bg-iron-900 tw-px-1.5 tw-py-0.5 tw-font-mono tw-text-sm tw-text-iron-100">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="tw-my-5 tw-overflow-x-auto tw-rounded-md tw-bg-iron-950 tw-p-4 tw-font-mono tw-text-sm tw-text-iron-100">
      {children}
    </pre>
  ),
};

export default function TechReportMarkdown({
  markdown,
}: {
  readonly markdown: string;
}) {
  return (
    <Markdown
      rehypePlugins={[[rehypeSanitize]]}
      remarkPlugins={[remarkGfm]}
      className="tw-w-full tw-break-words"
      components={markdownComponents}
    >
      {markdown}
    </Markdown>
  );
}
