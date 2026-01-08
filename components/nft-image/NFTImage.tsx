import type { BaseNFT, NFTLite } from "@/entities/INFT";
import styles from "./NFTImage.module.scss";
import NFTHTMLRenderer from "./renderers/NFTHTMLRenderer";
import NFTImageRenderer from "./renderers/NFTImageRenderer";
import NFTModelRenderer from "./renderers/NFTModelRenderer";
import NFTVideoRenderer from "./renderers/NFTVideoRenderer";
import { getMediaType } from "./utils/media-type";

interface Props {
  nft: BaseNFT | NFTLite;
  animation: boolean;
  showThumbnail?: boolean | undefined;
  showOriginal?: boolean | undefined;
  height: 300 | 650 | "full";
  targetProfile?: string | undefined;
  showBalance: boolean;
  transparentBG?: boolean | undefined;
  id?: string | undefined;
}

export default function NFTImage(props: Readonly<Props>) {
  const styleConfig = {
    height: {
      full: { heightStyle: "", imageStyle: styles["heightFull"] },
      650: { heightStyle: "", imageStyle: styles["height650"] },
      300: { heightStyle: styles["height300"], imageStyle: "" },
    },
  };

  const { heightStyle, imageStyle } = styleConfig.height[props.height];
  const bgStyle = props.transparentBG ? styles["transparentBG"] : "";

  const safeHeightStyle = heightStyle ?? "";
  const safeImageStyle = imageStyle ?? "";
  const safeBgStyle = bgStyle ?? "";

  const mediaType = getMediaType(props.nft, props.animation);

  const rendererProps = {
    ...props,
    heightStyle: safeHeightStyle,
    imageStyle: safeImageStyle,
    bgStyle: safeBgStyle,
  };

  switch (mediaType) {
    case "html":
      return <NFTHTMLRenderer {...rendererProps} />;
    case "glb":
      return <NFTModelRenderer {...rendererProps} />;
    case "video":
      return <NFTVideoRenderer {...rendererProps} />;
    case "image":
    default:
      return <NFTImageRenderer {...rendererProps} />;
  }
}
