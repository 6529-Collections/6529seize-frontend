import { GroupFull } from "../../../../../generated/models/GroupFull";

export default function GroupCardConfigs({
  group,
}: {
  readonly group: GroupFull;
}) {
  return (
    <div className="tw-mt-2 tw-overflow-x-hidden">
      <div className="tw-flex tw-items-center tw-gap-x-3 tw-overflow-x-auto horizontal-menu-hide-scrollbar">
        <div className="tw-whitespace-nowrap tw-cursor-default tw-inline-flex tw-items-center tw-gap-x-1 tw-justify-between tw-shadow-sm tw-rounded-lg tw-px-2 tw-py-1.5 tw-text-sm tw-font-normal tw-text-iron-300 tw-bg-iron-700 tw-ring-1 tw-ring-inset tw-ring-iron-700">
          <span>Level</span>
          <span className="tw-font-semibold">100+</span>
        </div>
        <div className="tw-whitespace-nowrap tw-cursor-default tw-inline-flex tw-items-center tw-gap-x-1 tw-justify-between tw-shadow-sm tw-rounded-lg tw-px-2 tw-py-1.5 tw-text-sm tw-font-normal tw-text-iron-300 tw-bg-iron-700 tw-ring-1 tw-ring-inset tw-ring-iron-700">
          <span>Rep</span>
          <span className="tw-font-semibold">from brookr</span>
        </div>
        <div className="tw-whitespace-nowrap tw-cursor-default tw-inline-flex tw-items-center tw-gap-x-1 tw-justify-between tw-shadow-sm tw-rounded-lg tw-px-2 tw-py-1.5 tw-text-sm tw-font-normal tw-text-iron-300 tw-bg-iron-700 tw-ring-1 tw-ring-inset tw-ring-iron-700">
          <span>CIC</span>
          <span className="tw-font-semibold">10+</span>
        </div>
      </div>
    </div>
  );
}
