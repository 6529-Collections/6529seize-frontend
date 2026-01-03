import dynamic from "next/dynamic";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";

// Import the media display components
import MediaDisplayImage from "./MediaDisplayImage";
import { ImageScale } from "@/helpers/image.helpers";
import MediaDisplayVideo from "./MediaDisplayVideo";
import MediaDisplayAudio from "./MediaDisplayAudio";
import SandboxedExternalIframe from "@/components/common/SandboxedExternalIframe";

enum MediaType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  AUDIO = "AUDIO",
  GLB = "GLB",
  HTML = "HTML",
  UNKNOWN = "UNKNOWN",
}

const MediaDisplayGLB = dynamic(() => import("./MediaDisplayGLB"), {
  ssr: false,
});

/**
 * A component to display media content without interactive modal functionality.
 * Identical to DropListItemContentMedia but without art viewing modal functionality.
 * Use this when you want to simply display media in a container that has its own click behavior.
 */
export default function MediaDisplay({
  media_mime_type,
  media_url,
  disableMediaInteraction = false,
  imageScale = ImageScale.AUTOx600,
}: {
  readonly media_mime_type: string;
  readonly media_url: string;
  readonly disableMediaInteraction?: boolean | undefined; // Set to true in gallery context to disable all media interaction (controls and click handlers)
  readonly imageScale?: ImageScale | undefined;
}) {
  const getMediaType = (): MediaType => {
    if (media_mime_type.includes("image")) {
      return MediaType.IMAGE;
    }
    if (media_mime_type.includes("video")) {
      return MediaType.VIDEO;
    }
    if (media_mime_type.includes("audio")) {
      return MediaType.AUDIO;
    }
    if (
      media_mime_type === "model/gltf-binary" ||
      media_mime_type === "model/gltf+json" ||
      media_url.endsWith(".glb") ||
      media_url.endsWith(".gltf")
    ) {
      return MediaType.GLB;
    }
    if (media_mime_type === "text/html") {
      return MediaType.HTML;
    }
    return MediaType.UNKNOWN;
  };

  const mediaType = getMediaType();

  switch (mediaType) {
    case MediaType.IMAGE:
      return <MediaDisplayImage src={media_url} imageScale={imageScale} />;
    case MediaType.VIDEO:
      return (
        <MediaDisplayVideo
          src={media_url}
          showControls={!disableMediaInteraction}
          disableClickHandler={disableMediaInteraction}
        />
      );
    case MediaType.AUDIO:
      return (
        <MediaDisplayAudio
          src={media_url}
          showControls={!disableMediaInteraction}
        />
      );
    case MediaType.GLB:
      return (
        <MediaDisplayGLB
          src={media_url}
          disableMediaInteractions={disableMediaInteraction}
        />
      );
    case MediaType.HTML:
      return (
        <SandboxedExternalIframe
          title=""
          src={media_url.replace("ipfs://", "https://ipfs.io/ipfs/")}
          className="tw-h-full tw-w-full"
        />
      );
    case MediaType.UNKNOWN:
      return <></>;
    default:
      assertUnreachable(mediaType);
      return;
  }
}
