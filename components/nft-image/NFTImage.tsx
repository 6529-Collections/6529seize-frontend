import styles from "./NFTImage.module.scss";
import { Col } from "react-bootstrap";
import { NFT } from "../../entities/INFT";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

interface Props {
  nft: NFT;
  animation: boolean;
  showThumbnail?: boolean;
  height: 300 | 650;
  balance: number;
  showOwned?: boolean;
  transparentBG?: boolean;
  id?: string;
  missing?: boolean;
}

export default function NFTImage(props: Props) {
  const [revealMissing, setRevealMissing] = useState(false);

  if (
    props.animation &&
    props.nft.animation &&
    props.nft.metadata.animation_details?.format == "HTML"
  ) {
    return (
      <Col
        className={`${styles.nftAnimation} height${props.height} ${
          props.transparentBG && styles.transparentBG
        }`}>
        <iframe src={props.nft.animation} id={`${props.id && `${props.id}`}`} />
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
        className={`${styles.nftAnimation} height${props.height} ${
          props.transparentBG && styles.transparentBG
        }`}>
        <video
          id={`${props.id && `${props.id}`}`}
          autoPlay
          muted
          controls
          src={props.nft.animation}
          poster={props.nft.thumbnail}
          onError={({ currentTarget }) => {
            currentTarget.src = props.nft.metadata.animation;
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
      <img
        id={`${props.id && `${props.id}`}`}
        src={props.showThumbnail ? props.nft.thumbnail : props.nft.image}
        onError={({ currentTarget }) => {
          if (currentTarget.src == props.nft.thumbnail) {
            currentTarget.src = props.nft.image;
          } else {
            currentTarget.src = props.nft.metadata.image;
          }
        }}
        alt={props.nft.name}
        className={`${styles.tokenImg} ${
          props.height == 650 ? styles.height650 : ""
        } ${props.missing ? styles.nftGreyscale : ""}`}
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
