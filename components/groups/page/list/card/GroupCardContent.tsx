import { GroupFull } from "../../../../../generated/models/GroupFull";
import GroupCardConfigs from "./GroupCardConfigs";

export default function GroupCardContent({
  group,
}: {
  readonly group: GroupFull;
}) {
  return (
    <div className="tw-flex-1 tw-px-4 sm:tw-px-5">
      <div className="tw-flex tw-items-center tw-gap-x-3 tw-justify-between">
        <p
          title={group.name}
          className="tw-mb-0 tw-text-xl tw-text-iron-50 tw-font-semibold tw-whitespace-nowrap tw-overflow-hidden tw-text-overflow-ellipsis tw-truncate"
        >
          {group.name}
        </p>
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <button className="tw-whitespace-nowrap tw-inline-flex tw-items-center tw-bg-iron-800 tw-border tw-border-solid tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out">
            Rep all
          </button>
          <button
            type="button"
            className="tw-whitespace-nowrap tw-inline-flex tw-items-center tw-bg-iron-800 tw-border tw-border-solid tw-rounded-lg tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out"
          >
            CIC all
          </button>
        </div>
      </div>
      <GroupCardConfigs group={group} />
    </div>
  );
}
