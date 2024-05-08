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
    <div>
      end time: {profileProxyAction.end_time}
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
