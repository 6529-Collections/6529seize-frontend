"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
  NEXTGEN_CONTRACT,
} from "@/constants/constants";
import type { ReferencedNft } from "@/entities/IDrop";
import type {
  ReservoirTokensResponse,
  ReservoirTokensResponseTokenElement,
} from "@/entities/IReservoir";
import { areEqualAddresses } from "@/helpers/Helpers";
import { isMemesEcosystemContract } from "@/helpers/nft.helpers";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import DropListItemContentNftDetails from "./DropListItemContentNftDetails";

export default function DropListItemContentNft({
  nft: { contract, token, name },
}: {
  readonly nft: ReferencedNft;
}) {
  const { data: nfts } = useQuery<ReservoirTokensResponseTokenElement[]>({
    queryKey: [QueryKey.RESERVOIR_NFT, { contract, token }],
    queryFn: async () => {
      const url = `https://api.reservoir.tools/tokens/v7?tokens=${contract}%3A${token}`;
      const response = await fetch(url);
      if (response.ok) {
        const data: ReservoirTokensResponse = await response.json();
        return data.tokens;
      }
      return [];
    },
    enabled: !!contract && !!token,
    staleTime: 1000 * 60 * 5,
  });

  const [nft, setNft] = useState<ReservoirTokensResponseTokenElement | null>(
    null
  );
  useEffect(() => {
    if (nfts?.length) {
      setNft(nfts[0]!);
    }
  }, [nfts]);

  const elementRef = useRef<HTMLDivElement>(null);

  const getNftHref = () => {
    if (areEqualAddresses(contract, MEMES_CONTRACT)) {
      return `/the-memes/${token}`;
    }
    if (areEqualAddresses(contract, GRADIENT_CONTRACT)) {
      return `/6529-gradient/${token}`;
    }
    if (areEqualAddresses(contract, NEXTGEN_CONTRACT)) {
      return `/nextgen/token/${token}`;
    }
    if (areEqualAddresses(contract, MEMELAB_CONTRACT)) {
      return `/memelab/${token}`;
    }
    return `https://opensea.io/assets/ethereum/${contract}/${token}`;
  };

  const getTarget = () => {
    const isMemes = isMemesEcosystemContract(contract);
    if (isMemes) {
      return "";
    }
    return "_blank";
  };

  const nftHref = getNftHref();
  const target = getTarget();

  return (
    <Link
      onClick={(e) => e.stopPropagation()}
      href={nftHref}
      className="tw-no-underline"
      target={target}
    >
      <div className="tw-mt-2 tw-flex tw-flex-col tw-gap-y-2" ref={elementRef}>
        <div className="tw-h-64 tw-w-full">
          {nft && (
            <img
              src={nft.token.imageLarge}
              alt="NFT token"
              className="tw-h-full tw-w-full tw-object-contain tw-object-center"
            />
          )}
        </div>
        <DropListItemContentNftDetails
          referencedNft={{ contract, token, name }}
          nft={nft}
        />
      </div>
    </Link>
  );
}
