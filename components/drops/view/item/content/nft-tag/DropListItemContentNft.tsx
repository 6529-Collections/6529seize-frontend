"use client";

import {
  GRADIENT_CONTRACT,
  MEMELAB_CONTRACT,
  MEMES_CONTRACT,
  NEXTGEN_CONTRACT,
} from "@/constants/constants";
import type { ReferencedNft } from "@/entities/IDrop";
import { areEqualAddresses } from "@/helpers/Helpers";
import { isMemesEcosystemContract } from "@/helpers/nft.helpers";
import { useTokenMetadataQuery } from "@/hooks/useAlchemyNftQueries";
import Link from "next/link";
import { useRef } from "react";
import DropListItemContentNftDetails from "./DropListItemContentNftDetails";

export default function DropListItemContentNft({
  nft: { contract, token, name },
}: {
  readonly nft: ReferencedNft;
}) {
  const { data: nfts = [] } = useTokenMetadataQuery({
    tokens: contract && token ? [{ contract, tokenId: token }] : [],
    enabled: Boolean(contract && token),
  });
  const nft = nfts[0] ?? null;

  const elementRef = useRef<HTMLSpanElement>(null);

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
      <span
        className="tw-mt-2 tw-flex tw-flex-col tw-gap-y-2"
        ref={elementRef}
      >
        <span className="tw-h-64 tw-w-full">
          {nft?.imageUrl && (
            <img
              src={nft.imageUrl}
              alt=""
              className="tw-h-full tw-w-full tw-object-contain tw-object-center"
            />
          )}
        </span>
        <DropListItemContentNftDetails
          referencedNft={{ contract, token, name }}
          nft={nft}
        />
      </span>
    </Link>
  );
}
