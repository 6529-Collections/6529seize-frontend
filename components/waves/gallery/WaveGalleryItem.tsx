"use client";

import MediaTypeBadge from "@/components/drops/media/MediaTypeBadge";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { ImageScale } from "@/helpers/image.helpers";
import {
  type ExtendedDrop,
  getDropPreviewImageUrl,
} from "@/helpers/waves/drop.helpers";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import Link from "next/link";
import { memo, useMemo } from "react";

interface WaveGalleryItemProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveGalleryItem = memo<WaveGalleryItemProps>(
  ({ drop, onDropClick }) => {
    const isTabletOrSmaller = useMediaQuery("(max-width: 1023px)");
    const { hasTouchScreen } = useDeviceInfo();
    const mediaImageScale = isTabletOrSmaller
      ? ImageScale.AUTOx450
      : ImageScale.AUTOx1080;

    const previewImageUrl = useMemo(
      () => getDropPreviewImageUrl(drop.metadata),
      [drop.metadata]
    );

    const handleImageClick = () => {
      onDropClick(drop);
    };

    const transitionClasses = !hasTouchScreen
      ? "tw-transition-all tw-duration-300 tw-ease-out"
      : "";

    const containerClass = `tw-group ${transitionClasses} tw-relative tw-bg-iron-950/50 tw-rounded-xl tw-overflow-hidden desktop-hover:hover:tw-ring-1 desktop-hover:hover:tw-ring-iron-700`;

    const imageScaleClasses = hasTouchScreen
      ? ""
      : "tw-transform tw-duration-500 tw-ease-out group-hover:tw-scale-105";

    return (
      <div className={containerClass}>
        <button
          className="tw-relative tw-m-0 tw-aspect-square tw-w-full tw-cursor-pointer tw-touch-none tw-overflow-hidden tw-border-none tw-bg-iron-900 tw-bg-transparent tw-p-0 tw-text-left"
          onClick={handleImageClick}
          type="button"
        >
          <div
            className={`tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center ${imageScaleClasses}`}
          >
            <MediaDisplay
              media_mime_type={
                drop.parts[0]?.media[0]?.mime_type ?? "image/jpeg"
              }
              media_url={drop.parts[0]?.media[0]?.url ?? ""}
              disableMediaInteraction={true}
              imageScale={mediaImageScale}
              previewImageUrl={previewImageUrl}
            />
          </div>
          <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-bg-gradient-to-t tw-from-black/80 tw-via-transparent tw-to-transparent tw-opacity-0 tw-transition-opacity tw-duration-300 group-hover:tw-opacity-100" />
          <div className="tw-pointer-events-none tw-absolute tw-bottom-0 tw-left-0 tw-right-0 tw-translate-y-2 tw-p-3 tw-opacity-0 tw-transition-all tw-duration-300 group-hover:tw-translate-y-0 group-hover:tw-opacity-100">
            {drop.title && (
              <span className="tw-block tw-truncate tw-text-sm tw-font-medium tw-text-white">
                {drop.title}
              </span>
            )}
            {drop.author.handle && (
              <span className="tw-mt-1 tw-block tw-text-xs tw-text-iron-300">
                {drop.author.handle}
              </span>
            )}
          </div>
        </button>
        <div className="tw-absolute tw-left-2 tw-top-2">
          <MediaTypeBadge
            mimeType={drop.parts[0]?.media[0]?.mime_type}
            dropId={drop.id}
            size="sm"
          />
        </div>
        {drop.author.handle && (
          <div className="tw-absolute tw-bottom-2 tw-left-2 tw-right-2 tw-flex tw-items-center tw-gap-2 tw-opacity-100 tw-transition-opacity tw-duration-300 group-hover:tw-opacity-100 lg:tw-opacity-0">
            <UserProfileTooltipWrapper user={drop.author.handle}>
              <Link
                onClick={(e) => e.stopPropagation()}
                href={`/${drop.author.handle}`}
                className="tw-rounded-lg tw-bg-black/60 tw-px-2 tw-py-1 tw-text-xs tw-text-white/90 tw-no-underline tw-backdrop-blur-sm tw-transition-colors desktop-hover:hover:tw-bg-black/80"
              >
                {drop.author.handle}
              </Link>
            </UserProfileTooltipWrapper>
          </div>
        )}
      </div>
    );
  }
);

WaveGalleryItem.displayName = "WaveGalleryItem";
