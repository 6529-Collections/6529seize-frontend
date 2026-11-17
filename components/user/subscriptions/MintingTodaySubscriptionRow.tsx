"use client";

import { useNowMinting } from "@/hooks/useNowMinting";
import { useNextMintDrop } from "@/hooks/useNextMintDrop";
import { isValidMemeCardId } from "@/components/memes/drops/MainStageMemeCardLink";
import { MEMES_CONTRACT } from "@/constants/constants";
import { DropImagePreview } from "@/components/drops/view/item/content/media/DropImagePreview";
import { ImageScale } from "@/helpers/image.helpers";
import { getDropPreviewImageUrl } from "@/helpers/waves/drop.helpers";
import Image from "next/image";
import { useState, type ComponentProps } from "react";
import MemeSubscriptionRow from "./MemeSubscriptionRow";

export default function MintingTodaySubscriptionRow(
  props: Readonly<ComponentProps<typeof MemeSubscriptionRow>>
) {
  const { nft } = useNowMinting();
  const { nextMint } = useNextMintDrop();
  const [failedSource, setFailedSource] = useState<string>();
  const matchesToken =
    nft?.id === props.subscription.token_id &&
    nft.contract.toLowerCase() === props.subscription.contract.toLowerCase();
  const mintedSource = matchesToken
    ? nft.thumbnail || nft.scaled || nft.icon
    : undefined;
  const winnerMemeId = nextMint?.submission_context?.meme_card_id;
  const matchesWinner =
    props.subscription.contract.toLowerCase() ===
      MEMES_CONTRACT.toLowerCase() &&
    isValidMemeCardId(winnerMemeId) &&
    winnerMemeId === props.subscription.token_id;
  const media = nextMint?.parts[0]?.media[0];
  const winnerImage =
    getDropPreviewImageUrl(nextMint?.metadata) ??
    (media?.mime_type.startsWith("image/") ? media.url : undefined);
  let source = mintedSource;
  if (!source && matchesWinner) source = winnerImage;
  const imageProps = {
    width: 80,
    height: 113,
    className:
      "tw-h-[68px] tw-w-12 tw-rounded-[3px] tw-object-contain tw-shadow-sm sm:tw-h-[113px] sm:tw-w-20",
    onError: () => setFailedSource(source),
  };
  let artwork;
  if (source && source !== failedSource) {
    artwork = mintedSource ? (
      <Image {...imageProps} src={mintedSource} alt="" unoptimized />
    ) : (
      <DropImagePreview
        {...imageProps}
        alt=""
        originalSrc={source}
        imageScale={ImageScale.W_200_H_200}
        allowOriginalGif={false}
        fallback={null}
      />
    );
  }

  return <MemeSubscriptionRow {...props} artwork={artwork} />;
}
