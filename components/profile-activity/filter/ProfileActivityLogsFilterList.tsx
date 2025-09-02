import { ProfileActivityLogType } from "@/enums";
import ProfileActivityLogsFilterListItem from "./ProfileActivityLogsFilterListItem";

export default function UserPageIdentityActivityLogFilterList({
  selected,
  options,
  setSelected,
  user,
}: {
  readonly selected: ProfileActivityLogType[];
  readonly options: ProfileActivityLogType[];
  readonly setSelected: (selected: ProfileActivityLogType) => void;
  readonly user: string | null;
}) {
  return (
    <div className="tw-origin-top-right tw-absolute tw-right-0 tw-mt-1 tw-w-full tw-rounded-lg tw-shadow-xl tw-bg-iron-800 tw-ring-1 tw-ring-black tw-ring-opacity-5">
      <ul className="tw-max-h-[calc(20rem+_-10svh)] tw-absolute tw-z-10 tw-pl-1.5 tw-pr-1.5 tw-list-none tw-mt-1 tw-w-full tw-overflow-auto tw-rounded-lg tw-bg-iron-800 tw-py-2 tw-text-base tw-shadow-xl tw-ring-1 tw-ring-inset tw-ring-white/10 focus:tw-outline-none sm:tw-text-sm">
        {options.map((itemType) => (
          <ProfileActivityLogsFilterListItem
            key={itemType}
            itemType={itemType}
            selectedItems={selected}
            setSelected={setSelected}
            user={user}
          />
        ))}
      </ul>
    </div>
  );
}
