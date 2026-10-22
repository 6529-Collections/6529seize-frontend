"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import type { ReactNode } from "react";

export default function CommonDropdownItemsMobileWrapper({
  isOpen,
  setOpen,
  label,
  hideOnDesktopHover = true,
  compactContent = false,
  menu = false,
  zIndexClassName = "tw-z-[1000]",
  onAfterLeave,
  children,
}: {
  readonly isOpen: boolean;
  readonly setOpen: (isOpen: boolean) => void;
  readonly label?: string | undefined;
  readonly hideOnDesktopHover?: boolean | undefined;
  readonly compactContent?: boolean | undefined;
  readonly menu?: boolean | undefined;
  readonly zIndexClassName?: string | undefined;
  readonly onAfterLeave?: (() => void) | undefined;
  readonly children: ReactNode;
}) {
  return (
    <MobileWrapperDialog
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      title={label}
      closeLabel="Close panel"
      hideOnDesktopHover={hideOnDesktopHover}
      zIndexClassName={zIndexClassName}
      onAfterLeave={onAfterLeave}
      noPadding
      headerClassName="tw-pt-3"
      titleClassName="tw-text-[17px]"
      surfaceClassName="!tw-rounded-t-xl tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-bg-iron-950"
    >
      <ul
        role={menu ? "menu" : undefined}
        aria-label={menu ? label : undefined}
        className={`tw-mx-0 tw-mb-0 tw-flex tw-list-none tw-flex-col tw-gap-0.5 tw-px-3 tw-pb-5 ${compactContent && !label ? "tw-mt-0" : "tw-mt-3.5"}`}
      >
        {children}
      </ul>
    </MobileWrapperDialog>
  );
}
