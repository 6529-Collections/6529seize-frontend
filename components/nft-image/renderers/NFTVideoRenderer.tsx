"use client";

import { Col } from "react-bootstrap";
import styles from "../NFTImage.module.scss";
import NFTImageBalance from "../NFTImageBalance";
import { BaseRendererProps } from "../types/renderer-props";

export default function NFTVideoRenderer(props: Readonly<BaseRendererProps>) {
  return (
    <Col
      className={`${styles.nftAnimation} ${props.heightStyle} ${props.bgStyle} d-flex justify-content-center align-items-center`}>
      <NFTImageBalance 
        balance={props.balance}
        showOwned={props.showOwned}
        showUnseized={props.showUnseized}
        height={props.height}
      />
      <video
        id={props.id ?? `video-${props.nft.id}`}
        autoPlay
        muted
        controls
        loop
        playsInline
        src={
          !props.showOriginal && "metadata" in props.nft && props.nft.compressed_animation
            ? props.nft.compressed_animation
            : props.nft.animation
        }
        className={props.imageStyle}
        poster={props.nft.scaled ? props.nft.scaled : props.nft.image}
        onError={({ currentTarget }) => {
          if (
            "metadata" in props.nft &&
            props.nft.compressed_animation &&
            currentTarget.src === props.nft.compressed_animation
          ) {
            currentTarget.src = props.nft.animation;
          } else if ("metadata" in props.nft && props.nft.metadata.animation) {
            currentTarget.src = props.nft.metadata.animation;
          }
        }}></video>
    </Col>
  );
}
