"use client";

import Image from "next/image";
import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import BoostIcon from "@/components/common/icons/BoostIcon";
import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import ContentDisplay from "@/components/waves/drops/ContentDisplay";
import { buildProcessedContent } from "@/components/waves/drops/media-utils";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { getTimeAgoShort } from "@/helpers/Helpers";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";

import BoostedDropLinkPreview from "./BoostedDropLinkPreview";
import {
  extractFirstUrl,
  removePreviewUrlFromContent,
} from "./extractStandaloneUrl";

interface BoostedDropCardHomeProps {
  readonly drop: ApiDrop;
  readonly onClick?: () => void;
}

const BoostedDropCardHome = memo(
  ({ drop, onClick }: BoostedDropCardHomeProps) => {
    const part = drop.parts[0];
    const media = part?.media[0];

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
    const contentContainerRef = useRef<HTMLDivElement>(null);
    const contentWrapperRef = useRef<HTMLDivElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const textMeasureRef = useRef<HTMLDivElement>(null);
    const [hideOverflowText, setHideOverflowText] = useState(false);
    const [hasMeasuredOverflow, setHasMeasuredOverflow] = useState(false);
    const shouldMeasureOverflow = Boolean(previewUrl && hasTextContent);
    const effectiveHasMeasuredOverflow = shouldMeasureOverflow
      ? hasMeasuredOverflow
      : false;
    const effectiveHideOverflowText = shouldMeasureOverflow
      ? hideOverflowText
      : false;

    const { author, wave, boosts } = drop;
    const waveHref = getWaveRoute({
      waveId: wave.id,
      isDirectMessage: false,
      isApp: false,
    });
    const MAX_FIRE_ICONS = 5;
    const fireIconsToShow = Math.min(boosts, MAX_FIRE_ICONS);
    const remainingBoosts = boosts - MAX_FIRE_ICONS;
    const waveName = wave.name;
    const handleCardKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!onClick) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      },
      [onClick]
    );
    const headerClasses =
      "tw-absolute tw-left-3 tw-right-3 tw-top-3 tw-z-30 tw-flex tw-flex-nowrap tw-items-center tw-justify-between tw-gap-2";

    const contentContainerClasses = previewUrl
      ? "tw-relative tw-flex tw-aspect-[2/1] sm:tw-aspect-[5/4] md:tw-aspect-[8/5] lg:tw-aspect-[5/4] xl:tw-aspect-[8/5] tw-w-full tw-flex-col tw-items-stretch tw-justify-stretch tw-gap-3 tw-overflow-hidden tw-rounded-xl"
      : "tw-relative tw-flex tw-aspect-[2/1] sm:tw-aspect-[5/4] md:tw-aspect-[8/5] lg:tw-aspect-[5/4] xl:tw-aspect-[8/5] tw-w-full tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-xl tw-px-6 tw-pb-6 sm:tw-pb-0 tw-pt-4 sm:tw-pt-16 md:tw-pt-12";
    const contentWrapperGapClasses = hasTextContent
      ? "tw-gap-2 sm:tw-gap-3"
      : "";
    const contentWrapperClasses = previewUrl
      ? `tw-relative tw-z-10 tw-grid tw-h-full tw-w-full tw-min-w-0 tw-max-w-full tw-grid-rows-[minmax(0,1fr)_auto] ${contentWrapperGapClasses}`
      : "tw-relative tw-z-10 tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-min-w-0 tw-max-w-full";
    const textClampClass = previewUrl
      ? "tw-line-clamp-2 sm:tw-line-clamp-3"
      : "tw-line-clamp-6";
    const contentClassName = previewUrl
      ? "tw-flex tw-w-full tw-max-w-full tw-flex-col tw-items-start tw-gap-1 tw-break-words tw-px-3 tw-pb-3 sm:tw-px-4 sm:tw-pb-4 tw-tracking-[0.01em] tw-font-normal tw-text-iron-300"
      : "tw-flex tw-w-fit tw-max-w-full tw-flex-col tw-items-start tw-gap-1 tw-break-words tw-tracking-[0.01em] tw-font-normal tw-text-iron-300";
    const contentTextClassName = `${textClampClass} tw-max-w-full tw-break-words tw-tracking-[0.01em] tw-font-normal`;
    const shouldShowTextContent =
      !previewUrl ||
      (hasTextContent &&
        (!effectiveHasMeasuredOverflow || !effectiveHideOverflowText));

    const measureOverflow = useCallback(() => {
      if (!shouldMeasureOverflow) {
        return;
      }

      const container = contentContainerRef.current;
      const wrapper = contentWrapperRef.current;
      const preview = previewRef.current;
      const textMeasure = textMeasureRef.current;

      if (!container || !wrapper || !preview || !textMeasure) {
        setHasMeasuredOverflow(false);
        setHideOverflowText(false);
        return;
      }

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

      setHasMeasuredOverflow(true);
      setHideOverflowText(
        previewOverflowing || totalHeight > containerHeight + 1
      );
    }, [shouldMeasureOverflow]);

    useEffect(() => {
      if (!shouldMeasureOverflow) {
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
          if (typeof frame === "number") {
            globalThis.cancelAnimationFrame(frame);
          }
        };
      }

      const observer = new ResizeObserver(() => measureOverflow());
      if (contentContainerRef.current) {
        observer.observe(contentContainerRef.current);
      }
      if (previewRef.current) {
        observer.observe(previewRef.current);
      }
      if (textMeasureRef.current) {
        observer.observe(textMeasureRef.current);
      }

      return () => {
        observer.disconnect();
        if (typeof frame === "number") {
          globalThis.cancelAnimationFrame(frame);
        }
      };
    }, [measureOverflow, shouldMeasureOverflow]);

    useEffect(() => {
      if (!shouldMeasureOverflow) {
        return;
      }

      let attempts = 0;
      const maxAttempts = 12;
      const intervalId = globalThis.setInterval(() => {
        measureOverflow();
        attempts += 1;
        if (attempts >= maxAttempts) {
          globalThis.clearInterval(intervalId);
        }
      }, 200);

      return () => {
        if (typeof intervalId === "number") {
          globalThis.clearInterval(intervalId);
        }
      };
    }, [measureOverflow, shouldMeasureOverflow]);

    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={handleCardKeyDown}
        className="tw-group tw-relative tw-flex tw-w-full tw-cursor-pointer tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-black/70 tw-p-0 tw-text-left tw-transition-all tw-duration-500 tw-ease-out hover:-tw-translate-y-1.5 hover:tw-shadow-[0_0_32px_-10px_rgba(255,255,255,0.12)]"
      >
        <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-z-20 tw-rounded-xl tw-border tw-border-solid tw-border-white/5" />

        <div className={headerClasses}>
          <div className="tw-flex tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-black/40 tw-px-2.5 tw-py-1 tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] tw-backdrop-blur-md tw-transition-colors group-hover:tw-bg-black/60">
            <span className="tw-text-[10px] tw-font-semibold tw-leading-4 tw-tracking-wide tw-text-zinc-300">
              {getTimeAgoShort(drop.created_at)}
            </span>
          </div>
          <div className="tw-flex tw-items-center tw-gap-0.5 tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-black/40 tw-px-2.5 tw-py-1 tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] tw-backdrop-blur-md tw-transition-colors group-hover:tw-bg-black/60 sm:tw-ml-auto">
            {Array.from({ length: fireIconsToShow }).map((_, i) => (
              <BoostIcon
                key={i}
                className="tw-size-3 tw-flex-shrink-0 tw-text-orange-400 tw-drop-shadow-sm"
                variant="filled"
              />
            ))}
            {remainingBoosts > 0 && (
              <span className="tw-ml-1 tw-text-[10px] tw-font-bold tw-tabular-nums tw-leading-4 tw-text-iron-50">
                +{remainingBoosts}
              </span>
            )}
          </div>
        </div>

        {media ? (
          <div className="tw-relative tw-aspect-[2/1] tw-w-full tw-overflow-hidden tw-rounded-xl sm:tw-aspect-[5/4] md:tw-aspect-[8/5] lg:tw-aspect-[5/4] xl:tw-aspect-[8/5]">
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
        ) : (
          <div className={contentContainerClasses} ref={contentContainerRef}>
            <div className={contentWrapperClasses} ref={contentWrapperRef}>
              {previewUrl && (
                <div className="tw-min-h-0 tw-overflow-hidden" ref={previewRef}>
                  <BoostedDropLinkPreview href={previewUrl} />
                </div>
              )}
              {previewUrl && hasTextContent && (
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
            {!previewUrl && (
              <div className="tw-pointer-events-none tw-absolute tw-inset-x-0.5 tw-bottom-0 tw-z-20 tw-h-6 tw-bg-gradient-to-b tw-from-black/0 tw-to-black/70 sm:tw-h-10 md:tw-h-12" />
            )}
          </div>
        )}

        <div className="tw-relative tw-z-10 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-zinc-900 tw-bg-black/70 tw-px-4 tw-py-3">
          <Link
            href={author.handle ? `/${author.handle}` : "#"}
            onClick={(event) => event.stopPropagation()}
            className="tw-flex tw-max-w-full tw-flex-wrap tw-items-center tw-gap-2 tw-no-underline tw-transition-opacity desktop-hover:hover:tw-opacity-80"
          >
            <ProfileAvatar
              pfpUrl={author.pfp}
              alt={author.handle ?? "User"}
              size={ProfileBadgeSize.SMALL}
            />
            <span className="tw-break-words tw-text-sm tw-font-medium tw-text-iron-50">
              {author.handle ?? "Anonymous"}
            </span>
          </Link>

          <Link
            href={waveHref}
            onClick={(event) => event.stopPropagation()}
            className="tw-group/wave tw-flex tw-max-w-full tw-flex-wrap tw-items-center tw-gap-2 tw-rounded-full tw-bg-white/5 tw-py-1 tw-pl-2.5 tw-pr-1 tw-no-underline tw-transition-all active:tw-scale-95 desktop-hover:hover:tw-bg-white/10"
          >
            <span className="tw-break-words tw-text-[11px] tw-font-medium tw-text-iron-400 tw-transition-colors desktop-hover:group-hover/wave:tw-text-iron-200">
              {waveName}
            </span>
            {wave.picture && (
              <Image
                src={getScaledImageUri(wave.picture, ImageScale.W_AUTO_H_50)}
                alt={waveName}
                width={20}
                height={20}
                className="tw-size-5 tw-shrink-0 tw-rounded-full tw-object-cover tw-ring-1 tw-ring-white/10"
              />
            )}
          </Link>
        </div>
      </div>
    );
  }
);

BoostedDropCardHome.displayName = "BoostedDropCardHome";

export default BoostedDropCardHome;
