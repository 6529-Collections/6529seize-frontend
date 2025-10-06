import { createBreakpoint } from "react-use";
import { SortDirection } from "@/entities/ISort";
import CommonTabs from "./tabs/CommonTabs";
import CommonDropdown from "./dropdown/CommonDropdown";
import { RefObject } from "react";

interface ChildComponentProps {
  onCopy?: () => void;
}

export interface CommonSelectItem<T, U = unknown> {
  readonly label: string;
  readonly mobileLabel?: string;
  readonly value: T;
  readonly key: string;
  readonly childrenProps?: U;
}

interface CommonSelectDefaultProps<T, U> {
  readonly items: CommonSelectItem<T, U>[];
  readonly activeItem: T;
  readonly filterLabel: string;
  readonly noneLabel?: string;
  readonly dynamicPosition?: boolean;
  readonly disabled?: boolean;
  readonly theme?: "dark" | "light";
  readonly size?: "sm" | "md";
  readonly containerRef?: RefObject<HTMLDivElement | null>; // this is useful if you have horizontal scrolling and want to keep the dropdown in attached to its trigger
  readonly setSelected: (item: T) => void;
  readonly renderItemChildren?: (
    item: CommonSelectItem<T, U>
  ) => React.ReactElement<ChildComponentProps>;
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
  readonly sortDirection?: SortDirection;
  readonly children?: React.ReactElement<ChildComponentProps>;
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
