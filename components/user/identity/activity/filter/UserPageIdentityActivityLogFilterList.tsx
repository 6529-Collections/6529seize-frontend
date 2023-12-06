
import { ProfileActivityLogType } from "../../../../../entities/IProfile";
import UserPageIdentityActivityLogFilterListItem from "./UserPageIdentityActivityLogFilterListItem";

export default function UserPageIdentityActivityLogFilterList({
  selected,
  setSelected,
}: {
  selected: ProfileActivityLogType[];
  setSelected: (selected: ProfileActivityLogType) => void;
}) {
  return (
    <div className="tw-origin-top-right tw-absolute tw-right-0 tw-mt-1 tw-w-full tw-rounded-lg tw-shadow-xl tw-bg-neutral-800 tw-ring-1 tw-ring-black tw-ring-opacity-5">
      <ul className="tw-absolute tw-z-10 tw-pl-1.5 tw-pr-1.5 tw-list-none tw-mt-1 tw-w-full tw-overflow-auto tw-rounded-lg tw-bg-neutral-800 tw-py-2 tw-text-base tw-shadow-xl tw-ring-1 tw-ring-inset tw-ring-white/10 focus:tw-outline-none sm:tw-text-sm">
        {Object.values(ProfileActivityLogType).map((itemType) => (
          <UserPageIdentityActivityLogFilterListItem
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
