import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import { ImageScale } from "@/helpers/image.helpers";
import { faExpand } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  isMemesDropImageMedia,
  type MemesDropMedia,
} from "./memesDropPanelTypes";

interface MemesDropArtworkHeroProps {
  readonly artworkMedia?: MemesDropMedia | null | undefined;
  readonly onOpenFullscreen: () => void;
}

export function MemesDropArtworkHero({
  artworkMedia,
  onOpenFullscreen,
}: MemesDropArtworkHeroProps) {
  const canOpenFullscreen = isMemesDropImageMedia(artworkMedia);

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
                disableModal={true}
                fillVideoContainer={true}
              />
              {canOpenFullscreen && (
                <button
                  type="button"
                  onClick={onOpenFullscreen}
                  className="tw-absolute tw-right-3 tw-top-3 tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-white/15 tw-bg-iron-950/75 tw-text-iron-100 tw-backdrop-blur tw-transition-colors tw-duration-200 hover:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400"
                  aria-label="Open fullscreen view"
                >
                  <FontAwesomeIcon icon={faExpand} className="tw-size-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
