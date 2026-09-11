import type { ProfileActivityLogType } from "@/types/enums";
import ProfileActivityLogsFilterListItem from "./ProfileActivityLogsFilterListItem";

export default function UserPageIdentityActivityLogFilterList({
  id,
  selected,
  options,
  setSelected,
}: {
  readonly id: string;
  readonly selected: ProfileActivityLogType[];
  readonly options: ProfileActivityLogType[];
  readonly setSelected: (selected: ProfileActivityLogType) => void;
}) {
  return (
    <div className="tw-absolute tw-right-0 tw-z-20 tw-mt-2 tw-w-full tw-min-w-[16rem] tw-origin-top-right">
      <ul
        id={id}
        aria-label="Activity types"
        className="tw-m-0 tw-flex tw-max-h-[min(24rem,calc(100svh-27rem))] tw-w-full tw-list-none tw-flex-col tw-gap-1 tw-overflow-y-auto tw-overflow-x-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/95 tw-p-2 tw-text-sm tw-text-iron-200 tw-shadow-2xl tw-shadow-black/50 tw-backdrop-blur-xl tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700 focus:tw-outline-none desktop-hover:hover:tw-scrollbar-thumb-iron-500"
      >
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
