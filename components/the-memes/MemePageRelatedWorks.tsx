"use client";

import type { NFT } from "@/entities/INFT";
import type { SupportedLocale } from "@/i18n/locales";
import MemePageArtistWorks from "./MemePageArtistWorks";
import MemePageReferencesSection from "./MemePageReferencesSection";
import { MEME_FOCUS } from "./MemeShared";

export default function MemePageRelatedWorks({
  nft,
  locale,
  focus,
  onFocusChange,
}: Readonly<{
  nft: NFT;
  locale: SupportedLocale;
  focus: MEME_FOCUS | undefined;
  onFocusChange: (focus: MEME_FOCUS) => void;
}>) {
  const referencesOpen = focus === MEME_FOCUS.REFERENCES;
  return (
    <>
      <MemePageArtistWorks nft={nft} locale={locale} />
      <MemePageReferencesSection
        nft={nft}
        locale={locale}
        open={referencesOpen}
        onToggle={() =>
          onFocusChange(
            referencesOpen ? MEME_FOCUS.LIVE : MEME_FOCUS.REFERENCES
          )
        }
      />
    </>
  );
}
