"use client";

import { Col } from "react-bootstrap";
import styles from "../NFTImage.module.scss";
import NFTImageBalance from "../NFTImageBalance";
import type { BaseRendererProps } from "../types/renderer-props";

function getSrc(nft: BaseRendererProps["nft"]): string | undefined {
  const hasMetadata = "metadata" in nft;
  const hasAnimation = hasMetadata && nft.metadata.animation;

  if (hasAnimation) {
    return nft.metadata.animation;
  } else if (hasMetadata) {
    return nft.metadata.animation_url;
  }

  return undefined;
}

export default function NFTHTMLRenderer(props: Readonly<BaseRendererProps>) {
  const src = getSrc(props.nft);

  return (
    <Col
      className={`${styles["nftAnimation"]} ${props.heightStyle} ${props.imageStyle} ${props.bgStyle} d-flex justify-content-center align-items-center`}>
      {props.showBalance && (
        <NFTImageBalance
          contract={props.nft.contract}
          tokenId={props.nft.id}
          height={props.height}
        />
      )}
      <iframe
        title={props.id}
        src={src}
        id={props.id ?? `iframe-${props.nft.id}`}
      />
    </Col>
  );
}
