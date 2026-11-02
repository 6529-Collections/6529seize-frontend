"use client";

import {
  Description,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { hasContent } from "./hasContent";

interface E2eeDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly description?: ReactNode | undefined;
  readonly closeLabel: string;
  readonly children?: ReactNode | undefined;
  readonly footer?: ReactNode | undefined;
  readonly size?: "sm" | "md" | undefined;
}

/**
 * Modal dialog for encrypted-chat flows. Headless UI traps focus, closes on
 * Escape and returns focus to the trigger when it closes. It eases in with
 * the shared 125 ms sidebar motion, and appears instantly with reduced motion.
 */
export function E2eeDialog({
  open,
  onClose,
  title,
  description,
  closeLabel,
  children,
  footer,
  size = "sm",
}: E2eeDialogProps) {
  const widthClass = size === "md" ? "tw-max-w-xl" : "tw-max-w-md";
  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="tailwind-scope tw-relative tw-z-[1000]"
    >
      <DialogBackdrop className="tw-fixed tw-inset-0 tw-bg-iron-950/80 motion-safe:tw-animate-sidebar-account-fade-in" />
      <div className="tw-fixed tw-inset-0 tw-overflow-y-auto tw-p-4">
        <div className="tw-flex tw-min-h-full tw-items-end tw-justify-center sm:tw-items-center">
          <DialogPanel
            className={`tw-w-full ${widthClass} tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5 tw-shadow-2xl motion-safe:tw-animate-sidebar-control-in`}
          >
            <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
              <DialogTitle className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50">
                {title}
              </DialogTitle>
              <button
                type="button"
                onClick={onClose}
                aria-label={closeLabel}
                className="tw-flex tw-size-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-text-iron-400 hover:tw-bg-iron-800 hover:tw-text-iron-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
              >
                <XMarkIcon aria-hidden="true" className="tw-size-5" />
              </button>
            </div>
            {hasContent(description) ? (
              <Description className="tw-mb-0 tw-mt-2 tw-text-sm tw-leading-6 tw-text-iron-400">
                {description}
              </Description>
            ) : null}
            {hasContent(children) ? (
              <div className="tw-mt-4">{children}</div>
            ) : null}
            {hasContent(footer) ? (
              <div className="tw-mt-5 tw-flex tw-flex-col-reverse tw-gap-3 sm:tw-flex-row sm:tw-justify-end">
                {footer}
              </div>
            ) : null}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
