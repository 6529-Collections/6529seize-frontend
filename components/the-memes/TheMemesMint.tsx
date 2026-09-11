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
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
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
  readonly nft: ApiMemesExtendedData;
  readonly standalone?: boolean;
}) {
  const { setTitle } = useTitle();

  useEffect(() => {
    const nftName = nft.name.trim();
    setTitle(
      standalone
        ? `Mint #${nft.id} | ${nftName} | The Memes by 6529`
        : `Mint #${nft.id} | ${nftName} | The Memes`
    );
  }, [nft.id, nft.name, setTitle, standalone]);

  const { contract, chain } = useDropForgeMintingConfig();
  const mintMetadata = useMemo<ManifoldMintMetadata>(
    () => ({
      tokenId: nft.id,
      metadata:
        typeof nft.metadata === "object" && nft.metadata !== null
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
      standalone={standalone}
    />
  );
}
