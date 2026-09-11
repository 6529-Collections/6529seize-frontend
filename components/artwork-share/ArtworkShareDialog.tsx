import { XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { NftSocialCardFormat } from "@/components/providers/metadata";
import useBodyScrollLock from "@/hooks/useBodyScrollLock";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { ArtworkShareDetails } from "./artworkShare";
import ArtworkShareActions from "./ArtworkShareActions";
import ArtworkShareExport from "./ArtworkShareExport";

const FORMATS = ["portrait", "square", "story", "landscape"] as const;

export default function ArtworkShareDialog({
  artwork,
  locale,
  onClose,
}: {
  readonly artwork: ArtworkShareDetails;
  readonly locale: SupportedLocale;
  readonly onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const [format, setFormat] = useState<NftSocialCardFormat>("portrait");
  useBodyScrollLock({ reserveScrollbarGap: true });

  useEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.activeElement;
    if (!dialog) return;
    dialog.showModal();
    closeRef.current?.focus();
    return () => {
      dialog.close();
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, []);

  return createPortal(
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="tailwind-scope tw-fixed tw-bottom-[env(safe-area-inset-bottom,0px)] tw-left-[env(safe-area-inset-left,0px)] tw-right-[env(safe-area-inset-right,0px)] tw-top-[env(safe-area-inset-top,0px)] tw-m-auto tw-max-h-[calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-2rem)] tw-w-[calc(100%-env(safe-area-inset-left,0px)-env(safe-area-inset-right,0px)-2rem)] tw-max-w-3xl tw-overflow-y-auto tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-0 tw-text-iron-50 tw-shadow-2xl backdrop:tw-bg-black/75"
    >
      <header className="tw-sticky tw-top-0 tw-z-10 tw-flex tw-items-start tw-justify-between tw-gap-4 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/10 tw-bg-iron-950 tw-p-4 sm:tw-px-6">
        <div className="tw-min-w-0">
          <h2 id={titleId} className="tw-m-0 tw-text-lg tw-font-semibold">
            {t(locale, "artworkShare.title")}
          </h2>
          <p className="tw-mb-0 tw-mt-1 tw-break-words tw-text-sm tw-text-iron-400">
            {artwork.title}
          </p>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t(locale, "artworkShare.close")}
          className="tw-inline-flex tw-size-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-300 hover:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          <XMarkIcon className="tw-size-5" aria-hidden="true" />
        </button>
      </header>
      <div className="tw-grid tw-gap-6 tw-p-4 sm:tw-p-6 md:tw-grid-cols-2">
        <ArtworkShareActions artwork={artwork} locale={locale} />
        <div className="tw-flex tw-min-w-0 tw-flex-col tw-gap-3">
          <fieldset className="tw-m-0 tw-min-w-0 tw-border-0 tw-p-0">
            <legend className="tw-mb-2 tw-text-sm tw-font-medium tw-text-iron-200">
              {t(locale, "artworkShare.format")}
            </legend>
            <div className="tw-grid tw-grid-cols-2 tw-gap-2">
              {FORMATS.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={format === value}
                  onClick={() => setFormat(value)}
                  className={`tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-px-2 tw-py-2 tw-text-sm tw-font-medium focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 ${format === value ? "tw-border-iron-300 tw-bg-iron-200 tw-text-iron-950" : "tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200 hover:tw-bg-iron-800"}`}
                >
                  {t(locale, `artworkShare.format.${value}`)}
                </button>
              ))}
            </div>
          </fieldset>
          <ArtworkShareExport
            key={format}
            artwork={artwork}
            format={format}
            locale={locale}
          />
        </div>
      </div>
    </dialog>,
    document.body
  );
}
