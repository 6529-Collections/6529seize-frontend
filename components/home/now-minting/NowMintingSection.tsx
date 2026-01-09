"use client";

import { useNowMinting } from "@/hooks/useNowMinting";
import NowMintingArtwork from "./NowMintingArtwork";
import NowMintingDetails from "./NowMintingDetails";

export default function NowMintingSection() {
  const { nft, isFetching } = useNowMinting();

  if (isFetching && !nft) {
    return (
      <section className="tw-py-8">
        <h2 className="tw-mb-4 tw-text-lg tw-font-medium tw-text-iron-50">
          Now minting
        </h2>
        <div className="tw-text-iron-400">Loading...</div>
      </section>
    );
  }

  if (!nft) {
    return null;
  }

  return (
    <section className="tw-py-8">
      <h2 className="tw-mb-4 tw-text-lg tw-font-medium tw-text-iron-50">
        Now minting
      </h2>
      <div className="tw-flex tw-flex-col tw-gap-6 md:tw-flex-row">
        <NowMintingArtwork
          imageUrl={nft.scaled}
          animationUrl={nft.animation}
          title={nft.name}
        />
        <NowMintingDetails nft={nft} />
      </div>
    </section>
  );
}
