"use client";

import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import ContentDisplay from "@/components/waves/drops/ContentDisplay";
import { buildProcessedContent } from "@/components/waves/drops/media-utils";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { useInView } from "@/hooks/useInView";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import BoostedDropLinkPreview from "./BoostedDropLinkPreview";
import {
  extractFirstUrl,
  removePreviewUrlFromContent,
} from "./extractStandaloneUrl";

type BoostedDropPart = ApiDrop["parts"][number];
type BoostedDropMediaItem = BoostedDropPart["media"][number];
type MeasuredChatMediaAspectRatio = {
  readonly aspectRatio: string;
  readonly mimeType: string;
  readonly url: string;
};
type OverflowElements = {
  readonly container: HTMLDivElement;
  readonly preview: HTMLDivElement;
  readonly textMeasure: HTMLDivElement;
  readonly wrapper: HTMLDivElement;
};

const CHAT_MEDIA_FALLBACK_ASPECT_RATIO = "8 / 5";
const HOME_ASPECT_RATIO_CLASSES =
  "tw-aspect-[2/1] sm:tw-aspect-[5/4] md:tw-aspect-[8/5] lg:tw-aspect-[5/4] xl:tw-aspect-[8/5]";
const CHAT_BODY_INSET_X_CLASSES = "tw-px-3 sm:tw-px-4";
const CHAT_PREVIEW_CONTAINER_CLASSES =
  "tw-relative tw-flex tw-w-full tw-flex-col tw-items-stretch tw-justify-start tw-gap-3 tw-overflow-hidden tw-rounded-xl";
const CHAT_TEXT_CONTAINER_CLASSES =
  "tw-relative tw-flex tw-w-full tw-items-start tw-justify-start tw-overflow-hidden tw-rounded-xl tw-px-4 tw-pb-4 tw-pt-14";
const CHAT_SUPPLEMENTAL_TEXT_CONTAINER_CLASSES =
  "tw-relative tw-flex tw-w-full tw-items-start tw-justify-start tw-overflow-hidden tw-rounded-xl tw-px-4 tw-pb-4";
const HOME_PREVIEW_CONTAINER_CLASSES = `tw-relative tw-flex ${HOME_ASPECT_RATIO_CLASSES} tw-w-full tw-flex-col tw-items-stretch tw-justify-stretch tw-gap-3 tw-overflow-hidden tw-rounded-xl`;
const HOME_TEXT_CONTAINER_CLASSES = `tw-relative tw-flex ${HOME_ASPECT_RATIO_CLASSES} tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-xl tw-px-6 tw-pb-6 sm:tw-pb-0 tw-pt-4 sm:tw-pt-16 md:tw-pt-12`;
const CHAT_MEDIA_WITH_CONTENT_CLASSES =
  "tw-flex tw-w-full tw-flex-col tw-gap-3";
const CHAT_PREVIEW_WRAPPER_BASE_CLASSES =
  "tw-relative tw-z-10 tw-flex tw-w-full tw-min-w-0 tw-max-w-full tw-flex-col";
const HOME_PREVIEW_WRAPPER_BASE_CLASSES =
  "tw-relative tw-z-10 tw-grid tw-h-full tw-w-full tw-min-w-0 tw-max-w-full tw-grid-rows-[minmax(0,1fr)_auto]";
const CHAT_TEXT_WRAPPER_CLASSES =
  "tw-relative tw-z-10 tw-flex tw-w-full tw-min-w-0 tw-max-w-full tw-items-start tw-justify-start";
const HOME_TEXT_WRAPPER_CLASSES =
  "tw-relative tw-z-10 tw-flex tw-h-full tw-w-full tw-min-w-0 tw-max-w-full tw-items-center tw-justify-center";
const WITH_PREVIEW_CONTENT_CLASS_NAME =
  "tw-flex tw-w-full tw-max-w-full tw-flex-col tw-items-start tw-gap-1 tw-break-words tw-px-3 tw-pb-3 sm:tw-px-4 sm:tw-pb-4 tw-tracking-[0.01em] tw-font-normal tw-text-iron-300";
const CHAT_TEXT_CONTENT_CLASS_NAME =
  "tw-flex tw-w-full tw-max-w-full tw-flex-col tw-items-start tw-gap-1 tw-break-words tw-tracking-[0.01em] tw-font-normal tw-text-iron-300";
const HOME_TEXT_CONTENT_CLASS_NAME =
  "tw-flex tw-w-fit tw-max-w-full tw-flex-col tw-items-start tw-gap-1 tw-break-words tw-tracking-[0.01em] tw-font-normal tw-text-iron-300";
const WITH_PREVIEW_TEXT_CLAMP_CLASS = "tw-line-clamp-2 sm:tw-line-clamp-3";
const WITHOUT_PREVIEW_TEXT_CLAMP_CLASS = "tw-line-clamp-6";
const CONTENT_TEXT_BASE_CLASSES =
  "tw-max-w-full tw-break-words tw-tracking-[0.01em] tw-font-normal";
const MAX_OVERFLOW_MEASUREMENT_ATTEMPTS = 12;
const OVERFLOW_MEASUREMENT_INTERVAL_MS = 200;

interface BoostedDropCardHomeContentProps {
  readonly part?: BoostedDropPart | undefined;
  readonly isChatVariant: boolean;
}

type BoostedDropOverflowMeasurementOptions = {
  readonly hasPreview: boolean;
  readonly hasTextContent: boolean;
  readonly isChatVariant: boolean;
};

const getContentContainerClasses = ({
  hasPreview,
  isSupplementalChatContent,
  isChatVariant,
}: {
  readonly hasPreview: boolean;
  readonly isSupplementalChatContent: boolean;
  readonly isChatVariant: boolean;
}): string => {
  if (isChatVariant) {
    if (!hasPreview && isSupplementalChatContent) {
      return CHAT_SUPPLEMENTAL_TEXT_CONTAINER_CLASSES;
    }

    return hasPreview
      ? CHAT_PREVIEW_CONTAINER_CLASSES
      : CHAT_TEXT_CONTAINER_CLASSES;
  }

  return hasPreview
    ? HOME_PREVIEW_CONTAINER_CLASSES
    : HOME_TEXT_CONTAINER_CLASSES;
};

const getSupplementalChatPart = (
  part?: BoostedDropPart
): BoostedDropPart | null => {
  if (!part) {
    return null;
  }

  const remainingMedia = part.media.slice(1);
  const hasCaption = Boolean(part.content?.trim());

  if (!hasCaption && remainingMedia.length === 0) {
    return null;
  }

  return {
    ...part,
    media: remainingMedia,
  };
};

const getContentWrapperClasses = ({
  hasPreview,
  hasTextContent,
  isChatVariant,
}: {
  readonly hasPreview: boolean;
  readonly hasTextContent: boolean;
  readonly isChatVariant: boolean;
}): string => {
  if (!hasPreview) {
    return isChatVariant
      ? CHAT_TEXT_WRAPPER_CLASSES
      : HOME_TEXT_WRAPPER_CLASSES;
  }

  const baseClasses = isChatVariant
    ? CHAT_PREVIEW_WRAPPER_BASE_CLASSES
    : HOME_PREVIEW_WRAPPER_BASE_CLASSES;
  const gapClasses = hasTextContent ? "tw-gap-2 sm:tw-gap-3" : "";

  return gapClasses ? `${baseClasses} ${gapClasses}` : baseClasses;
};

const getContentClassName = ({
  hasPreview,
  isChatVariant,
}: {
  readonly hasPreview: boolean;
  readonly isChatVariant: boolean;
}): string => {
  if (hasPreview) {
    return WITH_PREVIEW_CONTENT_CLASS_NAME;
  }

  return isChatVariant
    ? CHAT_TEXT_CONTENT_CLASS_NAME
    : HOME_TEXT_CONTENT_CLASS_NAME;
};

const getContentTextClassName = (hasPreview: boolean): string => {
  const clampClasses = hasPreview
    ? WITH_PREVIEW_TEXT_CLAMP_CLASS
    : WITHOUT_PREVIEW_TEXT_CLAMP_CLASS;

  return `${clampClasses} ${CONTENT_TEXT_BASE_CLASSES}`;
};

const getChatBodyInsetClasses = ({
  addBottomPadding,
}: {
  readonly addBottomPadding: boolean;
}): string =>
  `${CHAT_BODY_INSET_X_CLASSES}${addBottomPadding ? " tw-pb-4" : ""}`;

const getOverflowElements = ({
  container,
  preview,
  textMeasure,
  wrapper,
}: {
  readonly container: HTMLDivElement | null;
  readonly preview: HTMLDivElement | null;
  readonly textMeasure: HTMLDivElement | null;
  readonly wrapper: HTMLDivElement | null;
}): OverflowElements | null => {
  if (!container || !preview || !textMeasure || !wrapper) {
    return null;
  }

  return {
    container,
    preview,
    textMeasure,
    wrapper,
  };
};

const shouldHideOverflowText = ({
  container,
  preview,
  textMeasure,
  wrapper,
}: OverflowElements): boolean => {
  const containerHeight = container.getBoundingClientRect().height;
  const previewHeight = preview.getBoundingClientRect().height;
  const previewScrollHeight = preview.scrollHeight;
  const previewClientHeight = preview.clientHeight;
  const textHeight = textMeasure.getBoundingClientRect().height;
  const computedStyles = getComputedStyle(wrapper);
  const rowGap = Number.parseFloat(computedStyles.rowGap || "0");
  const previewOverflowing = previewScrollHeight > previewClientHeight + 1;
  const totalHeight =
    Math.max(previewHeight, previewScrollHeight) + textHeight + rowGap;

  return previewOverflowing || totalHeight > containerHeight + 1;
};

const observeIfPresent = (
  observer: ResizeObserver,
  element: HTMLDivElement | null
) => {
  if (element) {
    observer.observe(element);
  }
};

const cancelAnimationFrameIfNeeded = (frame: number | undefined) => {
  if (typeof frame === "number") {
    globalThis.cancelAnimationFrame(frame);
  }
};

const useBoostedDropPreviewContent = (part?: BoostedDropPart) => {
  const previewUrl = useMemo(
    () => extractFirstUrl(part?.content),
    [part?.content]
  );

  const cleanedContent = useMemo(
    () =>
      previewUrl
        ? removePreviewUrlFromContent(part?.content, previewUrl)
        : part?.content,
    [part?.content, previewUrl]
  );

  const previewContent = useMemo(
    () =>
      buildProcessedContent(
        cleanedContent ?? null,
        part?.media,
        previewUrl ? "" : "View drop..."
      ),
    [cleanedContent, part?.media, previewUrl]
  );

  const hasTextContent = useMemo(
    () => Boolean(cleanedContent && cleanedContent.trim().length > 0),
    [cleanedContent]
  );

  return {
    hasTextContent,
    previewContent,
    previewUrl,
  };
};

const useOverflowResizeTracking = ({
  enabled,
  measureOverflow,
  contentContainerRef,
  previewRef,
  textMeasureRef,
}: {
  readonly enabled: boolean;
  readonly measureOverflow: () => void;
  readonly contentContainerRef: RefObject<HTMLDivElement | null>;
  readonly previewRef: RefObject<HTMLDivElement | null>;
  readonly textMeasureRef: RefObject<HTMLDivElement | null>;
}) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const frame = globalThis.requestAnimationFrame(() => {
      measureOverflow();
    });

    if (typeof ResizeObserver === "undefined") {
      const handleResize = () => measureOverflow();
      globalThis.addEventListener("resize", handleResize);

      return () => {
        globalThis.removeEventListener("resize", handleResize);
        cancelAnimationFrameIfNeeded(frame);
      };
    }

    const observer = new ResizeObserver(() => measureOverflow());
    observeIfPresent(observer, contentContainerRef.current);
    observeIfPresent(observer, previewRef.current);
    observeIfPresent(observer, textMeasureRef.current);

    return () => {
      observer.disconnect();
      cancelAnimationFrameIfNeeded(frame);
    };
  }, [
    contentContainerRef,
    enabled,
    measureOverflow,
    previewRef,
    textMeasureRef,
  ]);
};

const useOverflowMeasurementRetry = ({
  enabled,
  measureOverflow,
}: {
  readonly enabled: boolean;
  readonly measureOverflow: () => void;
}) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    let attempts = 0;
    const intervalId = globalThis.setInterval(() => {
      measureOverflow();
      attempts += 1;
      if (attempts >= MAX_OVERFLOW_MEASUREMENT_ATTEMPTS) {
        globalThis.clearInterval(intervalId);
      }
    }, OVERFLOW_MEASUREMENT_INTERVAL_MS);

    return () => {
      if (typeof intervalId === "number") {
        globalThis.clearInterval(intervalId);
      }
    };
  }, [enabled, measureOverflow]);
};

const useBoostedDropOverflowMeasurement = ({
  hasPreview,
  hasTextContent,
  isChatVariant,
}: BoostedDropOverflowMeasurementOptions) => {
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const textMeasureRef = useRef<HTMLDivElement>(null);
  const [hideOverflowText, setHideOverflowText] = useState(false);
  const [hasMeasuredOverflow, setHasMeasuredOverflow] = useState(false);
  const shouldMeasureOverflow = !isChatVariant && hasPreview && hasTextContent;

  const measureOverflow = useCallback(() => {
    if (!shouldMeasureOverflow) {
      return;
    }

    const elements = getOverflowElements({
      container: contentContainerRef.current,
      preview: previewRef.current,
      textMeasure: textMeasureRef.current,
      wrapper: contentWrapperRef.current,
    });

    if (!elements) {
      setHasMeasuredOverflow(false);
      setHideOverflowText(false);
      return;
    }

    setHasMeasuredOverflow(true);
    setHideOverflowText(shouldHideOverflowText(elements));
  }, [shouldMeasureOverflow]);

  useOverflowResizeTracking({
    contentContainerRef,
    enabled: shouldMeasureOverflow,
    measureOverflow,
    previewRef,
    textMeasureRef,
  });
  useOverflowMeasurementRetry({
    enabled: shouldMeasureOverflow,
    measureOverflow,
  });

  const shouldShowTextContent =
    !hasPreview ||
    (hasTextContent &&
      (!shouldMeasureOverflow || !hasMeasuredOverflow || !hideOverflowText));

  return {
    contentContainerRef,
    contentWrapperRef,
    previewRef,
    shouldMeasureOverflow,
    shouldShowTextContent,
    textMeasureRef,
  };
};

const BoostedDropCardChatMedia = memo(
  ({ media }: { readonly media: BoostedDropMediaItem }) => {
    const [frameRef, inView] = useInView<HTMLDivElement>({ threshold: 0.1 });
    const [measuredAspectRatio, setMeasuredAspectRatio] =
      useState<MeasuredChatMediaAspectRatio | null>(null);
    const aspectRatio =
      measuredAspectRatio?.url === media.url &&
      measuredAspectRatio.mimeType === media.mime_type
        ? measuredAspectRatio.aspectRatio
        : CHAT_MEDIA_FALLBACK_ASPECT_RATIO;
    const syncMeasuredAspectRatio = useCallback(
      (nextAspectRatio: string) => {
        setMeasuredAspectRatio((current) => {
          if (
            current?.url === media.url &&
            current.mimeType === media.mime_type &&
            current.aspectRatio === nextAspectRatio
          ) {
            return current;
          }

          return {
            url: media.url,
            mimeType: media.mime_type,
            aspectRatio: nextAspectRatio,
          };
        });
      },
      [media.mime_type, media.url]
    );
    const isImageMedia = media.mime_type.includes("image");
    const isVideoMedia = media.mime_type.includes("video");

    useEffect(() => {
      if (typeof window === "undefined" || !inView) {
        return;
      }

      let isCancelled = false;

      if (isImageMedia) {
        const image = new globalThis.Image();

        image.onload = () => {
          if (
            isCancelled ||
            image.naturalWidth <= 0 ||
            image.naturalHeight <= 0
          ) {
            return;
          }
          syncMeasuredAspectRatio(
            `${image.naturalWidth} / ${image.naturalHeight}`
          );
        };

        image.src = getScaledImageUri(media.url, ImageScale.AUTOx450);

        return () => {
          isCancelled = true;
        };
      }

      if (isVideoMedia) {
        const video = document.createElement("video");
        const handleLoadedMetadata = () => {
          if (isCancelled || video.videoWidth <= 0 || video.videoHeight <= 0) {
            return;
          }
          syncMeasuredAspectRatio(`${video.videoWidth} / ${video.videoHeight}`);
        };

        video.preload = "metadata";
        video.addEventListener("loadedmetadata", handleLoadedMetadata);
        video.src = media.url;
        video.load();

        return () => {
          isCancelled = true;
          video.removeEventListener("loadedmetadata", handleLoadedMetadata);
          video.removeAttribute("src");
          video.load();
        };
      }

      return () => {
        isCancelled = true;
      };
    }, [
      inView,
      isImageMedia,
      isVideoMedia,
      media.mime_type,
      media.url,
      syncMeasuredAspectRatio,
    ]);

    return (
      <div
        data-testid="boosted-drop-media-frame"
        className="tw-relative tw-w-full tw-overflow-hidden tw-rounded-xl tw-bg-black/20"
        ref={frameRef}
        style={{ aspectRatio }}
      >
        <DropListItemContentMedia
          media_mime_type={media.mime_type}
          media_url={media.url}
          imageScale={ImageScale.AUTOx450}
          imageObjectPosition="center"
        />
      </div>
    );
  }
);

BoostedDropCardChatMedia.displayName = "BoostedDropCardChatMedia";

const BoostedDropCardHomeMedia = memo(
  ({ media }: { readonly media: BoostedDropMediaItem }) => (
    <div
      data-testid="boosted-drop-media-frame"
      className={`tw-relative ${HOME_ASPECT_RATIO_CLASSES} tw-w-full tw-overflow-hidden tw-rounded-xl`}
    >
      <div className="tw-relative tw-h-full tw-w-full">
        <div className="tw-relative tw-z-0 tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-rounded-xl tw-transition-transform tw-duration-700 group-hover:tw-scale-[1.02]">
          <div className="tw-relative tw-h-full tw-w-full tw-overflow-hidden">
            <DropListItemContentMedia
              media_mime_type={media.mime_type}
              media_url={media.url}
              imageScale={ImageScale.AUTOx450}
              imageObjectPosition="center"
            />
          </div>
        </div>
      </div>
    </div>
  )
);

BoostedDropCardHomeMedia.displayName = "BoostedDropCardHomeMedia";

const BoostedDropCardTextSection = memo(
  ({
    isChatVariant,
    isSupplementalChatContent = false,
    part,
  }: {
    readonly isChatVariant: boolean;
    readonly isSupplementalChatContent?: boolean | undefined;
    readonly part?: BoostedDropPart | undefined;
  }) => {
    const { hasTextContent, previewContent, previewUrl } =
      useBoostedDropPreviewContent(part);
    const hasPreview = Boolean(previewUrl);
    const {
      contentContainerRef,
      contentWrapperRef,
      previewRef,
      shouldMeasureOverflow,
      shouldShowTextContent,
      textMeasureRef,
    } = useBoostedDropOverflowMeasurement({
      hasPreview,
      hasTextContent,
      isChatVariant,
    });
    const contentContainerClasses = getContentContainerClasses({
      hasPreview,
      isSupplementalChatContent,
      isChatVariant,
    });
    const contentWrapperClasses = getContentWrapperClasses({
      hasPreview,
      hasTextContent,
      isChatVariant,
    });
    const contentClassName = getContentClassName({
      hasPreview,
      isChatVariant,
    });
    const contentTextClassName = getContentTextClassName(hasPreview);
    const previewWrapperClassName = isChatVariant
      ? `${getChatBodyInsetClasses({
          addBottomPadding: !hasTextContent,
        })} tw-min-h-0 tw-overflow-hidden`
      : "tw-min-h-0 tw-overflow-hidden";

    return (
      <div
        data-testid="boosted-drop-content-frame"
        className={contentContainerClasses}
        ref={contentContainerRef}
      >
        <div className={contentWrapperClasses} ref={contentWrapperRef}>
          {previewUrl && (
            <div className={previewWrapperClassName} ref={previewRef}>
              <BoostedDropLinkPreview
                href={previewUrl}
                variant={isChatVariant ? "chat" : "home"}
              />
            </div>
          )}
          {shouldMeasureOverflow && previewUrl && hasTextContent && (
            <div
              ref={textMeasureRef}
              aria-hidden="true"
              className="tw-pointer-events-none tw-invisible tw-absolute tw-left-0 tw-right-0 tw-top-0"
            >
              <ContentDisplay
                content={previewContent}
                shouldClamp={false}
                className={contentClassName}
                textClassName={contentTextClassName}
              />
            </div>
          )}
          {shouldShowTextContent && (
            <ContentDisplay
              content={previewContent}
              shouldClamp={false}
              className={contentClassName}
              textClassName={contentTextClassName}
            />
          )}
        </div>
        {!hasPreview && !isChatVariant && (
          <div className="tw-pointer-events-none tw-absolute tw-inset-x-0.5 tw-bottom-0 tw-z-20 tw-h-6 tw-bg-gradient-to-b tw-from-black/0 tw-to-black/70 sm:tw-h-10 md:tw-h-12" />
        )}
      </div>
    );
  }
);

BoostedDropCardTextSection.displayName = "BoostedDropCardTextSection";

const BoostedDropCardHomeContent = memo(
  ({ part, isChatVariant }: BoostedDropCardHomeContentProps) => {
    const media = part?.media[0];
    const supplementalChatPart =
      media && isChatVariant ? getSupplementalChatPart(part) : null;

    if (!media) {
      return (
        <BoostedDropCardTextSection isChatVariant={isChatVariant} part={part} />
      );
    }

    if (isChatVariant) {
      if (supplementalChatPart) {
        return (
          <div className={CHAT_MEDIA_WITH_CONTENT_CLASSES}>
            <div
              className={getChatBodyInsetClasses({
                addBottomPadding: false,
              })}
            >
              <BoostedDropCardChatMedia media={media} />
            </div>
            <BoostedDropCardTextSection
              isChatVariant={true}
              isSupplementalChatContent={true}
              part={supplementalChatPart}
            />
          </div>
        );
      }

      return (
        <div className={getChatBodyInsetClasses({ addBottomPadding: true })}>
          <BoostedDropCardChatMedia media={media} />
        </div>
      );
    }

    return <BoostedDropCardHomeMedia media={media} />;
  }
);

BoostedDropCardHomeContent.displayName = "BoostedDropCardHomeContent";

export default BoostedDropCardHomeContent;
