import "@google/model-viewer";
import type { BaseNFT } from "@/entities/INFT";
import { getResolvedAnimationSrc } from "./utils/animation-source";
import { withArweaveFallback } from "./utils/arweave-fallback";

export default function NFTModel(
  props: Readonly<{ nft: BaseNFT; id?: string | undefined }>
) {
  return (
    // @ts-ignore
    <model-viewer
      id={props.id ?? `iframe-${props.nft.id}`}
      src={getResolvedAnimationSrc(props.nft)}
      alt={props.nft.name}
      auto-rotate
      camera-controls
      ar
      onError={withArweaveFallback()}
      // @ts-ignore
      poster={props.nft.scaled}
    ></model-viewer>
  );
}
