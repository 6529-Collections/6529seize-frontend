"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SignalSlashIcon } from "@heroicons/react/24/outline";

import CustomTooltip from "@/components/utils/tooltip/CustomTooltip";
import {
  fetchGithubPreview,
  type GithubPreviewResponse,
} from "@/services/api/github-preview-api";

interface GithubPreviewStatusBadgeProps {
  readonly href: string;
  readonly initialPreview?: GithubPreviewResponse | null | undefined;
  readonly compact?: boolean | undefined;
}

type BadgeTone = "green" | "purple" | "red" | "gray" | "amber";

interface BadgeViewModel {
  readonly label: string;
  readonly detail?: string | undefined;
  readonly tone: BadgeTone;
  readonly loading?: boolean | undefined;
}

interface GithubPreviewUrlInfo {
  readonly url: URL;
  readonly kind: "issue" | "pull";
}

const parseGithubPreviewUrl = (href: string): URL | null => {
  try {
    const url = new URL(href);
    const hostname = url.hostname.replace(/^www\./i, "").toLowerCase();
    if (hostname !== "github.com") {
      return null;
    }

    const [, , kind, number] = url.pathname.split("/").filter(Boolean);
    if ((kind !== "issues" && kind !== "pull") || !number) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
};

const parseGithubPreviewUrlInfo = (
  href: string
): GithubPreviewUrlInfo | null => {
  const url = parseGithubPreviewUrl(href);
  if (!url) {
    return null;
  }

  const [, , kind] = url.pathname.split("/").filter(Boolean);
  if (kind === "pull") {
    return { url, kind: "pull" };
  }

  if (kind === "issues") {
    return { url, kind: "issue" };
  }

  return null;
};

const getBadgeViewModel = (preview: GithubPreviewResponse): BadgeViewModel => {
  if (preview.type === "github.issue") {
    switch (preview.state) {
      case "open":
        return { label: "Open", tone: "green" };
      case "closed_completed":
        return { label: "Completed", tone: "purple" };
      case "closed_not_planned":
        return { label: "Not planned", tone: "gray" };
      case "closed":
        return { label: "Closed", tone: "red" };
    }
  }

  if (preview.state === "merged") {
    return { label: "Merged", tone: "purple" };
  }

  if (preview.state === "draft") {
    return { label: "Draft", tone: "gray" };
  }

  if (preview.state === "closed") {
    return { label: "Closed", tone: "red" };
  }

  if (preview.reviewState === "changes_requested") {
    return { label: "Changes requested", tone: "red" };
  }

  if (preview.reviewState === "approved") {
    return { label: "Approved", tone: "green" };
  }

  if (preview.mergeableState && preview.mergeableState !== "unknown") {
    return {
      label: "Open",
      detail: preview.mergeableState.replaceAll("_", " "),
      tone: preview.mergeableState === "clean" ? "green" : "amber",
    };
  }

  return { label: "Open", tone: "green" };
};

const TONE_CLASSES: Record<BadgeTone, string> = {
  green:
    "tw-border-emerald-400/40 tw-bg-emerald-950/90 tw-text-emerald-100 tw-shadow-emerald-950/40",
  purple:
    "tw-border-violet-400/40 tw-bg-violet-950/90 tw-text-violet-100 tw-shadow-violet-950/40",
  red: "tw-border-iron-600/45 tw-bg-iron-950/70 tw-text-iron-400 tw-shadow-black/20",
  gray: "tw-border-iron-500/50 tw-bg-iron-950/90 tw-text-iron-100 tw-shadow-black/40",
  amber:
    "tw-border-amber-400/40 tw-bg-amber-950/90 tw-text-amber-100 tw-shadow-amber-950/40",
};

const VISIBLE_REFRESH_INTERVAL_MS = 60 * 1000;

type GithubStatusState =
  | { readonly type: "idle" }
  | { readonly type: "loading" }
  | { readonly type: "success"; readonly preview: GithubPreviewResponse }
  | { readonly type: "error"; readonly message: string };

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to get status";
};

const getStatusViewModel = (status: GithubStatusState): BadgeViewModel => {
  if (status.type === "success") {
    return getBadgeViewModel(status.preview);
  }

  if (status.type === "error") {
    return { label: "Status unavailable", tone: "red" };
  }

  return { label: "Loading status", tone: "gray", loading: true };
};

const getBadgeTitle = (
  status: GithubStatusState,
  viewModel: BadgeViewModel,
  detail: string | undefined
): string => {
  if (status.type === "error") {
    return "Status unavailable";
  }

  if (detail) {
    return `${viewModel.label} · ${detail}`;
  }

  return viewModel.label;
};

export default function GithubPreviewStatusBadge({
  href,
  initialPreview,
  compact = false,
}: GithubPreviewStatusBadgeProps) {
  const githubInfo = useMemo(() => parseGithubPreviewUrlInfo(href), [href]);
  const badgeRef = useRef<HTMLSpanElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState<GithubStatusState>(() =>
    initialPreview
      ? { type: "success", preview: initialPreview }
      : { type: "idle" }
  );

  useEffect(() => {
    if (!githubInfo) {
      setIsVisible(false);
      return;
    }

    const badge = badgeRef.current;
    if (!badge || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry?.isIntersecting === true),
      { threshold: 0.1 }
    );
    observer.observe(badge);

    return () => observer.disconnect();
  }, [githubInfo, status.type]);

  useEffect(() => {
    if (!githubInfo) {
      setStatus({ type: "idle" });
      return;
    }

    let active = true;

    if (initialPreview) {
      setStatus({ type: "success", preview: initialPreview });
      return () => {
        active = false;
      };
    }

    if (!isVisible) {
      return () => {
        active = false;
      };
    }

    setStatus({ type: "loading" });

    fetchGithubPreview(githubInfo.url.toString())
      .then((response) => {
        if (active) {
          setStatus({ type: "success", preview: response });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setStatus({
            type: "error",
            message: getErrorMessage(error),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [githubInfo, initialPreview, isVisible]);

  useEffect(() => {
    if (!githubInfo || !isVisible) {
      return;
    }

    let active = true;

    const refreshStatus = () => {
      fetchGithubPreview(githubInfo.url.toString(), { bypassCache: true })
        .then((response) => {
          if (active) {
            setStatus({ type: "success", preview: response });
          }
        })
        .catch((error: unknown) => {
          if (active) {
            setStatus({
              type: "error",
              message: getErrorMessage(error),
            });
          }
        });
    };

    const interval = globalThis.setInterval(
      refreshStatus,
      VISIBLE_REFRESH_INTERVAL_MS
    );

    return () => {
      active = false;
      globalThis.clearInterval(interval);
    };
  }, [githubInfo, isVisible]);

  if (!githubInfo) {
    return null;
  }

  const viewModel = getStatusViewModel(status);
  const detail = compact ? undefined : viewModel.detail;
  const title = getBadgeTitle(status, viewModel, detail);
  const badge = (
    <span
      ref={badgeRef}
      className={`tw-pointer-events-auto tw-absolute tw-right-2 tw-top-2 tw-z-20 tw-inline-flex tw-max-w-[calc(100%-1rem)] tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-px-2.5 tw-py-1 tw-text-[11px] tw-font-semibold tw-leading-none tw-shadow-lg tw-backdrop-blur-md ${TONE_CLASSES[viewModel.tone]}`}
      data-testid="github-preview-status-badge"
      aria-label={title}
      title={title}
    >
      {viewModel.loading && (
        <span className="tw-h-2 tw-w-2 tw-animate-spin tw-rounded-full tw-border tw-border-solid tw-border-current tw-border-r-transparent" />
      )}
      {status.type === "error" ? (
        <SignalSlashIcon
          className="tw-h-3.5 tw-w-3.5"
          aria-hidden="true"
          strokeWidth={2}
        />
      ) : (
        <span className="tw-line-clamp-1 tw-capitalize">{viewModel.label}</span>
      )}
      {detail && (
        <span className="tw-hidden tw-font-medium tw-normal-case tw-opacity-70 sm:tw-inline">
          {detail}
        </span>
      )}
    </span>
  );

  if (status.type !== "error") {
    return badge;
  }

  return (
    <CustomTooltip content="Status unavailable" placement="top" delayShow={200}>
      {badge}
    </CustomTooltip>
  );
}
