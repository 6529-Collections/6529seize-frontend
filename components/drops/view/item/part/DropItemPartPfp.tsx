import {
  getScaledImageUri,
  ImageScale,
} from "../../../../../helpers/image.helpers";

export default function DropItemPartPfp({
  pfpUrl,
}: {
  readonly pfpUrl: string | null;
}) {
  if (!pfpUrl) {
    return (
      <div className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain" />
    );
  }

  return (
    <img
      src={getScaledImageUri(pfpUrl, ImageScale.W_AUTO_H_50)}
      alt="Drop Author Profile"
      className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain"
    />
  );
}
