import PencilIcon from "../../../../../../utils/icons/PencilIcon";
import { ProfileProxyAction } from "../../../../../../../generated/models/ProfileProxyAction";

export default function ProfileProxyCreditView({
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
      Credit: {profileProxyAction.action_data.credit_amount}{" "}
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
