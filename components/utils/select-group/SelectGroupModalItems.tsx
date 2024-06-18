import { GroupFull } from "../../../generated/models/GroupFull";

export default function SelectGroupModalItems({
  groups,
  onGroupSelect,
}: {
  readonly groups: GroupFull[];
  readonly onGroupSelect: (group: GroupFull) => void;
}) {
  return (
    <ul className="tw-list-none tw-pl-0 tw-gap-y-4 tw-flex tw-flex-col">
      {groups.map((group) => (
        <li
          key={group.id}
          className="tw-bg-iron-950 tw-rounded-lg tw-w-full tw-text-left tw-border tw-border-solid  tw-divide-y tw-divide-x-0 tw-divide-solid tw-divide-iron-700  tw-transition tw-duration-300 tw-ease-out  tw-border-iron-600 hover:tw-border-primary-300 tw-cursor-pointer"
          onClick={() => onGroupSelect(group)}
        >
          <p className="tw-text-sm tw-font-normal tw-mb-0 tw-truncate tw-px-4 tw-py-2.5">
            <span className="tw-text-iron-400 tw-pr-1.5">Name:</span>
            <span>{group.name}</span>
          </p>
          <div className="tw-w-full tw-inline-flex tw-px-4 tw-py-2 tw-gap-x-2 tw-items-center">
            <span className="tw-whitespace-nowrap tw-text-xs tw-font-normal tw-text-iron-400 tw-mb-0">
              Created by
            </span>
            <div className="tw-flex tw-gap-x-2 tw-items-center">
              <div className="tw-h-6 tw-w-6 tw-rounded-md tw-overflow-hidden tw-ring-1 tw-ring-white/10 tw-bg-iron-900">
                <div className="tw-h-full tw-w-full tw-max-w-full">
                  <div className="tw-h-full tw-text-center tw-flex tw-items-center tw-justify-center">
                    <img
                      src=""
                      alt=""
                      className="tw-bg-transparent tw-max-w-full tw-max-h-full tw-h-auto tw-w-auto tw-mx-auto tw-object-contain"
                    />
                  </div>
                </div>
              </div>
              <span className="tw-text-iron-50 tw-text-sm tw-font-medium">
                {group.created_by?.handle}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
