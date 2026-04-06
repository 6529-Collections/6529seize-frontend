"use client";

import MediaTypeBadge from "@/components/drops/media/MediaTypeBadge";
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
      <Link
        href={`/the-memes/${cardNumber}`}
        className="tw-text-xl tw-font-semibold tw-leading-tight tw-text-iron-50 tw-no-underline tw-transition-colors tw-duration-300 desktop-hover:hover:tw-text-iron-200 sm:tw-text-2xl md:tw-text-3xl"
      >
        {title}
      </Link>

      <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        {mediaMimeType && (
          <MediaTypeBadge
            mimeType={mediaMimeType}
            dropId={`home-now-minting-${cardNumber}`}
            size="sm"
            iconClassName="tw-size-[26px]"
          />
        )}
        <span className="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium tw-uppercase tw-tracking-[0.08em] tw-text-iron-400 tw-backdrop-blur-sm">
          Card #{cardNumber}
        </span>
        {artistHandles.length > 0 ? (
          artistHandles.map((handle) => (
            <ArtistPill
              key={handle}
              label={handle}
              href={`/${handle}`}
              profileHandle={handle}
            />
          ))
        ) : (
          <ArtistPill label={artistName} />
        )}
      </div>
    </div>
  );
}
