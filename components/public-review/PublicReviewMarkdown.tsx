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
        className="tw-mb-0 tw-mt-14 tw-scroll-mt-24 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-pb-3 tw-text-2xl tw-font-semibold tw-tracking-[-0.02em] tw-text-white"
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="tw-mb-0 tw-mt-9 tw-text-xl tw-font-semibold tw-tracking-tight tw-text-iron-100">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="tw-mb-0 tw-mt-5 tw-text-base tw-leading-8 tw-text-iron-300">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="tw-mb-0 tw-mt-5 tw-space-y-2 tw-pl-6 tw-text-base tw-leading-7 tw-text-iron-300 marker:tw-text-iron-500">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="tw-mb-0 tw-mt-5 tw-space-y-2 tw-pl-6 tw-text-base tw-leading-7 tw-text-iron-300 marker:tw-text-iron-500">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="tw-pl-1">{children}</li>,
    strong: ({ children }) => (
      <strong className="tw-font-semibold tw-text-white">{children}</strong>
    ),
    em: ({ children }) => <em className="tw-text-iron-100">{children}</em>,
    blockquote: ({ children }) => (
      <blockquote className="tw-my-7 tw-border-y-0 tw-border-b-0 tw-border-l-2 tw-border-r-0 tw-border-solid tw-border-amber-400/70 tw-bg-amber-400/[0.035] tw-px-5 tw-py-1">
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
          className="tw-font-medium tw-text-sky-300 tw-underline tw-decoration-sky-400/50 tw-underline-offset-4 hover:tw-text-sky-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
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
      <code className="tw-break-all tw-rounded tw-border tw-border-solid tw-border-white/[0.06] tw-bg-white/[0.045] tw-px-1.5 tw-py-0.5 tw-font-mono tw-text-[0.9em] tw-text-iron-100">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre
        aria-label={t(DEFAULT_LOCALE, "publicReview.markdown.codeRegion")}
        className="tw-my-7 tw-overflow-x-auto tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-[#08080a] tw-p-4 tw-text-sm tw-leading-6 tw-text-iron-100 tw-shadow-inner focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
        tabIndex={0}
      >
        {children}
      </pre>
    ),
    table: ({ children }) => (
      <div
        aria-label={t(DEFAULT_LOCALE, "publicReview.markdown.tableRegion")}
        className="tw-my-7 tw-overflow-x-auto tw-rounded-lg tw-border tw-border-solid tw-border-white/10 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
        role="region"
        tabIndex={0}
      >
        <table className="tw-w-full tw-min-w-[38rem] tw-border-collapse tw-text-left tw-text-sm tw-text-iron-200">
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-bg-white/[0.045] tw-p-3 tw-font-mono tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-100">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.07] tw-p-3 tw-align-top">
        {children}
      </td>
    ),
    hr: () => (
      <hr className="tw-my-12 tw-border-0 tw-border-t tw-border-solid tw-border-white/10" />
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
