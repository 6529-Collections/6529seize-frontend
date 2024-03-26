import { IProfileAndConsolidations } from "../../../../entities/IProfile";
import { getScaledImageUri, ImageScale } from "../../../../helpers/image.helpers";

export default function CreateDropPfp({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  return (
    <div className="tw-h-10 tw-w-10 tw-mt-0.5 tw-rounded-lg tw-overflow-hidden tw-bg-iron-800">
      <div className="tw-h-full tw-w-full tw-max-w-full">
        <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center">
          {profile.profile?.pfp_url && (
            <img
              src={getScaledImageUri(
                profile.profile.pfp_url,
                ImageScale.W_AUTO_H_50
              )}
              alt="Create Drop Profile"
              className="tw-bg-iron-900 tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
}
