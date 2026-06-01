import type React from "react";
import { LinkIcon, PlayIcon } from "@heroicons/react/24/outline";
import { FallbackImage } from "@/components/common/FallbackImage";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import type { PreviewItem } from "./types";
import { getMediaAspectRatio, getPreviewImageUrl } from "./utils";

const PreviewMediaTile: React.FC<{
  readonly item: Extract<PreviewItem, { readonly kind: "media" }>;
}> = ({ item }) => {
  const hasText = item.text !== null;
  const imageUrl =
    item.media.imageUrl === null
      ? null
      : getPreviewImageUrl(item.media.imageUrl);
  const isVideo = item.media.kind === "video";

  return (
    <div
      className="tw-[contain:content] tw-[content-visibility:auto] tw-group tw-mb-2 tw-inline-block tw-w-full tw-break-inside-avoid tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-[#1A1A20] tw-align-top tw-shadow-sm tw-shadow-black/20 tw-transition-colors tw-duration-300 tw-ease-out desktop-hover:hover:tw-border-white/[0.12] desktop-hover:hover:tw-bg-[#202028]"
      aria-label={item.text ?? (isVideo ? "Curated video" : "Curated media")}
    >
      <div
        className="tw-relative tw-w-full tw-bg-[#101014]"
        style={{ aspectRatio: getMediaAspectRatio(item.media, hasText) }}
      >
        {imageUrl === null ? (
          <div
            className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-bg-[#101014]"
            aria-hidden="true"
          >
            <span className="tw-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-full tw-bg-white/10 tw-text-white/70 tw-ring-1 tw-ring-white/15">
              <PlayIcon className="tw-ml-0.5 tw-h-5 tw-w-5" />
            </span>
          </div>
        ) : (
          <FallbackImage
            primarySrc={getScaledImageUri(imageUrl, ImageScale.W_200_H_200)}
            fallbackSrc={imageUrl}
            alt=""
            fill
            sizes="156px"
            loading="lazy"
            decoding="async"
            className="tw-object-cover"
          />
        )}
        {item.mediaCount > 1 && (
          <span className="tw-absolute tw-bottom-1.5 tw-left-1.5 tw-rounded tw-bg-black/55 tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-bold tw-leading-none tw-text-white/90">
            +{item.mediaCount - 1}
          </span>
        )}
        {isVideo && imageUrl !== null && (
          <PlayIcon
            className="tw-absolute tw-bottom-1.5 tw-right-1.5 tw-h-4 tw-w-4 tw-text-white/60"
            aria-hidden="true"
          />
        )}
      </div>
      {hasText && (
        <div className="tw-flex tw-items-start tw-gap-1.5 tw-px-2.5 tw-py-2">
          <p
            dir="auto"
            className="tw-[overflow-wrap:anywhere] tw-mb-0 tw-line-clamp-2 tw-min-w-0 tw-flex-1 tw-break-words tw-text-xs tw-font-medium tw-leading-snug tw-text-zinc-300 tw-transition-colors tw-duration-300 desktop-hover:group-hover:tw-text-white"
          >
            {item.text}
          </p>
          {item.showLinkHint && (
            <LinkIcon
              className="tw-mt-0.5 tw-h-3 tw-w-3 tw-flex-shrink-0 tw-text-primary-300/80"
              aria-hidden="true"
            />
          )}
        </div>
      )}
    </div>
  );
};

const PreviewLinkTile: React.FC<{
  readonly item: Extract<PreviewItem, { readonly kind: "link" }>;
}> = ({ item }) => (
  <a
    href={item.url}
    target="_blank"
    rel="noreferrer"
    className="tw-text-primary-100 tw-[contain:content] tw-[content-visibility:auto] desktop-hover:hover:tw-text-primary-50 tw-group tw-mb-2 tw-inline-block tw-w-full tw-break-inside-avoid tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-primary-500/15 tw-bg-primary-500/5 tw-p-2.5 tw-align-top tw-no-underline tw-shadow-sm tw-shadow-black/20 tw-transition-colors tw-duration-300 tw-ease-out desktop-hover:hover:tw-border-primary-500/30 desktop-hover:hover:tw-bg-primary-500/10"
  >
    <span className="tw-mb-2 tw-flex tw-items-center tw-gap-1.5 tw-text-[11px] tw-font-bold tw-leading-none tw-text-primary-300/95">
      <LinkIcon className="tw-h-3.5 tw-w-3.5" aria-hidden="true" />
      <span className="tw-min-w-0 tw-truncate">{item.host}</span>
    </span>
    <span
      dir="auto"
      className="tw-[overflow-wrap:anywhere] tw-line-clamp-2 tw-break-words tw-text-[13px] tw-font-semibold tw-leading-snug"
    >
      {item.text}
    </span>
  </a>
);

const InlineTextLink: React.FC<{
  readonly item: Extract<PreviewItem, { readonly kind: "text" }>;
}> = ({ item }) => {
  if (item.inlineUrl === null || item.linkHost === null) {
    return null;
  }

  return (
    <a
      href={item.inlineUrl}
      target="_blank"
      rel="noreferrer"
      className="desktop-hover:hover:tw-text-primary-200 tw-ml-1 tw-inline-flex tw-items-center tw-gap-1 tw-text-primary-300 tw-no-underline"
    >
      <LinkIcon className="tw-h-2.5 tw-w-2.5" aria-hidden="true" />
      <span>{item.linkHost}</span>
    </a>
  );
};

const PreviewTextTile: React.FC<{
  readonly item: Extract<PreviewItem, { readonly kind: "text" }>;
}> = ({ item }) => {
  if (item.isEmojiOnly) {
    return (
      <div className="tw-[contain:content] tw-[content-visibility:auto] tw-group tw-mb-2 tw-inline-flex tw-min-h-20 tw-w-full tw-break-inside-avoid tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-[#1A1A20] tw-p-3 tw-text-center tw-align-top tw-text-2xl tw-leading-none tw-text-zinc-300 tw-shadow-sm tw-shadow-black/20 tw-transition-colors tw-duration-300 tw-ease-out desktop-hover:hover:tw-border-white/[0.12] desktop-hover:hover:tw-bg-[#202028] desktop-hover:hover:tw-text-white">
        <p
          dir="auto"
          className="tw-[overflow-wrap:anywhere] tw-mb-0 tw-break-words"
        >
          {item.text}
        </p>
      </div>
    );
  }

  if (item.isShortText) {
    return (
      <div className="tw-[contain:content] tw-[content-visibility:auto] tw-group tw-mb-2 tw-inline-flex tw-min-h-14 tw-w-full tw-break-inside-avoid tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-[#1A1A20] tw-p-2.5 tw-text-center tw-align-top tw-text-[13px] tw-font-semibold tw-leading-snug tw-text-zinc-300 tw-shadow-sm tw-shadow-black/20 tw-transition-colors tw-duration-300 tw-ease-out desktop-hover:hover:tw-border-white/[0.12] desktop-hover:hover:tw-bg-[#202028] desktop-hover:hover:tw-text-white">
        <p
          dir="auto"
          className="tw-[overflow-wrap:anywhere] tw-mb-0 tw-break-words"
        >
          {item.text}
          <InlineTextLink item={item} />
        </p>
      </div>
    );
  }

  return (
    <div className="tw-[contain:content] tw-[content-visibility:auto] tw-group tw-mb-2 tw-inline-block tw-w-full tw-break-inside-avoid tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.06] tw-bg-[#1A1A20] tw-p-2.5 tw-align-top tw-text-xs tw-font-medium tw-leading-snug tw-text-zinc-300 tw-shadow-sm tw-shadow-black/20 tw-transition-colors tw-duration-300 tw-ease-out desktop-hover:hover:tw-border-white/[0.12] desktop-hover:hover:tw-bg-[#202028] desktop-hover:hover:tw-text-white">
      <p
        dir="auto"
        className="tw-[overflow-wrap:anywhere] tw-mb-0 tw-line-clamp-5 tw-break-words"
      >
        {item.text}
        <InlineTextLink item={item} />
      </p>
    </div>
  );
};

export const PreviewTile: React.FC<{ readonly item: PreviewItem }> = ({
  item,
}) => {
  if (item.kind === "media") {
    return <PreviewMediaTile item={item} />;
  }

  if (item.kind === "link") {
    return <PreviewLinkTile item={item} />;
  }

  return <PreviewTextTile item={item} />;
};
