import { SortDirection } from "../../../entities/ISort";
import { UserPageCollectedFiltersTabsItem } from "../../user/collected/filters/UserPageCollectedFiltersTabs";

export interface CommonTabsTabProps<T> {
  readonly tab: UserPageCollectedFiltersTabsItem<T>;
  readonly activeTab: T;
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly setSelected: (tab: T) => void;
  readonly sortDirection?: SortDirection;
}

export default function CommonTabsTab() {
  return <div></div>;
}
