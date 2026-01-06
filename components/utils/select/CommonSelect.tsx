import type { SortDirection } from "@/entities/ISort";
import type { RefObject } from "react";
import { createBreakpoint } from "react-use";
import CommonDropdown from "./dropdown/CommonDropdown";
import CommonTabs from "./tabs/CommonTabs";

interface ChildComponentProps {
  onCopy?: (() => void) | undefined;
}

export interface CommonSelectItem<T, U = unknown> {
  readonly label: string;
  readonly mobileLabel?: string | undefined;
  readonly value: T;
  readonly key: string;
  readonly childrenProps?: U | undefined;
  readonly badge?: number | undefined;
}

interface CommonSelectDefaultProps<T, U> {
  readonly items: readonly CommonSelectItem<T, U>[];
  readonly activeItem: T;
  readonly filterLabel: string;
  readonly noneLabel?: string | undefined;
  readonly dynamicPosition?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  readonly theme?: "dark" | "light" | undefined;
  readonly size?: "sm" | "md" | "tabs" | undefined;
  readonly containerRef?: RefObject<HTMLDivElement | null> | undefined; // this is useful if you have horizontal scrolling and want to keep the dropdown in attached to its trigger
  readonly setSelected: (item: T) => void;
  readonly renderItemChildren?: (
    item: CommonSelectItem<T, U>
  ) => React.ReactElement<ChildComponentProps> | undefined;
  readonly closeOnSelect?: boolean | undefined;
  readonly fill?: boolean | undefined;
  readonly showFilterLabel?: boolean | undefined;
}

interface CommonSelectsWithSortProps<T, U>
  extends CommonSelectDefaultProps<T, U> {
  readonly sortDirection: SortDirection;
}

export interface CommonSelectItemProps<T, U> {
  readonly item: CommonSelectItem<T, U>;
  readonly activeItem: T;
  readonly itemIdx: number;
  readonly totalItems: number;
  readonly isMobile: boolean;
  readonly setSelected: (item: T) => void;
  readonly sortDirection?: SortDirection | undefined;
  readonly children?: React.ReactElement<ChildComponentProps> | undefined;
}

export type CommonSelectProps<T, U> =
  | CommonSelectDefaultProps<T, U>
  | CommonSelectsWithSortProps<T, U>;

const useBreakpoint = createBreakpoint({ LG: 1024, S: 0 });

export default function CommonSelect<T, U = unknown>(
  props: CommonSelectProps<T, U>
) {
  const breakpoint = useBreakpoint();
  if (breakpoint === "LG") {
    return <CommonTabs {...props} />;
  } else {
    return <CommonDropdown {...props} />;
  }
}
