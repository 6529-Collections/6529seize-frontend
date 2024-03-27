import {
  getScaledImageUri,
  ImageScale,
} from "../../../../helpers/image.helpers";

export default function DropPfp({ pfpUrl }: { readonly pfpUrl: string | null | undefined }) {
  return (
    <div className="tw-flex-shrink-0 tw-h-10 tw-w-10 tw-rounded-lg tw-overflow-hidden tw-bg-iron-800 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-p-0.5">
      <div className="tw-h-full tw-w-full tw-max-w-full">
        <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center">
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
