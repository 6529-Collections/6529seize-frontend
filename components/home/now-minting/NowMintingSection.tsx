"use client";

import { useNowMinting } from "@/hooks/useNowMinting";
import NowMintingArtwork from "./NowMintingArtwork";
import NowMintingDetails from "./NowMintingDetails";

export default function NowMintingSection() {
  const { nft, isFetching } = useNowMinting();

  if (isFetching && !nft) {
    return (
      <section className="tw-px-4 md:tw-px-6 lg:tw-px-8 tw-relative tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-800/50 tw-p-8 md:tw-p-12">
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
    <section className="tw-px-4 md:tw-px-6 lg:tw-px-8">
      <span className="tw-block tw-text-xl md:tw-text-2xl tw-font-semibold tw-tracking-tight tw-text-white tw-mb-4 md:tw-mb-6">
        Now minting
      </span>

      <div className="tw-relative tw-overflow-hidden tw-rounded-xl tw-bg-iron-950 tw-border tw-border-solid tw-border-iron-800/50">
        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-12 xl:tw-grid-cols-9 tw-h-full tw-gap-10 lg:tw-gap-14 tw-divide-y lg:tw-divide-x lg:tw-divide-y-0 tw-divide-solid tw-divide-white/5">
          <div className="lg:tw-col-span-6 xl:tw-col-span-5 tw-p-6 md:tw-p-8 tw-self-center">
            <NowMintingArtwork
              imageUrl={nft.scaled}
              animationUrl={nft.animation}
              title={nft.name}
            />
          </div>

          <div className="lg:tw-col-span-6 xl:tw-col-span-4 tw-p-6 md:tw-p-8">
            <NowMintingDetails nft={nft} />
          </div>
        </div>
      </div>
    </section>
  );
}
