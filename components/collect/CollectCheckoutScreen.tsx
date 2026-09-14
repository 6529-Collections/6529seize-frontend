"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRef, useState, type ReactNode } from "react";
import { useRetainedDialogFocus } from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import styles from "./marketplace-font.module.css";

/** A full-viewport checkout with one scrolling surface and a persistent back control. */
export default function CollectCheckoutScreen({
  children,
  onClose,
  open = true,
  busy = false,
}: {
  readonly children: ReactNode;
  readonly onClose: () => void;
  readonly open?: boolean;
  readonly busy?: boolean;
}) {
  const locale = useBrowserLocale();
  const [dialogMount, setDialogMount] = useState<HTMLSpanElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const dialogOpen = open && dialogMount !== null;
  useRetainedDialogFocus(true, dialogOpen, dialogRef);
  return (
    <>
      <span hidden aria-hidden="true" ref={setDialogMount} />
      <Dialog
        ref={dialogRef}
        open={dialogOpen}
        onClose={() => {
          if (!busy) onClose();
        }}
        unmount={false}
        className={`tailwind-scope tw-relative tw-z-[1000] ${styles["surface"] ?? ""}`}
      >
        <div className="tw-fixed tw-inset-0 tw-overflow-y-auto tw-overscroll-contain tw-bg-iron-950 tw-scrollbar-thin tw-scrollbar-track-iron-950 tw-scrollbar-thumb-iron-700">
          <DialogPanel className="tw-min-h-dvh tw-pb-[env(safe-area-inset-bottom)]">
            <header className="tw-sticky tw-top-0 tw-z-30 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-bg-iron-950/95 tw-backdrop-blur">
              <div className="tw-mx-auto tw-flex tw-max-w-6xl tw-items-center tw-gap-4 tw-px-5 tw-py-3 sm:tw-px-8">
                <button
                  type="button"
                  disabled={busy}
                  onClick={onClose}
                  className="tw-flex tw-min-h-11 tw-items-center tw-gap-2 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-2 tw-text-sm tw-font-medium tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50 desktop-hover:hover:tw-text-white"
                >
                  <ArrowLeftIcon aria-hidden="true" className="tw-size-4" />
                  {t(locale, "collect.checkout.back")}
                </button>
                <DialogTitle className="tw-sr-only">
                  {t(locale, "collect.checkout.title")}
                </DialogTitle>
              </div>
            </header>
            <div className="tw-mx-auto tw-max-w-6xl tw-px-5 tw-py-6 sm:tw-px-8 sm:tw-py-10">
              {children}
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
