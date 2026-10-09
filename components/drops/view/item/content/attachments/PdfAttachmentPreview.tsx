"use client";

import dynamic from "next/dynamic";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ErrorBoundary } from "react-error-boundary";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import PdfOriginalLink from "./PdfOriginalLink";

const PdfAttachmentReader = dynamic(() => import("./PdfAttachmentReader"), {
  ssr: false,
  loading: () => (
    <p role="status" className="tw-p-4">
      {t(DEFAULT_LOCALE, "attachment.pdf.loading")}
    </p>
  ),
});

export default function PdfAttachmentPreview({
  url,
  fileName,
  open,
  onClose,
}: {
  readonly url: string;
  readonly fileName: string;
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} className="tw-relative tw-z-[1100]">
      <DialogPanel
        className="tw-fixed tw-inset-0 tw-flex tw-flex-col tw-bg-iron-950 tw-text-iron-100"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        onClick={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ")
            event.stopPropagation();
        }}
      >
        <header className="tw-flex tw-shrink-0 tw-items-center tw-gap-3 tw-border-b tw-border-solid tw-border-iron-800 tw-px-4 tw-py-2">
          <DialogTitle className="tw-m-0 tw-min-w-0 tw-flex-1 tw-truncate tw-text-sm tw-font-medium">
            {fileName}
          </DialogTitle>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label={t(DEFAULT_LOCALE, "common.close")}
            className="tw-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-iron-900 tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            <XMarkIcon aria-hidden="true" className="tw-size-6" />
          </button>
        </header>
        <ErrorBoundary
          fallback={
            <div className="tw-p-4">
              <p role="alert">{t(DEFAULT_LOCALE, "attachment.pdf.error")}</p>
              <PdfOriginalLink url={url} />
            </div>
          }
        >
          <PdfAttachmentReader key={url} url={url} />
        </ErrorBoundary>
      </DialogPanel>
    </Dialog>
  );
}
