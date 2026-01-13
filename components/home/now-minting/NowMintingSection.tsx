"use client";

import { useNowMinting } from "@/hooks/useNowMinting";
import NowMintingArtwork from "./NowMintingArtwork";
import NowMintingDetails from "./NowMintingDetails";

export default function NowMintingSection() {
  const { nft, isFetching } = useNowMinting();

  if (isFetching && !nft) {
    return (
      <section className="tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-900 tw-p-6 md:tw-p-10">
        <div className="tw-relative">
          <h2 className="tw-mb-4 tw-text-xl tw-font-semibold tw-text-iron-50">
            Now minting
          </h2>
          <div className="tw-text-iron-400">Loading...</div>
        </div>
      </section>
    );
  }

  if (!nft) {
    return null;
  }

  return (
    <section className="tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950 tw-p-6 md:tw-p-10">
      <div className="tw-relative">
        <span className="tw-mb-5 tw-text-2xl tw-font-semibold tw-text-iron-50">
          Now minting
        </span>
        <div className="tw-flex tw-flex-col tw-gap-14 md:tw-flex-row tw-mt-6">
          <NowMintingArtwork
            imageUrl={nft.scaled}
            animationUrl={nft.animation}
            title={nft.name}
          />
          <NowMintingDetails nft={nft} />
        </div>
      </div>
    </section>
  );
}
