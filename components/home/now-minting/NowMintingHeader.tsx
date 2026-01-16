"use client";

import { resolveIpfsUrl } from "@/components/ipfs/IPFSContext";
import ArtistProfileHandle from "@/components/the-memes/ArtistProfileHandle";
import type { BaseNFT } from "@/entities/INFT";
import { useIdentity } from "@/hooks/useIdentity";
import Image from "next/image";
import Link from "next/link";

interface NowMintingHeaderProps {
  readonly cardNumber: number;
  readonly title: string;
  readonly artistHandle: string | undefined;
  readonly artistName: string;
}

export default function NowMintingHeader({
  cardNumber,
  title,
  artistHandle,
  artistName,
}: NowMintingHeaderProps) {
  const identityHandle = artistHandle || artistName;
  const { profile } = useIdentity({
    handleOrWallet: identityHandle,
    initialProfile: null,
  });
  const hasHandle = Boolean(artistHandle?.trim());

  return (
    <div className="tw-flex tw-flex-col">
      <span className="tw-mb-2 tw-text-[11px] tw-uppercase tw-leading-4 tw-tracking-[0.2em] tw-text-iron-500">
        Card #{cardNumber}
      </span>

      <Link
        href={`/the-memes/${cardNumber}`}
        className="tw-text-xl tw-font-semibold tw-leading-tight tw-text-iron-50 tw-no-underline tw-transition-colors tw-duration-300 desktop-hover:hover:tw-text-iron-200 sm:tw-text-2xl md:tw-text-3xl"
      >
        {title}
      </Link>

      <div className="tw-mt-4 tw-flex tw-items-center tw-gap-2">
        {profile?.pfp ? (
          <Image
            src={resolveIpfsUrl(profile.pfp)}
            alt={artistName}
            width={24}
            height={24}
            className="tw-size-6 tw-flex-shrink-0 tw-rounded-md tw-bg-iron-900 tw-object-contain"
          />
        ) : (
          <div className="tw-size-6 tw-flex-shrink-0 tw-rounded-md tw-bg-iron-900 tw-object-contain" />
        )}
        <span className="tw-text-md tw-font-semibold tw-text-white tw-transition-colors tw-duration-300 desktop-hover:hover:tw-text-opacity-80">
          {hasHandle ? (
            <ArtistProfileHandle
              nft={{ artist_seize_handle: artistHandle } as BaseNFT}
            />
          ) : (
            artistName
          )}
        </span>
      </div>
    </div>
  );
}
