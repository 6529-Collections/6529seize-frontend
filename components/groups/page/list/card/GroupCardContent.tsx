import { GroupFull } from "../../../../../generated/models/GroupFull";
import GroupCardConfigs from "./GroupCardConfigs";

export default function GroupCardContent({
  group,
}: {
  readonly group: GroupFull;
}) {
  return (
    <div className="tw-flex-1 tw-px-4 sm:tw-px-6">
      <p
        title={group.name}
        className="tw-mb-0 tw-text-xl tw-text-iron-50 tw-font-semibold tw-whitespace-nowrap tw-overflow-hidden tw-text-overflow-ellipsis tw-truncate"
      >
        {group.name}
      </p>
      <GroupCardConfigs group={group} />
    </div>
  );
}
