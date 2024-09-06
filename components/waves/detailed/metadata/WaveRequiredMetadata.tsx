import { useContext, useEffect, useState } from "react";
import { Wave } from "../../../../generated/models/Wave";
import WaveRequiredMetadataAdd from "./WaveRequiredMetadataAdd";
import WaveRequiredMetadatItems from "./WaveRequiredMetadataItems";
import { AuthContext } from "../../../auth/Auth";

export default function WaveRequiredMetadata({
  wave,
}: {
  readonly wave: Wave;
}) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const getShowEdit = () => {
    if (!connectedProfile?.profile?.handle) {
      return false;
    }
    if (!!activeProfileProxy) {
      return false;
    }
    if (wave.author.handle === connectedProfile.profile.handle) {
      return true;
    }
    if (!!wave.wave.authenticated_user_eligible_for_admin) {
      return true;
    }
    return false;
  };

  const [showEdit, setShowEdit] = useState(getShowEdit());
  useEffect(() => setShowEdit(getShowEdit()), [connectedProfile, wave]);
  return (
    <div className="tw-w-full">
      <div className="tw-bg-iron-900 tw-relative tw-ring-1 tw-ring-inset tw-ring-iron-800 tw-rounded-xl">
        <div className="tw-space-y-4 tw-divide-y tw-divide-solid tw-divide-x-0 tw-divide-iron-700">
          <div className="tw-px-6 tw-pt-4 tw-flex tw-justify-between tw-items-start tw-gap-x-6">
            <p className="tw-mb-0 tw-text-lg tw-text-white tw-font-semibold tw-tracking-tight">
              Required Metadata
            </p>
          </div>
          <div className="tw-px-6 tw-pt-6 tw-pb-4 tw-flex tw-flex-col">
            <WaveRequiredMetadatItems wave={wave} />
            {showEdit && <WaveRequiredMetadataAdd wave={wave} />}
          </div>
        </div>
      </div>
    </div>
  );
}
