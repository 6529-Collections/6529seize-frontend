"use client";

import { type CSSProperties, useEffect, useMemo, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import LinkHandlerFrame from "@/components/waves/LinkHandlerFrame";
import GithubPreviewStatusBadge from "@/components/waves/GithubPreviewStatusBadge";
import {
  fetchGithubPreview,
  type GithubPreviewLabel,
  type GithubPreviewResponse,
} from "@/services/api/github-preview-api";
import {
  parseGithubLink,
  type GithubFact,
  type GithubPreviewState,
} from "./githubPreviewParser";
import {
  getAccent,
  getAriaLabel,
  getCardTitle,
  getDetailText,
  getKindLabel,
  getKindLabelFromPreview,
  getMetaText,
  getPreviewFacts,
  getPreviewLabels,
  isStatusPreview,
  shouldFetchGithubPreview,
} from "./githubPreviewModel";

export { parseGithubLink } from "./githubPreviewParser";

interface GithubLinkPreviewProps {
  readonly href: string;
}

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
