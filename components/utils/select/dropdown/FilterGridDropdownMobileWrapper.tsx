"use client";

import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import type { ReactNode } from "react";

export default function FilterGridDropdownMobileWrapper({
  isOpen,
  setOpen,
  label,
  gridColumnClassName,
  children,
}: {
  readonly isOpen: boolean;
  readonly setOpen: (isOpen: boolean) => void;
  readonly label?: string | undefined;
  readonly gridColumnClassName: string;
  readonly children: ReactNode;
}) {
  return (
    <MobileWrapperDialog
      zIndexClassName="tw-z-[1000]"
      isOpen={isOpen}
      onClose={() => setOpen(false)}
      title={label}
      closeLabel="Close panel"
      noPadding
      headerClassName="tw-pt-3"
      titleClassName="tw-text-[17px]"
      surfaceClassName="!tw-rounded-t-xl tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.07] tw-bg-iron-950"
    >
      <div
        role="menu"
        aria-label={label}
        className={`tw-mt-3.5 tw-grid ${gridColumnClassName} tw-gap-2 tw-px-3 tw-pb-5`}
      >
        {children}
      </div>
    </MobileWrapperDialog>
  );
}
