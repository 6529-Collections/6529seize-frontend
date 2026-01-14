"use client";

import { useNowMinting } from "@/hooks/useNowMinting";
import NowMintingArtwork from "./NowMintingArtwork";
import NowMintingDetails from "./NowMintingDetails";

export default function NowMintingSection() {
  const { nft, isFetching } = useNowMinting();

  if (isFetching && !nft) {
    return (
      <section className="tw-relative tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-800/50 tw-p-8 md:tw-p-12">
        <span className="tw-block tw-text-xl md:tw-text-2xl tw-font-semibold tw-text-white tw-mb-8">
          Now minting
        </span>
        <div className="tw-text-iron-500">Loading...</div>
      </section>
    );
  }

  if (!nft) {
    return null;
  }

  return (
    <section>
      <span className="tw-block tw-text-xl md:tw-text-2xl tw-font-semibold tw-text-white tw-mb-6">
        Now minting
      </span>

      <div className="tw-relative tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-800/50 tw-p-8">
        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-12 tw-gap-10 lg:tw-gap-14">
          <div className="lg:tw-col-span-7">
            <NowMintingArtwork
              imageUrl={nft.scaled}
              animationUrl={nft.animation}
              title={nft.name}
            />
          </div>

          <div className="lg:tw-col-span-5">
            <NowMintingDetails nft={nft} />
          </div>
        </div>
      </div>
    </section>
  );
}
