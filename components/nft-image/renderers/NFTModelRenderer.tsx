"use client";

import NFTImageBalance from "@/components/nft-image/NFTImageBalance";
import styles from "@/components/nft-image/NFTImage.module.scss";
import NFTModel from "@/components/nft-image/NFTModel";
import type { BaseRendererProps } from "@/components/nft-image/types/renderer-props";
import { Col } from "react-bootstrap";

export default function NFTModelRenderer(props: Readonly<BaseRendererProps>) {
  // Only render if NFT has metadata (i.e., it's a BaseNFT, not NFTLite)
  if (!("metadata" in props.nft)) {
    return null;
  }

  const animationClassName = styles["nftAnimation"] ?? "";

  return (
    <Col
      className={`${animationClassName} ${props.imageStyle} ${props.bgStyle} d-flex justify-content-center align-items-center`}
    >
      {props.showBalance && (
        <NFTImageBalance
          contract={props.nft.contract}
          tokenId={props.nft.id}
          height={props.height}
        />
      )}
      <NFTModel nft={props.nft} id={props.id} />
    </Col>
  );
}
