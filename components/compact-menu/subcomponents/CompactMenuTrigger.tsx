import { MenuButton } from "@headlessui/react";
import clsx from "clsx";
import type { CompactMenuProps } from "../types";
import { DEFAULT_TRIGGER_CLASSES } from "../constants";

interface CompactMenuTriggerProps {
  readonly trigger: CompactMenuProps["trigger"];
  readonly triggerClassName?: string;
  readonly unstyledTrigger?: boolean;
  readonly disabled?: boolean;
  readonly ariaLabel?: string;
  readonly isOpen: boolean;
  readonly close: () => void;
}

export function CompactMenuTrigger({
  trigger,
  triggerClassName,
  unstyledTrigger = false,
  disabled = false,
  ariaLabel,
  isOpen,
  close,
}: CompactMenuTriggerProps) {
  return (
    <MenuButton
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      className={clsx(
        unstyledTrigger ? undefined : DEFAULT_TRIGGER_CLASSES,
        triggerClassName,
      )}
    >
      {typeof trigger === "function" ? trigger({ isOpen, close }) : trigger}
    </MenuButton>
  );
}
