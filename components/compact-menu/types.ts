import type { ReactNode } from "react";
import type { MenuItemsProps } from "@headlessui/react";

export interface CompactMenuItem {
  readonly id: string;
  readonly label: ReactNode;
  readonly icon?: ReactNode;
  readonly onSelect?: () => void;
  readonly disabled?: boolean;
  readonly className?: string;
  readonly active?: boolean;
  readonly "data-testid"?: string;
  readonly role?: string;
  readonly ariaSelected?: boolean;
  readonly ariaLabel?: string;
}

export interface CompactMenuProps {
  readonly trigger:
    | ReactNode
    | ((context: { isOpen: boolean; close: () => void }) => ReactNode);
  readonly items: readonly CompactMenuItem[];
  readonly onItemSelect?: (id: string) => void;
  readonly className?: string;
  readonly triggerClassName?: string;
  readonly unstyledTrigger?: boolean;
  readonly menuClassName?: string;
  readonly unstyledMenu?: boolean;
  readonly itemsWrapperClassName?: string;
  readonly itemClassName?: string;
  readonly activeItemClassName?: string;
  readonly inactiveItemClassName?: string;
  readonly focusItemClassName?: string;
  readonly anchor?: MenuItemsProps["anchor"];
  readonly menuWidthClassName?: string;
  readonly disabled?: boolean;
  readonly activeItemId?: string;
  readonly closeOnSelect?: boolean;
  readonly "aria-label"?: string;
  readonly unstyledItems?: boolean;
}
