"use client";

import NFTImageBalance from "@/components/nft-image/NFTImageBalance";
import NFTMediaContainer from "@/components/nft-image/NFTMediaContainer";
import styles from "@/components/nft-image/NFTImage.module.css";
import NFTModel from "@/components/nft-image/NFTModel";
import type { BaseRendererProps } from "@/components/nft-image/types/renderer-props";

export default function NFTModelRenderer(props: Readonly<BaseRendererProps>) {
  // Only render if NFT has metadata (i.e., it's a BaseNFT, not NFTLite)
  if (!("metadata" in props.nft)) {
    return null;
  }

  const animationClassName = styles["nftAnimation"] ?? "";

  return (
    <NFTMediaContainer
      className={`${animationClassName} ${props.imageStyle} ${props.bgStyle}`}
    >
      {props.showBalance && (
        <NFTImageBalance
          contract={props.nft.contract}
          tokenId={props.nft.id}
          height={props.height}
        />
      )}
      <NFTModel nft={props.nft} id={props.id} />
    </NFTMediaContainer>
  );
}
