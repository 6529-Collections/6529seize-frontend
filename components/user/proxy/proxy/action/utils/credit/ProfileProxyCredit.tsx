import { useContext, useEffect, useState } from "react";
import { ProfileProxy } from "../../../../../../../generated/models/ProfileProxy";
import { ProfileProxyAction } from "../../../../../../../generated/models/ProfileProxyAction";
import { AuthContext } from "../../../../../../auth/Auth";
import PencilIcon, {
  PencilIconSize,
} from "../../../../../../utils/icons/PencilIcon";
import { formatNumberWithCommas } from "../../../../../../../helpers/Helpers";

export default function ProfileProxyCredit({
  profileProxy,
  profileProxyAction,
  onCreditEdit,
}: {
  readonly profileProxy: ProfileProxy;
  readonly profileProxyAction: ProfileProxyAction;
  readonly onCreditEdit: () => void;
}) {
  const { connectedProfile } = useContext(AuthContext);
  const getIsOwner = (): boolean => {
    if (!connectedProfile) {
      return false;
    }
    return (
      connectedProfile?.profile?.external_id === profileProxy.created_by.id
    );
  };

  const [isOwner, setIsOwner] = useState(getIsOwner());
  useEffect(() => setIsOwner(getIsOwner()), [connectedProfile, profileProxy]);

  return (
    <div className="tw-flex lg:tw-justify-center tw-items-center">
      <p className="tw-flex tw-items-center tw-mb-0 tw-gap-x-1.5 tw-text-md tw-font-normal tw-text-iron-500">
        <span className="tw-font-normal tw-text-iron-500">Credit:</span>
        <span className="tw-text-iron-300 tw-font-medium">
          {formatNumberWithCommas(profileProxyAction.credit_amount ?? 0)}
        </span>
      </p>
      {isOwner && (
        <button
          type="button"
          className="tw-group tw-bg-transparent tw-border-0 tw-h-7 tw-w-7 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-text-iron-300 hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out"
          onClick={onCreditEdit}
        >
          <PencilIcon size={PencilIconSize.SMALL} />
        </button>
      )}
    </div>
  );
}
