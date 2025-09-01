"use client";

import { Col } from "react-bootstrap";
import styles from "../NFTImage.module.scss";
import NFTImageBalance from "../NFTImageBalance";
import { BaseRendererProps } from "../types/renderer-props";

export default function NFTHTMLRenderer(props: BaseRendererProps) {
  return (
    <Col
      className={`${styles.nftAnimation} ${props.heightStyle} ${props.imageStyle} ${props.bgStyle} d-flex justify-content-center align-items-center`}>
      <NFTImageBalance 
        balance={props.balance}
        showOwned={props.showOwned}
        showUnseized={props.showUnseized}
        height={props.height}
      />
      <iframe
        title={props.id}
        src={
          "metadata" in props.nft && props.nft.metadata.animation
            ? props.nft.metadata.animation
            : props.nft.metadata.animation_url
        }
        id={props.id ?? `iframe-${props.nft.id}`}
      />
    </Col>
  );
}