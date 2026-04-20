import Download from "@/components/download/Download";
import WaveDropDeleteButton from "@/components/utils/button/WaveDropDeleteButton";
import { MemesArtResubmitAction } from "@/components/waves/memes/submission/MemesArtResubmitAction";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { SingleWaveDropInfoDetails } from "./SingleWaveDropInfoDetails";
import { SingleWaveDropTraits } from "./SingleWaveDropTraits";
import { WaveDropAdditionalInfo } from "./WaveDropAdditionalInfo";
import type {
  MemesDropDownloadData,
  MemesDropFileInfo,
  MemesDropMedia,
} from "./memesDropPanelTypes";

interface MemesDropDetailsSectionProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave | null;
  readonly artworkMedia?: MemesDropMedia | null | undefined;
  readonly fileInfo: MemesDropFileInfo | null;
  readonly previewImageData: MemesDropDownloadData | null;
  readonly promoVideoData: MemesDropDownloadData | null;
  readonly fileName: string;
  readonly canDelete: boolean;
  readonly onClose?: (() => void) | undefined;
}

export function MemesDropDetailsSection({
  drop,
  wave,
  artworkMedia,
  fileInfo,
  previewImageData,
  promoVideoData,
  fileName,
  canDelete,
  onClose,
}: MemesDropDetailsSectionProps) {
  const hasArtworkDownload = artworkMedia !== null && fileInfo !== null;
  const hasDownloads =
    hasArtworkDownload || previewImageData !== null || promoVideoData !== null;

  return (
    <div className="tw-px-4 tw-pb-8 sm:tw-px-6 md:tw-pb-10 xl:tw-px-20">
      <div className="tw-mx-auto tw-max-w-3xl tw-space-y-8">
        <SingleWaveDropTraits drop={drop} />
        <SingleWaveDropInfoDetails drop={drop} />
        <WaveDropAdditionalInfo drop={drop} />

        {hasDownloads ? (
          <div className="tw-mt-8 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8">
            <div className="tw-inline-grid tw-grid-cols-[auto_auto_auto] tw-items-center tw-gap-x-3 tw-gap-y-2">
              {artworkMedia && fileInfo && (
                <>
                  <span className="tw-text-xs tw-font-medium tw-text-iron-600">
                    Media Type:
                  </span>
                  <span className="tw-text-xs tw-font-medium tw-text-iron-400">
                    {fileInfo.extension.toUpperCase()}
                  </span>
                  <Download
                    href={artworkMedia.url}
                    name={fileName}
                    extension={fileInfo.extension}
                    variant="text"
                    alwaysShowText
                  />
                </>
              )}
              {previewImageData && (
                <>
                  <span className="tw-text-xs tw-font-medium tw-text-iron-600">
                    Preview:
                  </span>
                  <span className="tw-text-xs tw-font-medium tw-text-iron-400">
                    {previewImageData.fileInfo.extension.toUpperCase()}
                  </span>
                  <Download
                    href={previewImageData.url}
                    name={`${fileName}-preview`}
                    extension={previewImageData.fileInfo.extension}
                    variant="text"
                    alwaysShowText
                  />
                </>
              )}
              {promoVideoData && (
                <>
                  <span className="tw-text-xs tw-font-medium tw-text-iron-600">
                    Promo Video:
                  </span>
                  <span className="tw-text-xs tw-font-medium tw-text-iron-400">
                    {promoVideoData.fileInfo.extension.toUpperCase()}
                  </span>
                  <Download
                    href={promoVideoData.url}
                    name={`${fileName}-promo-video`}
                    extension={promoVideoData.fileInfo.extension}
                    variant="text"
                    alwaysShowText
                  />
                </>
              )}
            </div>
          </div>
        ) : null}

        <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row">
          {wave && (
            <MemesArtResubmitAction
              drop={drop}
              wave={wave}
              variant="button"
              onSourceDropDeleted={onClose}
            />
          )}
          {canDelete && drop.drop_type !== ApiDropType.Winner && (
            <WaveDropDeleteButton drop={drop} />
          )}
        </div>
      </div>
    </div>
  );
}
