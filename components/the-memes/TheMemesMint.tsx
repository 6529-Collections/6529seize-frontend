"use client";

import dynamic from "next/dynamic";
import { MEMES_CONTRACT, MEMES_MANIFOLD_PROXY_CONTRACT } from "../../constants";
import { MEMES_MANIFOLD_PROXY_ABI } from "../../abis";
import { NFTWithMemesExtendedData } from "../../entities/INFT";
import { Time } from "../../helpers/time";
import { useEffect } from "react";
import { useTitle } from "../../contexts/TitleContext";

const ManifoldMinting = dynamic(
  () => import("../../components/manifoldMinting/ManifoldMinting"),
  {
    ssr: false,
  }
);

export default function TheMemesMint(props: {
  readonly nft: NFTWithMemesExtendedData;
}) {
  const { setTitle } = useTitle();
  const nft = props.nft;

  useEffect(() => {
    setTitle(`Mint #${nft.id} | ${nft.name} | The Memes`);
  }, [nft.id, nft.name, setTitle]);

  return (
    <ManifoldMinting
      title={`The Memes #${nft.id}`}
      contract={MEMES_CONTRACT}
      proxy={MEMES_MANIFOLD_PROXY_CONTRACT}
      abi={MEMES_MANIFOLD_PROXY_ABI}
      token_id={nft.id}
      mint_date={Time.fromString(nft.mint_date?.toString() ?? "")}
    />
  );
}
