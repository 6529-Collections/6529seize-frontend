import styles from "./NFTImage.module.scss";
import { Col } from "react-bootstrap";
import { BaseNFT, NFTLite } from "../../entities/INFT";
import Image from "next/image";
import { useEffect } from "react";

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

function getId(nft: BaseNFT | NFTLite, id?: string) {
  if (id) {
    return id;
  }
  return `nft-image-${nft.contract}-${nft.id}`;
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
    return <NFTImageHTML {...props} />;
  }

  if (
    props.animation &&
    props.nft.animation &&
    "metadata" in props.nft &&
    (props.nft.metadata.animation_details?.format === "MP4" ||
      props.nft.metadata.animation_details?.format === "MOV")
  ) {
    return <NFTImageVideo {...props} />;
  }

  return <NFTImageImage {...props} />;
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

export function NFTImageHTML(props: Readonly<Props>) {
  const id = getId(props.nft, props.id);
  let src = (props.nft as any).metadata?.animation;
  if (!src) {
    src = (props.nft as any).metadata?.animation_url;
  }
  return (
    <Col
      className={`${styles.nftAnimation} ${
        props.transparentBG ? styles.transparentBG : ""
      } d-flex justify-content-center align-items-center`}>
      <NFTImageBalance {...props} />
      <iframe title={props.nft.name} height={props.height} src={src} id={id} />
    </Col>
  );
}

export function NFTImageVideo(props: Readonly<Props>) {
  const id = getId(props.nft, props.id);
  let src = (props.nft as any).metadata?.animation;
  if (!src) {
    src = (props.nft as any).metadata?.animation_url;
  }
  if (!props.showOriginal && (props.nft as any).compressed_animation) {
    src = (props.nft as any).compressed_animation;
  }

  return (
    <Col
      className={`${styles.nftAnimation} ${
        props.height === 650 ? styles.height650 : styles.height300
      } ${
        props.transparentBG ? styles.transparentBG : ""
      } d-flex justify-content-center align-items-center`}>
      <NFTImageBalance {...props} />
      <video
        id={id}
        autoPlay
        muted
        controls
        loop
        playsInline
        src={src}
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

export function NFTImageImage(props: Readonly<Props>) {
  const id = getId(props.nft, props.id);
  let imgSrc = "";
  if (props.showThumbnail) {
    imgSrc = props.nft.thumbnail;
  } else if (props.nft.scaled && !props.showOriginal) {
    imgSrc = props.nft.scaled;
  } else {
    imgSrc = props.nft.image;
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
        id={id}
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
        src={imgSrc}
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
