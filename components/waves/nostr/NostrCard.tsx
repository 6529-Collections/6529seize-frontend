"use client";

import { useMemo, useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { CheckBadgeIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";

import type { NostrCardResponse, NostrImageInfo } from "@/types/nostr-open-graph";

import { LinkPreviewCardLayout } from "../OpenGraphPreview";

interface NostrCardProps {
  readonly href: string;
  readonly data: NostrCardResponse;
}

const isHttpUrl = (value: string | null | undefined): value is string => {
  if (!value) {
    return false;
  }
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const resolveLayoutHref = (originalHref: string, candidate: string | null | undefined): string => {
  if (isHttpUrl(candidate)) {
    return candidate;
  }
  return originalHref;
};

const formatDate = (value: string | null): string | null => {
  if (!value) {
    return null;
  }
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return null;
  }
};

const SENSITIVE_LABELS = new Set(["nsfw", "spoiler", "sensitive", "18+", "adult"]);

const LinkifiedText = ({ text }: { readonly text: string }) => {
  const parts = useMemo(() => {
    const segments: Array<{ readonly type: "text" | "link"; readonly value: string }> = [];
    const urlPattern = /(https?:\/\/[^\s]+)/gi;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = urlPattern.exec(text))) {
      if (match.index > lastIndex) {
        segments.push({ type: "text", value: text.slice(lastIndex, match.index) });
      }
      if (match[0]) {
        segments.push({ type: "link", value: match[0] });
      }
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      segments.push({ type: "text", value: text.slice(lastIndex) });
    }

    return segments;
  }, [text]);

  return (
    <>
      {parts.map((segment, index) => {
        if (segment.type === "link") {
          return (
            <Link
              key={`${segment.value}-${index}`}
              href={segment.value}
              target="_blank"
              rel="noopener noreferrer"
              className="tw-text-primary-300 tw-underline tw-break-all"
            >
              {segment.value}
            </Link>
          );
        }
        return <span key={index}>{segment.value}</span>;
      })}
    </>
  );
};

const NoteText = ({ text }: { readonly text: string }) => {
  const [expanded, setExpanded] = useState(false);
  const shouldClamp = text.length > 420;
  const displayedText = expanded || !shouldClamp ? text : `${text.slice(0, 400)}…`;

  const paragraphs = useMemo(() => displayedText.split(/\n+/).map((line) => line.trim()), [displayedText]);

  return (
    <div className="tw-space-y-2">
      {paragraphs.map((line, index) => (
        <p key={index} className="tw-m-0 tw-text-sm tw-text-iron-100 tw-whitespace-pre-wrap tw-break-words">
          <LinkifiedText text={line} />
        </p>
      ))}
      {shouldClamp && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="tw-text-xs tw-font-semibold tw-text-primary-300 tw-underline tw-transition hover:tw-text-primary-200"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
};

const ImageGrid = ({
  images,
  blur,
  alt,
}: {
  readonly images: readonly NostrImageInfo[];
  readonly blur: boolean;
  readonly alt: string;
}) => {
  if (images.length === 0) {
    return null;
  }

  const gridClass =
    images.length === 1 ? "tw-grid-cols-1" : images.length === 2 ? "tw-grid-cols-2" : "tw-grid-cols-2 md:tw-grid-cols-3";

  return (
    <div className={`tw-grid tw-gap-2 ${gridClass}`}>
      {images.map((image, index) => (
        <div key={`${image.url}-${index}`} className="tw-relative tw-overflow-hidden tw-rounded-lg tw-bg-iron-900/60 tw-aspect-[4/3]">
          <Image
            src={image.url}
            alt={image.alt ?? alt}
            fill
            className={`tw-object-cover tw-transition ${blur ? "tw-blur-lg" : ""}`}
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
          />
        </div>
      ))}
    </div>
  );
};

const AuthorHeader = ({
  name,
  handle,
  avatar,
  verified,
  createdAt,
}: {
  readonly name: string | null;
  readonly handle: string | null;
  readonly avatar: string | null;
  readonly verified: boolean;
  readonly createdAt: string | null;
}) => {
  const formattedDate = formatDate(createdAt);

  return (
    <div className="tw-flex tw-items-start tw-gap-3">
      {avatar ? (
        <div className="tw-h-10 tw-w-10 tw-overflow-hidden tw-rounded-full tw-bg-iron-800/70">
          <Image src={avatar} alt={name ?? "Nostr author"} width={40} height={40} className="tw-h-full tw-w-full tw-object-cover" unoptimized />
        </div>
      ) : (
        <div className="tw-h-10 tw-w-10 tw-rounded-full tw-bg-iron-800/70" />
      )}
      <div className="tw-flex tw-flex-1 tw-flex-col tw-min-w-0">
        <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
          <span className="tw-text-sm tw-font-semibold tw-text-iron-100 tw-truncate">{name ?? "Nostr user"}</span>
          {verified && <CheckBadgeIcon className="tw-h-4 tw-w-4 tw-text-primary-300" aria-hidden="true" />}
        </div>
        {handle && (
          <span className="tw-text-xs tw-text-iron-400 tw-truncate">{handle}</span>
        )}
        {formattedDate && (
          <span className="tw-text-xs tw-text-iron-500">{formattedDate}</span>
        )}
      </div>
    </div>
  );
};

const NostrNoteCard = ({ href, data }: { readonly href: string; readonly data: Extract<NostrCardResponse, { type: "nostr.note" }> }) => {
  const [revealed, setRevealed] = useState(() => {
    return !data.labels?.some((label) => SENSITIVE_LABELS.has(label.toLowerCase()));
  });

  const layoutHref = resolveLayoutHref(href, data.links?.open ?? data.canonicalUrl);
  const hasSensitive = data.labels?.some((label) => SENSITIVE_LABELS.has(label.toLowerCase())) ?? false;

  const handleReveal = () => setRevealed(true);

  return (
    <LinkPreviewCardLayout href={layoutHref}>
      <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-p-4 tw-space-y-4">
        {data.author && (
          <AuthorHeader
            name={data.author.name}
            handle={data.author.handle}
            avatar={data.author.avatar}
            verified={data.author.verifiedNip05}
            createdAt={data.createdAt}
          />
        )}
        {data.text && <NoteText text={data.text} />}
        {data.images.length > 0 && (
          <div className="tw-space-y-2">
            {hasSensitive && !revealed && (
              <div className="tw-rounded-lg tw-bg-iron-900/80 tw-border tw-border-solid tw-border-iron-700 tw-p-3 tw-text-center">
                <p className="tw-m-0 tw-text-sm tw-text-iron-200">This note may contain sensitive content.</p>
                <button
                  type="button"
                  onClick={handleReveal}
                  className="tw-mt-2 tw-inline-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-500 tw-px-4 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-black tw-transition hover:tw-bg-primary-400"
                >
                  Reveal images
                </button>
              </div>
            )}
            <ImageGrid
              images={data.images}
              blur={hasSensitive && !revealed}
              alt={data.author?.name ? `Image from ${data.author.name}'s note` : "Image from note"}
            />
          </div>
        )}
        <div className="tw-flex tw-justify-end">
          <Link
            href={data.links?.open ?? layoutHref}
            target="_blank"
            rel="noopener noreferrer"
            className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-border tw-border-solid tw-border-primary-400 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-primary-200 tw-transition hover:tw-border-primary-300 hover:tw-text-primary-100"
          >
            Open in your Nostr client
            <ArrowTopRightOnSquareIcon className="tw-h-4 tw-w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </LinkPreviewCardLayout>
  );
};

const ProfileHero = ({
  name,
  handle,
  about,
  avatar,
  banner,
  verifiedNip05,
}: Extract<NostrCardResponse, { type: "nostr.profile" }>["profile"]) => {
  return (
    <div className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40">
      {banner && (
        <div className="tw-relative tw-h-32 tw-w-full tw-bg-iron-800/60">
          <Image src={banner} alt={name ?? "Nostr profile banner"} fill className="tw-object-cover" sizes="100vw" unoptimized />
        </div>
      )}
      <div className="tw-flex tw-flex-col tw-gap-4 tw-p-4">
        <div className="tw-flex tw-items-center tw-gap-3">
          {avatar ? (
            <div className="tw-h-16 tw-w-16 tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-overflow-hidden">
              <Image src={avatar} alt={name ?? "Nostr profile"} width={64} height={64} className="tw-h-full tw-w-full tw-object-cover" unoptimized />
            </div>
          ) : (
            <div className="tw-h-16 tw-w-16 tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800/60" />
          )}
          <div className="tw-flex tw-flex-col tw-gap-1 tw-min-w-0">
            <div className="tw-flex tw-items-center tw-gap-2">
              <span className="tw-text-lg tw-font-semibold tw-text-iron-100 tw-truncate">{name ?? "Nostr user"}</span>
              {verifiedNip05 && <CheckBadgeIcon className="tw-h-5 tw-w-5 tw-text-primary-300" aria-hidden="true" />}
            </div>
            {handle && <span className="tw-text-sm tw-text-iron-400 tw-truncate">{handle}</span>}
          </div>
        </div>
        {about && (
          <p className="tw-m-0 tw-text-sm tw-text-iron-200 tw-whitespace-pre-wrap tw-break-words">{about}</p>
        )}
      </div>
    </div>
  );
};

const NostrProfileCard = ({ href, data }: { readonly href: string; readonly data: Extract<NostrCardResponse, { type: "nostr.profile" }> }) => {
  const layoutHref = resolveLayoutHref(href, data.canonicalUrl);
  return (
    <LinkPreviewCardLayout href={layoutHref}>
      <ProfileHero {...data.profile} />
    </LinkPreviewCardLayout>
  );
};

const NostrArticleCard = ({ href, data }: { readonly href: string; readonly data: Extract<NostrCardResponse, { type: "nostr.article" }> }) => {
  const layoutHref = resolveLayoutHref(href, data.links?.open ?? data.canonicalUrl);
  const formattedDate = formatDate(data.createdAt);

  return (
    <LinkPreviewCardLayout href={layoutHref}>
      <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900/40 tw-overflow-hidden">
        {data.article.image && (
          <div className="tw-relative tw-h-48 tw-w-full tw-bg-iron-900/60">
            <Image
              src={data.article.image}
              alt={data.article.title ?? "Nostr article"}
              fill
              className="tw-object-cover"
              sizes="100vw"
              unoptimized
            />
          </div>
        )}
        <div className="tw-flex tw-flex-col tw-gap-3 tw-p-4">
          {data.article.title && (
            <h3 className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-100">{data.article.title}</h3>
          )}
          {data.article.summary && (
            <p className="tw-m-0 tw-text-sm tw-text-iron-200 tw-whitespace-pre-wrap tw-break-words">{data.article.summary}</p>
          )}
          {data.author && (
            <div className="tw-flex tw-items-center tw-gap-3 tw-pt-2 tw-border-t tw-border-iron-800/60">
              {data.author.avatar ? (
                <Image
                  src={data.author.avatar}
                  alt={data.author.name ?? "Article author"}
                  width={36}
                  height={36}
                  className="tw-h-9 tw-w-9 tw-rounded-full tw-object-cover"
                  unoptimized
                />
              ) : (
                <div className="tw-h-9 tw-w-9 tw-rounded-full tw-bg-iron-800/60" />
              )}
              <div className="tw-flex tw-flex-col tw-gap-0.5 tw-min-w-0">
                <span className="tw-text-sm tw-font-semibold tw-text-iron-100 tw-truncate">{data.author.name ?? "Nostr author"}</span>
                {data.author.handle && <span className="tw-text-xs tw-text-iron-400 tw-truncate">{data.author.handle}</span>}
              </div>
              {formattedDate && <span className="tw-ml-auto tw-text-xs tw-text-iron-500">{formattedDate}</span>}
            </div>
          )}
          <div className="tw-flex tw-justify-end">
            <Link
              href={data.links?.open ?? layoutHref}
              target="_blank"
              rel="noopener noreferrer"
              className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-full tw-border tw-border-solid tw-border-primary-400 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-primary-200 tw-transition hover:tw-border-primary-300 hover:tw-text-primary-100"
            >
              Open article
              <ArrowTopRightOnSquareIcon className="tw-h-4 tw-w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </LinkPreviewCardLayout>
  );
};

const MessageCard = ({ href, message }: { readonly href: string; readonly message: string }) => {
  return (
    <LinkPreviewCardLayout href={href}>
      <div className="tw-rounded-xl tw-border tw-border-dashed tw-border-iron-700 tw-bg-iron-900/40 tw-p-4">
        <p className="tw-m-0 tw-text-sm tw-text-iron-200 tw-text-center">{message}</p>
      </div>
    </LinkPreviewCardLayout>
  );
};

export default function NostrCard({ href, data }: NostrCardProps) {
  switch (data.type) {
    case "nostr.note":
      return <NostrNoteCard href={href} data={data} />;
    case "nostr.profile":
      return <NostrProfileCard href={href} data={data} />;
    case "nostr.article":
      return <NostrArticleCard href={href} data={data} />;
    case "nostr.secret_redacted":
      return <MessageCard href={href} message={data.message} />;
    case "nostr.unavailable":
      return <MessageCard href={href} message={data.message} />;
    default:
      return <MessageCard href={href} message="Nostr content unavailable" />;
  }
}
