"use client";

import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import { getMediaType } from "@/components/nft-image/utils/media-type";
import { toBaseNftFromApiMemesExtendedData } from "@/components/the-memes/apiMemesExtendedDataAdapter";
import clsx from "clsx";
import HomeNftArtwork from "./HomeNftArtwork";
import NowMintingDetails from "./NowMintingDetails";

interface NowMintingSectionProps {
  readonly nft: ApiMemesExtendedData;
}

export default function NowMintingSection({ nft }: NowMintingSectionProps) {
  const isImage =
    getMediaType(toBaseNftFromApiMemesExtendedData(nft), true) === "image";

  return (
    <section
      data-home-section="Latest drop"
      data-home-drop
      className="tw-group/home-drop tw-relative tw-z-50 tw-px-4 tw-pb-4 tw-pt-8 md:tw-px-6 md:tw-pb-8 md:tw-pt-10 lg:tw-px-8"
    >
      <span className="tw-mb-7 tw-mt-0 tw-block tw-text-[28px] tw-font-semibold tw-leading-[1.17] tw-tracking-[-0.04em] tw-text-iron-50 md:tw-mb-8 md:tw-text-[38px] md:tw-leading-[1.14]">
        Latest Drop
      </span>

      <div className="tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.06] tw-bg-iron-950 tw-shadow-[0_24px_60px_rgba(0,0,0,0.2)]">
        <div
          className={clsx(
            "tw-grid tw-grid-cols-1 tw-items-stretch tw-gap-x-6 lg:tw-grid-cols-12 xl:tw-grid-cols-9",
            isImage ? "lg:tw-gap-y-6" : "tw-gap-y-6"
          )}
        >
          <div
            data-home-artwork-column
            data-home-artwork-is-image={isImage}
            className="tw-flex tw-items-center tw-p-0 lg:tw-col-span-6 xl:tw-col-span-5"
          >
            <HomeNftArtwork nft={nft} />
          </div>

          <div className="tw-min-w-0 tw-px-5 tw-py-8 md:tw-px-6 md:tw-py-10 lg:tw-col-span-6 lg:tw-p-8 xl:tw-col-span-4">
            <NowMintingDetails nft={nft} />
          </div>
        </div>
      </div>
    </section>
  );
}
