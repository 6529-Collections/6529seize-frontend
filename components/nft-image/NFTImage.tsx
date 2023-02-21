import styles from "./NFTImage.module.scss";
import { Col } from "react-bootstrap";
import { BaseNFT } from "../../entities/INFT";
import Image from "next/image";
import { useEffect } from "react";

interface Props {
  nft: BaseNFT;
  animation: boolean;
  showThumbnail?: boolean;
  showOriginal?: boolean;
  height: 300 | 650;
  balance: number;
  showOwned?: boolean;
  transparentBG?: boolean;
  id?: string;
  missing?: boolean;
  onLoad?: () => void;
}

export default function NFTImage(props: Props) {
  useEffect(() => {
    if (props.onLoad) {
      props.onLoad();
    }
  }, []);

  if (
    props.animation &&
    props.nft.animation &&
    props.nft.metadata.animation_details?.format == "HTML"
  ) {
    return (
      <Col
        className={`text-center ${styles.nftAnimation} ${
          props.transparentBG ? styles.transparentBG : ""
        }`}>
        {props.balance > 0 && (
          <span
            className={`${styles.balance}  ${
              props.height == 650 ? styles.balanceBigger : ""
            }`}>
            <span>{props.height == 650 && "SEIZED "}x</span>
            {props.balance}
          </span>
        )}
        <iframe
          src={props.nft.animation}
          onError={({ currentTarget }) => {
            currentTarget.src = props.nft.metadata.animation;
          }}
          id={`${props.id && `${props.id}`}`}
        />
      </Col>
    );
  }

  if (
    props.animation &&
    props.nft.animation &&
    props.nft.metadata.animation_details?.format == "MP4"
  ) {
    return (
      <Col
        className={`text-center ${styles.nftAnimation} ${
          props.height == 650 ? styles.height650 : styles.height300
        } ${
          props.transparentBG ? styles.transparentBG : ""
        } d-flex justify-content-center align-items-center`}>
        {props.balance > 0 && (
          <span
            className={`${styles.balance}  ${
              props.height == 650 ? styles.balanceBigger : ""
            }`}>
            <span>{props.height == 650 && "SEIZED "}x</span>
            {props.balance}
          </span>
        )}
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
            if (currentTarget.src == props.nft.compressed_animation) {
              currentTarget.src = props.nft.animation;
            } else {
              currentTarget.src = props.nft.metadata.animation;
            }
          }}></video>
      </Col>
    );
  }

  return (
    <Col
      xs={12}
      className={`text-center d-flex align-items-center justify-content-center ${
        styles.imageWrapper
      } ${props.height == 300 ? styles.height300 : ""} ${
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
          if (currentTarget.src == props.nft.thumbnail) {
            currentTarget.src = props.nft.scaled
              ? props.nft.scaled
              : props.nft.image;
          } else if (currentTarget.src == props.nft.scaled) {
            currentTarget.src = props.nft.image;
          } else {
            currentTarget.src = props.nft.metadata.image;
          }
        }}
        alt={props.nft.name}
        className={props.height == 650 ? styles.height650 : ""}
      />
      {props.balance > 0 && (
        <span
          className={`${styles.balance}  ${
            props.height == 650 ? styles.balanceBigger : ""
          }`}>
          <span>{props.height == 650 && "SEIZED "}x</span>
          {props.balance}
        </span>
      )}
      {props.missing && <span className={`${styles.balance}`}>NOT SEIZED</span>}
      {props.showOwned && (
        <span
          className={`${styles.balance}  ${
            props.height == 650 ? styles.balanceBigger : ""
          }`}>
          SEIZED
        </span>
      )}
    </Col>
  );
}
