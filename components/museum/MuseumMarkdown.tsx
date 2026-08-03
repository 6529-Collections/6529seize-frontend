import type { AnchorHTMLAttributes, ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { CASEY_ACCESSION_ID, getCaseyDossierAnchor } from "@/lib/museum/casey";
import { buildImmutableMuseumBlobUrl } from "@/lib/museum/publication/security";

interface MuseumMarkdownProps {
  readonly children: string;
  readonly className?: string | undefined;
  readonly embeddedDocument?: boolean | undefined;
  readonly sourceCommit: string | null;
  readonly sourcePath?: string | undefined;
}

function withoutEmbeddedDocumentTitle(markdown: string): string {
  const lines = markdown.replace(/^\uFEFF/u, "").split(/\r?\n/u);
  if (!/^#\s+\S/u.test(lines[0] ?? "")) {
    return markdown;
  }

  lines.shift();
  while (lines[0]?.trim() === "") {
    lines.shift();
  }
  return lines.join("\n");
}

const CASEY_OBJECT_DOCUMENT_PATTERN = /^(6529NM\.2026\.001\.\d{2})\.md$/u;

const PROJECT_ROUTE_BY_DOCUMENT = new Map([
  ["century.md", "century"],
  ["process-and-pre-process.md", "pre-process"],
  ["microimage-and-phototaxis.md", "phototaxis"],
  ["atomism-and-923-empty-rooms.md", "923-empty-rooms"],
  ["still-life-and-ex-nihilo.md", "ex-nihilo-cosmos"],
]);

function publicMuseumRoute(url: string): string | null {
  const withoutFragment = url.split("#", 1)[0] ?? "";
  const fileName = withoutFragment.split("/").at(-1) ?? "";
  const objectMatch = CASEY_OBJECT_DOCUMENT_PATTERN.exec(fileName);
  if (objectMatch?.[1]) {
    return `/museum/network/collection/${encodeURIComponent(objectMatch[1])}`;
  }
  if (fileName === "casey-reas-artist-practice.md") {
    return "/museum/network/artists/casey-reas";
  }
  if (fileName === "casey-reas-collection-essay.md") {
    return `/museum/network/gifts/${CASEY_ACCESSION_ID}#casey-reas-collection-essay`;
  }
  if (fileName === "gift-into-public-trust.md") {
    return `/museum/network/gifts/${CASEY_ACCESSION_ID}#gift-narrative-title`;
  }
  if (fileName === "source-and-chronology-matrix.md") {
    return "/museum/network/stories/source-and-chronology";
  }
  const projectSlug = PROJECT_ROUTE_BY_DOCUMENT.get(fileName);
  if (projectSlug !== undefined) {
    return `/museum/network/projects/${projectSlug}#project-essay-title`;
  }
  const dossierAnchor = getCaseyDossierAnchor(fileName);
  return dossierAnchor !== null
    ? `/museum/network/gifts/${CASEY_ACCESSION_ID}#${dossierAnchor}`
    : null;
}

function hasUnsafeRelativePath(url: string): boolean {
  const withoutFragment = url.split("#", 1)[0] ?? "";
  const path = withoutFragment.split("?", 1)[0] ?? "";
  try {
    const decodedPath = decodeURIComponent(path);
    return decodedPath.includes("\\") || decodedPath.split("/").includes("..");
  } catch {
    return true;
  }
}

function sourceBoundary(sourcePath: string): string {
  const segments = sourcePath.split("/");
  if (
    segments[0] === "records" &&
    segments[1] === "accessions" &&
    segments[2]
  ) {
    return `records/accessions/${segments[2]}/`;
  }
  return segments[0] ? `${segments[0]}/` : "";
}

function resolveRepositoryPath(url: string, sourcePath: string): string | null {
  try {
    if (url.includes("\\")) {
      return null;
    }
    const base = new URL(`/${sourcePath}`, "https://museum-source.invalid/");
    const resolved = new URL(url, base);
    if (resolved.origin !== "https://museum-source.invalid") {
      return null;
    }
    const normalizedPath = decodeURIComponent(resolved.pathname).replace(
      /^\/+/,
      ""
    );
    if (
      normalizedPath.length === 0 ||
      normalizedPath.includes("\\") ||
      normalizedPath.split("/").includes("..") ||
      !normalizedPath.startsWith(sourceBoundary(sourcePath))
    ) {
      return null;
    }
    return normalizedPath;
  } catch {
    return null;
  }
}

function externalUrlTransform(url: string): string | null {
  try {
    const parsed = new URL(url);
    const allowed =
      parsed.protocol === "https:" ||
      parsed.protocol === "http:" ||
      parsed.protocol === "mailto:";
    return allowed ? url : "";
  } catch {
    return null;
  }
}

function repositoryRelativeUrlTransform(
  url: string,
  sourcePath?: string,
  sourceCommit?: string | null
): string {
  if (!sourcePath) {
    return "";
  }
  const repositoryPath = resolveRepositoryPath(url, sourcePath);
  if (repositoryPath === null) {
    return "";
  }
  const museumRoute = publicMuseumRoute(repositoryPath);
  if (museumRoute !== null) {
    return museumRoute;
  }
  try {
    const hash = new URL(url, "https://museum-link.invalid/").hash;
    return (
      buildImmutableMuseumBlobUrl(sourceCommit ?? null, repositoryPath, hash) ??
      ""
    );
  } catch {
    return "";
  }
}

function safeUrlTransform(
  url: string,
  sourcePath?: string,
  sourceCommit?: string | null
): string {
  if (url.startsWith("#")) {
    return url;
  }
  if (url.startsWith("//")) {
    return "";
  }
  if (url.startsWith("/")) {
    return hasUnsafeRelativePath(url) ? "" : url;
  }

  const externalUrl = externalUrlTransform(url);
  if (externalUrl !== null) {
    return externalUrl;
  }
  return repositoryRelativeUrlTransform(url, sourcePath, sourceCommit);
}

function MuseumMarkdownLink({
  href,
  children,
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const safeHref = typeof href === "string" ? safeUrlTransform(href) : "";
  if (safeHref.length === 0) {
    return <span className="tw-text-iron-200">{children}</span>;
  }

  const external =
    safeHref.startsWith("http") || safeHref.startsWith("mailto:");
  return (
    <a
      href={safeHref}
      className="hover:tw-text-primary-200 tw-text-primary-300 tw-underline tw-underline-offset-4 focus-visible:tw-rounded-sm focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}

function MuseumMarkdownTable({ children }: { readonly children?: ReactNode }) {
  return (
    <div
      aria-label={t(DEFAULT_LOCALE, "museum.network.markdown.scrollableTable")}
      className="tw-max-w-full tw-overflow-x-auto focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
      role="region"
      tabIndex={0}
    >
      <table className="tw-w-full tw-min-w-[44rem] tw-border-collapse tw-text-left tw-text-sm tw-leading-6 tw-text-iron-200">
        {children}
      </table>
    </div>
  );
}

const baseComponents: Components = {
  a: MuseumMarkdownLink,
  h1: ({ children }) => (
    <h2 className="tw-mt-8 tw-text-2xl tw-font-semibold tw-text-white">
      {children}
    </h2>
  ),
  h2: ({ children }) => (
    <h3 className="tw-mt-7 tw-text-xl tw-font-semibold tw-text-white">
      {children}
    </h3>
  ),
  h3: ({ children }) => (
    <h4 className="tw-mt-6 tw-text-lg tw-font-semibold tw-text-white">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="tw-m-0 tw-leading-7 tw-text-iron-200">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="tw-m-0 tw-list-disc tw-space-y-2 tw-pl-5 tw-text-iron-200">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="tw-m-0 tw-list-decimal tw-space-y-2 tw-pl-5 tw-text-iron-200">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="tw-pl-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="tw-m-0 tw-border-l-2 tw-border-primary-500/60 tw-pl-4 tw-text-iron-300">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) => (
    <code
      className={`tw-rounded-md tw-bg-iron-900 tw-px-1.5 tw-py-0.5 tw-text-sm tw-text-iron-100 ${className ?? ""}`}
    >
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="tw-max-w-full tw-overflow-x-auto tw-rounded-lg tw-border tw-border-white/10 tw-bg-iron-950 tw-p-4 tw-text-sm tw-text-iron-200">
      {children}
    </pre>
  ),
  table: MuseumMarkdownTable,
  thead: ({ children }) => (
    <thead className="tw-border-b tw-border-solid tw-border-iron-700 tw-text-iron-100">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className="tw-divide-y tw-divide-iron-800">{children}</tbody>
  ),
  th: ({ children }) => (
    <th scope="col" className="tw-px-3 tw-py-3 tw-align-top tw-font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="tw-px-3 tw-py-3 tw-align-top">{children}</td>
  ),
  img: ({ alt }) => (
    <span className="tw-inline-flex tw-rounded-md tw-border tw-border-white/10 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-300">
      {t(DEFAULT_LOCALE, "museum.network.markdown.mediaOmitted", {
        suffix: alt ? `: ${alt}` : "",
      })}
    </span>
  ),
  hr: () => <hr className="tw-border-white/10" />,
};

export function MuseumMarkdown({
  children,
  className = "",
  embeddedDocument = false,
  sourceCommit,
  sourcePath,
}: MuseumMarkdownProps) {
  return (
    <div className={`tw-space-y-4 ${className}`}>
      <ReactMarkdown
        components={baseComponents}
        rehypePlugins={[rehypeSanitize]}
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => safeUrlTransform(url, sourcePath, sourceCommit)}
      >
        {embeddedDocument ? withoutEmbeddedDocumentTitle(children) : children}
      </ReactMarkdown>
    </div>
  );
}

export function MuseumJsonDisclosure({
  label,
  value,
}: {
  readonly label: string;
  readonly value: unknown;
}) {
  return (
    <details className="tw-rounded-lg tw-border tw-border-white/10 tw-bg-iron-950/60">
      <summary className="tw-cursor-pointer tw-list-none tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-iron-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400">
        {label}
      </summary>
      <pre className="tw-m-0 tw-max-h-96 tw-overflow-auto tw-border-t tw-border-white/10 tw-p-4 tw-text-xs tw-leading-5 tw-text-iron-300">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}
