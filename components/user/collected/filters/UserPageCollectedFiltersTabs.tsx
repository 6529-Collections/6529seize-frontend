import { SortDirection } from "../../../../entities/ISort";
import UserPageCollectedFiltersTab from "./UserPageCollectedFiltersTab";

export interface UserPageCollectedFiltersTabsItem<T> {
  readonly label: string;
  readonly value: T;
  readonly key: string;
}

export interface UserPageCollectedFiltersTabsDefaultProps<T> {
  readonly tabs: UserPageCollectedFiltersTabsItem<T>[];
  readonly activeTab: T;
  readonly setSelected: (tab: T) => void;
}

export interface UserPageCollectedFiltersTabsWithSortProps<T>
  extends UserPageCollectedFiltersTabsDefaultProps<T> {
  readonly sortDirection: SortDirection;
}

export type UserPageCollectedFiltersTabsProps<T> =
  | UserPageCollectedFiltersTabsDefaultProps<T>
  | UserPageCollectedFiltersTabsWithSortProps<T>;

export default function UserPageCollectedFiltersTabs<T>(
  props: UserPageCollectedFiltersTabsProps<T>
) {
  const { tabs, activeTab, setSelected } = props;

  return (
    <div className="tw-inline-flex tw-rounded-lg tw-overflow-hidden tw-w-full sm:tw-w-auto">
      {Object.values(tabs).map((tab, i) => (
        <UserPageCollectedFiltersTab
          key={tab.key}
          tab={tab}
          isFirst={i === 0}
          isLast={i === tabs.length - 1}
          activeTab={activeTab}
          sortDirection={
            "sortDirection" in props ? props.sortDirection : undefined
          }
          setSelected={setSelected}
        />
      ))}
    </div>
  );
}
