import { Col } from "react-bootstrap";
import styles from "../NFTImage.module.scss";
import NFTImageBalance from "../NFTImageBalance";
import { BaseRendererProps } from "../types/renderer-props";

export default function NFTVideoRenderer(props: Readonly<BaseRendererProps>) {
  return (
    <Col
      className={`${styles.nftAnimation} ${props.heightStyle} ${props.bgStyle} d-flex justify-content-center align-items-center`}
    >
      <NFTImageBalance
        showOwnedIfLoggedIn={props.showOwnedIfLoggedIn}
        showUnseizedIfLoggedIn={props.showUnseizedIfLoggedIn}
        contract={props.nft.contract}
        tokenId={props.nft.id}
        height={props.height}
      />
      <video
        id={props.id ?? `video-${props.nft.id}`}
        autoPlay
        muted
        controls
        loop
        playsInline
        preload="auto"
        src={
          !props.showOriginal &&
          "metadata" in props.nft &&
          props.nft.compressed_animation
            ? props.nft.compressed_animation
            : props.nft.animation
        }
        className={props.imageStyle}
   
      ></video>
    </Col>
  );
}
