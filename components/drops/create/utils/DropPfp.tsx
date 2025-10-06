import {
  getScaledImageUri,
  ImageScale,
} from "@/helpers/image.helpers";
import { DropPartSize } from "@/components/drops/view/part/DropPart";

export default function DropPfp({
  pfpUrl,
  size = DropPartSize.MEDIUM,
}: {
  readonly pfpUrl: string | null | undefined;
  readonly size?: DropPartSize;
}) {
  const SIZE_CLASSES: Record<DropPartSize, string> = {
    [DropPartSize.SMALL]: "tw-h-7 tw-w-7",
    [DropPartSize.MEDIUM]: "tw-h-10 tw-w-10",
    [DropPartSize.LARGE]: "tw-h-12 tw-w-12",
  };

  return (
    <div
      className={`${SIZE_CLASSES[size]} tw-bg-iron-900 tw-relative tw-flex-shrink-0 tw-rounded-lg`}
    >
      <div className="tw-rounded-lg tw-h-full tw-w-full">
        <div className="tw-ring-1 tw-ring-white/10 tw-h-full tw-w-full tw-max-w-full tw-rounded-lg tw-overflow-hidden tw-bg-iron-900">
          <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-overflow-hidden">
            {pfpUrl && (
              <img
                src={getScaledImageUri(pfpUrl, ImageScale.W_AUTO_H_50)}
                alt="Create Drop Profile"
                className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
