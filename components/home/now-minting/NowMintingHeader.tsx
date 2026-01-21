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
  readonly artistHandle: string;
  readonly artistName: string;
}

export default function NowMintingHeader({
  cardNumber,
  title,
  artistHandle,
  artistName,
}: NowMintingHeaderProps) {
  const { profile } = useIdentity({
    handleOrWallet: artistHandle,
    initialProfile: null,
  });
  const hasHandle = Boolean(artistHandle.trim());

  return (
    <div className="tw-flex tw-flex-col">
      <Link
        href={`/the-memes/${cardNumber}`}
        className="tw-text-xl tw-font-semibold tw-leading-tight tw-text-iron-50 tw-no-underline tw-transition-colors tw-duration-300 desktop-hover:hover:tw-text-iron-200 sm:tw-text-2xl md:tw-text-3xl"
      >
        {title}
      </Link>

      <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        <span className="tw-inline-flex tw-items-center tw-rounded-full tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/60 tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium tw-uppercase tw-tracking-[0.08em] tw-text-iron-500">
          Card #{cardNumber}
        </span>
        <span className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/60 tw-px-2.5 tw-py-1">
          {profile?.pfp ? (
            <Image
              src={resolveIpfsUrl(profile.pfp)}
              alt={artistName}
              width={16}
              height={16}
              className="tw-size-4 tw-flex-shrink-0 tw-rounded-sm tw-bg-iron-900 tw-object-contain"
            />
          ) : (
            <div className="tw-size-4 tw-flex-shrink-0 tw-rounded-sm tw-bg-iron-900 tw-object-contain" />
          )}
          <span className="tw-text-sm tw-font-medium tw-text-iron-200 tw-transition-colors tw-duration-300 desktop-hover:hover:tw-text-iron-100">
            {hasHandle ? (
              <ArtistProfileHandle
                nft={{ artist_seize_handle: artistHandle } as BaseNFT}
              />
            ) : (
              artistName
            )}
          </span>
        </span>
      </div>

    </div>
  );
}
