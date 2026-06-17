"use client";

import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import ContentDisplay from "@/components/waves/drops/ContentDisplay";
import { buildProcessedContent } from "@/components/waves/drops/media-utils";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ImageScale } from "@/helpers/image.helpers";
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
type OverflowElements = {
  readonly container: HTMLDivElement;
  readonly preview: HTMLDivElement;
  readonly textMeasure: HTMLDivElement;
  readonly wrapper: HTMLDivElement;
};

const HOME_ASPECT_RATIO_CLASSES =
  "tw-aspect-[2/1] sm:tw-aspect-[5/4] md:tw-aspect-[8/5] lg:tw-aspect-[5/4] xl:tw-aspect-[8/5]";
const CHAT_TEXT_MAX_HEIGHT_CLASSES = "tw-max-h-[11rem] md:tw-max-h-[12rem]";
const CHAT_PREVIEW_MAX_HEIGHT_CLASSES = "tw-max-h-[15rem] md:tw-max-h-[16rem]";
const CHAT_PREVIEW_CONTAINER_CLASSES = `tw-relative tw-flex ${CHAT_PREVIEW_MAX_HEIGHT_CLASSES} tw-w-full tw-flex-col tw-items-stretch tw-justify-stretch tw-gap-3 tw-overflow-hidden tw-bg-black/20 tw-p-3`;
const CHAT_TEXT_CONTAINER_CLASSES = `tw-relative tw-flex ${CHAT_TEXT_MAX_HEIGHT_CLASSES} tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-bg-black/20 tw-px-4 tw-py-5 sm:tw-px-6`;
const HOME_PREVIEW_CONTAINER_CLASSES = `tw-relative tw-flex ${HOME_ASPECT_RATIO_CLASSES} tw-w-full tw-flex-col tw-items-stretch tw-justify-stretch tw-gap-3 tw-overflow-hidden tw-rounded-xl`;
const HOME_TEXT_CONTAINER_CLASSES = `tw-relative tw-flex ${HOME_ASPECT_RATIO_CLASSES} tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-xl tw-px-6 tw-pb-6 sm:tw-pb-0 tw-pt-4 sm:tw-pt-16 md:tw-pt-12`;
const CHAT_PREVIEW_WRAPPER_BASE_CLASSES =
  "tw-pointer-events-none tw-relative tw-z-30 tw-grid tw-h-full tw-w-full tw-min-w-0 tw-max-w-full tw-grid-rows-[minmax(0,1fr)_auto] [&_a]:tw-pointer-events-auto [&_button]:tw-pointer-events-auto [&_video]:tw-pointer-events-auto";
const HOME_PREVIEW_WRAPPER_BASE_CLASSES =
  "tw-pointer-events-none tw-relative tw-z-30 tw-grid tw-h-full tw-w-full tw-min-w-0 tw-max-w-full tw-grid-rows-[minmax(0,1fr)_auto] [&_a]:tw-pointer-events-auto [&_button]:tw-pointer-events-auto [&_video]:tw-pointer-events-auto";
const CHAT_TEXT_WRAPPER_CLASSES =
  "tw-pointer-events-none tw-relative tw-z-30 tw-flex tw-w-full tw-min-w-0 tw-max-w-full tw-items-center tw-justify-center [&_a]:tw-pointer-events-auto [&_button]:tw-pointer-events-auto";
const HOME_TEXT_WRAPPER_CLASSES =
  "tw-pointer-events-none tw-relative tw-z-30 tw-flex tw-h-full tw-w-full tw-min-w-0 tw-max-w-full tw-items-center tw-justify-center [&_a]:tw-pointer-events-auto [&_button]:tw-pointer-events-auto";
const WITH_PREVIEW_CONTENT_CLASS_NAME =
  "tw-flex tw-w-full tw-max-w-full tw-flex-col tw-items-start tw-gap-1 tw-break-words tw-px-3 tw-pb-3 tw-text-left sm:tw-px-4 sm:tw-pb-4 tw-tracking-[0.01em] tw-font-normal tw-text-iron-300";
const CHAT_WITH_PREVIEW_CONTENT_CLASS_NAME =
  "tw-flex tw-w-full tw-max-w-full tw-flex-col tw-items-start tw-gap-1 tw-break-words tw-px-3 tw-pb-3 tw-text-left tw-tracking-[0.01em] tw-font-normal tw-text-iron-400";
const HOME_TEXT_CONTENT_CLASS_NAME =
  "tw-flex tw-w-fit tw-max-w-full tw-flex-col tw-items-start tw-gap-1 tw-break-words tw-tracking-[0.01em] tw-font-normal tw-text-iron-300";
const WITH_PREVIEW_TEXT_CLAMP_CLASS = "tw-line-clamp-2 sm:tw-line-clamp-3";
const WITHOUT_PREVIEW_TEXT_CLAMP_CLASS = "tw-line-clamp-6";
const CONTENT_TEXT_BASE_CLASSES =
  "tw-block tw-w-full tw-max-w-full tw-break-words tw-text-left tw-tracking-[0.01em] tw-font-normal";
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
  isChatVariant,
}: {
  readonly hasPreview: boolean;
  readonly isChatVariant: boolean;
}): string => {
  if (isChatVariant) {
    return hasPreview
      ? CHAT_PREVIEW_CONTAINER_CLASSES
      : CHAT_TEXT_CONTAINER_CLASSES;
  }

  return hasPreview
    ? HOME_PREVIEW_CONTAINER_CLASSES
    : HOME_TEXT_CONTAINER_CLASSES;
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
    return isChatVariant
      ? CHAT_WITH_PREVIEW_CONTENT_CLASS_NAME
      : WITH_PREVIEW_CONTENT_CLASS_NAME;
  }

  return HOME_TEXT_CONTENT_CLASS_NAME;
};

const getContentTextClassName = (hasPreview: boolean): string => {
  const clampClasses = hasPreview
    ? WITH_PREVIEW_TEXT_CLAMP_CLASS
    : WITHOUT_PREVIEW_TEXT_CLAMP_CLASS;

  return `${clampClasses} ${CONTENT_TEXT_BASE_CLASSES}`;
};

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
}: BoostedDropOverflowMeasurementOptions) => {
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const contentWrapperRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const textMeasureRef = useRef<HTMLDivElement>(null);
  const [hideOverflowText, setHideOverflowText] = useState(false);
  const [hasMeasuredOverflow, setHasMeasuredOverflow] = useState(false);
  const shouldMeasureOverflow = hasPreview && hasTextContent;

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

const BoostedDropCardHomeMedia = memo(
  ({
    isChatVariant,
    media,
  }: {
    readonly isChatVariant: boolean;
    readonly media: BoostedDropMediaItem;
  }) => (
    <div
      data-testid="boosted-drop-media-frame"
      className={`tw-relative ${HOME_ASPECT_RATIO_CLASSES} ${isChatVariant ? CHAT_TEXT_MAX_HEIGHT_CLASSES : ""} tw-w-full tw-overflow-hidden tw-rounded-xl`}
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
    part,
  }: {
    readonly isChatVariant: boolean;
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
      ? "tw-min-h-0 tw-overflow-hidden tw-rounded-lg"
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

    if (!media) {
      return (
        <BoostedDropCardTextSection isChatVariant={isChatVariant} part={part} />
      );
    }

    return (
      <BoostedDropCardHomeMedia isChatVariant={isChatVariant} media={media} />
    );
  }
);

BoostedDropCardHomeContent.displayName = "BoostedDropCardHomeContent";

export default BoostedDropCardHomeContent;
