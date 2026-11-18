"use client";

import IconButton from "@/components/utils/button/IconButton";

import { ShareIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useHasHydrated } from "@/hooks/useHasHydrated";
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
  const hasHydrated = useHasHydrated();
  const locale = suppliedLocale ?? browserLocale;
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="tailwind-scope tw-inline-flex tw-shrink-0">
      <IconButton
        type="button"
        disabled={!hasHydrated}
        size={36}
        variant="ghost"
        shape="compact"
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
      </IconButton>
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
