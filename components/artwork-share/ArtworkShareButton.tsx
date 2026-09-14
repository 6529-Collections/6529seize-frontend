"use client";

import { ShareIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import ArtworkShareDialog from "./ArtworkShareDialog";
import type { ArtworkShareDetails } from "./artworkShare";

export default function ArtworkShareButton({
  artwork,
  locale: suppliedLocale,
}: {
  readonly artwork: ArtworkShareDetails;
  readonly locale?: SupportedLocale | undefined;
}) {
  const browserLocale = useBrowserLocale();
  const locale = suppliedLocale ?? browserLocale;
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="tailwind-scope tw-inline-flex tw-shrink-0">
      <button
        type="button"
        className="tw-inline-flex tw-size-9 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-100 tw-transition focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-iron-700 motion-reduce:tw-transition-none"
        onClick={(event) => {
          event.stopPropagation();
          setIsOpen(true);
        }}
        aria-label={t(locale, "artworkShare.title")}
        title={t(locale, "artworkShare.title")}
        aria-haspopup="dialog"
        data-testid="artwork-share-trigger"
      >
        <ShareIcon className="tw-size-4" aria-hidden="true" />
      </button>
      {isOpen && (
        <ArtworkShareDialog
          key={`${artwork.kind}-${artwork.tokenId}`}
          artwork={artwork}
          locale={locale}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
