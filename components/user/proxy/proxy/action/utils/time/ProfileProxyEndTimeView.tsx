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
    <div className="tw-inline-flex">
      <p className="tw-flex tw-items-center tw-mb-0 tw-gap-x-2 tw-text-base tw-font-normal tw-leading-6 tw-text-iron-500">
        {profileProxyAction.end_time}
      </p>
      {isOwner && (
        <button
          className="tw-bg-transparent tw-border-none"
          onClick={onEditMode}
        >
          <PencilIcon />
        </button>
      )}
    </div>
  );
}
