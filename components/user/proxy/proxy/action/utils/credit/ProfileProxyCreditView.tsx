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
    <div className="tw-flex">
      <p className="tw-flex tw-items-center tw-mb-0 tw-gap-x-2 tw-text-base tw-font-normal tw-leading-6 tw-text-iron-500">
        <span className="tw-text-base tw-font-normal tw-text-iron-500">
          Credit:
        </span>
        <span className="tw-text-iron-300 tw-font-medium">
          {profileProxyAction.credit_amount}
        </span>
      </p>
      {isOwner && (
        <button
          type="button"
          className="tw-group tw-bg-transparent tw-border-0 tw-h-8 tw-w-8 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-text-iron-300 hover:tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out"
          onClick={onEditMode}
        >
          <PencilIcon />
        </button>
      )}
    </div>
  );
}
