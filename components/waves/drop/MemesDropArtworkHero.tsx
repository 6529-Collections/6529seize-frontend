import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import videoFrameStyles from "@/components/drops/view/item/content/media/SeizeVideoFrame.module.css";
import { ImageScale } from "@/helpers/image.helpers";
import clsx from "clsx";
import type { MemesDropMedia } from "./memesDropPanelTypes";

interface MemesDropArtworkHeroProps {
  readonly artworkMedia?: MemesDropMedia | null | undefined;
}

export function MemesDropArtworkHero({
  artworkMedia,
}: MemesDropArtworkHeroProps) {
  const loadStrategy =
    artworkMedia?.mime_type === "text/html" ? "in-view" : "eager";
  const isVideo = artworkMedia?.mime_type.includes("video") ?? false;

  return (
    <div
      data-video-artwork={isVideo || undefined}
      className={clsx(
        "tw-flex tw-w-full tw-flex-col",
        isVideo ? videoFrameStyles["artworkStage"] : "lg:tw-min-h-screen"
      )}
    >
      <div
        className={clsx(
          "tw-flex tw-items-center tw-justify-center tw-px-4 tw-py-4 sm:tw-px-6 lg:tw-py-8 xl:tw-px-20",
          isVideo
            ? "tw-flex-1 [--video-frame-padding:2rem] lg:[--video-frame-padding:4rem]"
            : "lg:tw-flex-1"
        )}
      >
        {artworkMedia && (
          <div className="tw-mx-auto tw-flex tw-w-full tw-items-center tw-justify-center md:tw-max-w-4xl">
            <div
              className={clsx(
                "tw-relative tw-w-full",
                !isVideo &&
                  "tw-h-[clamp(24rem,calc(100dvh-10rem),42rem)] sm:tw-h-[clamp(18rem,75vw,calc(100dvh-8rem))] lg:tw-h-[95vh]"
              )}
            >
              <DropListItemContentMedia
                media_mime_type={artworkMedia.mime_type}
                media_url={artworkMedia.url}
                isCompetitionDrop={true}
                imageScale={ImageScale.AUTOx1080}
                loadStrategy={loadStrategy}
                artworkVideoLayout={isVideo}
                fillVideoContainer={!isVideo}
                videoAlign="center"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
