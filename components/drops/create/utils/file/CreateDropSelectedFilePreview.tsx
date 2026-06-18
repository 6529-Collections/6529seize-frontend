import type { JSX } from "react";
import { useObjectUrl } from "@/hooks/useObjectUrl";
import SeizeVideoPlayer from "@/components/drops/view/item/content/media/SeizeVideoPlayer";

enum FILE_TYPES {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  AUDIO = "AUDIO",
  UNKNOWN = "UNKNOWN",
}

const getFileType = (file: File): FILE_TYPES => {
  if (file.type.includes("image")) {
    return FILE_TYPES.IMAGE;
  }
  if (file.type.includes("video")) {
    return FILE_TYPES.VIDEO;
  }
  if (file.type.includes("audio")) {
    return FILE_TYPES.AUDIO;
  }
  return FILE_TYPES.UNKNOWN;
};

export default function CreateDropSelectedFilePreview({
  file,
}: {
  readonly file: File;
}) {
  const fileType = getFileType(file);
  const previewFile = fileType === FILE_TYPES.UNKNOWN ? null : file;
  const previewUrl = useObjectUrl(previewFile);

  const components: Record<FILE_TYPES, JSX.Element> = {
    [FILE_TYPES.IMAGE]: previewUrl ? (
      // Keep a plain img here because local blob previews cannot be optimized by next/image.
      <img
        src={previewUrl}
        alt=""
        className="tw-h-full tw-w-full tw-object-contain tw-object-center"
      />
    ) : (
      <></>
    ),
    [FILE_TYPES.VIDEO]: previewUrl ? (
      <SeizeVideoPlayer
        src={previewUrl}
        template="watch-media"
        muted
        preload="metadata"
        layout="fill"
        showActions={false}
      />
    ) : (
      <></>
    ),
    [FILE_TYPES.AUDIO]: previewUrl ? (
      <audio className="tw-w-full" controls>
        <source src={previewUrl} type={file.type} />
        Your browser does not support the audio tag.
      </audio>
    ) : (
      <></>
    ),
    [FILE_TYPES.UNKNOWN]: <></>,
  };

  return (
    <div className="tw-mt-2 tw-flex tw-gap-x-3">
      <div className="tw-h-full tw-w-full">{components[fileType]}</div>
    </div>
  );
}
