"use client";

import MediaTypeBadge from "@/components/drops/media/MediaTypeBadge";
import { MainStageMemeCardPill } from "@/components/memes/drops/MainStageMemeCardLink";
import Link from "next/link";
import ArtistPill from "./ArtistPill";

interface NowMintingHeaderProps {
  readonly cardNumber: number;
  readonly title: string;
  readonly artistHandle: string;
  readonly artistName: string;
  readonly mediaMimeType?: string | null | undefined;
}

export default function NowMintingHeader({
  cardNumber,
  title,
  artistHandle,
  artistName,
  mediaMimeType,
}: NowMintingHeaderProps) {
  const artistHandles = artistHandle
    .split(",")
    .map((handle) => handle.trim())
    .filter(Boolean);

  return (
    <div className="tw-flex tw-flex-col">
      <div className="tw-flex tw-min-h-5 tw-flex-wrap tw-items-center">
        <MainStageMemeCardPill memeCardId={cardNumber} variant="subtle" />
      </div>
      <Link
        href={`/the-memes/${cardNumber}`}
        className="tw-mt-3 tw-text-xl tw-font-semibold tw-leading-[1.08] tw-tracking-[-0.02em] tw-text-iron-50 tw-no-underline tw-transition-colors tw-duration-300 desktop-hover:hover:tw-text-iron-200 sm:tw-text-2xl sm:tw-leading-[1.08] md:tw-text-3xl md:tw-leading-[1.08]"
      >
        {title}
      </Link>

      <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-3">
        {mediaMimeType && (
          <MediaTypeBadge
            mimeType={mediaMimeType}
            dropId={`home-now-minting-${cardNumber}`}
            size="sm"
          />
        )}
        {artistHandles.length > 0 ? (
          artistHandles.map((handle) => (
            <ArtistPill
              appearance="minimal"
              key={handle}
              label={handle}
              href={`/${handle}`}
              profileHandle={handle}
            />
          ))
        ) : (
          <ArtistPill appearance="minimal" label={artistName} />
        )}
      </div>
    </div>
  );
}
