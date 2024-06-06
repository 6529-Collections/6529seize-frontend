import { GroupFull } from "../../../../../generated/models/GroupFull";
import GroupCardConfigs from "./GroupCardConfigs";

export default function GroupCardContent({
  group,
}: {
  readonly group: GroupFull;
}) {
  return (
    <div className="tw-px-4 sm:tw-px-6 tw-flex tw-justify-between tw-items-start tw-gap-x-6">
      <div>
        <p className="tw-mb-0 tw-text-xl tw-text-iron-50 tw-font-semibold">
          {group.name}
        </p>
        <GroupCardConfigs group={group} />
      </div>
    </div>
  );
}
