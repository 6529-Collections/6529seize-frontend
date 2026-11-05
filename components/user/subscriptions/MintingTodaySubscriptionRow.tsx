"use client";

import { useNowMinting } from "@/hooks/useNowMinting";
import Image from "next/image";
import { useState, type ComponentProps } from "react";
import MemeSubscriptionRow from "./MemeSubscriptionRow";

export default function MintingTodaySubscriptionRow(
  props: Readonly<ComponentProps<typeof MemeSubscriptionRow>>
) {
  const { nft } = useNowMinting();
  const [failedSource, setFailedSource] = useState<string>();
  const matchesToken =
    nft?.id === props.subscription.token_id &&
    nft.contract.toLowerCase() === props.subscription.contract.toLowerCase();
  const source = matchesToken
    ? nft.thumbnail || nft.scaled || nft.icon
    : undefined;

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
            unoptimized
            className="tw-h-[113px] tw-w-20 tw-rounded-[3px] tw-object-contain tw-shadow-sm"
            onError={() => setFailedSource(source)}
          />
        ) : undefined
      }
    />
  );
}
