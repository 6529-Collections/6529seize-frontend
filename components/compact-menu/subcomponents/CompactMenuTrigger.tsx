import { MenuButton } from "@headlessui/react";
import clsx from "clsx";
import { Fragment } from "react";
import type { CompactMenuProps } from "../types";
import { DEFAULT_TRIGGER_CLASSES } from "../constants";

interface CompactMenuTriggerProps {
  readonly trigger: CompactMenuProps["trigger"];
  readonly triggerClassName?: string | undefined;
  readonly triggerAsChild?: boolean | undefined;
  readonly unstyledTrigger?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  readonly ariaLabel?: string | undefined;
  readonly isOpen: boolean;
  readonly close: () => void;
}

export function CompactMenuTrigger({
  trigger,
  triggerClassName,
  triggerAsChild = false,
  unstyledTrigger = false,
  disabled = false,
  ariaLabel,
  isOpen,
  close,
}: CompactMenuTriggerProps) {
  const renderTrigger = () => {
    if (typeof trigger === "function") {
      return trigger({ isOpen, close });
    }

    return trigger;
  };

  if (triggerAsChild) {
    return (
      <MenuButton
        as={Fragment}
        aria-label={ariaLabel}
        disabled={disabled}
      >
        {renderTrigger()}
      </MenuButton>
    );
  }

  return (
    <MenuButton
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      className={clsx(
        unstyledTrigger ? undefined : DEFAULT_TRIGGER_CLASSES,
        triggerClassName
      )}
    >
      {renderTrigger()}
    </MenuButton>
  );
}
