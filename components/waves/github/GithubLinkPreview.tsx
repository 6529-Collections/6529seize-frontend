"use client";

import { useEffect, useMemo, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import LinkHandlerFrame from "@/components/waves/LinkHandlerFrame";
import GithubPreviewStatusBadge from "@/components/waves/GithubPreviewStatusBadge";
import {
  fetchGithubPreview,
  type GithubPreviewResponse,
} from "@/services/api/github-preview-api";

interface GithubLinkPreviewProps {
  readonly href: string;
}

type GithubLinkKind =
  | "pull"
  | "issue"
  | "repository"
  | "code"
  | "commit"
  | "release"
  | "actions"
  | "discussion"
  | "github";

export interface ParsedGithubLink {
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

const GITHUB_NUMBER_PATTERN = /^\d+$/;

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
    case "tree":
    case "blob":
      return { kind: "code", label: rest.length > 0 ? rest.join("/") : "Code" };
    case "commit":
      return {
        kind: "commit",
        label: rest[0] ? rest[0].slice(0, 12) : "Commit",
      };
    case "releases":
      return {
        kind: "release",
        label: rest[0] === "tag" && rest[1] ? rest[1] : "Releases",
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

const shouldFetchGithubPreview = (link: ParsedGithubLink): boolean =>
  link.kind === "pull" || link.kind === "issue";

const getKindLabel = (
  link: ParsedGithubLink,
  preview: GithubPreviewResponse | null
): string => {
  const effectiveKind =
    preview?.type === "github.pull_request"
      ? "pull"
      : preview?.type === "github.issue"
        ? "issue"
        : link.kind;

  switch (effectiveKind) {
    case "pull":
      return "Pull request";
    case "issue":
      return "Issue";
    case "code":
      return "Code";
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

const getFallbackTitle = (link: ParsedGithubLink): string => {
  switch (link.kind) {
    case "pull":
      return `Pull request #${link.number}`;
    case "issue":
      return `Issue #${link.number}`;
    case "repository":
      return `${link.owner}/${link.repo}`;
    case "code":
      return link.pathLabel ?? "Code";
    case "commit":
      return `Commit ${link.pathLabel ?? ""}`.trim();
    case "release":
      return link.pathLabel ?? "Release";
    case "actions":
      return link.pathLabel ?? "Actions";
    case "discussion":
      return `Discussion ${link.pathLabel ?? ""}`.trim();
    case "github":
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

const getAriaLabel = (
  link: ParsedGithubLink,
  preview: GithubPreviewResponse | null
): string => {
  const kindLabel = getKindLabel(link, preview).toLowerCase();
  const title = getCardTitle(link, preview);
  return `Open GitHub ${kindLabel}: ${title} (opens in a new tab)`;
};

const LoadingStatus = () => (
  <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-border-iron-600/50 tw-bg-iron-950/80 tw-px-2.5 tw-py-1 tw-text-[11px] tw-font-semibold tw-leading-none tw-text-iron-200 tw-shadow-lg tw-shadow-black/30">
    <span className="tw-h-2 tw-w-2 tw-animate-spin tw-rounded-full tw-border tw-border-solid tw-border-current tw-border-r-transparent" />
    Loading
  </span>
);

const UnavailableStatus = () => (
  <span className="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-iron-600/50 tw-bg-iron-950/80 tw-px-2.5 tw-py-1 tw-text-[11px] tw-font-semibold tw-leading-none tw-text-iron-300 tw-shadow-lg tw-shadow-black/30">
    Status unavailable
  </span>
);

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
  const kindLabel = getKindLabel(link, preview);
  const detailText = getDetailText(link, preview);

  return (
    <LinkHandlerFrame href={href}>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        prefetch={false}
        onClick={(event) => event.stopPropagation()}
        className="tw-relative tw-block tw-w-full tw-min-w-0 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/55 tw-p-3 tw-pr-12 tw-no-underline tw-shadow-sm tw-shadow-black/20 tw-transition tw-duration-200 hover:tw-border-iron-600 hover:tw-bg-iron-900/75 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 sm:tw-p-4 sm:tw-pr-14"
        data-testid="github-link-preview-card"
        aria-label={getAriaLabel(link, preview)}
      >
        <div className="tw-flex tw-min-w-0 tw-gap-3">
          <span className="tw-flex tw-h-10 tw-w-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-black/35">
            <Image
              src="/github_w.png"
              alt=""
              aria-hidden="true"
              width={24}
              height={24}
              unoptimized
              className="tw-h-6 tw-w-6 tw-opacity-90"
            />
          </span>
          <span className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-2">
            <span className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-2">
              <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-leading-none tw-tracking-wide tw-text-iron-400">
                GitHub
              </span>
              <span className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-800/80 tw-px-2 tw-py-1 tw-text-[11px] tw-font-semibold tw-leading-none tw-text-iron-200">
                {kindLabel}
              </span>
              {state.type === "loading" && <LoadingStatus />}
              {state.type === "error" && <UnavailableStatus />}
              {preview && (
                <GithubPreviewStatusBadge
                  href={href}
                  initialPreview={preview}
                  compact
                  placement="inline"
                />
              )}
            </span>
            <span className="tw-[overflow-wrap:anywhere] tw-line-clamp-2 tw-break-words tw-text-sm tw-font-semibold tw-leading-snug tw-text-iron-100 sm:tw-text-base">
              {title}
            </span>
            <span className="tw-[overflow-wrap:anywhere] tw-line-clamp-2 tw-break-words tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-400">
              {detailText}
            </span>
          </span>
        </div>
      </Link>
    </LinkHandlerFrame>
  );
}
