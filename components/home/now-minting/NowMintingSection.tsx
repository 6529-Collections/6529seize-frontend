"use client";

import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import HomeNftArtwork from "./HomeNftArtwork";
import NowMintingDetails from "./NowMintingDetails";

interface NowMintingSectionProps {
  readonly nft: ApiMemesExtendedData | undefined;
  readonly isFetching: boolean;
}

export default function NowMintingSection({
  nft,
  isFetching,
}: NowMintingSectionProps) {
  if (isFetching && !nft) {
    return (
      <section className="tw-px-4 tw-pb-4 tw-pt-6 md:tw-px-6 md:tw-pb-8 md:tw-pt-10 lg:tw-px-8">
        <span className="tw-mb-3 tw-block tw-text-xl tw-font-medium tw-tracking-tight tw-text-iron-100 md:tw-mb-4 md:tw-text-2xl">
          Latest Drop
        </span>

        <div className="tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-iron-950 tw-shadow-[0_24px_60px_rgba(0,0,0,0.2)]">
          <div className="tw-grid tw-grid-cols-1 tw-items-stretch lg:tw-grid-cols-12 xl:tw-grid-cols-9">
            <div className="tw-flex tw-p-0 lg:tw-col-span-6 xl:tw-col-span-5">
              <div className="tw-relative tw-min-h-[clamp(360px,65vw,640px)] tw-w-full tw-rounded-none tw-bg-iron-800/50 motion-safe:tw-animate-pulse" />
            </div>

            <div className="tw-min-w-0 tw-p-5 md:tw-p-6 lg:tw-col-span-6 lg:tw-p-8 xl:tw-col-span-4">
              <div className="tw-flex tw-flex-col tw-gap-8 lg:tw-gap-10">
                <div className="tw-space-y-2">
                  <div className="tw-h-4 tw-w-24 tw-rounded tw-bg-iron-800/50 motion-safe:tw-animate-pulse" />
                  <div className="tw-h-7 tw-w-3/4 tw-rounded tw-bg-iron-800/50 motion-safe:tw-animate-pulse" />
                  <div className="tw-h-4 tw-w-32 tw-rounded tw-bg-iron-800/50 motion-safe:tw-animate-pulse" />
                </div>
                <div className="tw-flex tw-flex-col tw-gap-4">
                  <div className="tw-grid tw-grid-cols-2 tw-gap-x-8 tw-gap-y-5">
                    {["edition", "status", "price", "floor"].map((stat) => (
                      <div key={stat} className="tw-space-y-2">
                        <div className="tw-h-4 tw-w-16 tw-rounded tw-bg-iron-800/50 motion-safe:tw-animate-pulse" />
                        <div className="tw-h-6 tw-w-24 tw-rounded tw-bg-iron-800/50 motion-safe:tw-animate-pulse" />
                      </div>
                    ))}
                  </div>
                  <div className="tw-h-5 tw-w-28 tw-rounded tw-bg-iron-800/50 motion-safe:tw-animate-pulse" />
                </div>
                <div className="tw-flex tw-flex-col tw-gap-4">
                  <div className="tw-space-y-2">
                    <div className="tw-h-4 tw-w-28 tw-rounded tw-bg-iron-800/50 motion-safe:tw-animate-pulse" />
                    <div className="tw-h-5 tw-w-3/4 tw-rounded tw-bg-iron-800/50 motion-safe:tw-animate-pulse" />
                  </div>
                  <div className="tw-h-24 tw-w-full tw-rounded-xl tw-bg-iron-800/50 motion-safe:tw-animate-pulse" />
                </div>
                <div className="tw-h-32 tw-w-full tw-rounded-lg tw-bg-iron-800/50 motion-safe:tw-animate-pulse" />
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
    <section className="tw-relative tw-z-50 tw-px-4 tw-pb-4 tw-pt-6 md:tw-px-6 md:tw-pb-8 md:tw-pt-10 lg:tw-px-8">
      <span className="tw-mb-3 tw-block tw-text-xl tw-font-medium tw-tracking-tight tw-text-iron-100 md:tw-mb-4 md:tw-text-2xl">
        Latest Drop
      </span>

      <div className="tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.03] tw-bg-iron-950 tw-shadow-[0_24px_60px_rgba(0,0,0,0.2)]">
        <div className="tw-grid tw-grid-cols-1 tw-items-stretch tw-gap-x-6 tw-gap-y-6 lg:tw-grid-cols-12 xl:tw-grid-cols-9">
          <div
            data-home-artwork-column
            className="tw-flex tw-items-center tw-p-0 lg:tw-col-span-6 xl:tw-col-span-5"
          >
            <HomeNftArtwork nft={nft} />
          </div>

          <div className="tw-min-w-0 tw-p-5 md:tw-p-6 lg:tw-col-span-6 lg:tw-p-8 xl:tw-col-span-4">
            <NowMintingDetails nft={nft} />
          </div>
        </div>
      </div>
    </section>
  );
}
