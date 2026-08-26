import { DialogTitle } from "@headlessui/react";
import clsx from "clsx";
import type { ReactNode, Ref } from "react";
import MobileWrapperDialogBackButton from "./MobileWrapperDialogBackButton";
import MobileWrapperDialogCloseButton from "./MobileWrapperDialogCloseButton";

export default function MobileWrapperDialogHeader({
  title,
  showDesktopCloseButton,
  onClose,
  onBack,
  className,
  titleActions,
  headerActions,
  showHeaderCloseButton,
  showHeaderDivider,
  headerCloseButtonClassName,
  titleClassName,
  titleRef,
  backLabel,
  closeLabel,
}: {
  readonly title: string | undefined;
  readonly showDesktopCloseButton: boolean;
  readonly onClose: () => void;
  readonly onBack?: (() => void) | undefined;
  readonly className?: string | undefined;
  readonly titleActions?: ReactNode;
  readonly headerActions?: ReactNode;
  readonly showHeaderCloseButton?: boolean | undefined;
  readonly showHeaderDivider?: boolean | undefined;
  readonly headerCloseButtonClassName?: string | undefined;
  readonly titleClassName?: string | undefined;
  readonly titleRef: Ref<HTMLElement>;
  readonly backLabel: string;
  readonly closeLabel: string;
}) {
  const hasHeaderDivider = !!onBack || !!showHeaderDivider;

  return (
    <div
      className={clsx(
        "tw-px-4 sm:tw-px-6",
        hasHeaderDivider && "tw-pb-4",
        className
      )}
    >
      <div
        className={clsx(
          "tw-flex tw-items-center tw-justify-between tw-gap-3",
          hasHeaderDivider &&
            "-tw-mx-4 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.06] tw-px-4 tw-pb-4 sm:-tw-mx-6 sm:tw-px-6"
        )}
      >
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-3">
          {onBack && (
            <MobileWrapperDialogBackButton onClick={onBack} label={backLabel} />
          )}
          <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-3">
            {title && (
              <DialogTitle
                ref={titleRef}
                tabIndex={-1}
                className={clsx(
                  "tw-m-0 tw-text-base tw-font-semibold tw-text-iron-50 focus:tw-outline-none",
                  titleClassName
                )}
              >
                {title}
              </DialogTitle>
            )}
            {titleActions !== undefined && titleActions !== null && (
              <div className="tw-flex tw-shrink-0 tw-items-center">
                {titleActions}
              </div>
            )}
          </div>
        </div>
        {showDesktopCloseButton && (
          <MobileWrapperDialogCloseButton
            onClick={onClose}
            label={closeLabel}
            className={clsx(
              "tw-hidden md:tw-inline-flex",
              headerCloseButtonClassName
            )}
          />
        )}
        {showHeaderCloseButton && (
          <MobileWrapperDialogCloseButton
            onClick={onClose}
            label={closeLabel}
            className={clsx("tw-inline-flex", headerCloseButtonClassName)}
          />
        )}
      </div>
      {headerActions !== undefined && headerActions !== null && (
        <div
          className={clsx(
            "tw-flex tw-items-center",
            hasHeaderDivider ? "tw-pt-4" : "tw-mt-2"
          )}
        >
          {headerActions}
        </div>
      )}
    </div>
  );
}
