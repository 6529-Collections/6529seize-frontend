"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  LinkIcon,
  PlayIcon,
} from "@heroicons/react/24/outline";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWater } from "@fortawesome/free-solid-svg-icons";
import { FallbackImage } from "@/components/common/FallbackImage";
import type { ApiDropMedia } from "@/generated/models/ApiDropMedia";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import {
  getWaveDescriptionPreviewText,
  markdownToPlainText,
} from "@/helpers/waves/waveDescriptionPreview";
import { useWaveById } from "@/hooks/useWaveById";
import { useProfileWave } from "@/hooks/useProfileWave";
import { useWaveCurationDrops } from "@/hooks/useWaveCurationDrops";
import { useWaveCurations } from "@/hooks/waves/useWaveCurations";

interface CurationWavePreviewCardProps {
  readonly waveId: string;
  readonly profileIdentity?: string | null | undefined;
  readonly fallbackName?: string | null | undefined;
  readonly fallbackPfp?: string | null | undefined;
}

const PREVIEW_DROPS_FETCH_LIMIT = 4;
const PREVIEW_ITEM_LIMIT = 4;
const URL_PATTERN = /https?:\/\/[^\s<>"')\]]+/gi;
const DIRECT_IMAGE_URL_PATTERN = /\.(?:avif|gif|jpe?g|png|webp)(?:[?#]|$)/i;
const REDUNDANT_LINK_HOSTS = new Set([
  "mobile.twitter.com",
  "t.co",
  "twitter.com",
  "x.com",
]);
const TILE_BASE_CLASS_NAME =
  "tw-mb-2 tw-inline-block tw-w-full tw-break-inside-avoid tw-overflow-hidden tw-rounded-md tw-border tw-border-solid tw-border-white/10 tw-align-top tw-[contain:content] tw-[content-visibility:auto]";
const TRAILING_URL_PUNCTUATION = "),.;!?";

interface PreviewNftLink {
  readonly url_in_text: string;
  readonly data?: {
    readonly name?: string | null | undefined;
    readonly media_uri?: string | null | undefined;
    readonly media_preview?: {
      readonly status?: string | null | undefined;
      readonly kind?: string | null | undefined;
      readonly card_url?: string | null | undefined;
      readonly small_url?: string | null | undefined;
      readonly thumb_url?: string | null | undefined;
      readonly width?: number | null | undefined;
      readonly height?: number | null | undefined;
      readonly mime_type?: string | null | undefined;
    } | null;
  } | null;
}

interface PreviewDropContent {
  readonly id: string;
  readonly title?: string | null | undefined;
  readonly nft_links?: readonly PreviewNftLink[] | undefined;
  readonly parts: readonly PreviewDropPart[];
}

interface PreviewDropPart {
  readonly content?: string | null | undefined;
  readonly media: readonly ApiDropMedia[];
  readonly attachments?: ReadonlyArray<{
    readonly file_name?: string | null | undefined;
  }>;
  readonly quoted_drop?: {
    readonly drop?: PreviewDropContent | null | undefined;
  } | null;
}

interface PreviewDrop extends PreviewDropContent {
  readonly wave?: {
    readonly name?: string | null | undefined;
    readonly picture?: string | null | undefined;
  };
}

interface PreviewMedia {
  readonly url: string;
  readonly width: number | null;
  readonly height: number | null;
  readonly isVideo: boolean;
}

type PreviewItem =
  | {
      readonly kind: "media";
      readonly key: string;
      readonly media: PreviewMedia;
      readonly mediaCount: number;
      readonly showLinkHint: boolean;
      readonly text: string | null;
    }
  | {
      readonly kind: "link";
      readonly key: string;
      readonly host: string;
      readonly text: string;
      readonly url: string;
    }
  | {
      readonly inlineUrl: string | null;
      readonly isEmojiOnly: boolean;
      readonly isShortText: boolean;
      readonly kind: "text";
      readonly key: string;
      readonly linkHost: string | null;
      readonly text: string;
    };

const getTrimmedText = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed.length === 0 ? null : trimmed;
};

const normalizeUrl = (url: string): string => {
  const trimmed = url.trim();
  let end = trimmed.length;

  while (
    end > 0 &&
    TRAILING_URL_PUNCTUATION.includes(trimmed.charAt(end - 1))
  ) {
    end -= 1;
  }

  return trimmed.slice(0, end);
};

const extractUrls = (...values: readonly (string | null | undefined)[]) => {
  const urls = new Set<string>();

  for (const value of values) {
    for (const match of value?.match(URL_PATTERN) ?? []) {
      const url = normalizeUrl(match);
      if (url.length > 0) {
        urls.add(url);
      }
    }
  }

  return [...urls];
};

const stripUrls = (text: string): string | null =>
  getTrimmedText(
    text.replace(URL_PATTERN, "").replace(/\(\s*\)/g, "").replace(/\s+/g, " ")
  );

const getUrlHost = (url: string): string | null => {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
};

const getUrlPathLabel = (url: string): string => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const path = parsed.pathname.replace(/^\/+/, "");
    return path.length > 0 ? `${host}/${path}` : host;
  } catch {
    return url;
  }
};

const getWordCount = (text: string): number =>
  text.split(/\s+/).filter((word) => word.length > 0).length;

const isTrivialLinkText = (textWithoutUrls: string | null): boolean =>
  textWithoutUrls === null ||
  textWithoutUrls.length <= 30 ||
  getWordCount(textWithoutUrls) <= 6;

const isEmojiOnlyText = (text: string): boolean =>
  /^[\p{Extended_Pictographic}\uFE0F\u200D\s]+$/u.test(text);

const getDropDisplayText = (drop: PreviewDropContent): string | null => {
  const title = getTrimmedText(drop.title);
  const contentPart =
    drop.parts.find(
      (part) => getTrimmedText(markdownToPlainText(part.content ?? "")) !== null
    ) ?? null;
  const content =
    contentPart !== null
      ? getTrimmedText(markdownToPlainText(contentPart.content ?? ""))
      : null;

  if (title !== null && content !== null && title !== content) {
    return `${title}: ${content}`;
  }

  return title ?? content;
};

const getAttachmentFallbackText = (drop: PreviewDropContent): string | null => {
  const attachmentFileName =
    drop.parts
      .flatMap((part) => part.attachments ?? [])
      .map((attachment) => getTrimmedText(attachment.file_name))
      .find((fileName) => fileName !== null) ?? null;

  return attachmentFileName;
};

const getQuotedDrop = (drop: PreviewDropContent): PreviewDropContent =>
  drop.parts.find((part) => part.quoted_drop?.drop)?.quoted_drop?.drop ?? drop;

const inferImageMimeType = (url: string): string | null =>
  DIRECT_IMAGE_URL_PATTERN.test(url) ? "image/*" : null;

const isImageLikeMedia = (url: string, mimeType: string | null): boolean =>
  mimeType?.toLowerCase().startsWith("image/") === true ||
  DIRECT_IMAGE_URL_PATTERN.test(url);

const getMediaAspectRatio = (
  media: PreviewMedia,
  hasText: boolean
): number => {
  const fallbackRatio = 4 / 3;
  const rawRatio =
    media.width !== null &&
    media.height !== null &&
    media.width > 0 &&
    media.height > 0
      ? media.width / media.height
      : fallbackRatio;
  const minRatio = hasText ? 4 / 5 : 3 / 4;
  const maxRatio = 16 / 9;

  return Math.min(Math.max(rawRatio, minRatio), maxRatio);
};

const getDropMedia = (
  drop: PreviewDropContent,
  urls: readonly string[]
): PreviewMedia[] => {
  const attachedMedia = drop.parts
    .flatMap((part) => part.media)
    .filter((media) => media.url.length > 0)
    .filter((media) => isImageLikeMedia(media.url, media.mime_type))
    .map((media): PreviewMedia => {
      return {
        url: media.url,
        width: null,
        height: null,
        isVideo: false,
      };
    });

  const linkPreviewMedia =
    drop.nft_links?.flatMap((link): PreviewMedia[] => {
      const preview = link.data?.media_preview ?? null;
      const previewUrl =
        getTrimmedText(preview?.card_url) ??
        getTrimmedText(preview?.small_url) ??
        getTrimmedText(preview?.thumb_url) ??
        getTrimmedText(link.data?.media_uri);

      if (previewUrl === null) {
        return [];
      }

      if (
        preview?.status !== undefined &&
        preview.status !== null &&
        preview.status !== "READY"
      ) {
        return [];
      }

      const mimeType =
        getTrimmedText(preview?.mime_type) ??
        inferImageMimeType(previewUrl) ??
        "";

      if (
        preview?.status !== "READY" &&
        !isImageLikeMedia(previewUrl, mimeType)
      ) {
        return [];
      }

      return [
        {
          url: previewUrl,
          width: preview?.width ?? null,
          height: preview?.height ?? null,
          isVideo: preview?.kind?.toLowerCase() === "video",
        },
      ];
    }) ?? [];

  const directMedia = urls
    .filter((url) => DIRECT_IMAGE_URL_PATTERN.test(url))
    .map((url): PreviewMedia => {
      return {
        url,
        width: null,
        height: null,
        isVideo: false,
      };
    });

  const uniqueMedia = new Map<string, PreviewMedia>();
  for (const media of [...attachedMedia, ...linkPreviewMedia, ...directMedia]) {
    if (!uniqueMedia.has(media.url)) {
      uniqueMedia.set(media.url, media);
    }
  }

  return [...uniqueMedia.values()];
};

const getLinkHintUrl = (
  urls: readonly string[],
  rawText: string | null
): string | null =>
  urls.find((url) => {
    const host = getUrlHost(url);
    if (host === null || REDUNDANT_LINK_HOSTS.has(host)) {
      return false;
    }

    return rawText === null || !rawText.includes(url);
  }) ?? null;

const getPrimaryLink = (
  drop: PreviewDropContent,
  urls: readonly string[],
  textWithoutUrls: string | null
) => {
  const url = urls[0] ?? getTrimmedText(drop.nft_links?.[0]?.url_in_text);
  if (url === undefined || url === null) {
    return null;
  }

  const host = getUrlHost(url);
  if (host === null) {
    return null;
  }

  const title =
    getTrimmedText(drop.nft_links?.[0]?.data?.name) ??
    textWithoutUrls ??
    getUrlPathLabel(url);

  return { host, title, url };
};

const classifyDrop = (inputDrop: PreviewDrop): PreviewItem | null => {
  const drop = getQuotedDrop(inputDrop);
  const rawText = getDropDisplayText(drop);
  const rawContents = drop.parts.map((part) => part.content ?? "");
  const urls = extractUrls(
    rawText,
    ...rawContents,
    ...(drop.nft_links?.map((link) => link.url_in_text) ?? [])
  );
  const textWithoutUrls =
    rawText !== null ? stripUrls(rawText) : getAttachmentFallbackText(drop);
  const media = getDropMedia(drop, urls);
  const primaryMedia = media[0] ?? null;
  const hasMeaningfulText = textWithoutUrls !== null;

  if (primaryMedia !== null) {
    return {
      kind: "media",
      key: `${drop.id}-${primaryMedia.url}`,
      media: primaryMedia,
      mediaCount: media.length,
      showLinkHint:
        hasMeaningfulText && getLinkHintUrl(urls, rawText) !== null,
      text: hasMeaningfulText ? textWithoutUrls : null,
    };
  }

  if (urls.length > 0 && isTrivialLinkText(textWithoutUrls)) {
    const primaryLink = getPrimaryLink(drop, urls, textWithoutUrls);
    if (primaryLink !== null) {
      return {
        kind: "link",
        key: `${drop.id}-${primaryLink.url}`,
        host: primaryLink.host,
        text: primaryLink.title,
        url: primaryLink.url,
      };
    }
  }

  if (textWithoutUrls !== null) {
    const inlineUrl = urls[0] ?? null;
    const linkHost = inlineUrl !== null ? getUrlHost(inlineUrl) : null;

    return {
      kind: "text",
      key: `${drop.id}-text`,
      inlineUrl,
      isEmojiOnly: isEmojiOnlyText(textWithoutUrls),
      isShortText: textWithoutUrls.length < 60,
      linkHost,
      text: textWithoutUrls,
    };
  }

  return null;
};

const getPreviewItems = (drops: readonly PreviewDrop[]): PreviewItem[] =>
  drops
    .map(classifyDrop)
    .filter((item): item is PreviewItem => item !== null)
    .slice(0, PREVIEW_ITEM_LIMIT);

const PreviewMediaTile: React.FC<{
  readonly item: Extract<PreviewItem, { readonly kind: "media" }>;
}> = ({ item }) => {
  const hasText = item.text !== null;

  return (
    <div
      className={`${TILE_BASE_CLASS_NAME} tw-bg-iron-900`}
      aria-label={item.text ?? "Curated media"}
    >
      <div
        className="tw-relative tw-w-full tw-bg-iron-950"
        style={{ aspectRatio: getMediaAspectRatio(item.media, hasText) }}
      >
        <FallbackImage
          primarySrc={getScaledImageUri(item.media.url, ImageScale.W_200_H_200)}
          fallbackSrc={item.media.url}
          alt=""
          fill
          sizes="156px"
          loading="lazy"
          decoding="async"
          className="tw-object-cover"
        />
        {item.mediaCount > 1 && (
          <span className="tw-absolute tw-bottom-1.5 tw-left-1.5 tw-rounded tw-bg-black/55 tw-px-1.5 tw-py-0.5 tw-text-[10px] tw-font-bold tw-leading-none tw-text-white/90">
            +{item.mediaCount - 1}
          </span>
        )}
        {item.media.isVideo && (
          <PlayIcon
            className="tw-absolute tw-bottom-1.5 tw-right-1.5 tw-h-4 tw-w-4 tw-text-white/60"
            aria-hidden="true"
          />
        )}
      </div>
      {hasText && (
        <div className="tw-flex tw-items-start tw-gap-1.5 tw-px-3 tw-py-2">
          <p
            dir="auto"
            className="tw-mb-0 tw-line-clamp-2 tw-min-w-0 tw-flex-1 tw-break-words tw-text-[13px] tw-font-semibold tw-leading-snug tw-text-iron-300 tw-[overflow-wrap:anywhere]"
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
    className={`${TILE_BASE_CLASS_NAME} tw-bg-primary-950/20 tw-p-3 tw-text-primary-100 tw-no-underline desktop-hover:hover:tw-bg-primary-950/35 desktop-hover:hover:tw-text-primary-50`}
  >
    <span className="tw-mb-2 tw-flex tw-items-center tw-gap-1.5 tw-text-[11px] tw-font-bold tw-leading-none tw-text-primary-300">
      <LinkIcon className="tw-h-3.5 tw-w-3.5" aria-hidden="true" />
      <span className="tw-min-w-0 tw-truncate">{item.host}</span>
    </span>
    <span
      dir="auto"
      className="tw-line-clamp-2 tw-break-words tw-text-[13px] tw-font-semibold tw-leading-snug tw-[overflow-wrap:anywhere]"
    >
      {item.text}
    </span>
  </a>
);

const PreviewTextTile: React.FC<{
  readonly item: Extract<PreviewItem, { readonly kind: "text" }>;
}> = ({ item }) => {
  const toneClassName = item.isEmojiOnly
    ? "tw-flex tw-min-h-20 tw-items-center tw-justify-center tw-p-3 tw-text-center tw-text-2xl tw-leading-none"
    : item.isShortText
      ? "tw-flex tw-min-h-16 tw-items-center tw-justify-center tw-p-3 tw-text-center tw-text-sm tw-font-semibold tw-leading-snug"
      : "tw-p-3 tw-text-[13px] tw-font-semibold tw-leading-snug";

  return (
    <div
      className={`${TILE_BASE_CLASS_NAME} tw-bg-iron-900/85 tw-text-iron-200 ${toneClassName}`}
    >
      <p
        dir="auto"
        className={`tw-mb-0 tw-break-words tw-[overflow-wrap:anywhere] ${
          item.isEmojiOnly || item.isShortText ? "" : "tw-line-clamp-5"
        }`}
      >
        {item.text}
        {item.inlineUrl !== null && item.linkHost !== null && (
          <a
            href={item.inlineUrl}
            target="_blank"
            rel="noreferrer"
            className="tw-ml-1 tw-inline-flex tw-items-center tw-gap-1 tw-text-primary-300 tw-no-underline desktop-hover:hover:tw-text-primary-200"
          >
            <LinkIcon className="tw-h-2.5 tw-w-2.5" aria-hidden="true" />
            <span>{item.linkHost}</span>
          </a>
        )}
      </p>
    </div>
  );
};

const PreviewTile: React.FC<{ readonly item: PreviewItem }> = ({ item }) => {
  if (item.kind === "media") {
    return <PreviewMediaTile item={item} />;
  }

  if (item.kind === "link") {
    return <PreviewLinkTile item={item} />;
  }

  return <PreviewTextTile item={item} />;
};

const getWaveAuthor = (wave?: ApiWave): string | null =>
  getTrimmedText(wave?.author.handle) ??
  getTrimmedText(wave?.author.primary_address);

const getWaveHref = ({
  waveId,
  wave,
  curationId,
}: {
  readonly waveId: string;
  readonly wave?: ApiWave | undefined;
  readonly curationId: string | null;
}): string =>
  getWaveRoute({
    waveId: wave?.id ?? waveId,
    isDirectMessage: wave?.chat.scope.group?.is_direct_message ?? false,
    isApp: false,
    extraParams: { curation: curationId ?? undefined },
  });

export const CurationWavePreviewCard: React.FC<
  CurationWavePreviewCardProps
> = ({ waveId, profileIdentity, fallbackName, fallbackPfp }) => {
  const normalizedProfileIdentity = getTrimmedText(profileIdentity);
  const { wave } = useWaveById(waveId);
  const {
    data: profileWave,
    isError: isProfileWaveError,
    isFetching: isProfileWaveFetching,
  } = useProfileWave({
    identity: normalizedProfileIdentity,
    enabled: normalizedProfileIdentity !== null,
  });
  const hasResolvedProfileWave =
    normalizedProfileIdentity === null ||
    profileWave !== undefined ||
    isProfileWaveError;
  const selectedProfileCurationId =
    profileWave?.profile_wave_id === waveId
      ? getTrimmedText(profileWave.profile_curation_id)
      : null;
  const shouldLoadFallbackCurations =
    hasResolvedProfileWave && selectedProfileCurationId === null;
  const { data: curations = [], isFetching: areCurationsFetching } =
    useWaveCurations({
      waveId,
      enabled: shouldLoadFallbackCurations,
    });
  const fallbackCurationId = shouldLoadFallbackCurations
    ? (curations.at(0)?.id ?? null)
    : null;
  const curationId = selectedProfileCurationId ?? fallbackCurationId;
  const { drops, isFetching: areDropsFetching } = useWaveCurationDrops({
    wave: wave ?? null,
    curationId,
    pageSize: PREVIEW_DROPS_FETCH_LIMIT,
    enabled: hasResolvedProfileWave && curationId !== null,
  });

  const isFetching =
    isProfileWaveFetching || areCurationsFetching || areDropsFetching;

  const firstDropWave = drops.at(0)?.wave;
  const waveName =
    getTrimmedText(wave?.name) ??
    getTrimmedText(fallbackName) ??
    getTrimmedText(firstDropWave?.name) ??
    "Featured wave";
  const wavePicture =
    getTrimmedText(wave?.picture) ??
    getTrimmedText(fallbackPfp) ??
    getTrimmedText(firstDropWave?.picture);
  const author = getWaveAuthor(wave);
  const description = getWaveDescriptionPreviewText(wave);
  const previewItems = getPreviewItems(drops);
  const waveHref = getWaveHref({ waveId, wave, curationId });

  return (
    <div className="-tw-mx-4 -tw-my-3 tw-max-h-[calc(100vh-32px)] tw-w-[300px] tw-overflow-hidden tw-rounded-lg tw-bg-iron-950 tw-text-iron-50">
      <div className="tw-px-4 tw-pb-4 tw-pt-4">
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-relative tw-h-10 tw-w-10 tw-flex-shrink-0 tw-overflow-hidden tw-rounded-full tw-bg-iron-900">
            {wavePicture ? (
              <FallbackImage
                primarySrc={getScaledImageUri(
                  wavePicture,
                  ImageScale.W_200_H_200
                )}
                fallbackSrc={wavePicture}
                alt=""
                fill
                sizes="40px"
                className="tw-object-cover"
              />
            ) : (
              <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center">
                <FontAwesomeIcon
                  icon={faWater}
                  className="tw-h-4 tw-w-4 tw-text-white/30"
                  aria-hidden="true"
                />
              </div>
            )}
          </div>
          <div className="tw-min-w-0 tw-flex-1">
            <div className="tw-line-clamp-2 tw-text-base tw-font-bold tw-leading-tight tw-text-white">
              {waveName}
            </div>
            {author && (
              <div className="tw-mt-0.5 tw-truncate tw-text-xs tw-font-semibold tw-text-iron-300">
                @{author}
              </div>
            )}
          </div>
        </div>
        {description && (
          <p className="tw-mb-0 tw-mt-3 tw-line-clamp-2 tw-text-xs tw-text-iron-300">
            {description}
          </p>
        )}

        {previewItems.length > 0 ? (
          <div className="tw-mt-3 tw-columns-2 tw-gap-2">
            {previewItems.map((item) => (
              <PreviewTile key={item.key} item={item} />
            ))}
          </div>
        ) : isFetching ? (
          <div className="tw-mt-3 tw-grid tw-grid-cols-2 tw-gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="tw-h-16 tw-animate-pulse tw-rounded-md tw-bg-iron-900"
              />
            ))}
          </div>
        ) : (
          <p className="tw-mb-0 tw-mt-3 tw-text-xs tw-font-semibold tw-text-iron-400">
            No curated drops yet.
          </p>
        )}
      </div>

      <div className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3">
        <Link
          href={waveHref}
          prefetch={false}
          className="desktop-hover:hover:tw-text-primary-200 tw-inline-flex tw-items-center tw-gap-1.5 tw-text-xs tw-font-bold tw-text-primary-300 tw-no-underline"
        >
          Open wave
          <ArrowRightIcon className="tw-h-3.5 tw-w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
};
