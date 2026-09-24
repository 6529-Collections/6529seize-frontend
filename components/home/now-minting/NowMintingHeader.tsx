"use client";

import { MainStageMemeCardPill } from "@/components/memes/drops/MainStageMemeCardLink";
import Link from "next/link";
import ArtistPill from "./ArtistPill";

interface NowMintingHeaderProps {
  readonly cardNumber: number;
  readonly title: string;
  readonly artistHandle: string;
  readonly artistName: string;
}

export default function NowMintingHeader({
  cardNumber,
  title,
  artistHandle,
  artistName,
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
        className="tw-mt-2 tw-w-fit tw-max-w-full tw-text-balance tw-rounded-sm tw-text-2xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 tw-no-underline tw-transition-colors tw-duration-200 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-primary-400 desktop-hover:hover:tw-text-iron-300 motion-reduce:tw-transition-none md:tw-text-3xl"
      >
        {title}
      </Link>

      <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-3">
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
