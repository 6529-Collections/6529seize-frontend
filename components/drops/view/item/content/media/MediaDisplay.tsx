import dynamic from "next/dynamic";
import { assertUnreachable } from "../../../../../../helpers/AllowlistToolHelpers";

// Import the media display components
import MediaDisplayImage from "./MediaDisplayImage";
import MediaDisplayVideo from "./MediaDisplayVideo";
import MediaDisplayAudio from "./MediaDisplayAudio";

enum MediaType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  AUDIO = "AUDIO",
  GLB = "GLB",
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
}: {
  readonly media_mime_type: string;
  readonly media_url: string;
  readonly disableMediaInteraction?: boolean; // Set to true in gallery context to disable all media interaction (controls and click handlers)
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
    if (media_url.endsWith(".glb")) {
      return MediaType.GLB;
    }
    return MediaType.UNKNOWN;
  };

  const mediaType = getMediaType();

  switch (mediaType) {
    case MediaType.IMAGE:
      return <MediaDisplayImage src={media_url} />;
    case MediaType.VIDEO:
      return <MediaDisplayVideo 
        src={media_url} 
        showControls={!disableMediaInteraction} 
        disableClickHandler={disableMediaInteraction} 
      />;
    case MediaType.AUDIO:
      return <MediaDisplayAudio src={media_url} showControls={!disableMediaInteraction} />;
    case MediaType.GLB:
      return <MediaDisplayGLB src={media_url} />;
    case MediaType.UNKNOWN:
      return <></>;
    default:
      assertUnreachable(mediaType);
  }
}