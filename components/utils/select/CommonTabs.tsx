import { SortDirection } from "../../../entities/ISort";

export interface CommonTabItem<T> {
  readonly label: string;
  readonly value: T;
  readonly key: string;
}

export interface CommonTabsDefaultProps<T> {
  readonly tabs: CommonTabItem<T>[];
  readonly activeTab: T;
  readonly setSelected: (tab: T) => void;
}

export interface CommonTabsWithSortProps<T> extends CommonTabsDefaultProps<T> {
  readonly sortDirection: SortDirection;
}

export type CommonTabsProps<T> =
  | CommonTabsDefaultProps<T>
  | CommonTabsWithSortProps<T>;

export default function CommonTabs<T>(props: CommonTabsProps<T>) {
  return <div></div>;
}
