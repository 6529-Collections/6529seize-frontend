import "@google/model-viewer";
import { BaseNFT } from "../../entities/INFT";

export default function NFTModel(
  props: Readonly<{ nft: BaseNFT; id?: string }>
) {
  return (
    <model-viewer
      id={props.id ?? `iframe-${props.nft.id}`}
      src={props.nft.metadata.animation ?? props.nft.metadata.animation_url}
      alt={props.nft.name}
      auto-rotate
      camera-controls
      ar
      poster={props.nft.scaled}></model-viewer>
  );
}
