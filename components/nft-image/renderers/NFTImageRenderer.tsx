import { Col } from "react-bootstrap";
import Image from "next/image";
import styles from "../NFTImage.module.scss";
import NFTImageBalance from "../NFTImageBalance";
import { BaseRendererProps } from "../types/renderer-props";

export default function NFTImageRenderer(props: BaseRendererProps) {
  return (
    <Col
      xs={12}
      className={`mb-2 text-center d-flex align-items-center justify-content-center ${styles.imageWrapper} ${props.heightStyle} ${props.bgStyle}`}>
      <Image
        loading="eager"
        priority
        width="0"
        height="0"
        fetchPriority="high"
        className={props.imageStyle}
        style={{
          height: "auto",
          width: "auto",
          maxWidth: "100%",
          maxHeight: "100%",
        }}
        id={props.id ?? `image-${props.nft.id}`}
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
      />
      <NFTImageBalance 
        balance={props.balance}
        showOwned={props.showOwned}
        showUnseized={props.showUnseized}
        height={props.height}
      />
    </Col>
  );
}
