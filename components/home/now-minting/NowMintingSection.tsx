"use client";

import { useNowMinting } from "@/hooks/useNowMinting";
import NowMintingArtwork from "./NowMintingArtwork";
import NowMintingDetails from "./NowMintingDetails";

export default function NowMintingSection() {
  const { nft, isFetching } = useNowMinting();

  if (isFetching && !nft) {
    return (
      <section className="tw-px-4 tw-pb-32 tw-pt-10 md:tw-pt-14 md:tw-px-6 lg:tw-px-8">
        <span className="tw-mb-4 tw-block tw-text-xl tw-font-semibold tw-tracking-tight tw-text-zinc-200 md:tw-mb-6 md:tw-text-2xl">
          Latest Drop
        </span>

        <div className="tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800/50 tw-bg-iron-950">
          <div className="tw-grid tw-h-full tw-grid-cols-1 tw-gap-y-10 tw-divide-y tw-divide-solid tw-divide-white/5 lg:tw-grid-cols-12 lg:tw-divide-x lg:tw-divide-y-0 xl:tw-grid-cols-9">
            <div className="tw-self-center tw-p-6 md:tw-p-8 lg:tw-col-span-6 xl:tw-col-span-5">
              <div className="tw-relative tw-h-[clamp(360px,65vw,640px)] tw-w-full tw-animate-pulse tw-rounded-lg tw-bg-iron-800/50" />
            </div>

            <div className="tw-p-6 md:tw-p-8 lg:tw-col-span-6 xl:tw-col-span-4">
              <div className="tw-flex tw-flex-col tw-gap-6">
                <div className="tw-space-y-3">
                  <div className="tw-h-5 tw-w-24 tw-animate-pulse tw-rounded tw-bg-iron-800/50" />
                  <div className="tw-h-8 tw-w-3/4 tw-animate-pulse tw-rounded tw-bg-iron-800/50" />
                  <div className="tw-h-5 tw-w-32 tw-animate-pulse tw-rounded tw-bg-iron-800/50" />
                </div>
                <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                  {...new Array(4).map((_, i) => (
                    <div key={i} className="tw-space-y-2">
                      <div className="tw-h-4 tw-w-16 tw-animate-pulse tw-rounded tw-bg-iron-800/50" />
                      <div className="tw-h-6 tw-w-24 tw-animate-pulse tw-rounded tw-bg-iron-800/50" />
                    </div>
                  ))}
                </div>
                <div className="tw-h-14 tw-w-full tw-animate-pulse tw-rounded-xl tw-bg-iron-800/50" />
                <div className="tw-h-44 tw-w-full tw-animate-pulse tw-rounded-xl tw-bg-iron-800/50" />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!nft) {
    return null;
  }

  return (
    <section className="tw-px-4 tw-pb-16 tw-pt-10 md:tw-pt-14 md:tw-px-6 md:tw-pb-32 lg:tw-px-8">
      <span className="tw-mb-4 tw-block tw-text-xl tw-font-semibold tw-tracking-tight tw-text-zinc-200 md:tw-mb-6 md:tw-text-2xl">
        Latest Drop
      </span>

      <div className="tw-relative tw-rounded-xl tw-border tw-border-solid tw-border-iron-800/50 tw-bg-iron-950">
        <div className="tw-grid tw-h-full tw-grid-cols-1 tw-gap-y-10 tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/5 lg:tw-grid-cols-12 lg:tw-divide-x lg:tw-divide-y-0 xl:tw-grid-cols-9">
          <div className="tw-px-6 tw-pt-6 md:tw-p-8 md:tw-pb-12 lg:tw-col-span-6 xl:tw-col-span-5">
            <NowMintingArtwork nft={nft} />
          </div>

          <div className="tw-p-6 md:tw-p-8 lg:tw-col-span-6 xl:tw-col-span-4">
            <NowMintingDetails nft={nft} />
          </div>
        </div>
      </div>
    </section>
  );
}
