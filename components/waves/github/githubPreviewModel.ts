import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  formatFileSizeLabel,
  getLocalizedFileKindLabel,
  getLocalizedGithubFileKindLabel,
} from "@/lib/link-preview/filePreviewI18n";
import type {
  GithubContentPreviewResponse,
  GithubPreviewChecks,
  GithubPreviewLabel,
  GithubPreviewResponse,
  GithubStatusPreviewResponse,
} from "@/services/api/github-preview-api";
import {
  GITHUB_ACCENTS,
  type GithubAccent,
  type GithubFact,
  type GithubLinkKind,
  type ParsedGithubLink,
} from "./githubPreviewParser";

const GITHUB_PREVIEW_LOCALE = DEFAULT_LOCALE;

export const shouldFetchGithubPreview = (link: ParsedGithubLink): boolean =>
  link.kind !== "github";

export const isStatusPreview = (
  preview: GithubPreviewResponse | null
): preview is GithubStatusPreviewResponse =>
  preview?.type === "github.issue" || preview?.type === "github.pull_request";

const formatCompactNumber = (
  value: number | null | undefined
): string | null =>
  typeof value === "number"
    ? new Intl.NumberFormat(undefined, {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value)
    : null;

const formatInteger = (value: number | null | undefined): string | null =>
  typeof value === "number" ? new Intl.NumberFormat().format(value) : null;

const formatDate = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const formatCount = (
  value: number | null | undefined,
  singular: string,
  plural = `${singular}s`
): string | null => {
  if (typeof value !== "number") {
    return null;
  }

  const noun = value === 1 ? singular : plural;
  return `${formatInteger(value)} ${noun}`;
};

const formatDiff = (
  additions: number | null | undefined,
  deletions: number | null | undefined
): string | null => {
  if (typeof additions !== "number" && typeof deletions !== "number") {
    return null;
  }

  return `+${formatInteger(additions ?? 0)} / -${formatInteger(deletions ?? 0)}`;
};

const normalizeStatusText = (
  value: string | null | undefined
): string | null => (value ? value.replaceAll("_", " ") : null);

const titleCase = (value: string | null | undefined): string | null => {
  const normalized = normalizeStatusText(value);
  if (!normalized) {
    return null;
  }

  return normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const joinDetailParts = (
  parts: readonly (string | null | undefined)[]
): string => parts.filter((part): part is string => Boolean(part)).join(" - ");

const joinMetaParts = (parts: readonly (string | null | undefined)[]): string =>
  parts.filter((part): part is string => Boolean(part)).join(" / ");

const getChecksLabel = (
  checks: GithubPreviewChecks | null | undefined
): string | null => {
  if (!checks) {
    return null;
  }

  if (checks.state === "success" && typeof checks.total === "number") {
    return `${formatInteger(checks.total)} passing`;
  }

  if (checks.state === "failure" && typeof checks.failed === "number") {
    return `${formatInteger(checks.failed)} failing`;
  }

  if (checks.state === "pending" && typeof checks.pending === "number") {
    return `${formatInteger(checks.pending)} pending`;
  }

  return titleCase(checks.state);
};

const getChecksTone = (
  checks: GithubPreviewChecks | null | undefined
): GithubFact["tone"] => {
  switch (checks?.state) {
    case "success":
      return "success";
    case "failure":
      return "danger";
    case "pending":
      return "warning";
    default:
      return "default";
  }
};

const compactFacts = (
  facts: readonly (GithubFact | null)[]
): readonly GithubFact[] =>
  facts.filter(
    (fact): fact is GithubFact => fact !== null && fact.value.trim().length > 0
  );

export const getKindLabel = (
  link: ParsedGithubLink,
  preview: GithubPreviewResponse | null
): string => {
  let effectiveKind = link.kind;
  if (preview?.type === "github.pull_request") {
    effectiveKind = "pull";
  } else if (preview?.type === "github.issue") {
    effectiveKind = "issue";
  }

  switch (effectiveKind) {
    case "pull":
      return "Pull request";
    case "issue":
      return "Issue";
    case "file":
      return "File";
    case "directory":
      return "Directory";
    case "commit":
      return "Commit";
    case "release":
      return "Release";
    case "actions":
      return "Actions";
    case "discussion":
      return "Discussion";
    case "repository":
      return "Repository";
    case "github":
      return "GitHub";
  }
};

export const getKindLabelFromPreview = (
  preview: GithubPreviewResponse | null
): string | null => {
  switch (preview?.type) {
    case "github.issue":
      return "Issue";
    case "github.pull_request":
      return "Pull request";
    case "github.repository":
      return "Repository";
    case "github.file": {
      if (!preview.fileKind) {
        return "File";
      }
      return getLocalizedGithubFileKindLabel(
        GITHUB_PREVIEW_LOCALE,
        preview.fileKind
      );
    }
    case "github.directory":
      return "Directory";
    case "github.commit":
      return "Commit";
    case "github.release":
      return "Release";
    case "github.actions":
      return "Actions";
    case "github.discussion":
      return "Discussion";
    case undefined:
      return null;
  }
};

const getAccentKind = (
  link: ParsedGithubLink,
  preview: GithubPreviewResponse | null
): GithubLinkKind => {
  switch (preview?.type) {
    case "github.issue":
      return "issue";
    case "github.pull_request":
      return "pull";
    case "github.repository":
      return "repository";
    case "github.file":
      return "file";
    case "github.directory":
      return "directory";
    case "github.commit":
      return "commit";
    case "github.release":
      return "release";
    case "github.actions":
      return "actions";
    case "github.discussion":
      return "discussion";
    case undefined:
      return link.kind;
  }
};

export const getAccent = (
  link: ParsedGithubLink,
  preview: GithubPreviewResponse | null
): GithubAccent => {
  const kind = getAccentKind(link, preview);
  return { kind, ...GITHUB_ACCENTS[kind] };
};

const getFallbackTitle = (link: ParsedGithubLink): string => {
  switch (link.kind) {
    case "pull":
      return `Pull request #${link.number}`;
    case "issue":
      return `Issue #${link.number}`;
    case "repository":
      return `${link.owner}/${link.repo}`;
    case "file":
      return link.pathLabel ?? "File";
    case "directory":
      return link.pathLabel ?? "Directory";
    case "commit":
      return `Commit ${link.pathLabel ?? ""}`.trim();
    case "release":
      return link.pathLabel ?? "Release";
    case "actions":
      return link.pathLabel ?? "Actions";
    case "discussion":
      return `Discussion ${link.pathLabel ?? ""}`.trim();
    case "github":
      // Unknown GitHub subroutes intentionally skip metadata fetching.
      return link.pathLabel ?? `${link.owner}/${link.repo}`;
  }
};

export const getCardTitle = (
  link: ParsedGithubLink,
  preview: GithubPreviewResponse | null
): string => {
  const title = preview?.title?.trim();
  return title && title.length > 0 ? title : getFallbackTitle(link);
};

type GithubPreviewOf<TType extends GithubPreviewResponse["type"]> = Extract<
  GithubPreviewResponse,
  { readonly type: TType }
>;

const getRepositoryDetail = (
  repoLabel: string,
  preview: GithubPreviewOf<"github.repository">
): string =>
  joinDetailParts([
    repoLabel,
    preview.description,
    preview.language,
    preview.archived ? "archived" : null,
    preview.stars !== null
      ? `${formatCompactNumber(preview.stars)} stars`
      : null,
    preview.forks !== null
      ? `${formatCompactNumber(preview.forks)} forks`
      : null,
  ]);

const getFileDetail = (
  repoLabel: string,
  preview: GithubContentPreviewResponse
): string =>
  joinDetailParts([
    repoLabel,
    preview.path,
    preview.fileKind
      ? getLocalizedFileKindLabel(GITHUB_PREVIEW_LOCALE, preview.fileKind)
      : null,
    preview.ref,
    formatFileSizeLabel(preview.size, GITHUB_PREVIEW_LOCALE),
  ]);

const getDirectoryDetail = (
  repoLabel: string,
  preview: GithubContentPreviewResponse
): string =>
  joinDetailParts([
    repoLabel,
    preview.path,
    preview.ref,
    preview.itemCount !== null
      ? `${formatInteger(preview.itemCount)} items`
      : null,
  ]);

const getFallbackDetail = (
  link: ParsedGithubLink,
  repoLabel: string
): string => {
  if (link.kind === "pull" && link.number) {
    return `${repoLabel} - PR #${link.number}`;
  }
  if (link.kind === "issue" && link.number) {
    return `${repoLabel} - issue #${link.number}`;
  }
  return link.pathLabel ? `${repoLabel} - ${link.pathLabel}` : repoLabel;
};

export const getDetailText = (
  link: ParsedGithubLink,
  preview: GithubPreviewResponse | null
): string => {
  const repoLabel = `${link.owner}/${link.repo}`;

  switch (preview?.type) {
    case "github.pull_request":
      return `${repoLabel} - PR #${preview.number}`;
    case "github.issue":
      return `${repoLabel} - issue #${preview.number}`;
    case "github.repository":
      return getRepositoryDetail(repoLabel, preview);
    case "github.file":
      return getFileDetail(repoLabel, preview);
    case "github.directory":
      return getDirectoryDetail(repoLabel, preview);
    case "github.commit":
      return joinDetailParts([
        repoLabel,
        preview.shortSha,
        preview.author ? `@${preview.author}` : null,
        formatDate(preview.committedAt),
      ]);
    case "github.release":
      return joinDetailParts([
        repoLabel,
        preview.tagName,
        preview.state,
        formatDate(preview.publishedAt),
      ]);
    case "github.actions":
      return joinDetailParts([
        repoLabel,
        preview.runNumber ? `run #${formatInteger(preview.runNumber)}` : null,
        normalizeStatusText(preview.conclusion ?? preview.status),
        preview.event,
      ]);
    case "github.discussion":
      return joinDetailParts([
        repoLabel,
        preview.number ? `discussion #${preview.number}` : null,
        preview.category,
        normalizeStatusText(preview.state),
        preview.comments !== null
          ? `${formatInteger(preview.comments)} comments`
          : null,
      ]);
    case undefined:
      return getFallbackDetail(link, repoLabel);
  }
};

const formatGithubAuthor = (
  author: string | null | undefined
): string | null => (author ? `by @${author}` : null);

const formatGithubDate = (
  prefix: string,
  value: string | null | undefined
): string | null => (value ? `${prefix} ${formatDate(value)}` : null);

const formatGithubBranches = (
  headRef: string | null | undefined,
  baseRef: string | null | undefined
): string | null => (headRef && baseRef ? `${headRef} -> ${baseRef}` : null);

const formatGithubPrefix = (
  prefix: string,
  value: string | null | undefined
): string | null => (value ? `${prefix} ${value}` : null);

export const getMetaText = (
  preview: GithubPreviewResponse | null
): string | null => {
  switch (preview?.type) {
    case "github.pull_request":
      return joinMetaParts([
        formatGithubAuthor(preview.author),
        formatGithubDate("updated", preview.updatedAt),
        formatGithubBranches(preview.headRef, preview.baseRef),
      ]);
    case "github.issue":
      return joinMetaParts([
        formatGithubAuthor(preview.author),
        formatGithubDate("updated", preview.updatedAt),
      ]);
    case "github.repository":
      return joinMetaParts([
        preview.visibility,
        formatGithubPrefix("default", preview.defaultBranch),
        formatGithubDate("pushed", preview.pushedAt),
      ]);
    case "github.file":
    case "github.directory":
      return joinMetaParts([
        preview.path,
        formatGithubPrefix("ref", preview.ref),
      ]);
    default:
      return null;
  }
};

const getAssigneeLabel = (
  assignees: readonly string[] | null | undefined
): string | null => {
  if (!assignees || assignees.length === 0) {
    return null;
  }

  const [firstAssignee, ...rest] = assignees;
  if (!firstAssignee) {
    return null;
  }

  return rest.length > 0
    ? `@${firstAssignee} +${rest.length}`
    : `@${firstAssignee}`;
};

export const getPreviewLabels = (
  preview: GithubPreviewResponse | null
): readonly GithubPreviewLabel[] => {
  if (
    preview?.type === "github.issue" ||
    preview?.type === "github.pull_request"
  ) {
    return preview.labels ?? [];
  }

  if (preview?.type === "github.repository") {
    return (
      preview.topics?.map((topic) => ({
        name: topic,
        color: null,
      })) ?? []
    );
  }

  return [];
};

const createFact = (
  label: string,
  value: string | null | undefined,
  tone?: GithubFact["tone"]
): GithubFact | null => (value ? { label, value, tone } : null);

const getReviewFact = (
  reviewState: GithubPreviewOf<"github.pull_request">["reviewState"]
): GithubFact | null => {
  if (reviewState === "none") {
    return null;
  }
  const changesRequested = reviewState === "changes_requested";
  return {
    label: "Review",
    value: changesRequested ? "Changes requested" : "Approved",
    tone: changesRequested ? "danger" : "success",
  };
};

const getPullRequestFacts = (
  preview: GithubPreviewOf<"github.pull_request">
): readonly GithubFact[] => {
  const checksLabel = getChecksLabel(preview.checks);
  return compactFacts([
    checksLabel
      ? {
          label: "Checks",
          value: checksLabel,
          tone: getChecksTone(preview.checks),
        }
      : null,
    getReviewFact(preview.reviewState),
    createFact("Diff", formatDiff(preview.additions, preview.deletions)),
    createFact("Files", formatCount(preview.changedFiles, "file")),
    createFact("Commits", formatCount(preview.commits, "commit")),
    createFact("Comments", formatCount(preview.comments, "comment")),
  ]);
};

const getIssueFacts = (
  preview: GithubPreviewOf<"github.issue">
): readonly GithubFact[] =>
  compactFacts([
    createFact("Assignees", getAssigneeLabel(preview.assignees)),
    createFact("Comments", formatCount(preview.comments, "comment")),
    createFact("Closed", formatDate(preview.closedAt)),
  ]);

const getRepositoryFacts = (
  preview: GithubPreviewOf<"github.repository">
): readonly GithubFact[] =>
  compactFacts([
    createFact("Language", preview.language),
    createFact("Stars", formatCompactNumber(preview.stars)),
    createFact("Forks", formatCompactNumber(preview.forks)),
    createFact("Open", formatCount(preview.openIssues, "issue")),
    createFact("License", preview.license),
  ]);

const getLineAnchor = (
  preview: GithubContentPreviewResponse
): string | null => {
  if (!preview.lineStart) {
    return null;
  }
  if (preview.lineEnd && preview.lineEnd !== preview.lineStart) {
    return `L${preview.lineStart}-L${preview.lineEnd}`;
  }
  return `L${preview.lineStart}`;
};

const getFileFacts = (
  preview: GithubContentPreviewResponse
): readonly GithubFact[] => {
  const showMimeType =
    preview.mimeType &&
    preview.fileKind !== "code" &&
    preview.fileKind !== "text";
  return compactFacts([
    preview.fileKind
      ? {
          label: t(GITHUB_PREVIEW_LOCALE, "linkPreview.github.fact.type"),
          value: getLocalizedFileKindLabel(
            GITHUB_PREVIEW_LOCALE,
            preview.fileKind
          ),
        }
      : null,
    createFact("Language", preview.language),
    showMimeType
      ? {
          label: t(GITHUB_PREVIEW_LOCALE, "linkPreview.github.fact.mime"),
          value: preview.mimeType,
        }
      : null,
    createFact("Ref", preview.ref),
    createFact(
      t(GITHUB_PREVIEW_LOCALE, "linkPreview.file.fact.size"),
      formatFileSizeLabel(preview.size, GITHUB_PREVIEW_LOCALE)
    ),
    createFact("Lines", formatCount(preview.lineCount, "line")),
    createFact("Anchor", getLineAnchor(preview)),
  ]);
};

const getDirectoryFacts = (
  preview: GithubContentPreviewResponse
): readonly GithubFact[] =>
  compactFacts([
    createFact("Ref", preview.ref),
    createFact("Items", formatCount(preview.itemCount, "item")),
    createFact("Files", formatCount(preview.fileCount, "file")),
    createFact("Folders", formatCount(preview.directoryCount, "folder")),
  ]);

const getCommitFacts = (
  preview: GithubPreviewOf<"github.commit">
): readonly GithubFact[] =>
  compactFacts([
    { label: "SHA", value: preview.shortSha },
    createFact("Author", preview.author ? `@${preview.author}` : null),
    createFact("Date", formatDate(preview.committedAt)),
    createFact("Diff", formatDiff(preview.additions, preview.deletions)),
    createFact("Files", formatCount(preview.changedFiles, "file")),
  ]);

const getReleaseFacts = (
  preview: GithubPreviewOf<"github.release">
): readonly GithubFact[] =>
  compactFacts([
    createFact("Tag", preview.tagName),
    { label: "State", value: titleCase(preview.state) ?? preview.state },
    createFact("Published", formatDate(preview.publishedAt)),
  ]);

const getActionsTone = (
  conclusion: GithubPreviewOf<"github.actions">["conclusion"]
): GithubFact["tone"] => {
  if (conclusion === "success") {
    return "success";
  }
  return conclusion ? "danger" : "default";
};

const getActionsFacts = (
  preview: GithubPreviewOf<"github.actions">
): readonly GithubFact[] => {
  const status = titleCase(preview.conclusion ?? preview.status);
  return compactFacts([
    createFact(
      "Run",
      preview.runNumber ? `#${formatInteger(preview.runNumber)}` : null
    ),
    status
      ? {
          label: "Status",
          value: status,
          tone: getActionsTone(preview.conclusion),
        }
      : null,
    createFact("Event", preview.event),
  ]);
};

const getDiscussionFacts = (
  preview: GithubPreviewOf<"github.discussion">
): readonly GithubFact[] =>
  compactFacts([
    createFact("Discussion", preview.number ? `#${preview.number}` : null),
    createFact("Category", preview.category),
    createFact("State", titleCase(preview.state)),
    createFact("Comments", formatCount(preview.comments, "comment")),
  ]);

export const getPreviewFacts = (
  preview: GithubPreviewResponse | null
): readonly GithubFact[] => {
  if (!preview) {
    return [];
  }

  switch (preview.type) {
    case "github.pull_request":
      return getPullRequestFacts(preview);
    case "github.issue":
      return getIssueFacts(preview);
    case "github.repository":
      return getRepositoryFacts(preview);
    case "github.file":
      return getFileFacts(preview);
    case "github.directory":
      return getDirectoryFacts(preview);
    case "github.commit":
      return getCommitFacts(preview);
    case "github.release":
      return getReleaseFacts(preview);
    case "github.actions":
      return getActionsFacts(preview);
    case "github.discussion":
      return getDiscussionFacts(preview);
  }
};

export const getAriaLabel = (
  link: ParsedGithubLink,
  preview: GithubPreviewResponse | null
): string => {
  const kindLabel = (
    getKindLabelFromPreview(preview) ?? getKindLabel(link, preview)
  ).toLowerCase();
  const title = getCardTitle(link, preview);
  return `Open GitHub ${kindLabel}: ${title} (opens in a new tab)`;
};
