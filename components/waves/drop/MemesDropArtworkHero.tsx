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
    <div className="tw-flex tw-min-h-screen tw-w-full tw-flex-col">
      <div className="tw-flex tw-flex-1 tw-items-center tw-justify-center tw-px-4 tw-py-6 sm:tw-px-6 lg:tw-py-8 xl:tw-px-20">
        {artworkMedia && (
          <div className="tw-mx-auto tw-flex tw-w-full tw-items-center tw-justify-center md:tw-max-w-4xl">
            <div className="tw-relative tw-h-[60vh] tw-w-full md:tw-h-[80vh] lg:tw-h-[95vh]">
              <DropListItemContentMedia
                media_mime_type={artworkMedia.mime_type}
                media_url={artworkMedia.url}
                isCompetitionDrop={true}
                imageScale={ImageScale.AUTOx1080}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
