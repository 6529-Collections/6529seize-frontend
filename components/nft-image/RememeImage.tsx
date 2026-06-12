import styles from "@/components/nft-image/NFTImage.module.scss";
import { Col } from "react-bootstrap";
import type { Rememe } from "@/entities/INFT";
import Image from "next/image";
import { parseIpfsUrl, parseIpfsUrlToGateway } from "@/helpers/Helpers";

interface Props {
  nft: Rememe;
  animation: boolean;
  height: 300 | 650;
}

function getText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function addFallbackUrl(urls: string[], value: unknown) {
  const url = getText(value);
  if (url) {
    urls.push(url);
  }
}

function addParsedFallbackUrls(
  urls: string[],
  value: unknown,
  gatewayFirst = true
) {
  const url = getText(value);
  if (!url) {
    return;
  }

  const parsedUrl = parseIpfsUrl(url);
  const gatewayUrl = parseIpfsUrlToGateway(url);
  if (gatewayFirst) {
    addFallbackUrl(urls, gatewayUrl);
    addFallbackUrl(urls, parsedUrl);
    return;
  }

  addFallbackUrl(urls, parsedUrl);
  addFallbackUrl(urls, gatewayUrl);
}

function getImageAlt(nft: Rememe): string {
  return getText(nft.metadata?.name) || `#${nft.id}`;
}

export default function RememeImage(props: Readonly<Props>) {
  const imageFallbackUrls = getImageFallbackUrls();
  const videoFallbackUrls = getVideoFallbackUrls();
  const imageAlt = getImageAlt(props.nft);

  function getImageFallbackUrls() {
    const urls: string[] = [];
    if (props.height === 300) {
      addFallbackUrl(urls, props.nft.s3_image_thumbnail);
    }
    addFallbackUrl(urls, props.nft.s3_image_scaled);
    addFallbackUrl(urls, props.nft.s3_image_original);

    const image = getText(props.nft.image);
    if (image.toLowerCase().startsWith("data")) {
      addFallbackUrl(urls, image);
    } else {
      addParsedFallbackUrls(urls, image);
      addParsedFallbackUrls(urls, props.nft.metadata?.image);
      addFallbackUrl(urls, props.nft.contract_opensea_data?.imageUrl);
    }
    return urls;
  }

  function getVideoFallbackUrls() {
    const urls: string[] = [];
    const image = getText(props.nft.image);

    if (image.endsWith(".mp4")) {
      addParsedFallbackUrls(urls, image, false);
    }

    addParsedFallbackUrls(urls, props.nft.metadata?.animation, false);

    return urls;
  }

  function isMp4() {
    return (
      props.nft.metadata?.animation_details?.format &&
      props.nft.metadata.animation_details.format.toLowerCase() === "mp4"
    );
  }

  if (
    (props.animation && props.nft.animation && isMp4()) ||
    getText(props.nft.image).endsWith(".mp4")
  ) {
    return (
      <Col
        className={`${styles["nftAnimation"]} ${
          props.height === 650 ? styles["height650"] : styles["height300"]
        } d-flex justify-content-center align-items-center`}
      >
        <video
          id={`${props.nft.contract}-${props.nft.id}`}
          autoPlay={props.animation}
          muted
          controls
          loop
          playsInline
          src={videoFallbackUrls[0]}
          onError={({ currentTarget }) => {
            const nextFallback = videoFallbackUrls.shift();
            if (nextFallback) {
              currentTarget.src = nextFallback;
            }
          }}
        ></video>
      </Col>
    );
  }

  if (!imageFallbackUrls[0]) {
    return (
      <Col
        xs={12}
        className={`mb-2 text-center d-flex align-items-center justify-content-center ${
          styles["imageWrapper"]
        } ${props.height === 300 ? styles["height300"] : ""}`}
      >
        <div
          role="img"
          aria-label={imageAlt}
          className={props.height === 650 ? styles["height650"] : ""}
        />
      </Col>
    );
  }

  return (
    <Col
      xs={12}
      className={`mb-2 text-center d-flex align-items-center justify-content-center ${
        styles["imageWrapper"]
      } ${props.height === 300 ? styles["height300"] : ""}`}
    >
      <Image
        unoptimized
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
        src={imageFallbackUrls[0]}
        onError={({ currentTarget }) => {
          const nextFallback = imageFallbackUrls.shift();
          if (nextFallback) {
            currentTarget.src = nextFallback;
          }
        }}
        alt={imageAlt}
        className={props.height === 650 ? styles["height650"] : ""}
      />
    </Col>
  );
}
