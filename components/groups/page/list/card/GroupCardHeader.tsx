import Link from "next/link";
import { GroupFull } from "../../../../../generated/models/GroupFull";
import { getTimeAgo } from "../../../../../helpers/Helpers";
import { useContext} from "react";
import { AuthContext } from "../../../../auth/Auth";
import GroupCardEditActions from "./actions/GroupCardEditActions";

export default function GroupCardHeader({
  group,
  onEditClick,
}: {
  readonly group: GroupFull;
  readonly onEditClick: (group: GroupFull) => void;
}) {
  const { connectedProfile } = useContext(AuthContext);
  const timeAgo = getTimeAgo(new Date(group.created_at).getTime());

  return (
    <div className="tw-px-4 sm:tw-px-5 tw-flex tw-gap-x-3">
      <div className="tw-mt-2 tw-flex tw-gap-x-4">
        {group.created_by.pfp ? (
          <img
            className="tw-flex-shrink-0 tw-object-contain tw-h-8 tw-w-8 tw-rounded-md tw-bg-iron-700 tw-ring-2 tw-ring-iron-900"
            src={group.created_by.pfp}
            alt="Profile Picture"
          />
        ) : (
          <div className="tw-h-8 tw-w-8 tw-rounded-md tw-bg-iron-700 tw-ring-2 tw-ring-iron-900"></div>
        )}
      </div>
      <div className="tw-mt-2 tw-flex tw-items-center tw-w-full tw-justify-between">
        <Link
          onClick={(e) => e.stopPropagation()}
          href={group.created_by.handle}
          className="tw-no-underline hover:tw-underline tw-transition tw-duration-300 tw-ease-out"
        >
          <span className="tw-text-sm tw-font-semibold tw-text-iron-50">
            {group.created_by.handle}
          </span>
        </Link>
        <div className="tw-flex tw-items-center tw-gap-x-4">
          <span className="tw-text-sm tw-text-iron-400 tw-font-normal">
            {timeAgo}
          </span>
          {!!connectedProfile?.profile?.handle && (
            <GroupCardEditActions group={group} onEditClick={onEditClick} />
          )}
        </div>
      </div>
    </div>
  );
}
