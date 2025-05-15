import type { JSX } from "react";
enum FILE_TYPES {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  AUDIO = "AUDIO",
  UNKNOWN = "UNKNOWN",
}

export default function CreateDropSelectedFilePreview({
  file,
}: {
  readonly file: File;
}) {
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

  const fileType = getFileType(file);

  const components: Record<FILE_TYPES, JSX.Element> = {
    [FILE_TYPES.IMAGE]: (
      <img
        src={URL.createObjectURL(file)}
        alt=""
        className="tw-w-full tw-h-full tw-object-center tw-object-contain"
      />
    ),
    [FILE_TYPES.VIDEO]: (
      <video className="tw-w-full tw-h-full" controls>
        <source src={URL.createObjectURL(file)} type={file.type} />
        Your browser does not support the video tag.
      </video>
    ),
    [FILE_TYPES.AUDIO]: (
      <audio className="tw-w-full" controls>
        <source src={URL.createObjectURL(file)} type={file.type} />
        Your browser does not support the audio tag.
      </audio>
    ),
    [FILE_TYPES.UNKNOWN]: <></>,
  };

  return (
    <div className="tw-mt-2 tw-flex tw-gap-x-3">
      <div className="tw-h-full tw-w-full">{components[fileType]}</div>
    </div>
  );
}
