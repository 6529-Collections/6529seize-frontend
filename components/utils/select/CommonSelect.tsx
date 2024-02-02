import { createBreakpoint } from "react-use";
import { SortDirection } from "../../../entities/ISort";
import CommonTabs from "./tabs/CommonTabs";
import CommonDropdown from "./dropdown/CommonDropdown";
import { RefObject } from "react";

export interface CommonSelectItem<T> {
  readonly label: string;
  readonly mobileLabel?: string;
  readonly value: T;
  readonly key: string;
}

export interface CommonSelectDefaultProps<T> {
  readonly items: CommonSelectItem<T>[];
  readonly activeItem: T;
  readonly filterLabel: string;
  readonly noneLabel?: string;
  readonly containerRef?: RefObject<HTMLDivElement>; // this is useful if you have horizontal scrolling and want to keep the dropdown in attached to its trigger
  readonly setSelected: (item: T) => void;
}

export interface CommonSelectsWithSortProps<T>
  extends CommonSelectDefaultProps<T> {
  readonly sortDirection: SortDirection;
}

export interface CommonSelectItemProps<T> {
  readonly item: CommonSelectItem<T>;
  readonly activeItem: T;
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly setSelected: (item: T) => void;
  readonly sortDirection?: SortDirection;
}

export type CommonSelectProps<T> =
  | CommonSelectDefaultProps<T>
  | CommonSelectsWithSortProps<T>;

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

export default function CommonSelect<T>(props: CommonSelectProps<T>) {
  const breakpoint = useBreakpoint();
  if (breakpoint === "LG") {
    return <CommonTabs {...props} />;
  } else {
    return <CommonDropdown {...props} />;
  }
}
