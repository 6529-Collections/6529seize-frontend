import Markdown from "react-markdown";
import rehypeExternalLinks from "rehype-external-links";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

interface AgreementStepAgreementProps {
  readonly text: string;
  readonly scrollable?: boolean;
}

/**
 * Renders sanitized agreement Markdown, scrolling independently by default.
 * Disable scrolling when the containing dialog already owns the scroll area.
 */
export default function AgreementStepAgreement({
  text,
  scrollable = true,
}: AgreementStepAgreementProps) {
  return (
    <div className="tw-flex tw-w-full tw-flex-col tw-items-center">
      <div
        className={
          scrollable
            ? "tw-max-h-[50vh] tw-w-full tw-overflow-y-auto tw-overflow-x-hidden tw-rounded-lg tw-border tw-border-iron-800 tw-p-4 tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 md:tw-max-h-[60vh] lg:tw-min-h-[20vh]"
            : "tw-w-full"
        }
      >
        <Markdown
          rehypePlugins={[
            [
              rehypeExternalLinks,
              {
                target: "_blank",
                rel: ["noopener", "noreferrer", "nofollow"],
                protocols: ["http", "https"],
              },
            ],
            [rehypeSanitize],
          ]}
          remarkPlugins={[remarkGfm]}
          className="tw-w-full tw-text-iron-200"
          components={{
            h1: ({ children }) => (
              <h1 className="tw-mb-2 tw-mt-4 tw-text-2xl tw-font-semibold tw-text-iron-100">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="tw-mb-2 tw-mt-3 tw-text-xl tw-font-semibold tw-text-iron-100">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="tw-mb-1 tw-mt-3 tw-text-lg tw-font-semibold tw-text-iron-100">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="tw-mb-3 tw-whitespace-pre-wrap tw-break-words tw-leading-relaxed tw-text-iron-300">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="tw-mb-3 tw-list-disc tw-pl-6">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="tw-mb-3 tw-list-decimal tw-pl-6">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="tw-mb-1 tw-text-iron-300">{children}</li>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="tw-text-blue-400 tw-underline hover:tw-text-blue-300"
              >
                {children}
              </a>
            ),
            blockquote: ({ children }) => (
              <blockquote className="tw-my-3 tw-border-l-4 tw-border-iron-500 tw-pl-4 tw-italic">
                {children}
              </blockquote>
            ),
            code: ({ children }) => (
              <code className="tw-rounded tw-bg-iron-800 tw-px-1 tw-py-0.5 tw-font-mono tw-text-sm">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="tw-my-3 tw-overflow-x-auto tw-rounded tw-bg-iron-800 tw-p-3 tw-font-mono tw-text-sm">
                {children}
              </pre>
            ),
          }}
        >
          {text}
        </Markdown>
      </div>
    </div>
  );
}
