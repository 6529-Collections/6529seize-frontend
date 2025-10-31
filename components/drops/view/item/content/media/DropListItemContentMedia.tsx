import dynamic from "next/dynamic";
import { assertUnreachable } from "@/helpers/AllowlistToolHelpers";
import DropListItemContentMediaAudio from "./DropListItemContentMediaAudio";
import { ImageScale } from "@/helpers/image.helpers";

import DropListItemContentMediaImage from "./DropListItemContentMediaImage";
import DropListItemContentMediaVideo from "./DropListItemContentMediaVideo";

enum MediaType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  AUDIO = "AUDIO",
  GLB = "GLB",
  UNKNOWN = "UNKNOWN",
}

const DropListItemContentMediaGLB = dynamic(
  () => import("./DropListItemContentMediaGLB"),
  {
    ssr: false,
  }
);

export default function DropListItemContentMedia({
  media_mime_type,
  media_url,
  onContainerClick,
  isCompetitionDrop = false,
  imageScale = ImageScale.AUTOx450,
}: {
  readonly media_mime_type: string;
  readonly media_url: string;
  readonly onContainerClick?: () => void;
  readonly isCompetitionDrop?: boolean;
  readonly imageScale?: ImageScale;
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
    if (media_mime_type === "model/gltf-binary" || 
        media_mime_type === "model/gltf+json" ||
        media_url.endsWith(".glb") || 
        media_url.endsWith(".gltf")) {
      return MediaType.GLB;
    }
    return MediaType.UNKNOWN;
  };
  

  const mediaType = getMediaType();

  switch (mediaType) {
    case MediaType.IMAGE:
      return (
        <DropListItemContentMediaImage
          src={media_url}
          onContainerClick={onContainerClick}
          isCompetitionDrop={isCompetitionDrop}
          imageScale={imageScale}
        />
      );
    case MediaType.VIDEO:
      return <DropListItemContentMediaVideo src={media_url} />;
    case MediaType.AUDIO:
      return <DropListItemContentMediaAudio src={media_url} />;
    case MediaType.GLB:
      return <DropListItemContentMediaGLB src={media_url} />;
    case MediaType.UNKNOWN:
      return <></>;
    default:
      assertUnreachable(mediaType);
  }
}
