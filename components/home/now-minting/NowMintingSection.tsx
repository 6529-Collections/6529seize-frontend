"use client";

import { useNowMinting } from "@/hooks/useNowMinting";
import NowMintingArtwork from "./NowMintingArtwork";
import NowMintingDetails from "./NowMintingDetails";

export default function NowMintingSection() {
  const { nft, isFetching } = useNowMinting();

  if (isFetching && !nft) {
    return (
      <section className="tw-px-4 tw-pb-20 tw-pt-6 md:tw-px-6 md:tw-pt-8 lg:tw-px-8">
        <span className="tw-mb-3 tw-block tw-text-xl tw-font-semibold tw-tracking-tight tw-text-zinc-200 md:tw-mb-4 md:tw-text-2xl">
          Latest Drop
        </span>

        <div className="tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950">
          <div className="tw-grid tw-grid-cols-1 tw-gap-y-6 lg:tw-grid-cols-12 xl:tw-grid-cols-9">
            <div className="tw-p-0 lg:tw-col-span-6 xl:tw-col-span-5">
              <div className="tw-relative tw-h-[clamp(360px,65vw,640px)] tw-w-full tw-animate-pulse tw-rounded-none tw-bg-iron-800/50" />
            </div>

            <div className="tw-p-5 md:tw-p-6 lg:tw-col-span-6 xl:tw-col-span-4">
              <div className="tw-flex tw-flex-col tw-gap-5">
                <div className="tw-space-y-2">
                  <div className="tw-h-4 tw-w-24 tw-animate-pulse tw-rounded tw-bg-iron-800/50" />
                  <div className="tw-h-7 tw-w-3/4 tw-animate-pulse tw-rounded tw-bg-iron-800/50" />
                  <div className="tw-h-4 tw-w-32 tw-animate-pulse tw-rounded tw-bg-iron-800/50" />
                </div>
                <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                  {...new Array(4).map((_, i) => (
                    <div key={i} className="tw-space-y-2">
                      <div className="tw-h-4 tw-w-16 tw-animate-pulse tw-rounded tw-bg-iron-800/50" />
                      <div className="tw-h-6 tw-w-24 tw-animate-pulse tw-rounded tw-bg-iron-800/50" />
                    </div>
                  ))}
                </div>
                <div className="tw-h-12 tw-w-full tw-animate-pulse tw-rounded-lg tw-bg-iron-800/50" />
                <div className="tw-h-32 tw-w-full tw-animate-pulse tw-rounded-lg tw-bg-iron-800/50" />
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
    <section className="tw-px-4 tw-pb-20 tw-pt-6 md:tw-px-6 md:tw-pb-24 md:tw-pt-8 lg:tw-px-8">
      <span className="tw-mb-3 tw-block tw-text-xl tw-font-semibold tw-tracking-tight tw-text-zinc-200 md:tw-mb-4 md:tw-text-2xl">
        Latest Drop
      </span>

      <div className="tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950">
        <div className="tw-grid tw-grid-cols-1 tw-items-center tw-gap-y-6 lg:tw-grid-cols-12 xl:tw-grid-cols-9">
          <div className="tw-p-0 lg:tw-col-span-6 xl:tw-col-span-5">
            <NowMintingArtwork nft={nft} />
          </div>

          <div className="tw-p-5 md:tw-p-6 lg:tw-col-span-6 xl:tw-col-span-4">
            <NowMintingDetails nft={nft} />
          </div>
        </div>
      </div>
    </section>
  );
}
