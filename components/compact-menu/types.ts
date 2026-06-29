import type { ReactNode } from "react";
import type { MenuItemsProps } from "@headlessui/react";

export interface CompactMenuActionItem {
  readonly id: string;
  readonly kind?: "item" | undefined;
  readonly label: ReactNode;
  readonly icon?: ReactNode | undefined;
  readonly href?: string | undefined;
  readonly onSelect?: (() => void) | undefined;
  readonly disabled?: boolean | undefined;
  readonly className?: string | undefined;
  readonly active?: boolean | undefined;
  readonly "data-testid"?: string | undefined;
  readonly role?: string | undefined;
  readonly ariaSelected?: boolean | undefined;
  readonly ariaLabel?: string | undefined;
}

export interface CompactMenuSectionItem {
  readonly id: string;
  readonly kind: "section";
  readonly label: ReactNode;
  readonly className?: string | undefined;
}

export type CompactMenuItem = CompactMenuActionItem | CompactMenuSectionItem;

export interface CompactMenuProps {
  readonly trigger:
    | ReactNode
    | ((context: { isOpen: boolean; close: () => void }) => ReactNode);
  readonly items: readonly CompactMenuItem[];
  readonly onItemSelect?: ((id: string) => void) | undefined;
  readonly className?: string | undefined;
  readonly triggerClassName?: string | undefined;
  readonly unstyledTrigger?: boolean | undefined;
  readonly menuClassName?: string | undefined;
  readonly unstyledMenu?: boolean | undefined;
  readonly header?: ReactNode | undefined;
  readonly headerClassName?: string | undefined;
  readonly itemsWrapperClassName?: string | undefined;
  readonly itemClassName?: string | undefined;
  readonly activeItemClassName?: string | undefined;
  readonly inactiveItemClassName?: string | undefined;
  readonly focusItemClassName?: string | undefined;
  readonly anchor?: MenuItemsProps["anchor"] | undefined;
  readonly menuWidthClassName?: string | undefined;
  readonly disabled?: boolean | undefined;
  readonly activeItemId?: string | undefined;
  readonly closeOnSelect?: boolean | undefined;
  readonly "aria-label"?: string | undefined;
  readonly unstyledItems?: boolean | undefined;
}
