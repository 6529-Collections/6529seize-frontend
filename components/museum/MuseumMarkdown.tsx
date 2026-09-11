import {
  Children,
  cloneElement,
  isValidElement,
  type AnchorHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { getCaseyDossierAnchor } from "@/lib/museum/casey";
import { MUSEUM_DATA_ARCHITECTURE_STANDARD_SLUGS } from "@/lib/museum/publication/dataArchitectureContract";
import { MUSEUM_CASEY_ACQUISITION_SLUG } from "@/lib/museum/publication/routes";
import { buildImmutableMuseumBlobUrl } from "@/lib/museum/publication/security";

interface MuseumMarkdownProps {
  readonly children: string;
  readonly className?: string | undefined;
  readonly documentHeadings?: boolean | undefined;
  readonly nestedDocumentHeadings?: boolean | undefined;
  readonly embeddedDocument?: boolean | undefined;
  readonly sourceCommit: string | null;
  readonly sourcePath?: string | undefined;
  readonly workHrefs?: Readonly<Record<string, string>> | undefined;
}

const EMPTY_WORK_HREFS: Readonly<Record<string, string>> = {};

const INLINE_CODE_SAFE_BREAK_DELIMITER = /^[/:._#?&=\-]$/u;
const INLINE_CODE_LONG_HEX = /^(?:0x)?[0-9a-f]{24,}$/iu;

/**
 * Preserve the exact selected value while exposing mobile line-break
 * opportunities at identifier delimiters and fixed eight-character hash
 * groups. A word-break element has no text content, so copying the code still
 * returns the canonical value byte-for-byte.
 */
function renderInlineCodeWithSafeBreaks(codeText: string): ReactNode[] {
  const segments = codeText.split(/((?:0x)?[0-9a-f]{24,}|[/:._#?&=\-])/giu);
  const rendered: ReactNode[] = [];

  segments.forEach((segment, segmentIndex) => {
    if (!segment) {
      return;
    }

    if (INLINE_CODE_SAFE_BREAK_DELIMITER.test(segment)) {
      rendered.push(segment, <wbr key={`delimiter-${segmentIndex}`} />);
      return;
    }

    if (INLINE_CODE_LONG_HEX.test(segment)) {
      const hasPrefix = /^0x/iu.test(segment);
      const prefix = hasPrefix ? segment.slice(0, 2) : "";
      const hex = hasPrefix ? segment.slice(2) : segment;
      const groups = hex.match(/.{1,8}/gu) ?? [hex];
      if (prefix !== "") rendered.push(prefix);
      groups.forEach((group, groupIndex) => {
        rendered.push(group);
        if (groupIndex < groups.length - 1) {
          rendered.push(<wbr key={`hex-${segmentIndex}-${groupIndex}`} />);
        }
      });
      return;
    }

    rendered.push(segment);
  });

  return rendered;
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

const INSTITUTIONAL_PRACTICE_ROUTE =
  "/museum/network/research/institutional-practice";
const INSTITUTIONAL_PRACTICE_PROFILE_ROUTE_BY_PATH = new Map([
  ["records/institutional-practice/profiles/met.md", "met"],
  ["records/institutional-practice/profiles/getty.md", "getty"],
  ["records/institutional-practice/profiles/moma.md", "moma"],
  ["records/institutional-practice/profiles/whitney.md", "whitney"],
  ["records/institutional-practice/profiles/tate.md", "tate"],
  [
    "records/institutional-practice/profiles/centre-pompidou.md",
    "centre-pompidou",
  ],
  ["records/institutional-practice/profiles/sfmoma.md", "sfmoma"],
  ["records/institutional-practice/profiles/guggenheim.md", "guggenheim"],
  ["records/institutional-practice/profiles/zkm.md", "zkm"],
  [
    "records/institutional-practice/profiles/ars-electronica.md",
    "ars-electronica",
  ],
  [
    "records/institutional-practice/profiles/rhizome-new-museum.md",
    "rhizome-new-museum",
  ],
  [
    "records/institutional-practice/profiles/serpentine-arts-technologies.md",
    "serpentine-arts-technologies",
  ],
  ["records/institutional-practice/profiles/v-and-a.md", "v-and-a"],
  ["records/institutional-practice/profiles/lacma.md", "lacma"],
  ["records/institutional-practice/profiles/hek-basel.md", "hek-basel"],
  ["records/institutional-practice/profiles/li-ma.md", "li-ma"],
  ["records/institutional-practice/profiles/v2.md", "v2"],
  ["records/institutional-practice/profiles/transmediale.md", "transmediale"],
  ["records/institutional-practice/profiles/acmi.md", "acmi"],
  ["records/institutional-practice/profiles/m-plus.md", "m-plus"],
  [
    "records/institutional-practice/profiles/nam-june-paik-art-center.md",
    "nam-june-paik-art-center",
  ],
  ["records/institutional-practice/profiles/ntt-icc.md", "ntt-icc"],
  [
    "records/institutional-practice/profiles/centro-multimedia.md",
    "centro-multimedia",
  ],
  [
    "records/institutional-practice/profiles/laboratorio-arte-alameda.md",
    "laboratorio-arte-alameda",
  ],
  ["records/institutional-practice/profiles/dia.md", "dia"],
  [
    "records/institutional-practice/profiles/walker-art-center.md",
    "walker-art-center",
  ],
  ["records/institutional-practice/profiles/mca-chicago.md", "mca-chicago"],
]);
const INSTITUTIONAL_PRACTICE_STUDY_PATH =
  "records/institutional-practice/a-field-of-practice.md";
const INSTITUTIONAL_PRACTICE_SOURCE_REGISTER_PATH =
  "records/institutional-practice/source-register.md";
const INSTITUTIONAL_PRACTICE_ADJACENT_PATH =
  "records/institutional-practice/adjacent-chain-native-practice.md";
const CURATORIAL_PUBLICATION_STANDARD_PATH =
  "docs/curatorial-publication-standard.md";
const INSTITUTIONAL_SOURCE_INVENTORY_PATH =
  "docs/institutional-source-inventory.json";
const DATA_ARCHITECTURE_OVERVIEW_PATH = "docs/data-architecture.md";
const DATA_ARCHITECTURE_CASEY_PATH =
  "docs/data-architecture/casey-reas-implementation.md";
const DATA_ARCHITECTURE_STANDARD_PREFIX = "docs/data-architecture/";
const DATA_ARCHITECTURE_STANDARD_SUFFIX = ".md";
const DATA_ARCHITECTURE_STANDARD_SLUG_SET = new Set<string>(
  MUSEUM_DATA_ARCHITECTURE_STANDARD_SLUGS
);
const RIGHTS_ROUTE_BY_PATH = new Map([
  [
    "records/institutional-practice/rights-and-licenses.md",
    "/museum/network/research/rights",
  ],
  [
    "records/institutional-practice/rights-for-artists.md",
    "/museum/network/research/rights/artists",
  ],
  [
    "records/institutional-practice/rights-for-collectors.md",
    "/museum/network/research/rights/collectors",
  ],
]);

function institutionalPracticeRoute(repositoryPath: string): string | null {
  if (repositoryPath === INSTITUTIONAL_PRACTICE_STUDY_PATH) {
    return INSTITUTIONAL_PRACTICE_ROUTE;
  }
  if (repositoryPath === INSTITUTIONAL_PRACTICE_SOURCE_REGISTER_PATH) {
    return `${INSTITUTIONAL_PRACTICE_ROUTE}/sources`;
  }
  if (repositoryPath === INSTITUTIONAL_PRACTICE_ADJACENT_PATH) {
    return `${INSTITUTIONAL_PRACTICE_ROUTE}/adjacent-practice`;
  }
  if (repositoryPath === CURATORIAL_PUBLICATION_STANDARD_PATH) {
    return "/museum/network/research/scholarship-and-writing";
  }
  const profileSlug =
    INSTITUTIONAL_PRACTICE_PROFILE_ROUTE_BY_PATH.get(repositoryPath);
  return profileSlug === undefined
    ? null
    : `${INSTITUTIONAL_PRACTICE_ROUTE}/${profileSlug}`;
}

function dataArchitectureRoute(repositoryPath: string): string | null {
  const root = "/museum/network/research/data-architecture";
  if (repositoryPath === DATA_ARCHITECTURE_OVERVIEW_PATH) return root;
  if (repositoryPath === DATA_ARCHITECTURE_CASEY_PATH) {
    return `${root}/casey-reas-implementation`;
  }
  if (
    !repositoryPath.startsWith(DATA_ARCHITECTURE_STANDARD_PREFIX) ||
    !repositoryPath.endsWith(DATA_ARCHITECTURE_STANDARD_SUFFIX)
  ) {
    return null;
  }
  const slug = repositoryPath.slice(
    DATA_ARCHITECTURE_STANDARD_PREFIX.length,
    -DATA_ARCHITECTURE_STANDARD_SUFFIX.length
  );
  return DATA_ARCHITECTURE_STANDARD_SLUG_SET.has(slug)
    ? `${root}/${slug}`
    : null;
}

function publicMuseumRoute(
  url: string,
  workHrefs: Readonly<Record<string, string>>
): string | null {
  const withoutFragment = url.split("#", 1)[0] ?? "";
  const exactWorkHref = workHrefs[withoutFragment];
  if (exactWorkHref !== undefined) return exactWorkHref;
  const rightsRoute = RIGHTS_ROUTE_BY_PATH.get(withoutFragment);
  if (rightsRoute !== undefined) {
    return rightsRoute;
  }
  const practiceRoute = institutionalPracticeRoute(withoutFragment);
  if (practiceRoute !== null) {
    return practiceRoute;
  }
  const architectureRoute = dataArchitectureRoute(withoutFragment);
  if (architectureRoute !== null) return architectureRoute;
  if (withoutFragment.startsWith("records/institutional-practice/")) {
    return null;
  }
  const fileName = withoutFragment.split("/").at(-1) ?? "";
  const objectMatch = CASEY_OBJECT_DOCUMENT_PATTERN.exec(fileName);
  if (objectMatch?.[1]) {
    return workHrefs[objectMatch[1]] ?? null;
  }
  if (fileName === "casey-reas-artist-practice.md") {
    return "/museum/network/artists/casey-reas";
  }
  if (fileName === "casey-reas-collection-essay.md") {
    return `/museum/network/acquisitions/${MUSEUM_CASEY_ACQUISITION_SLUG}#casey-reas-collection-essay`;
  }
  if (fileName === "gift-into-public-trust.md") {
    return `/museum/network/acquisitions/${MUSEUM_CASEY_ACQUISITION_SLUG}#gift-narrative-title`;
  }
  if (fileName === "source-and-chronology-matrix.md") {
    return "/museum/network/research/sources-and-chronology";
  }
  const projectSlug = PROJECT_ROUTE_BY_DOCUMENT.get(fileName);
  if (projectSlug !== undefined) {
    return `/museum/network/projects/${projectSlug}#project-essay-title`;
  }
  const dossierAnchor = getCaseyDossierAnchor(fileName);
  return dossierAnchor !== null
    ? `/museum/network/acquisitions/${MUSEUM_CASEY_ACQUISITION_SLUG}#${dossierAnchor}`
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
  if (segments[0] === "records" && segments[1] === "institutional-practice") {
    return "records/institutional-practice/";
  }
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
    const withinInstitutionalPractice = sourcePath.startsWith(
      "records/institutional-practice/"
    );
    const isInstitutionalResearchDocument =
      withinInstitutionalPractice &&
      (normalizedPath === CURATORIAL_PUBLICATION_STANDARD_PATH ||
        normalizedPath === INSTITUTIONAL_SOURCE_INVENTORY_PATH);
    const isStandardRelatedPath =
      sourcePath === CURATORIAL_PUBLICATION_STANDARD_PATH &&
      (normalizedPath.startsWith("records/institutional-practice/") ||
        normalizedPath === "CONTRIBUTING.md");
    if (
      normalizedPath.length === 0 ||
      normalizedPath.includes("\\") ||
      normalizedPath.split("/").includes("..") ||
      (!normalizedPath.startsWith(sourceBoundary(sourcePath)) &&
        !isInstitutionalResearchDocument &&
        !isStandardRelatedPath)
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
  sourceCommit?: string | null,
  workHrefs: Readonly<Record<string, string>> = EMPTY_WORK_HREFS
): string {
  if (!sourcePath) {
    return "";
  }
  const repositoryPath = resolveRepositoryPath(url, sourcePath);
  if (repositoryPath === null) {
    return "";
  }
  const museumRoute = publicMuseumRoute(repositoryPath, workHrefs);
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
  sourceCommit?: string | null,
  workHrefs: Readonly<Record<string, string>> = EMPTY_WORK_HREFS
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
  return repositoryRelativeUrlTransform(
    url,
    sourcePath,
    sourceCommit,
    workHrefs
  );
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

interface MuseumMarkdownTableElementProps {
  readonly children?: ReactNode;
}

interface MuseumMarkdownTableCellProps extends MuseumMarkdownTableElementProps {
  readonly mobileLabel?: string;
}

function MuseumMarkdownTableHead({
  children,
}: MuseumMarkdownTableElementProps) {
  return (
    <thead className="tw-hidden tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-700 tw-text-iron-100 lg:tw-table-header-group">
      {children}
    </thead>
  );
}

function MuseumMarkdownTableBody({
  children,
}: MuseumMarkdownTableElementProps) {
  return (
    <tbody className="tw-block tw-divide-y tw-divide-iron-800 lg:tw-table-row-group">
      {children}
    </tbody>
  );
}

function MuseumMarkdownTableRow({ children }: MuseumMarkdownTableElementProps) {
  return (
    <tr className="tw-block tw-border-b tw-border-iron-800 last:tw-border-b-0 lg:tw-table-row">
      {children}
    </tr>
  );
}

function MuseumMarkdownTableHeader({
  children,
}: MuseumMarkdownTableElementProps) {
  return (
    <th scope="col" className="tw-px-3 tw-py-3 tw-align-top tw-font-semibold">
      {children}
    </th>
  );
}

function MuseumMarkdownTableCell({
  children,
  mobileLabel,
}: MuseumMarkdownTableCellProps) {
  return (
    <td className="tw-block tw-whitespace-normal tw-break-words tw-px-3 tw-py-2 tw-align-top lg:tw-table-cell lg:tw-py-3">
      {mobileLabel ? (
        <span className="tw-mb-1 tw-block tw-text-[0.7rem] tw-font-semibold tw-uppercase tw-tracking-[0.08em] tw-text-iron-500 lg:tw-hidden">
          {mobileLabel}
        </span>
      ) : null}
      {children}
    </td>
  );
}

function tableElementWithChildren(
  element: ReactNode
): ReactElement<MuseumMarkdownTableElementProps> | null {
  return isValidElement(element)
    ? (element as ReactElement<MuseumMarkdownTableElementProps>)
    : null;
}

function markdownTextContent(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }
      const element = tableElementWithChildren(child);
      if (!element) return "";
      return markdownTextContent(element.props.children);
    })
    .join("")
    .trim();
}

function tableHeaderLabels(children: ReactNode): string[] {
  const header = Children.toArray(children)
    .map(tableElementWithChildren)
    .find((element) => element?.type === MuseumMarkdownTableHead);
  if (!header) return [];

  const row = Children.toArray(header.props.children)
    .map(tableElementWithChildren)
    .find((element) => element?.type === MuseumMarkdownTableRow);
  if (!row) return [];

  return Children.toArray(row.props.children).map((cell) => {
    const element = tableElementWithChildren(cell);
    return element?.type === MuseumMarkdownTableHeader
      ? markdownTextContent(element.props.children)
      : "";
  });
}

function addMobileTableLabels(
  children: ReactNode,
  labels: readonly string[]
): ReactNode {
  return Children.toArray(children).map((section) => {
    const sectionElement = tableElementWithChildren(section);
    if (sectionElement?.type !== MuseumMarkdownTableBody) return section;

    const rows = Children.toArray(sectionElement.props.children).map((row) => {
      const rowElement = tableElementWithChildren(row);
      if (rowElement?.type !== MuseumMarkdownTableRow) return row;

      const cells = Children.toArray(rowElement.props.children).map(
        (cell, index) => {
          const cellElement = tableElementWithChildren(cell);
          if (cellElement?.type !== MuseumMarkdownTableCell) return cell;
          const mobileLabel = labels[index] ?? "";
          const mobileLabelProps =
            mobileLabel.length > 0 ? { mobileLabel } : {};
          return cloneElement(
            cellElement as ReactElement<MuseumMarkdownTableCellProps>,
            mobileLabelProps
          );
        }
      );
      return cloneElement(rowElement, { children: cells });
    });

    return cloneElement(sectionElement, { children: rows });
  });
}

function MuseumMarkdownTable({ children }: { readonly children?: ReactNode }) {
  const labels = tableHeaderLabels(children);
  const labelledChildren = addMobileTableLabels(children, labels);

  return (
    <div>
      <div
        aria-label={t(
          DEFAULT_LOCALE,
          "museum.network.markdown.scrollableTable"
        )}
        className="tw-max-w-full tw-overflow-x-auto focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        role="region"
        tabIndex={0}
      >
        <table className="tw-block tw-w-full tw-table-fixed tw-border-collapse tw-text-left tw-text-sm tw-leading-6 tw-text-iron-200 lg:tw-table lg:tw-table-auto">
          {labelledChildren}
        </table>
      </div>
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
  code: ({ children, className }) => {
    const codeText = Children.toArray(children)
      .filter((child): child is string => typeof child === "string")
      .join("");
    const isInline = !codeText.includes("\n");
    return (
      <code
        className={`tw-rounded-md tw-bg-iron-900 tw-px-1.5 tw-py-0.5 tw-text-sm tw-text-iron-100 ${isInline ? "tw-inline-block tw-max-w-full tw-whitespace-normal tw-align-bottom sm:tw-overflow-x-auto sm:tw-whitespace-nowrap" : ""} ${className ?? ""}`}
      >
        {isInline ? renderInlineCodeWithSafeBreaks(codeText) : children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="tw-max-w-full tw-overflow-x-auto tw-rounded-lg tw-border tw-border-white/10 tw-bg-iron-950 tw-p-4 tw-text-sm tw-text-iron-200">
      {children}
    </pre>
  ),
  table: MuseumMarkdownTable,
  thead: MuseumMarkdownTableHead,
  tbody: MuseumMarkdownTableBody,
  tr: MuseumMarkdownTableRow,
  th: MuseumMarkdownTableHeader,
  td: MuseumMarkdownTableCell,
  // Markdown is a source-record surface. Typed publication routes render
  // governed media separately; arbitrary Markdown image URLs stay inert.
  img: ({ alt }) => (
    <span className="tw-inline-flex tw-rounded-md tw-border tw-border-white/10 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-text-iron-300">
      {t(DEFAULT_LOCALE, "museum.network.markdown.mediaOmitted", {
        suffix: alt ? `: ${alt}` : "",
      })}
    </span>
  ),
  hr: () => <hr className="tw-border-white/10" />,
};

const documentHeadingComponents: Components = {
  ...baseComponents,
  h1: ({ children }) => (
    <h2 className="tw-mt-10 tw-text-2xl tw-font-semibold tw-text-white">
      {children}
    </h2>
  ),
  h2: ({ children }) => (
    <h2 className="tw-mt-10 tw-text-2xl tw-font-semibold tw-text-white">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="tw-mt-8 tw-text-xl tw-font-semibold tw-text-white">
      {children}
    </h3>
  ),
};

const nestedDocumentHeadingComponents: Components = {
  ...baseComponents,
  h1: ({ children }) => (
    <h3 className="tw-mt-10 tw-text-2xl tw-font-semibold tw-text-white">
      {children}
    </h3>
  ),
  h2: ({ children }) => (
    <h3 className="tw-mt-10 tw-text-2xl tw-font-semibold tw-text-white">
      {children}
    </h3>
  ),
  h3: ({ children }) => (
    <h4 className="tw-mt-8 tw-text-xl tw-font-semibold tw-text-white">
      {children}
    </h4>
  ),
};

export function MuseumMarkdown({
  children,
  className = "",
  documentHeadings = false,
  nestedDocumentHeadings = false,
  embeddedDocument = false,
  sourceCommit,
  sourcePath,
  workHrefs = EMPTY_WORK_HREFS,
}: MuseumMarkdownProps) {
  const markdown = embeddedDocument
    ? withoutEmbeddedDocumentTitle(children)
    : children;
  let markdownComponents = baseComponents;
  if (documentHeadings) markdownComponents = documentHeadingComponents;
  if (nestedDocumentHeadings) {
    markdownComponents = nestedDocumentHeadingComponents;
  }
  const renderedMarkdown = (
    <ReactMarkdown
      components={markdownComponents}
      rehypePlugins={[rehypeSanitize]}
      remarkPlugins={[remarkGfm]}
      urlTransform={(url) =>
        safeUrlTransform(url, sourcePath, sourceCommit, workHrefs)
      }
    >
      {markdown}
    </ReactMarkdown>
  );

  return (
    <div className={`tw-space-y-4 tw-text-base ${className}`}>
      {renderedMarkdown}
    </div>
  );
}

export function MuseumJsonDisclosure({
  label,
  ...content
}: {
  readonly label: string;
} & (
  | { readonly value: unknown; readonly sourceJson?: never }
  | { readonly sourceJson: string; readonly value?: never }
)) {
  const json =
    "sourceJson" in content
      ? content.sourceJson
      : JSON.stringify(content.value, null, 2);
  return (
    <details className="tw-rounded-lg tw-border tw-border-white/10 tw-bg-iron-950/60">
      <summary className="tw-cursor-pointer tw-list-none tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-iron-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400">
        {label}
      </summary>
      <pre className="tw-m-0 tw-max-h-96 tw-overflow-auto tw-border-t tw-border-white/10 tw-p-4 tw-text-xs tw-leading-5 tw-text-iron-300">
        {json}
      </pre>
    </details>
  );
}
