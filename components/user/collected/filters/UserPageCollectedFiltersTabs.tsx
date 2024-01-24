import { SortDirection } from "../../../../entities/ISort";
import UserPageCollectedFiltersTab from "./UserPageCollectedFiltersTab";

export interface UserPageCollectedFiltersTabsItem<T> {
  readonly label: string;
  readonly value: T;
  readonly key: string;
}

export default function UserPageCollectedFiltersTabs<T, U extends boolean>({
  tabs,
  activeTab,
  sortable,
  sortDirection,
  setSelected,
}: {
  readonly tabs: UserPageCollectedFiltersTabsItem<T>[];
  readonly activeTab: T;
  readonly sortable: U;
  readonly sortDirection?: U extends true ? SortDirection : undefined;
  readonly setSelected: (tab: T) => void;
}) {
  return (
    <div className="tw-inline-flex tw-rounded-lg tw-overflow-hidden">
      {Object.values(tabs).map((tab, i) => (
        <UserPageCollectedFiltersTab
          key={tab.key}
          tab={tab}
          isFirst={i === 0}
          isLast={i === tabs.length - 1}
          activeTab={activeTab}
          setSelected={setSelected}
        />
      ))}
    </div>
  );
}
