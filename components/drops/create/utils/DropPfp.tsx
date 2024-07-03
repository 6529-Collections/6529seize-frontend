import { assertUnreachable } from "../../../../helpers/AllowlistToolHelpers";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../helpers/image.helpers";

export enum DropPFPSize {
  SMALL = "SMALL",
  MEDIUM = "MEDIUM",
  LARGE = "LARGE",
}

export default function DropPfp({
  pfpUrl,
  size = DropPFPSize.MEDIUM,
  isWaveDescriptionDrop = false,
}: {
  readonly pfpUrl: string | null | undefined;
  readonly size?: DropPFPSize;
  readonly isWaveDescriptionDrop?: boolean;
}) {
  const SIZE_CLASSES: Record<DropPFPSize, string> = {
    [DropPFPSize.SMALL]: "tw-h-7 tw-w-7",
    [DropPFPSize.MEDIUM]: "tw-h-[2.625rem] tw-w-[2.625rem]",
    [DropPFPSize.LARGE]: "tw-h-12 tw-w-12",
  };

  return (
    /* tw-bg-iron-800 tw-ring-1 tw-ring-iron-700  */
    <div
      className={`${SIZE_CLASSES[size]} tw-flex-shrink-0 tw-rounded-lg tw-overflow-hidden`}
    >
      <div className="tw-h-full tw-w-full tw-max-w-full tw-rounded-lg tw-overflow-hidden">
        <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-overflow-hidden">
          {pfpUrl && (
            <div className="tw-p-[1.5px] tw-rounded-lg tw-bg-gradient-to-tr tw-from-primary-600 tw-to-primary-300">
              <div className="tw-bg-iron-900 tw-rounded-lg tw-p-[1px]">
                <img
                  src={getScaledImageUri(pfpUrl, ImageScale.W_AUTO_H_50)}
                  alt="Create Drop Profile"
                  className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain tw-rounded-lg"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
