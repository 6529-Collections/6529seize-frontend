import { cloneElement, isValidElement } from "react";
import type { ReactElement } from "react";
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
  const renderTrigger = () => {
    if (typeof trigger === "function") {
      return trigger({ isOpen, close });
    }

    if (isCustomTriggerElement(trigger)) {
      return cloneElement(trigger, { isOpen, close });
    }

    return trigger;
  };

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
      {renderTrigger()}
    </MenuButton>
  );
}

type TriggerRenderProps = { isOpen: boolean; close: () => void };

const isCustomTriggerElement = (
  element: CompactMenuProps["trigger"],
): element is ReactElement<TriggerRenderProps> =>
  isValidElement(element) && typeof element.type !== "string";
