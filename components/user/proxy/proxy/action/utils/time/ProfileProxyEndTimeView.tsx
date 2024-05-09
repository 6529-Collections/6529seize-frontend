import { ProfileProxyAction } from "../../../../../../../generated/models/ProfileProxyAction";
import PencilIcon from "../../../../../../utils/icons/PencilIcon";

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
    <div className="tw-flex">
      <p className="tw-flex tw-items-center tw-mb-0 tw-gap-x-2 tw-text-base tw-font-normal tw-leading-6 tw-text-iron-500">
        {profileProxyAction.end_time}
      </p>
      {isOwner && (
        <button
          type="button"
          className="tw-bg-transparent tw-border-0 tw-p-0 tw-rounded-full tw-text-iron-300 hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out"
          onClick={onEditMode}
        >
          <PencilIcon />
        </button>
      )}
    </div>
  );
}
