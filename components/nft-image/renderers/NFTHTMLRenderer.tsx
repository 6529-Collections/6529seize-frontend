"use client";

import { Col } from "react-bootstrap";
import styles from "../NFTImage.module.scss";
import NFTImageBalance from "../NFTImageBalance";
import type { BaseRendererProps } from "../types/renderer-props";
import { getResolvedAnimationSrc } from "../utils/animation-source";

function getSrc(nft: BaseRendererProps["nft"]): string | undefined {
  return getResolvedAnimationSrc(nft);
}

export default function NFTHTMLRenderer(props: Readonly<BaseRendererProps>) {
  const src = getSrc(props.nft);
  const animationClassName = styles["nftAnimation"] ?? "";

  return (
    <Col
      className={`${animationClassName} ${props.heightStyle} ${props.imageStyle} ${props.bgStyle} d-flex justify-content-center align-items-center`}
    >
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
