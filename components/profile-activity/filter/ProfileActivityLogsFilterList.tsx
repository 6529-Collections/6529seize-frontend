import type { ProfileActivityLogType } from "@/types/enums";
import ProfileActivityLogsFilterListItem from "./ProfileActivityLogsFilterListItem";

export default function UserPageIdentityActivityLogFilterList({
  selected,
  options,
  setSelected,
}: {
  readonly selected: ProfileActivityLogType[];
  readonly options: ProfileActivityLogType[];
  readonly setSelected: (selected: ProfileActivityLogType) => void;
}) {
  return (
    <div className="tw-absolute tw-right-0 tw-mt-1 tw-w-full tw-origin-top-right tw-rounded-lg tw-bg-iron-800 tw-shadow-xl tw-ring-1 tw-ring-black tw-ring-opacity-5">
      <ul className="tw-absolute tw-z-10 tw-mt-1 tw-max-h-[calc(20rem+_-10svh)] tw-w-full tw-list-none tw-overflow-auto tw-rounded-lg tw-bg-iron-800 tw-py-2 tw-pl-1.5 tw-pr-1.5 tw-text-base tw-shadow-xl tw-ring-1 tw-ring-inset tw-ring-white/10 focus:tw-outline-none sm:tw-text-sm">
        {options.map((itemType) => (
          <ProfileActivityLogsFilterListItem
            key={itemType}
            itemType={itemType}
            selectedItems={selected}
            setSelected={setSelected}
          />
        ))}
      </ul>
    </div>
  );
}
