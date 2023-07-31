import styles from "./NFTImage.module.scss";
import { Col } from "react-bootstrap";
import { Rememe } from "../../entities/INFT";
import Image from "next/image";
import { parseIpfsUrl, parseIpfsUrlToGateway } from "../../helpers/Helpers";

interface Props {
  nft: Rememe;
  animation: boolean;
  height: 300 | 650;
}

export default function RememeImage(props: Props) {
  const fallbackUrls = getFallbackUrls();

  function getFallbackUrls() {
    const urls = [];
    if (props.height === 300 && props.nft.s3_image_thumbnail) {
      urls.push(props.nft.s3_image_thumbnail);
    }
    if (props.nft.s3_image_scaled) {
      urls.push(props.nft.s3_image_scaled);
    }
    if (props.nft.s3_image_original) {
      urls.push(props.nft.s3_image_original);
    }
    urls.push(parseIpfsUrlToGateway(props.nft.image));
    urls.push(parseIpfsUrl(props.nft.image));
    if (props.nft.metadata.image) {
      urls.push(parseIpfsUrlToGateway(props.nft.metadata.image));
      urls.push(parseIpfsUrl(props.nft.metadata.image));
    }
    urls.push(props.nft.contract_opensea_data.imageUrl);
    return urls;
  }

  function isMp4() {
    return (
      props.nft.metadata.animation_details &&
      props.nft.metadata.animation_details.format &&
      props.nft.metadata.animation_details.format.toLowerCase() == "mp4"
    );
  }

  if (props.animation && props.nft.animation && isMp4()) {
    return (
      <Col
        className={`${styles.nftAnimation} ${
          props.height == 650 ? styles.height650 : styles.height300
        } d-flex justify-content-center align-items-center`}>
        <video
          id={`${props.nft.contract}-${props.nft.id}`}
          autoPlay
          muted
          controls
          loop
          playsInline
          src={parseIpfsUrl(props.nft.animation)}
          onError={({ currentTarget }) => {
            if (currentTarget.src == props.nft.animation) {
              currentTarget.src = parseIpfsUrl(props.nft.metadata.animation);
            } else if (
              currentTarget.src == parseIpfsUrl(props.nft.metadata.animation)
            ) {
              currentTarget.src = parseIpfsUrlToGateway(
                props.nft.metadata.animation
              );
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
      } ${props.height == 300 ? styles.height300 : ""}`}>
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
        id={`${props.nft.contract}-${props.nft.id}`}
        src={fallbackUrls[0]}
        onError={({ currentTarget }) => {
          const nextFallback = fallbackUrls.shift();
          if (nextFallback) {
            currentTarget.src = nextFallback;
          }
        }}
        alt={props.nft.metadata.name}
        className={props.height == 650 ? styles.height650 : ""}
      />
    </Col>
  );
}
