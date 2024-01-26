import { useEffect, useState } from "react";
import { UserPageCollectedFiltersTabsItem } from "./UserPageCollectedFiltersTabs";
import CommonTableSortIcon from "../../utils/icons/CommonTableSortIcon";
import { SortDirection } from "../../../../entities/ISort";

export default function UserPageCollectedFiltersTab<T>({
  tab,
  activeTab,
  isFirst,
  isLast,
  setSelected,
  sortDirection,
}: {
  readonly tab: UserPageCollectedFiltersTabsItem<T>;
  readonly activeTab: T;
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly setSelected: (tab: T) => void;
  readonly sortDirection?: SortDirection;
}) {
  const getIsActive = (): boolean => tab.value === activeTab;

  const [isActive, setIsActive] = useState<boolean>(getIsActive());

  useEffect(() => {
    setIsActive(getIsActive());
  }, [activeTab]);

  const getDynamicClasses = (): string => {
    let response = "";
    if (isActive) {
      response += " tw-bg-iron-800 tw-text-iron-100";
    } else {
      response +=
        " tw-bg-iron-950 hover:tw-bg-iron-900 tw-text-iron-500 hover:tw-text-iron-100";
    }

    if (isFirst) {
      response += " tw-rounded-l-lg";
    } else if (isLast) {
      response += " tw-rounded-r-lg";
    }
    return response;
  };

  const [dynamicClasses, setDynamicClasses] = useState<string>(
    getDynamicClasses()
  );
  useEffect(() => {
    setDynamicClasses(getDynamicClasses());
  }, [isActive, isFirst, isLast]);

  return (
    <button
      type="button"
      onClick={() => setSelected(tab.value)}
      className={`${dynamicClasses} tw-whitespace-nowrap tw-flex-1 sm:tw-flex-none tw-px-4 tw-py-2 tw-text-base sm:tw-text-sm tw-font-semibold tw-border tw-border-solid tw-border-iron-700 tw-transition tw-duration-300 tw-ease-out`}
    >
      {tab.label}
      {sortDirection && (
        <CommonTableSortIcon
          direction={isActive ? sortDirection : SortDirection.DESC}
          isActive={isActive}
        />
      )}
    </button>
  );
}
