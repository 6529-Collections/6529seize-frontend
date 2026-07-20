import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  formatFileSizeLabel,
  getLocalizedFileKindLabel,
  getLocalizedGithubFileKindLabel,
} from "@/lib/link-preview/filePreviewI18n";
import type {
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

export const formatCompactNumber = (
  value: number | null | undefined
): string | null =>
  typeof value === "number"
    ? new Intl.NumberFormat(undefined, {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value)
    : null;

export const formatInteger = (
  value: number | null | undefined
): string | null =>
  typeof value === "number" ? new Intl.NumberFormat().format(value) : null;

export const formatDate = (value: string | null | undefined): string | null => {
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

export const formatCount = (
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

export const formatDiff = (
  additions: number | null | undefined,
  deletions: number | null | undefined
): string | null => {
  if (typeof additions !== "number" && typeof deletions !== "number") {
    return null;
  }

  return `+${formatInteger(additions ?? 0)} / -${formatInteger(deletions ?? 0)}`;
};

export const normalizeStatusText = (
  value: string | null | undefined
): string | null => (value ? value.replaceAll("_", " ") : null);

export const titleCase = (value: string | null | undefined): string | null => {
  const normalized = normalizeStatusText(value);
  if (!normalized) {
    return null;
  }

  return normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
};

export const joinDetailParts = (
  parts: readonly (string | null | undefined)[]
): string => parts.filter((part): part is string => Boolean(part)).join(" - ");

export const joinMetaParts = (
  parts: readonly (string | null | undefined)[]
): string => parts.filter((part): part is string => Boolean(part)).join(" / ");

export const getChecksLabel = (
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

export const getChecksTone = (
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

export const compactFacts = (
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

export const getAccentKind = (
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

export const getFallbackTitle = (link: ParsedGithubLink): string => {
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

export const getDetailText = (
  link: ParsedGithubLink,
  preview: GithubPreviewResponse | null
): string => {
  const repoLabel = `${link.owner}/${link.repo}`;

  if (preview?.type === "github.pull_request") {
    return `${repoLabel} - PR #${preview.number}`;
  }

  if (preview?.type === "github.issue") {
    return `${repoLabel} - issue #${preview.number}`;
  }

  if (preview?.type === "github.repository") {
    return joinDetailParts([
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
  }

  if (preview?.type === "github.file" || preview?.type === "github.directory") {
    return joinDetailParts([
      repoLabel,
      preview.path,
      preview.type === "github.file" && preview.fileKind
        ? getLocalizedFileKindLabel(GITHUB_PREVIEW_LOCALE, preview.fileKind)
        : null,
      preview.ref,
      preview.type === "github.file"
        ? formatFileSizeLabel(preview.size, GITHUB_PREVIEW_LOCALE)
        : null,
      preview.type === "github.directory" && preview.itemCount !== null
        ? `${formatInteger(preview.itemCount)} items`
        : null,
    ]);
  }

  if (preview?.type === "github.commit") {
    return joinDetailParts([
      repoLabel,
      preview.shortSha,
      preview.author ? `@${preview.author}` : null,
      formatDate(preview.committedAt),
    ]);
  }

  if (preview?.type === "github.release") {
    return joinDetailParts([
      repoLabel,
      preview.tagName,
      preview.state,
      formatDate(preview.publishedAt),
    ]);
  }

  if (preview?.type === "github.actions") {
    return joinDetailParts([
      repoLabel,
      preview.runNumber ? `run #${formatInteger(preview.runNumber)}` : null,
      normalizeStatusText(preview.conclusion ?? preview.status),
      preview.event,
    ]);
  }

  if (preview?.type === "github.discussion") {
    return joinDetailParts([
      repoLabel,
      preview.number ? `discussion #${preview.number}` : null,
      preview.category,
      normalizeStatusText(preview.state),
      preview.comments !== null
        ? `${formatInteger(preview.comments)} comments`
        : null,
    ]);
  }

  if (link.kind === "pull" && link.number) {
    return `${repoLabel} - PR #${link.number}`;
  }

  if (link.kind === "issue" && link.number) {
    return `${repoLabel} - issue #${link.number}`;
  }

  if (link.pathLabel) {
    return `${repoLabel} - ${link.pathLabel}`;
  }

  return repoLabel;
};

export const getMetaText = (
  preview: GithubPreviewResponse | null
): string | null => {
  if (!preview) {
    return null;
  }

  if (preview.type === "github.pull_request") {
    return joinMetaParts([
      preview.author ? `by @${preview.author}` : null,
      preview.updatedAt ? `updated ${formatDate(preview.updatedAt)}` : null,
      preview.headRef && preview.baseRef
        ? `${preview.headRef} -> ${preview.baseRef}`
        : null,
    ]);
  }

  if (preview.type === "github.issue") {
    return joinMetaParts([
      preview.author ? `by @${preview.author}` : null,
      preview.updatedAt ? `updated ${formatDate(preview.updatedAt)}` : null,
    ]);
  }

  if (preview.type === "github.repository") {
    return joinMetaParts([
      preview.visibility,
      preview.defaultBranch ? `default ${preview.defaultBranch}` : null,
      preview.pushedAt ? `pushed ${formatDate(preview.pushedAt)}` : null,
    ]);
  }

  if (preview.type === "github.file" || preview.type === "github.directory") {
    return joinMetaParts([
      preview.path,
      preview.ref ? `ref ${preview.ref}` : null,
    ]);
  }

  return null;
};

export const getAssigneeLabel = (
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

export const getPreviewFacts = (
  preview: GithubPreviewResponse | null
): readonly GithubFact[] => {
  if (!preview) {
    return [];
  }

  switch (preview.type) {
    case "github.pull_request": {
      const checksLabel = getChecksLabel(preview.checks);
      return compactFacts([
        checksLabel
          ? {
              label: "Checks",
              value: checksLabel,
              tone: getChecksTone(preview.checks),
            }
          : null,
        preview.reviewState !== "none"
          ? {
              label: "Review",
              value:
                preview.reviewState === "changes_requested"
                  ? "Changes requested"
                  : "Approved",
              tone:
                preview.reviewState === "changes_requested"
                  ? "danger"
                  : "success",
            }
          : null,
        formatDiff(preview.additions, preview.deletions)
          ? {
              label: "Diff",
              value: formatDiff(preview.additions, preview.deletions)!,
            }
          : null,
        formatCount(preview.changedFiles, "file")
          ? {
              label: "Files",
              value: formatCount(preview.changedFiles, "file")!,
            }
          : null,
        formatCount(preview.commits, "commit")
          ? { label: "Commits", value: formatCount(preview.commits, "commit")! }
          : null,
        formatCount(preview.comments, "comment")
          ? {
              label: "Comments",
              value: formatCount(preview.comments, "comment")!,
            }
          : null,
      ]);
    }
    case "github.issue":
      return compactFacts([
        getAssigneeLabel(preview.assignees)
          ? { label: "Assignees", value: getAssigneeLabel(preview.assignees)! }
          : null,
        formatCount(preview.comments, "comment")
          ? {
              label: "Comments",
              value: formatCount(preview.comments, "comment")!,
            }
          : null,
        preview.closedAt
          ? { label: "Closed", value: formatDate(preview.closedAt) ?? "" }
          : null,
      ]);
    case "github.repository":
      return compactFacts([
        preview.language
          ? { label: "Language", value: preview.language }
          : null,
        formatCompactNumber(preview.stars)
          ? { label: "Stars", value: formatCompactNumber(preview.stars)! }
          : null,
        formatCompactNumber(preview.forks)
          ? { label: "Forks", value: formatCompactNumber(preview.forks)! }
          : null,
        formatCount(preview.openIssues, "issue")
          ? { label: "Open", value: formatCount(preview.openIssues, "issue")! }
          : null,
        preview.license ? { label: "License", value: preview.license } : null,
      ]);
    case "github.file":
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
        preview.language
          ? { label: "Language", value: preview.language }
          : null,
        preview.mimeType &&
        preview.fileKind !== "code" &&
        preview.fileKind !== "text"
          ? {
              label: t(GITHUB_PREVIEW_LOCALE, "linkPreview.github.fact.mime"),
              value: preview.mimeType,
            }
          : null,
        preview.ref ? { label: "Ref", value: preview.ref } : null,
        formatFileSizeLabel(preview.size, GITHUB_PREVIEW_LOCALE)
          ? {
              label: t(GITHUB_PREVIEW_LOCALE, "linkPreview.file.fact.size"),
              value: formatFileSizeLabel(preview.size, GITHUB_PREVIEW_LOCALE)!,
            }
          : null,
        formatCount(preview.lineCount, "line")
          ? { label: "Lines", value: formatCount(preview.lineCount, "line")! }
          : null,
        preview.lineStart
          ? {
              label: "Anchor",
              value:
                preview.lineEnd && preview.lineEnd !== preview.lineStart
                  ? `L${preview.lineStart}-L${preview.lineEnd}`
                  : `L${preview.lineStart}`,
            }
          : null,
      ]);
    case "github.directory":
      return compactFacts([
        preview.ref ? { label: "Ref", value: preview.ref } : null,
        formatCount(preview.itemCount, "item")
          ? { label: "Items", value: formatCount(preview.itemCount, "item")! }
          : null,
        formatCount(preview.fileCount, "file")
          ? { label: "Files", value: formatCount(preview.fileCount, "file")! }
          : null,
        formatCount(preview.directoryCount, "folder")
          ? {
              label: "Folders",
              value: formatCount(preview.directoryCount, "folder")!,
            }
          : null,
      ]);
    case "github.commit":
      return compactFacts([
        { label: "SHA", value: preview.shortSha },
        preview.author
          ? { label: "Author", value: `@${preview.author}` }
          : null,
        formatDate(preview.committedAt)
          ? { label: "Date", value: formatDate(preview.committedAt)! }
          : null,
        formatDiff(preview.additions, preview.deletions)
          ? {
              label: "Diff",
              value: formatDiff(preview.additions, preview.deletions)!,
            }
          : null,
        formatCount(preview.changedFiles, "file")
          ? {
              label: "Files",
              value: formatCount(preview.changedFiles, "file")!,
            }
          : null,
      ]);
    case "github.release":
      return compactFacts([
        preview.tagName ? { label: "Tag", value: preview.tagName } : null,
        { label: "State", value: titleCase(preview.state) ?? preview.state },
        formatDate(preview.publishedAt)
          ? { label: "Published", value: formatDate(preview.publishedAt)! }
          : null,
      ]);
    case "github.actions":
      return compactFacts([
        preview.runNumber
          ? { label: "Run", value: `#${formatInteger(preview.runNumber)}` }
          : null,
        titleCase(preview.conclusion ?? preview.status)
          ? {
              label: "Status",
              value: titleCase(preview.conclusion ?? preview.status)!,
              tone:
                preview.conclusion === "success"
                  ? "success"
                  : preview.conclusion
                    ? "danger"
                    : "default",
            }
          : null,
        preview.event ? { label: "Event", value: preview.event } : null,
      ]);
    case "github.discussion":
      return compactFacts([
        preview.number
          ? { label: "Discussion", value: `#${preview.number}` }
          : null,
        preview.category
          ? { label: "Category", value: preview.category }
          : null,
        titleCase(preview.state)
          ? { label: "State", value: titleCase(preview.state)! }
          : null,
        formatCount(preview.comments, "comment")
          ? {
              label: "Comments",
              value: formatCount(preview.comments, "comment")!,
            }
          : null,
      ]);
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
