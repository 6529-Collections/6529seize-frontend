"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

import { fetchFarcasterPreview } from "@/services/api/farcaster";
import type {
  FarcasterPreviewResponse,
  FarcasterCastPreview,
  FarcasterChannelPreview,
  FarcasterFramePreview,
  FarcasterProfilePreview,
  FarcasterUnavailablePreview,
  FarcasterUnsupportedPreview,
  FarcasterCastEmbed,
} from "@/types/farcaster.types";

import { LinkPreviewCardLayout } from "./OpenGraphPreview";

interface FarcasterCardProps {
  readonly href: string;
}

type SupportedPreview = Exclude<
  FarcasterPreviewResponse,
  FarcasterUnavailablePreview | FarcasterUnsupportedPreview
>;

type FarcasterCardState =
  | { readonly status: "loading" }
  | { readonly status: "fallback" }
  | { readonly status: "unavailable"; readonly data: FarcasterUnavailablePreview }
  | { readonly status: "ready"; readonly data: SupportedPreview };

const COMPACT_NUMBER_FORMATTER = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
});

const formatCount = (value: number | undefined): string | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  if (value < 1000) {
    return `${value}`;
  }

  return COMPACT_NUMBER_FORMATTER.format(value);
};

const formatRelativeTime = (timestamp: string | undefined): string | null => {
  if (!timestamp) {
    return null;
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const diffInSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  for (const [unit, secondsInUnit] of units) {
    const value = Math.round(diffInSeconds / secondsInUnit);
    if (Math.abs(value) >= 1 || unit === "second") {
      return RELATIVE_TIME_FORMATTER.format(value, unit);
    }
  }

  return null;
};

const getPrimaryHref = (
  preview: { readonly canonicalUrl?: string | undefined },
  fallback: string
): string => {
  if (preview.canonicalUrl && preview.canonicalUrl.trim().length > 0) {
    return preview.canonicalUrl;
  }

  return fallback;
};

const ExternalLink = ({
  href,
  children,
}: {
  readonly href: string;
  readonly children: ReactNode;
}) => (
  <Link
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="tw-inline-flex tw-items-center tw-gap-x-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-600 tw-bg-iron-900/60 tw-px-3 tw-py-1.5 tw-text-sm tw-font-semibold tw-text-iron-100 tw-no-underline tw-transition tw-duration-200 hover:tw-border-iron-400 hover:tw-text-white"
  >
    {children}
  </Link>
);

const renderImageGrid = (
  embeds: readonly FarcasterCastEmbed[] | undefined,
  authorName: string
): ReactNode => {
  if (!embeds) {
    return null;
  }

  const images = embeds
    .filter((embed) => embed.type === "image")
    .map((embed) => embed.previewImageUrl ?? embed.url)
    .filter((url): url is string => typeof url === "string" && url.length > 0);

  if (images.length === 0) {
    return null;
  }

  let gridClass = "tw-grid tw-grid-cols-2 tw-gap-2";
  if (images.length === 1) {
    gridClass = "tw-flex";
  } else if (images.length === 3) {
    gridClass = "tw-grid tw-grid-cols-3 tw-gap-2";
  }

  return (
    <div className={gridClass}>
      {images.slice(0, 4).map((url, index) => (
        <div
          key={`${url}-${index}`}
          className="tw-relative tw-overflow-hidden tw-rounded-lg tw-bg-iron-800/60"
        >
          <img
            src={url}
            alt={`Image from ${authorName}'s cast`}
            loading="lazy"
            decoding="async"
            className="tw-h-full tw-w-full tw-object-cover"
          />
        </div>
      ))}
    </div>
  );
};

const CastHeader = ({
  preview,
}: {
  readonly preview: FarcasterCastPreview["cast"];
}) => {
  const timestamp = formatRelativeTime(preview.timestamp);

  return (
    <div className="tw-flex tw-items-start tw-gap-3">
      {preview.author.avatarUrl && (
        <img
          src={preview.author.avatarUrl}
          alt={preview.author.displayName ? `${preview.author.displayName}'s avatar` : "Farcaster avatar"}
          loading="lazy"
          decoding="async"
          className="tw-h-12 tw-w-12 tw-flex-shrink-0 tw-rounded-full tw-object-cover"
        />
      )}
      <div className="tw-min-w-0 tw-flex-1">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
          <span className="tw-text-base tw-font-semibold tw-text-iron-100">
            {preview.author.displayName ?? preview.author.username ?? "Farcaster user"}
          </span>
          {preview.author.username && (
            <span className="tw-text-sm tw-text-iron-400">@{preview.author.username}</span>
          )}
          {timestamp && (
            <span className="tw-text-xs tw-text-iron-500">{timestamp}</span>
          )}
        </div>
        {preview.channel?.name && (
          <div className="tw-mt-2 tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-px-3 tw-py-1 tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-iron-300">
            {preview.channel.iconUrl && (
              <img
                src={preview.channel.iconUrl}
                alt={`${preview.channel.name} channel icon`}
                loading="lazy"
                decoding="async"
                className="tw-h-4 tw-w-4 tw-rounded-full tw-object-cover"
              />
            )}
            <span>/{preview.channel.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const renderReactions = (
  reactions: FarcasterCastPreview["cast"]["reactions"] | null | undefined
): ReactNode => {
  if (!reactions) {
    return null;
  }

  const stats: Array<{ label: string; value: string | null }> = [
    { label: "Likes", value: formatCount(reactions.likes) },
    { label: "Recasts", value: formatCount(reactions.recasts) },
    { label: "Replies", value: formatCount(reactions.replies) },
  ];

  const visible = stats.filter((stat) => stat.value !== null);
  if (visible.length === 0) {
    return null;
  }

  return (
    <div className="tw-flex tw-flex-wrap tw-gap-4">
      {visible.map((stat) => (
        <div key={stat.label} className="tw-text-sm tw-text-iron-300">
          <span className="tw-font-semibold tw-text-iron-100">{stat.value}</span>
          <span className="tw-ml-1">{stat.label}</span>
        </div>
      ))}
    </div>
  );
};

const CastBody = ({ preview }: { readonly preview: FarcasterCastPreview }) => {
  const authorName =
    preview.cast.author.displayName ??
    preview.cast.author.username ??
    "Farcaster";

  return (
    <div className="tw-space-y-4">
      <CastHeader preview={preview.cast} />
      {preview.cast.text && (
        <p className="tw-m-0 tw-text-sm tw-leading-6 tw-text-iron-200 tw-whitespace-pre-wrap tw-break-words">
          {preview.cast.text}
        </p>
      )}
      {renderImageGrid(preview.cast.embeds, authorName)}
      {renderReactions(preview.cast.reactions)}
    </div>
  );
};

const ProfileBody = ({
  preview,
}: {
  readonly preview: FarcasterProfilePreview;
}) => (
  <div className="tw-flex tw-gap-3">
    {preview.profile.avatarUrl && (
      <img
        src={preview.profile.avatarUrl}
        alt={preview.profile.displayName ? `${preview.profile.displayName}'s avatar` : "Farcaster avatar"}
        loading="lazy"
        decoding="async"
        className="tw-h-16 tw-w-16 tw-flex-shrink-0 tw-rounded-full tw-object-cover"
      />
    )}
    <div className="tw-min-w-0 tw-space-y-2">
      <div className="tw-space-y-1">
        <p className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-100">
          {preview.profile.displayName ?? preview.profile.username ?? "Farcaster user"}
        </p>
        {preview.profile.username && (
          <p className="tw-m-0 tw-text-sm tw-text-iron-400">
            @{preview.profile.username}
          </p>
        )}
      </div>
      {preview.profile.bio && (
        <p className="tw-m-0 tw-text-sm tw-text-iron-200 tw-whitespace-pre-wrap tw-break-words">
          {preview.profile.bio}
        </p>
      )}
    </div>
  </div>
);

const ChannelBody = ({
  preview,
}: {
  readonly preview: FarcasterChannelPreview;
}) => (
  <div className="tw-space-y-3">
    <div className="tw-flex tw-items-center tw-gap-3">
      {preview.channel.iconUrl && (
        <img
          src={preview.channel.iconUrl}
          alt={preview.channel.name ? `${preview.channel.name} icon` : "Channel icon"}
          loading="lazy"
          decoding="async"
          className="tw-h-12 tw-w-12 tw-rounded-full tw-object-cover"
        />
      )}
      <div className="tw-min-w-0">
        <p className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
          {preview.channel.name ?? `/${preview.channel.id ?? "channel"}`}
        </p>
        {preview.channel.id && (
          <p className="tw-m-0 tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-400">
            /{preview.channel.id}
          </p>
        )}
      </div>
    </div>
    {preview.channel.description && (
      <p className="tw-m-0 tw-text-sm tw-text-iron-200 tw-whitespace-pre-wrap tw-break-words">
        {preview.channel.description}
      </p>
    )}
    {preview.channel.latestCast?.text && (
      <div className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/30 tw-p-3">
        <p className="tw-m-0 tw-text-xs tw-uppercase tw-tracking-wide tw-text-iron-400">
          Latest cast
        </p>
        <p className="tw-mt-2 tw-text-sm tw-text-iron-100 tw-whitespace-pre-wrap tw-break-words">
          {preview.channel.latestCast.text}
        </p>
        {preview.channel.latestCast.author && (
          <p className="tw-m-0 tw-text-xs tw-text-iron-400">
            @{preview.channel.latestCast.author}
          </p>
        )}
      </div>
    )}
  </div>
);

const FrameBody = ({ preview }: { readonly preview: FarcasterFramePreview }) => (
  <div className="tw-space-y-4">
    {preview.frame.imageUrl && (
      <div className="tw-overflow-hidden tw-rounded-xl tw-bg-iron-900/40">
        <img
          src={preview.frame.imageUrl}
          alt={preview.frame.title ?? "Frame preview"}
          loading="lazy"
          decoding="async"
          className="tw-h-full tw-w-full tw-object-cover"
        />
      </div>
    )}
    <div className="tw-space-y-1">
      {preview.frame.title && (
        <p className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-100">
          {preview.frame.title}
        </p>
      )}
      <p className="tw-m-0 tw-text-sm tw-text-iron-400">
        {preview.frame.siteName ?? new URL(preview.frame.frameUrl).host}
      </p>
    </div>
    {preview.frame.buttons && preview.frame.buttons.length > 0 && (
      <div className="tw-flex tw-flex-wrap tw-gap-2">
        {preview.frame.buttons.map((label, index) => (
          <span
            key={`${label}-${index}`}
            className="tw-inline-flex tw-items-center tw-rounded-full tw-bg-iron-800/60 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-iron-200"
          >
            {label}
          </span>
        ))}
      </div>
    )}
    <div className="tw-flex tw-flex-wrap tw-gap-3">
      <ExternalLink href={preview.frame.castUrl ?? preview.frame.frameUrl}>
        Open in Warpcast
      </ExternalLink>
      <ExternalLink href={preview.frame.frameUrl}>Open frame URL</ExternalLink>
    </div>
  </div>
);

const renderContent = (
  preview: SupportedPreview,
  href: string
): ReactElement => {
  if (preview.type === "cast") {
    const primaryHref = getPrimaryHref(preview, href);
    return (
      <LinkPreviewCardLayout href={href}>
        <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4 tw-space-y-4">
          <CastBody preview={preview} />
          <div className="tw-flex tw-flex-wrap tw-gap-3">
            <ExternalLink href={primaryHref}>Open on Warpcast</ExternalLink>
          </div>
        </div>
      </LinkPreviewCardLayout>
    );
  }

  if (preview.type === "profile") {
    const primaryHref = getPrimaryHref(preview, href);
    return (
      <LinkPreviewCardLayout href={href}>
        <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4 tw-space-y-4">
          <ProfileBody preview={preview} />
          <ExternalLink href={primaryHref}>Open profile on Warpcast</ExternalLink>
        </div>
      </LinkPreviewCardLayout>
    );
  }

  if (preview.type === "channel") {
    const primaryHref = getPrimaryHref(preview, href);
    return (
      <LinkPreviewCardLayout href={href}>
        <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4 tw-space-y-4">
          <ChannelBody preview={preview} />
          <ExternalLink href={primaryHref}>Open channel on Warpcast</ExternalLink>
        </div>
      </LinkPreviewCardLayout>
    );
  }

  if (preview.type === "frame") {
    return (
      <LinkPreviewCardLayout href={href}>
        <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
          <FrameBody preview={preview} />
        </div>
      </LinkPreviewCardLayout>
    );
  }

  return (
    <LinkPreviewCardLayout href={href}>
      <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
        <p className="tw-m-0 tw-text-sm tw-text-iron-200">Unsupported preview.</p>
      </div>
    </LinkPreviewCardLayout>
  );
};

const renderUnavailable = (
  preview: FarcasterUnavailablePreview,
  href: string
): ReactElement => {
  const primaryHref = getPrimaryHref(preview, href);

  return (
    <LinkPreviewCardLayout href={href}>
      <div className="tw-flex tw-flex-col tw-items-start tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
        <div>
          <p className="tw-m-0 tw-text-base tw-font-semibold tw-text-iron-100">
            Unavailable on Farcaster
          </p>
          {preview.reason && (
            <p className="tw-mt-1 tw-text-sm tw-text-iron-300">{preview.reason}</p>
          )}
        </div>
        <ExternalLink href={primaryHref}>Open on Warpcast</ExternalLink>
      </div>
    </LinkPreviewCardLayout>
  );
};

export default function FarcasterCard({ href }: FarcasterCardProps) {
  const [state, setState] = useState<FarcasterCardState>({ status: "loading" });

  useEffect(() => {
    let isActive = true;

    setState({ status: "loading" });

    fetchFarcasterPreview(href)
      .then((response) => {
        if (!isActive) {
          return;
        }

        if (!response || response.type === "unsupported") {
          setState({ status: "fallback" });
          return;
        }

        if (response.type === "unavailable") {
          setState({ status: "unavailable", data: response });
          return;
        }

        setState({ status: "ready", data: response });
      })
      .catch(() => {
        if (isActive) {
          setState({ status: "fallback" });
        }
      });

    return () => {
      isActive = false;
    };
  }, [href]);

  if (state.status === "fallback") {
    throw new Error("Unsupported Farcaster preview");
  }

  if (state.status === "loading") {
    return (
      <LinkPreviewCardLayout href={href}>
        <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
          <div className="tw-animate-pulse tw-space-y-3">
            <div className="tw-flex tw-items-center tw-gap-3">
              <div className="tw-h-12 tw-w-12 tw-rounded-full tw-bg-iron-800/60" />
              <div className="tw-flex-1 tw-space-y-2">
                <div className="tw-h-4 tw-w-1/3 tw-rounded tw-bg-iron-800/60" />
                <div className="tw-h-3 tw-w-1/4 tw-rounded tw-bg-iron-800/40" />
              </div>
            </div>
            <div className="tw-h-3 tw-w-full tw-rounded tw-bg-iron-800/40" />
            <div className="tw-h-3 tw-w-2/3 tw-rounded tw-bg-iron-800/30" />
            <div className="tw-h-40 tw-w-full tw-rounded-xl tw-bg-iron-800/30" />
          </div>
        </div>
      </LinkPreviewCardLayout>
    );
  }

  if (state.status === "unavailable") {
    return renderUnavailable(state.data, href);
  }

  return renderContent(state.data, href);
}
