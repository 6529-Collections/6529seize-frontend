"use client";

import Image from "next/image";
import Link from "next/link";

import { resolveIpfsUrl } from "@/components/ipfs/IPFSContext";
import ArtistProfileHandle from "@/components/the-memes/ArtistProfileHandle";
import type { BaseNFT } from "@/entities/INFT";
import { useIdentity } from "@/hooks/useIdentity";

interface NowMintingHeaderProps {
  readonly cardNumber: number;
  readonly title: string;
  readonly artistHandle: string;
  readonly artistName: string;
}

function NowMintingArtistHandlePill({
  artistHandle,
}: {
  readonly artistHandle: string;
}) {
  const { profile } = useIdentity({
    handleOrWallet: artistHandle,
    initialProfile: null,
  });

  return (
    <span className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 tw-px-2.5 tw-py-1 tw-backdrop-blur-sm">
      {profile?.pfp ? (
        <Image
          src={resolveIpfsUrl(profile.pfp)}
          alt={artistHandle}
          width={16}
          height={16}
          className="tw-size-4 tw-flex-shrink-0 tw-rounded-sm tw-bg-iron-900 tw-object-contain"
        />
      ) : (
        <div className="tw-size-4 tw-flex-shrink-0 tw-rounded-sm tw-bg-iron-900 tw-object-contain" />
      )}
      <span className="tw-text-sm tw-font-medium tw-text-iron-200 tw-transition-colors tw-duration-300 desktop-hover:hover:tw-text-iron-100">
        <ArtistProfileHandle
          nft={{ artist_seize_handle: artistHandle } as BaseNFT}
        />
      </span>
    </span>
  );
}

function NowMintingArtistNamePill({
  artistName,
}: {
  readonly artistName: string;
}) {
  return (
    <span className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 tw-px-2.5 tw-py-1 tw-backdrop-blur-sm">
      <div className="tw-size-4 tw-flex-shrink-0 tw-rounded-sm tw-bg-iron-900 tw-object-contain" />
      <span className="tw-text-sm tw-font-medium tw-text-iron-200">
        {artistName}
      </span>
    </span>
  );
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
      <Link
        href={`/the-memes/${cardNumber}`}
        className="tw-text-xl tw-font-semibold tw-leading-tight tw-text-iron-50 tw-no-underline tw-transition-colors tw-duration-300 desktop-hover:hover:tw-text-iron-200 sm:tw-text-2xl md:tw-text-3xl"
      >
        {title}
      </Link>

      <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        <span className="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-white/5 tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium tw-uppercase tw-tracking-[0.08em] tw-text-iron-400 tw-backdrop-blur-sm">
          Card #{cardNumber}
        </span>
        {artistHandles.length > 0 ? (
          artistHandles.map((handle) => (
            <NowMintingArtistHandlePill key={handle} artistHandle={handle} />
          ))
        ) : (
          <NowMintingArtistNamePill artistName={artistName} />
        )}
      </div>
    </div>
  );
}
