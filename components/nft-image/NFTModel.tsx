import "@google/model-viewer";
import { useEffect, useMemo, useRef } from "react";
import type { SyntheticEvent } from "react";
import type { BaseNFT } from "@/entities/INFT";
import { getResolvedAnimationSrc } from "./utils/animation-source";
import { withArweaveFallback } from "./utils/gateway-fallback";

type ModelViewerElement = HTMLElement & {
  src: string;
};

export default function NFTModel(
  props: Readonly<{ nft: BaseNFT; id?: string | undefined }>
) {
  const modelRef = useRef<ModelViewerElement | null>(null);
  const handleArweaveError = useMemo(() => withArweaveFallback(), []);

  useEffect(() => {
    const modelElement = modelRef.current;
    if (!modelElement) {
      return;
    }

    const nativeErrorHandler = (event: Event) => {
      const currentTarget = event.currentTarget as ModelViewerElement | null;
      if (!currentTarget) {
        return;
      }

      handleArweaveError({
        currentTarget,
      } as SyntheticEvent<ModelViewerElement, Event>);
    };

    modelElement.addEventListener("error", nativeErrorHandler);

    return () => {
      modelElement.removeEventListener("error", nativeErrorHandler);
    };
  }, [handleArweaveError]);

  return (
    // @ts-ignore
    <model-viewer
      ref={modelRef}
      id={props.id ?? `iframe-${props.nft.id}`}
      src={getResolvedAnimationSrc(props.nft)}
      alt={props.nft.name}
      auto-rotate
      camera-controls
      ar
      // @ts-ignore
      poster={props.nft.scaled}
    ></model-viewer>
  );
}
