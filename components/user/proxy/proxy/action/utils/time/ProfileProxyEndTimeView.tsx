import { ProfileProxyAction } from "../../../../../../../generated/models/ProfileProxyAction";
import { getTimeAgo, getTimeUntil } from "../../../../../../../helpers/Helpers";
import PencilIcon, {
  PencilIconSize,
} from "../../../../../../utils/icons/PencilIcon";

export default function ProfileProxyEndTimeView({
  profileProxyAction,
  isOwner,
  setEditMode,
}: {
  readonly profileProxyAction: ProfileProxyAction;
  readonly isOwner: boolean;
  readonly setEditMode: () => void;
}) {
  const onEditMode = () => {
    if (isOwner) {
      setEditMode();
    }
  };
  return (
    <div className="tw-flex tw-items-center">
      <span className="tw-whitespace-nowrap tw-text-iron-300 tw-text-md tw-font-normal">
        {profileProxyAction.end_time
          ? getTimeUntil(profileProxyAction.end_time)
          : "Not set"}
      </span>
      {isOwner && (
        <button
          type="button"
          className="tw-group tw-bg-transparent tw-border-0 tw-h-8 tw-w-8 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-text-iron-300 hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out"
          onClick={onEditMode}
        >
          <PencilIcon size={PencilIconSize.SMALL} />
        </button>
      )}
    </div>
  );
}
