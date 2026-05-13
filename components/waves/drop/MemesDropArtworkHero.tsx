import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import { ImageScale } from "@/helpers/image.helpers";
import type { MemesDropMedia } from "./memesDropPanelTypes";

interface MemesDropArtworkHeroProps {
  readonly artworkMedia?: MemesDropMedia | null | undefined;
}

export function MemesDropArtworkHero({
  artworkMedia,
}: MemesDropArtworkHeroProps) {
  return (
    <div className="tw-flex tw-w-full tw-flex-col lg:tw-min-h-screen">
      <div className="tw-flex tw-items-center tw-justify-center tw-px-4 tw-py-4 sm:tw-px-6 lg:tw-flex-1 lg:tw-py-8 xl:tw-px-20">
        {artworkMedia && (
          <div className="tw-mx-auto tw-flex tw-w-full tw-items-center tw-justify-center md:tw-max-w-4xl">
            <div className="tw-relative tw-h-[clamp(18rem,75vw,calc(100dvh-8rem))] tw-w-full lg:tw-h-[95vh]">
              <DropListItemContentMedia
                media_mime_type={artworkMedia.mime_type}
                media_url={artworkMedia.url}
                isCompetitionDrop={true}
                imageScale={ImageScale.AUTOx1080}
                fillVideoContainer={true}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
