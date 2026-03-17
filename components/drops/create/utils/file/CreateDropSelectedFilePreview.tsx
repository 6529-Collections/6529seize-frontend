import type { JSX } from "react";
enum FILE_TYPES {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  AUDIO = "AUDIO",
  CSV = "CSV",
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
    if (file.type === "text/csv" || file.name.toLowerCase().endsWith(".csv")) {
      return FILE_TYPES.CSV;
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
    [FILE_TYPES.CSV]: (
      <div className="tw-flex tw-h-full tw-min-h-32 tw-w-full tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-iron-700 tw-bg-iron-900/60 tw-p-6 tw-text-center">
        <div>
          <div className="tw-text-sm tw-font-semibold tw-text-iron-100">
            CSV attachment
          </div>
          <div className="tw-mt-1 tw-break-all tw-text-xs tw-text-iron-400">
            {file.name}
          </div>
        </div>
      </div>
    ),
    [FILE_TYPES.UNKNOWN]: <></>,
  };

  return (
    <div className="tw-mt-2 tw-flex tw-gap-x-3">
      <div className="tw-h-full tw-w-full">{components[fileType]}</div>
    </div>
  );
}
