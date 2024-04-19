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
}: {
  readonly pfpUrl: string | null | undefined;
  readonly size?: DropPFPSize;
}) {
  const getSizeClasses = (): string => {
    switch (size) {
      case DropPFPSize.SMALL:
        return "tw-h-7 tw-w-7";
      case DropPFPSize.MEDIUM:
        return "tw-h-10 tw-w-10";
      case DropPFPSize.LARGE:
        return "tw-h-12 tw-w-12";
      default:
        assertUnreachable(size);
        return "";
    }
  };

  return (
    <div
      className={`${getSizeClasses()} tw-flex-shrink-0 tw-rounded-lg tw-overflow-hidden tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-p-[1px]`}
    >
      <div className="tw-h-full tw-w-full tw-max-w-full tw-rounded-lg tw-overflow-hidden">
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
  );
}
