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
    <div className="tw-inline-flex">
      <div className="tw-text-base tw-font-normal tw-text-iron-400">
        <p className="tw-mb-0 tw-space-x-1 tw-whitespace-nowrap">
          <span className="tw-text-iron-300 tw-font-medium">
            {profileProxyAction.credit_amount}
          </span>
        </p>
      </div>
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
