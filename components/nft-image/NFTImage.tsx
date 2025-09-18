import styles from "./NFTImage.module.scss";
import { BaseNFT, NFTLite } from "../../entities/INFT";
import { getMediaType } from "./utils/media-type";
import NFTImageRenderer from "./renderers/NFTImageRenderer";
import NFTVideoRenderer from "./renderers/NFTVideoRenderer";
import NFTHTMLRenderer from "./renderers/NFTHTMLRenderer";
import NFTModelRenderer from "./renderers/NFTModelRenderer";

interface Props {
  nft: BaseNFT | NFTLite;
  animation: boolean;
  showThumbnail?: boolean;
  showOriginal?: boolean;
  height: 300 | 650 | "full";
  targetProfile?: string;
  showOwnedIfLoggedIn: boolean;
  showUnseizedIfLoggedIn: boolean;
  transparentBG?: boolean;
  id?: string;
  priority?: boolean;
  sizes?: string;
}

export default function NFTImage(props: Readonly<Props>) {
  const styleConfig = {
    height: {
      full: { heightStyle: "", imageStyle: styles.heightFull },
      650: { heightStyle: "", imageStyle: styles.height650 },
      300: { heightStyle: styles.height300, imageStyle: "" },
    },
  };

  const { heightStyle, imageStyle } = styleConfig.height[props.height];
  const bgStyle = props.transparentBG ? styles.transparentBG : "";

  const mediaType = getMediaType(props.nft, props.animation);

  const rendererProps = {
    ...props,
    heightStyle,
    imageStyle,
    bgStyle,
    priority: props.priority,
    sizes: props.sizes ?? "100vw",
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
