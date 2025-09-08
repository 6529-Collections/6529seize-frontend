"use client";

import { Col } from "react-bootstrap";

import styles from "../NFTImage.module.scss";
import NFTImageBalance from "../NFTImageBalance";
import NFTModel from "../NFTModel";
import { BaseRendererProps } from "../types/renderer-props";

export default function NFTModelRenderer(props: Readonly<BaseRendererProps>) {
  // Only render if NFT has metadata (i.e., it's a BaseNFT, not NFTLite)
  if (!("metadata" in props.nft)) {
    return null;
  }

  return (
    <Col
      className={`${styles.nftAnimation} ${props.imageStyle} ${props.bgStyle} d-flex justify-content-center align-items-center`}>
      <NFTImageBalance 
        showOwnedIfLoggedIn={props.showOwnedIfLoggedIn}
        showUnseizedIfLoggedIn={props.showUnseizedIfLoggedIn}
        contract={props.nft.contract}
        tokenId={props.nft.id}
        height={props.height}
      />
      <NFTModel nft={props.nft} id={props.id} />
    </Col>
  );
}
