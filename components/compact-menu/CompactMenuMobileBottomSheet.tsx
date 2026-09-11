"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import clsx from "clsx";
import type { ReactNode } from "react";
import { useRef, useState } from "react";
import type { CompactMenuItem } from "./types";

interface MobileBottomSheetTriggerProps {
  readonly ariaLabel: string;
  readonly ariaExpanded: boolean;
  readonly disabled: boolean;
  readonly onClick: () => void;
}

interface CompactMenuMobileBottomSheetProps {
  readonly title: string;
  readonly ariaLabel: string;
  readonly items: readonly CompactMenuItem[];
  readonly trigger: ReactNode;
  readonly triggerClassName?: string | undefined;
  readonly renderTriggerButton?:
    | ((props: MobileBottomSheetTriggerProps) => ReactNode)
    | undefined;
  readonly disabled?: boolean | undefined;
  readonly zIndexClassName?: string | undefined;
}

export default function CompactMenuMobileBottomSheet({
  title,
  ariaLabel,
  items,
  trigger,
  triggerClassName,
  renderTriggerButton,
  disabled = false,
  zIndexClassName = "tw-z-[1020]",
}: CompactMenuMobileBottomSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  const close = () => {
    pendingActionRef.current = null;
    setIsOpen(false);
  };

  const selectAction = (onSelect: (() => void) | undefined) => {
    pendingActionRef.current = onSelect ?? null;
    setIsOpen(false);
  };

  const runPendingAction = () => {
    const pendingAction = pendingActionRef.current;
    pendingActionRef.current = null;
    pendingAction?.();
  };

  return (
    <>
      {renderTriggerButton ? (
        renderTriggerButton({
          ariaLabel,
          ariaExpanded: isOpen,
          disabled,
          onClick: () => setIsOpen(true),
        })
      ) : (
        <button
          type="button"
          className={triggerClassName}
          aria-label={ariaLabel}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          disabled={disabled}
          onClick={() => setIsOpen(true)}
        >
          {trigger}
        </button>
      )}
      <MobileWrapperDialog
        title={title}
        titleClassName="tw-text-lg tw-font-semibold"
        isOpen={isOpen}
        onClose={close}
        onAfterLeave={runPendingAction}
        zIndexClassName={zIndexClassName}
      >
        <div className="tw-flex tw-flex-col tw-px-4 sm:tw-px-6">
          {items.map((item) =>
            item.kind === "section" ? (
              <div
                key={item.id}
                className="tw-mt-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/10 tw-pb-2 tw-pt-5 first:tw-mt-0 first:tw-border-t-0 first:tw-pt-1"
              >
                <span className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500">
                  {item.label}
                </span>
              </div>
            ) : (
              <button
                key={item.id}
                type="button"
                disabled={item.disabled}
                onClick={() => selectAction(item.onSelect)}
                className={clsx(
                  "tw-flex tw-min-h-12 tw-w-full tw-items-center tw-gap-3 tw-rounded-xl tw-border-0 tw-bg-transparent tw-px-0 tw-py-3 tw-text-left tw-text-base tw-font-medium tw-text-iron-200 tw-transition-colors tw-duration-200 active:tw-bg-iron-800 disabled:tw-cursor-not-allowed disabled:tw-opacity-50",
                  item.className
                )}
              >
                {item.icon !== undefined &&
                item.icon !== null &&
                item.icon !== false ? (
                  <span className="tw-flex tw-size-5 tw-flex-none tw-items-center tw-justify-center">
                    {item.icon}
                  </span>
                ) : null}
                <span className="tw-min-w-0 tw-flex-1">{item.label}</span>
              </button>
            )
          )}
        </div>
      </MobileWrapperDialog>
    </>
  );
}
