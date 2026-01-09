"use client";

import { resolveIpfsUrl } from "@/components/ipfs/IPFSContext";
import { useIdentity } from "@/hooks/useIdentity";
import Image from "next/image";

interface NowMintingHeaderProps {
  readonly cardNumber: number;
  readonly title: string;
  readonly artistHandle: string;
}

export default function NowMintingHeader({
  cardNumber,
  title,
  artistHandle,
}: NowMintingHeaderProps) {
  const { profile } = useIdentity({
    handleOrWallet: artistHandle,
    initialProfile: null,
  });

  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <span className="tw-text-xs tw-uppercase tw-tracking-wider tw-text-iron-400">
        Card #{cardNumber}
      </span>
      <h3 className="tw-text-xl tw-font-semibold tw-text-iron-50">{title}</h3>
      <div className="tw-flex tw-items-center tw-gap-2">
        {profile?.pfp ? (
          <Image
            src={resolveIpfsUrl(profile.pfp)}
            alt={artistHandle}
            width={24}
            height={24}
            className="tw-size-6 tw-rounded-full tw-object-cover"
          />
        ) : (
          <div className="tw-size-6 tw-rounded-full tw-bg-iron-700" />
        )}
        <span className="tw-text-sm tw-text-iron-300">{artistHandle}</span>
      </div>
    </div>
  );
}
