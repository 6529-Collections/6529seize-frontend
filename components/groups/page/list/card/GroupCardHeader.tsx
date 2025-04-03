import Link from "next/link";
import { ApiGroupFull } from "../../../../../generated/models/ApiGroupFull";
import { getTimeAgo } from "../../../../../helpers/Helpers";
import { useContext } from "react";
import { AuthContext } from "../../../../auth/Auth";
import GroupCardEditActions from "./actions/GroupCardEditActions";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../../helpers/image.helpers";

export default function GroupCardHeader({
  group,
  onEditClick,
  userPlaceholder,
}: {
  readonly group?: ApiGroupFull;
  readonly onEditClick?: (group: ApiGroupFull) => void;
  readonly userPlaceholder?: string;
}) {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const timeAgo = group
    ? getTimeAgo(new Date(group.created_at ?? "").getTime())
    : "";

  return (
    <div className="tw-px-4 sm:tw-px-5 tw-flex tw-items-center tw-gap-x-3">
      <div className="-tw-mt-3 tw-flex tw-gap-x-4">
        {group?.created_by.pfp ? (
          <img
            className="tw-flex-shrink-0 tw-object-contain tw-h-9 tw-w-9 tw-rounded-md tw-bg-iron-700 tw-ring-1 tw-ring-iron-700"
            src={getScaledImageUri(
              group.created_by.pfp,
              ImageScale.W_AUTO_H_50
            )}
            alt="Profile Picture"
          />
        ) : (
          <div className="tw-h-9 tw-w-9 tw-rounded-md tw-bg-iron-700 tw-ring-1 tw-ring-iron-700"></div>
        )}
      </div>
      <div className="tw-mt-1.5 tw-flex tw-items-center tw-w-full tw-justify-between">
        <Link
          onClick={(e) => e.stopPropagation()}
          href={
            group
              ? `/${group?.created_by.handle ?? userPlaceholder}`
              : userPlaceholder ?? ""
          }
          className="tw-no-underline hover:tw-underline tw-transition tw-duration-300 tw-ease-out  tw-text-iron-50 hover:tw-text-iron-400">
          <span className="tw-text-sm tw-font-semibold">
            {group?.created_by.handle ?? userPlaceholder}
          </span>
        </Link>
        <div className="tw-flex tw-items-center tw-gap-x-4">
          <span className="tw-text-sm tw-text-iron-500 tw-font-normal">
            {timeAgo}
          </span>
          {!!connectedProfile?.profile?.handle &&
            !activeProfileProxy &&
            onEditClick &&
            group && (
              <GroupCardEditActions group={group} onEditClick={onEditClick} />
            )}
        </div>
      </div>
    </div>
  );
}
