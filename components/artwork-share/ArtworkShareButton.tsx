"use client";

import { ShareIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import Button from "@/components/utils/button/Button";
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
    <div className="tailwind-scope">
      <Button
        variant="secondary"
        size="lg"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        data-testid="artwork-share-trigger"
      >
        <ShareIcon className="tw-size-4" aria-hidden="true" />
        {t(locale, "artworkShare.title")}
      </Button>
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
