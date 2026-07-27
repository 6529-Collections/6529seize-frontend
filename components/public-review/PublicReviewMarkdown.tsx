import { Children, isValidElement, type ReactNode } from "react";
import Markdown, { type Components } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getUniquePublicReviewHeadingId } from "@/lib/public-review/editorialSections";

function getHeadingText(children: ReactNode): string {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }
      if (isValidElement<{ children?: ReactNode }>(child)) {
        return getHeadingText(child.props.children);
      }
      return "";
    })
    .join("");
}

function createMarkdownComponents(): Components {
  const headingCounts = new Map<string, number>();

  return {
    h1: () => null,
    h2: ({ children }) => (
      <h2
        id={getUniquePublicReviewHeadingId(
          getHeadingText(children),
          headingCounts
        )}
        className="tw-mb-0 tw-mt-12 tw-scroll-mt-24 tw-text-lg tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-100 sm:tw-text-xl"
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="tw-mb-0 tw-mt-8 tw-text-base tw-font-medium tw-leading-6 tw-text-iron-100">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="tw-mb-0 tw-mt-4 tw-text-base tw-font-light tw-leading-7 tw-text-iron-400">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="tw-mb-0 tw-mt-4 tw-space-y-2 tw-pl-5 tw-text-base tw-font-light tw-leading-7 tw-text-iron-400 marker:tw-text-iron-600">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="tw-mb-0 tw-mt-4 tw-space-y-2 tw-pl-5 tw-text-base tw-font-light tw-leading-7 tw-text-iron-400 marker:tw-text-iron-600">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="tw-pl-1">{children}</li>,
    strong: ({ children }) => (
      <strong className="tw-font-medium tw-text-iron-100">{children}</strong>
    ),
    em: ({ children }) => <em className="tw-text-iron-200">{children}</em>,
    blockquote: ({ children }) => (
      <blockquote className="tw-my-7 tw-border-y-0 tw-border-b-0 tw-border-l-2 tw-border-r-0 tw-border-solid tw-border-primary-400/60 tw-bg-primary-400/[0.035] tw-px-5 tw-py-1">
        {children}
      </blockquote>
    ),
    a: ({ href, children }) => {
      const isExternal = href?.startsWith("http") ?? false;
      return (
        <a
          href={href}
          {...(isExternal
            ? { target: "_blank", rel: "noreferrer noopener" }
            : {})}
          className="tw-font-medium tw-text-iron-200 tw-underline tw-decoration-iron-600 tw-underline-offset-4 hover:tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
        >
          {children}
          {isExternal && (
            <span className="tw-sr-only">
              {" "}
              ({t(DEFAULT_LOCALE, "publicReview.markdown.externalLink")})
            </span>
          )}
        </a>
      );
    },
    code: ({ children }) => (
      <code className="tw-break-all tw-rounded tw-border tw-border-solid tw-border-iron-800/50 tw-bg-iron-900/70 tw-px-1.5 tw-py-0.5 tw-font-mono tw-text-[0.88em] tw-text-iron-100">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <section
        aria-label={t(DEFAULT_LOCALE, "publicReview.markdown.codeRegion")}
        className="tw-my-7 tw-overflow-x-auto tw-rounded-lg tw-border tw-border-solid tw-border-iron-800/50 tw-bg-iron-950 tw-p-4 tw-text-sm tw-leading-6 tw-text-iron-100 tw-shadow-inner focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
        tabIndex={0}
      >
        <pre className="tw-m-0">{children}</pre>
      </section>
    ),
    table: ({ children }) => (
      <div
        aria-label={t(DEFAULT_LOCALE, "publicReview.markdown.tableRegion")}
        className="tw-my-7 tw-overflow-x-auto tw-rounded-lg tw-border tw-border-solid tw-border-iron-800/50 tw-bg-iron-900/55 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
        role="region"
        tabIndex={0}
      >
        <table className="tw-w-full tw-min-w-[38rem] tw-border-collapse tw-text-left tw-text-sm tw-font-light tw-text-iron-400">
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800/50 tw-bg-iron-900/75 tw-p-3 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-200">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800/50 tw-p-3 tw-align-top tw-text-sm tw-leading-6">
        {children}
      </td>
    ),
    hr: () => (
      <hr className="tw-my-12 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800/50" />
    ),
  };
}

export function PublicReviewMarkdown({
  markdown,
}: {
  readonly markdown: string;
}) {
  return (
    <div className="tw-min-w-0">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={createMarkdownComponents()}
      >
        {markdown}
      </Markdown>
    </div>
  );
}
