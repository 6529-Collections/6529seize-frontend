import styles from "./NFTImage.module.scss";
import "@google/model-viewer";
import { BaseNFT } from "../../entities/INFT";

export default function NFTModel(props: Readonly<{ nft: BaseNFT }>) {
  return (
    <div className={styles.modelViewer} style={{ width: "100%" }}>
      <model-viewer
        src={props.nft.metadata.animation ?? props.nft.metadata.animation_url}
        alt={props.nft.name}
        auto-rotate
        camera-controls
        ar
        poster={props.nft.scaled}
        style={{ width: "100%", height: "100%" }}></model-viewer>
    </div>
  );
}
