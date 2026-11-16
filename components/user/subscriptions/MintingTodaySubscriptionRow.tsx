"use client";

import { useNowMinting } from "@/hooks/useNowMinting";
import { useNextMintDrop } from "@/hooks/useNextMintDrop";
import { isValidMemeCardId } from "@/components/memes/drops/MainStageMemeCardLink";
import { MEMES_CONTRACT } from "@/constants/constants";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
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
  // Minted fields are thumbnails; also cap winner previews outside the resize CDN.
  const source =
    mintedSource ??
    (matchesWinner && winnerImage
      ? getScaledImageUri(winnerImage, ImageScale.W_200_H_200)
      : undefined);

  return (
    <MemeSubscriptionRow
      {...props}
      artwork={
        source && source !== failedSource ? (
          <Image
            src={source}
            alt=""
            width={80}
            height={113}
            unoptimized={!!mintedSource}
            className="tw-h-[68px] tw-w-12 tw-rounded-[3px] tw-object-contain tw-shadow-sm sm:tw-h-[113px] sm:tw-w-20"
            onError={() => setFailedSource(source)}
          />
        ) : undefined
      }
    />
  );
}
