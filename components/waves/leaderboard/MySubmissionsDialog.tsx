"use client";

import Button from "@/components/utils/button/Button";
import { PreviewModalShell } from "@/components/waves/drops/PreviewModalShell";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

export default function MySubmissionsDialog({
  isOpen,
  onClose,
  competitionName,
  children,
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly competitionName: string;
  readonly children: (isApp: boolean) => ReactNode;
}) {
  const locale = useBrowserLocale();
  return (
    <PreviewModalShell isOpen={isOpen} onClose={onClose} maxWidth="5xl">
      {(isApp) => (
        <div className="tailwind-scope tw-flex tw-max-h-[85vh] tw-flex-col">
          <header className="tw-flex tw-items-start tw-justify-between tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-p-4 sm:tw-p-6">
            <div className="tw-min-w-0">
              <DialogTitle className="tw-m-0 tw-text-lg tw-font-semibold tw-text-iron-50">
                {t(locale, "waves.submissions.mine")}
              </DialogTitle>
              <p className="tw-mb-0 tw-mt-1 tw-break-words tw-text-sm tw-text-iron-300">
                {competitionName}
              </p>
            </div>
            <Button
              variant="tertiary"
              size="sm"
              onClick={onClose}
              aria-label={t(locale, "waves.submissions.close")}
            >
              <XMarkIcon aria-hidden="true" className="tw-size-5" />
            </Button>
          </header>
          <div className="tw-min-h-0 tw-overflow-y-auto tw-overscroll-contain tw-p-4 sm:tw-p-6">
            {children(isApp)}
          </div>
        </div>
      )}
    </PreviewModalShell>
  );
}
