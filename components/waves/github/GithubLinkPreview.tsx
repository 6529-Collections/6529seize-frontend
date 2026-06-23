"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import LinkHandlerFrame from "@/components/waves/LinkHandlerFrame";
import GithubPreviewStatusBadge from "@/components/waves/GithubPreviewStatusBadge";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  formatFileSizeLabel,
  getLocalizedFileKindLabel,
  getLocalizedGithubFileKindLabel,
} from "@/lib/link-preview/filePreviewI18n";
import {
  fetchGithubPreview,
  type GithubPreviewChecks,
  type GithubPreviewLabel,
  type GithubPreviewResponse,
  type GithubStatusPreviewResponse,
} from "@/services/api/github-preview-api";

interface GithubLinkPreviewProps {
  readonly href: string;
}

type GithubLinkKind =
  | "pull"
  | "issue"
  | "repository"
  | "file"
  | "directory"
  | "commit"
  | "release"
  | "actions"
  | "discussion"
  | "github";

interface ParsedGithubLink {
  readonly href: string;
  readonly owner: string;
  readonly repo: string;
  readonly kind: GithubLinkKind;
  readonly number?: number | undefined;
  readonly pathLabel?: string | undefined;
}

type GithubPreviewState =
  | { readonly type: "idle" }
  | { readonly type: "loading" }
  | { readonly type: "success"; readonly preview: GithubPreviewResponse }
  | { readonly type: "error" };

interface GithubFact {
  readonly label: string;
  readonly value: string;
  readonly tone?: "default" | "success" | "warning" | "danger" | undefined;
}

interface GithubAccent {
  readonly kind: GithubLinkKind;
  readonly railColor: string;
  readonly borderColor: string;
  readonly backgroundColor: string;
  readonly textColor: string;
}

const GITHUB_NUMBER_PATTERN = /^\d+$/;
const GITHUB_PREVIEW_LOCALE = DEFAULT_LOCALE;

const GITHUB_ACCENTS: Record<GithubLinkKind, Omit<GithubAccent, "kind">> = {
  pull: {
    railColor: "#8b5cf6",
    borderColor: "rgba(139, 92, 246, 0.32)",
    backgroundColor: "rgba(139, 92, 246, 0.12)",
    textColor: "#ddd6fe",
  },
  issue: {
    railColor: "#22c55e",
    borderColor: "rgba(34, 197, 94, 0.3)",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    textColor: "#bbf7d0",
  },
  repository: {
    railColor: "#38bdf8",
    borderColor: "rgba(56, 189, 248, 0.28)",
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    textColor: "#bae6fd",
  },
  file: {
    railColor: "#f59e0b",
    borderColor: "rgba(245, 158, 11, 0.32)",
    backgroundColor: "rgba(245, 158, 11, 0.11)",
    textColor: "#fde68a",
  },
  directory: {
    railColor: "#14b8a6",
    borderColor: "rgba(20, 184, 166, 0.3)",
    backgroundColor: "rgba(20, 184, 166, 0.1)",
    textColor: "#99f6e4",
  },
  commit: {
    railColor: "#fb923c",
    borderColor: "rgba(251, 146, 60, 0.3)",
    backgroundColor: "rgba(251, 146, 60, 0.1)",
    textColor: "#fed7aa",
  },
  release: {
    railColor: "#10b981",
    borderColor: "rgba(16, 185, 129, 0.3)",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    textColor: "#a7f3d0",
  },
  actions: {
    railColor: "#60a5fa",
    borderColor: "rgba(96, 165, 250, 0.3)",
    backgroundColor: "rgba(96, 165, 250, 0.1)",
    textColor: "#bfdbfe",
  },
  discussion: {
    railColor: "#ec4899",
    borderColor: "rgba(236, 72, 153, 0.3)",
    backgroundColor: "rgba(236, 72, 153, 0.1)",
    textColor: "#fbcfe8",
  },
  github: {
    railColor: "#94a3b8",
    borderColor: "rgba(148, 163, 184, 0.26)",
    backgroundColor: "rgba(148, 163, 184, 0.08)",
    textColor: "#cbd5e1",
  },
};

const safeDecode = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const toPositiveNumber = (value: string | undefined): number | undefined => {
  if (!value || !GITHUB_NUMBER_PATTERN.test(value)) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

const getRepositoryPathLabel = (
  segment: string | undefined,
  rest: readonly string[]
): { readonly kind: GithubLinkKind; readonly label?: string | undefined } => {
  switch (segment) {
    case undefined:
      return { kind: "repository" };
    case "blob":
      return { kind: "file", label: rest.length > 0 ? rest.join("/") : "File" };
    case "tree":
      return {
        kind: "directory",
        label: rest.length > 0 ? rest.join("/") : "Directory",
      };
    case "commit":
      return {
        kind: "commit",
        label: rest[0] ? rest[0].slice(0, 12) : "Commit",
      };
    case "releases":
      return {
        kind: "release",
        label:
          rest[0] === "tag" && rest[1] ? rest.slice(1).join("/") : "Releases",
      };
    case "actions":
      return { kind: "actions", label: "Actions" };
    case "discussions":
      return {
        kind: "discussion",
        label: rest[0] ? `#${rest[0]}` : "Discussions",
      };
    case "issues":
      return { kind: "repository", label: "Issues" };
    case "pulls":
      return { kind: "repository", label: "Pull requests" };
    default:
      return { kind: "github", label: segment };
  }
};

export const parseGithubLink = (href: string): ParsedGithubLink | null => {
  let url: URL;

  try {
    url = new URL(href);
  } catch {
    return null;
  }

  const hostname = url.hostname.replace(/^www\./i, "").toLowerCase();
  if (hostname !== "github.com") {
    return null;
  }

  const [ownerSegment, repoSegment, kindSegment, numberSegment, ...rest] =
    url.pathname.split("/").filter(Boolean);

  if (!ownerSegment || !repoSegment) {
    return null;
  }

  const owner = safeDecode(ownerSegment);
  const repo = safeDecode(repoSegment);
  const number = toPositiveNumber(numberSegment);

  if (kindSegment === "pull" && number) {
    return {
      href,
      owner,
      repo,
      kind: "pull",
      number,
    };
  }

  if (kindSegment === "issues" && number) {
    return {
      href,
      owner,
      repo,
      kind: "issue",
      number,
    };
  }

  // Non-PR/issue GitHub routes keep the segment after the repo as part of the
  // display path, e.g. /commit/<sha> exposes the sha as numberSegment here.
  const repositoryPath = getRepositoryPathLabel(
    kindSegment,
    [numberSegment, ...rest].filter((value): value is string => Boolean(value))
  );

  return {
    href,
    owner,
    repo,
    kind: repositoryPath.kind,
    pathLabel: repositoryPath.label,
  };
};

// Rich previews fetch only for known GitHub resource shapes. Unknown subroutes
// keep local labels to avoid broad fan-out through the server API route.
const shouldFetchGithubPreview = (link: ParsedGithubLink): boolean =>
  link.kind !== "github";

const isStatusPreview = (
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

const getKindLabel = (
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

const getKindLabelFromPreview = (
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

const getAccent = (
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

const getCardTitle = (
  link: ParsedGithubLink,
  preview: GithubPreviewResponse | null
): string => {
  const title = preview?.title?.trim();
  return title && title.length > 0 ? title : getFallbackTitle(link);
};

const getDetailText = (
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

const getMetaText = (preview: GithubPreviewResponse | null): string | null => {
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

const getPreviewLabels = (
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

const getPreviewFacts = (
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
        preview.language ? { label: "Language", value: preview.language } : null,
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
              value: formatFileSizeLabel(
                preview.size,
                GITHUB_PREVIEW_LOCALE
              )!,
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

const getAriaLabel = (
  link: ParsedGithubLink,
  preview: GithubPreviewResponse | null
): string => {
  const kindLabel = (
    getKindLabelFromPreview(preview) ?? getKindLabel(link, preview)
  ).toLowerCase();
  const title = getCardTitle(link, preview);
  return `Open GitHub ${kindLabel}: ${title} (opens in a new tab)`;
};

const LoadingStatus = () => (
  <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-border-iron-600/50 tw-bg-iron-950/80 tw-px-2.5 tw-py-1 tw-text-[11px] tw-font-semibold tw-leading-none tw-text-iron-200 tw-shadow-lg tw-shadow-black/30">
    <span className="tw-h-2 tw-w-2 tw-animate-spin tw-rounded-full tw-border tw-border-solid tw-border-current tw-border-r-transparent" />
    <span>Loading</span>
  </span>
);

const UnavailableStatus = () => (
  <span className="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-iron-600/50 tw-bg-iron-950/80 tw-px-2.5 tw-py-1 tw-text-[11px] tw-font-semibold tw-leading-none tw-text-iron-300 tw-shadow-lg tw-shadow-black/30">
    Status unavailable
  </span>
);

const FACT_TONE_CLASSES: Record<NonNullable<GithubFact["tone"]>, string> = {
  default: "tw-border-iron-800 tw-bg-iron-950/55 tw-text-iron-100",
  success: "tw-border-emerald-500/25 tw-bg-emerald-500/10 tw-text-emerald-100",
  warning: "tw-border-amber-400/30 tw-bg-amber-500/10 tw-text-amber-100",
  danger: "tw-border-rose-400/30 tw-bg-rose-500/10 tw-text-rose-100",
};

const FactChips = ({ facts }: { readonly facts: readonly GithubFact[] }) => {
  if (facts.length === 0) {
    return null;
  }

  return (
    <span className="tw-flex tw-min-w-0 tw-flex-wrap tw-gap-1.5">
      {facts.slice(0, 6).map((fact) => (
        <span
          key={`${fact.label}-${fact.value}`}
          className={`tw-inline-flex tw-min-w-0 tw-max-w-full tw-items-baseline tw-gap-1 tw-rounded-md tw-border tw-border-solid tw-px-2 tw-py-0.5 tw-text-[11px] tw-leading-5 ${
            FACT_TONE_CLASSES[fact.tone ?? "default"]
          }`}
        >
          <span className="tw-flex-shrink-0 tw-text-iron-400">
            {fact.label}
          </span>
          <span className="tw-truncate tw-font-semibold">{fact.value}</span>
        </span>
      ))}
    </span>
  );
};

const getLabelStyle = (
  label: GithubPreviewLabel
): CSSProperties | undefined => {
  const color = label.color?.trim();
  if (!color || !/^[0-9a-f]{6}$/i.test(color)) {
    return undefined;
  }

  return {
    borderColor: `#${color}88`,
    backgroundColor: `#${color}22`,
  };
};

const LabelChips = ({
  labels,
}: {
  readonly labels: readonly GithubPreviewLabel[];
}) => {
  if (labels.length === 0) {
    return null;
  }

  return (
    <span className="tw-flex tw-min-w-0 tw-flex-wrap tw-gap-1.5">
      {labels.slice(0, 4).map((label) => (
        <span
          key={label.name}
          style={getLabelStyle(label)}
          className="tw-inline-flex tw-max-w-full tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/65 tw-px-2 tw-py-0.5 tw-text-[11px] tw-font-medium tw-leading-5 tw-text-iron-100"
        >
          <span className="tw-truncate">{label.name}</span>
        </span>
      ))}
      {labels.length > 4 && (
        <span className="tw-rounded-full tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/60 tw-px-2 tw-py-0.5 tw-text-[11px] tw-font-medium tw-leading-5 tw-text-iron-400">
          +{labels.length - 4}
        </span>
      )}
    </span>
  );
};

const FileExcerpt = ({
  preview,
}: {
  readonly preview: GithubPreviewResponse | null;
}) => {
  if (preview?.type !== "github.file" || !preview.excerpt?.length) {
    return null;
  }

  const start = preview.lineStart ?? 1;

  return (
    <span
      className="tw-grid tw-max-h-24 tw-overflow-hidden tw-rounded-md tw-border tw-border-solid tw-border-iron-800 tw-bg-black/35 tw-p-2 tw-font-mono tw-text-[11px] tw-leading-4 tw-text-iron-200 sm:tw-text-xs"
      data-testid="github-file-excerpt"
    >
      {preview.excerpt.map((line, index) => (
        <span key={`${start + index}-${line}`} className="tw-flex tw-min-w-0">
          <span className="tw-mr-2 tw-w-8 tw-flex-shrink-0 tw-select-none tw-text-right tw-text-iron-500">
            {start + index}
          </span>
          <span className="tw-min-w-0 tw-truncate">{line || " "}</span>
        </span>
      ))}
    </span>
  );
};

const DirectoryEntries = ({
  preview,
}: {
  readonly preview: GithubPreviewResponse | null;
}) => {
  if (preview?.type !== "github.directory" || !preview.entries?.length) {
    return null;
  }

  return (
    <span className="tw-flex tw-min-w-0 tw-flex-wrap tw-gap-1.5">
      {preview.entries.map((entry) => (
        <span
          key={entry}
          className="tw-inline-flex tw-max-w-full tw-rounded-md tw-bg-black/25 tw-px-2 tw-py-0.5 tw-font-mono tw-text-[11px] tw-leading-5 tw-text-iron-200"
        >
          <span className="tw-truncate">{entry}</span>
        </span>
      ))}
    </span>
  );
};

export default function GithubLinkPreview({ href }: GithubLinkPreviewProps) {
  const link = useMemo(() => parseGithubLink(href), [href]);
  const [state, setState] = useState<GithubPreviewState>({ type: "idle" });

  useEffect(() => {
    if (!link || !shouldFetchGithubPreview(link)) {
      setState({ type: "idle" });
      return;
    }

    let active = true;
    setState({ type: "loading" });

    fetchGithubPreview(link.href)
      .then((preview) => {
        if (active) {
          setState({ type: "success", preview });
        }
      })
      .catch(() => {
        if (active) {
          setState({ type: "error" });
        }
      });

    return () => {
      active = false;
    };
  }, [link]);

  if (!link) {
    return null;
  }

  const preview = state.type === "success" ? state.preview : null;
  const title = getCardTitle(link, preview);
  const kindLabel =
    getKindLabelFromPreview(preview) ?? getKindLabel(link, preview);
  const detailText = getDetailText(link, preview);
  const metaText = getMetaText(preview);
  const facts = getPreviewFacts(preview);
  const labels = getPreviewLabels(preview);
  const accent = getAccent(link, preview);

  return (
    <LinkHandlerFrame href={href}>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        prefetch={false}
        onClick={(event) => event.stopPropagation()}
        className="tw-relative tw-block tw-w-full tw-min-w-0 tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950/70 tw-p-3 tw-pr-12 tw-no-underline tw-shadow-sm tw-shadow-black/20 tw-transition tw-duration-200 hover:tw-border-iron-600 hover:tw-bg-iron-900/75 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 sm:tw-p-4 sm:tw-pr-14"
        data-testid="github-link-preview-card"
        aria-label={getAriaLabel(link, preview)}
      >
        <span
          aria-hidden="true"
          className="tw-absolute tw-inset-y-0 tw-left-0 tw-w-1 tw-opacity-85"
          data-testid="github-preview-accent"
          data-accent-kind={accent.kind}
          style={{ backgroundColor: accent.railColor }}
        />
        <span className="tw-grid tw-min-w-0 tw-grid-cols-[2.5rem,minmax(0,1fr)] tw-gap-3 sm:tw-grid-cols-[3rem,minmax(0,1fr)]">
          <span
            className="tw-flex tw-h-10 tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-black/35 sm:tw-h-12 sm:tw-w-12"
            style={{
              borderColor: accent.borderColor,
              backgroundColor: accent.backgroundColor,
            }}
          >
            <Image
              src="/github_w.png"
              alt=""
              aria-hidden="true"
              width={24}
              height={24}
              unoptimized
              className="tw-h-6 tw-w-6 tw-opacity-90 sm:tw-h-7 sm:tw-w-7"
            />
          </span>
          <span className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-2.5">
            <span className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-1.5 sm:tw-gap-2">
              <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-leading-none tw-text-iron-500">
                GitHub
              </span>
              <span
                className="tw-inline-flex tw-items-center tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800/75 tw-px-2 tw-py-1 tw-text-[11px] tw-font-semibold tw-leading-none tw-text-iron-200"
                data-testid="github-preview-kind-badge"
                style={{
                  borderColor: accent.borderColor,
                  backgroundColor: accent.backgroundColor,
                  color: accent.textColor,
                }}
              >
                {kindLabel}
              </span>
              {state.type === "loading" && <LoadingStatus />}
              {state.type === "error" && <UnavailableStatus />}
              {isStatusPreview(preview) && (
                <GithubPreviewStatusBadge
                  href={href}
                  initialPreview={preview}
                  compact
                  placement="inline"
                />
              )}
            </span>
            <span className="tw-flex tw-min-w-0 tw-flex-col tw-gap-1">
              <span className="tw-[overflow-wrap:anywhere] tw-line-clamp-2 tw-break-words tw-text-sm tw-font-semibold tw-leading-snug tw-text-iron-50 sm:tw-text-base">
                {title}
              </span>
              <span className="tw-[overflow-wrap:anywhere] tw-line-clamp-2 tw-break-words tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-400">
                {detailText}
              </span>
              {metaText && (
                <span className="tw-[overflow-wrap:anywhere] tw-line-clamp-1 tw-break-words tw-text-xs tw-leading-5 tw-text-iron-500">
                  {metaText}
                </span>
              )}
            </span>
            <FactChips facts={facts} />
            <LabelChips labels={labels} />
            <DirectoryEntries preview={preview} />
            <FileExcerpt preview={preview} />
          </span>
        </span>
      </Link>
    </LinkHandlerFrame>
  );
}
