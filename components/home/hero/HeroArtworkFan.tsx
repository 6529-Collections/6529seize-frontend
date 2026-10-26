"use client";

import NftPurchasingGate from "@/components/common/NftPurchasingGate";
import { DropImagePreview } from "@/components/drops/view/item/content/media/DropImagePreview";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { NFTLite } from "@/entities/INFT";
import { ImageScale } from "@/helpers/image.helpers";
import { shouldShowNextMintInLatestDrop } from "@/helpers/mint-visibility.helpers";
import { getDropPreviewImageUrl } from "@/helpers/waves/drop.helpers";
import { useNextMintDrop } from "@/hooks/useNextMintDrop";
import { useNftPurchasingVisibility } from "@/hooks/useNftPurchasingVisibility";
import type { NowMintingStatus } from "@/hooks/useNowMintingStatus";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import clsx from "clsx";
import { useState } from "react";
import { useLatestDropTransitionReady } from "../now-minting/useLatestDropTransitionReady";
import styles from "./HeroArtworkFan.module.css";

interface Artwork {
  readonly id: string;
  readonly number?: number | undefined;
  readonly name: string;
  readonly image: string;
  readonly isSubmission?: boolean;
}

function publishedArtwork(nft: {
  readonly id: number;
  readonly name: string;
  readonly scaled: string | null;
  readonly image: string | null;
}): Artwork {
  return {
    id: `meme-${nft.id}`,
    number: nft.id,
    name: nft.name,
    image: nft.scaled ?? nft.image ?? "",
  };
}

function recentArtworks(memes: NFTLite[]): Artwork[] {
  return [...memes]
    .sort((a, b) => b.id - a.id)
    .slice(0, 5)
    .map(publishedArtwork);
}

function ArtworkImage({
  artwork,
  front,
}: {
  readonly artwork: Artwork;
  readonly front: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!artwork.image || failed) return null;
  const imageProps = {
    fill: true,
    sizes: "(min-width: 1024px) 250px, 180px",
    loading: front ? ("eager" as const) : ("lazy" as const),
    className: "tw-object-contain",
  };
  return artwork.isSubmission ? (
    <DropImagePreview
      alt=""
      {...imageProps}
      originalSrc={artwork.image}
      imageScale={ImageScale.AUTOx600}
      fallback={null}
    />
  ) : (
    <Image
      alt=""
      {...imageProps}
      src={artwork.image}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}

function ArtworkFan({
  recent,
  front,
}: {
  readonly recent: readonly Artwork[];
  readonly front: Artwork | undefined;
}) {
  const back = recent
    .filter((artwork) => artwork.id !== front?.id)
    .slice(0, 4)
    .reverse();
  const cards = [back[0], back[1], back[2], back[3], front];
  // Decorative repeats of collection artwork; discovery links remain in the sections below.
  return (
    <div
      aria-hidden="true"
      data-home-artwork-fan
      className={clsx(
        styles["fan"],
        "tw-relative tw-mx-auto tw-w-full tw-min-w-0 tw-max-w-[580px]"
      )}
    >
      {cards.map((artwork, index) => (
        <figure
          key={index}
          data-slot={index}
          className={clsx(
            styles["card"],
            "tw-absolute tw-m-0 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-1.5 tw-pb-0 tw-shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
          )}
        >
          <div className="tw-relative tw-aspect-[4/5] tw-overflow-hidden tw-rounded-md tw-bg-black">
            {artwork && (
              <ArtworkImage
                key={artwork.image}
                artwork={artwork}
                front={index === 4}
              />
            )}
          </div>
          <figcaption className="tw-flex tw-h-8 tw-items-center tw-justify-between tw-gap-2 tw-text-[8px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-300">
            <span className="tw-truncate">{artwork?.name}</span>
            {artwork?.number !== undefined && (
              <span className="tw-shrink-0">#{artwork.number}</span>
            )}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}

function CurrentArtworkFan({
  recent,
  mintStatus,
}: {
  readonly recent: readonly Artwork[];
  readonly mintStatus: NowMintingStatus;
}) {
  const { nft, isDropComplete, isStatusLoading } = mintStatus;
  const { nextMint, nextMintTitle, isLoading } = useNextMintDrop();
  const transitionReady = useLatestDropTransitionReady({
    isDropComplete,
    mintNumber: nft?.id,
  });
  const showNextMint = shouldShowNextMintInLatestDrop({
    isMintEnded: transitionReady === true,
    nextMintExists: !!nextMint,
  });
  let front: Artwork | undefined;
  if (showNextMint && nextMint) {
    const media = nextMint.parts[0]?.media[0];
    front = {
      id: `drop-${nextMint.id}`,
      number: nextMint.submission_context?.meme_card_id ?? undefined,
      name: nextMintTitle ?? "",
      image:
        getDropPreviewImageUrl(nextMint.metadata) ??
        (media?.mime_type.startsWith("image/") ? media.url : ""),
      isSubmission: true,
    };
  } else if (!isStatusLoading && !isLoading && transitionReady !== null) {
    front = nft ? publishedArtwork(nft) : recent[0];
  }
  return <ArtworkFan recent={recent} front={front} />;
}

export default function HeroArtworkFan({
  mintStatus,
}: {
  readonly mintStatus: NowMintingStatus;
}) {
  const { hideNftPurchasing } = useNftPurchasingVisibility();
  const { data: recent = [] } = useQuery({
    queryKey: [QueryKey.MEMES_LITE],
    queryFn: async () => {
      const response = await commonApiFetch<{ data: NFTLite[] }>({
        endpoint: "memes_lite",
      });
      return response.data;
    },
    select: recentArtworks,
    staleTime: 60_000,
  });
  if (hideNftPurchasing)
    return <ArtworkFan recent={recent} front={recent[0]} />;
  return (
    <NftPurchasingGate>
      <CurrentArtworkFan recent={recent} mintStatus={mintStatus} />
    </NftPurchasingGate>
  );
}
