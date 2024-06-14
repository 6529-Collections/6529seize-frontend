import styles from "./NFTImage.module.scss";
import { Col } from "react-bootstrap";
import { BaseNFT, NFTLite } from "../../entities/INFT";
import Image from "next/image";
import { useEffect } from "react";
import NFTModel from "./NFTModel";

interface Props {
  nft: BaseNFT | NFTLite;
  animation: boolean;
  showThumbnail?: boolean;
  showOriginal?: boolean;
  height: 300 | 650;
  balance: number;
  showOwned?: boolean;
  transparentBG?: boolean;
  id?: string;
  showUnseized: boolean;
  onLoad?: () => void;
}

export default function NFTImage(props: Readonly<Props>) {
  useEffect(() => {
    if (props.onLoad) {
      props.onLoad();
    }
  }, []);

  if (
    props.animation &&
    props.nft.animation &&
    "metadata" in props.nft &&
    props.nft.metadata.animation_details?.format === "HTML"
  ) {
    return (
      <Col
        className={`${styles.nftAnimation} ${
          props.transparentBG ? styles.transparentBG : ""
        } d-flex justify-content-center align-items-center`}>
        <NFTImageBalance {...props} />
        <iframe
          src={
            props.nft.metadata.animation
              ? props.nft.metadata.animation
              : props.nft.metadata.animation_url
          }
          id={`${props.id && `${props.id}`}`}
        />
      </Col>
    );
  }

  if (
    props.animation &&
    props.nft.animation &&
    "metadata" in props.nft &&
    props.nft.metadata.animation_details?.format === "GLB"
  ) {
    return (
      <Col
        className={`${styles.nftAnimation} ${
          props.transparentBG ? styles.transparentBG : ""
        } d-flex justify-content-center align-items-center`}>
        <NFTImageBalance {...props} />
        <NFTModel nft={props.nft} />
      </Col>
    );
  }

  if (
    props.animation &&
    props.nft.animation &&
    "metadata" in props.nft &&
    (props.nft.metadata.animation_details?.format === "MP4" ||
      props.nft.metadata.animation_details?.format === "MOV")
  ) {
    return (
      <Col
        className={`${styles.nftAnimation} ${
          props.height === 650 ? styles.height650 : styles.height300
        } ${
          props.transparentBG ? styles.transparentBG : ""
        } d-flex justify-content-center align-items-center`}>
        <NFTImageBalance {...props} />
        <video
          id={`${props.id && `${props.id}`}`}
          autoPlay
          muted
          controls
          loop
          playsInline
          src={
            !props.showOriginal && props.nft.compressed_animation
              ? props.nft.compressed_animation
              : props.nft.animation
          }
          poster={props.nft.scaled ? props.nft.scaled : props.nft.image}
          onError={({ currentTarget }) => {
            if (
              "metadata" in props.nft &&
              currentTarget.src === props.nft.compressed_animation
            ) {
              currentTarget.src = props.nft.animation;
            } else if ("metadata" in props.nft) {
              currentTarget.src = props.nft.metadata.animation;
            }
          }}></video>
      </Col>
    );
  }

  return (
    <Col
      xs={12}
      className={`mb-2 text-center d-flex align-items-center justify-content-center ${
        styles.imageWrapper
      } ${props.height === 300 ? styles.height300 : ""} ${
        props.transparentBG && styles.transparentBG
      }`}>
      <Image
        loading="eager"
        priority
        width="0"
        height="0"
        style={{
          height: "auto",
          width: "auto",
          maxWidth: "100%",
          maxHeight: "100%",
        }}
        id={`${props.id && `${props.id}`}`}
        src={
          props.showThumbnail
            ? props.nft.thumbnail
            : props.nft.scaled && !props.showOriginal
            ? props.nft.scaled
            : props.nft.image
        }
        onError={({ currentTarget }) => {
          if (currentTarget.src === props.nft.thumbnail) {
            currentTarget.src = props.nft.scaled
              ? props.nft.scaled
              : props.nft.image;
          } else if (currentTarget.src === props.nft.scaled) {
            currentTarget.src = props.nft.image;
          } else if ("metadata" in props.nft) {
            currentTarget.src = props.nft.metadata.image;
          }
        }}
        alt={props.nft.name}
        className={props.height === 650 ? styles.height650 : ""}
      />
      <NFTImageBalance {...props} />
    </Col>
  );
}

export function NFTImageBalance(props: Readonly<Props>) {
  return (
    <>
      {props.balance > 0 && (
        <span
          className={`${styles.balance}  ${
            props.height === 650 ? styles.balanceBigger : ""
          }`}>
          <span>SEIZED{!props.showOwned ? ` x${props.balance}` : ""}</span>
        </span>
      )}
      {props.showUnseized && props.balance === 0 && (
        <span className={`${styles.balance}`}>UNSEIZED</span>
      )}
      {props.showUnseized && props.balance === -1 && (
        <span className={`${styles.balance}`}>...</span>
      )}
    </>
  );
}
