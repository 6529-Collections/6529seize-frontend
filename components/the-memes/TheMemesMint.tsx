"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo } from "react";
import { MEMES_MANIFOLD_PROXY_ABI } from "@/abis/abis";
import { useDropForgeMintingConfig } from "@/components/drop-forge/drop-forge-config";
import type {
  ArweaveMetadata,
  ManifoldMintMetadata,
} from "@/components/manifold-minting/manifold-mint-metadata";
import { useTitle } from "@/contexts/TitleContext";
import type { NFTWithMemesExtendedData } from "@/entities/INFT";
import { Time } from "@/helpers/time";

const ManifoldMinting = dynamic(
  () => import("../manifold-minting/ManifoldMinting"),
  {
    ssr: false,
  }
);

export default function TheMemesMint({
  nft,
  standalone = false,
}: {
  readonly nft: NFTWithMemesExtendedData;
  readonly standalone?: boolean;
}) {
  const { setTitle } = useTitle();

  useEffect(() => {
    setTitle(
      standalone
        ? `Mint #${nft.id} | ${nft.name} | The Memes by 6529`
        : `Mint #${nft.id} | ${nft.name} | The Memes`
    );
  }, [nft.id, nft.name, setTitle, standalone]);

  const { contract, chain } = useDropForgeMintingConfig();
  const mintMetadata = useMemo<ManifoldMintMetadata>(
    () => ({
      tokenId: nft.id,
      metadata:
        nft.metadata && typeof nft.metadata === "object"
          ? (nft.metadata as ArweaveMetadata)
          : {},
    }),
    [nft.id, nft.metadata]
  );

  return (
    <ManifoldMinting
      title={`The Memes #${nft.id}`}
      contract={contract}
      chain={chain}
      abi={MEMES_MANIFOLD_PROXY_ABI}
      mint_date={Time.fromString(nft.mint_date?.toString() ?? "")}
      mintMetadata={mintMetadata}
      standalone={true}
    />
  );
}
