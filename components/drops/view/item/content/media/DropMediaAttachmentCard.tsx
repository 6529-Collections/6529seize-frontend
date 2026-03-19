"use client";

import Download from "@/components/download/Download";
import { getFileInfoFromUrl } from "@/helpers/file.helpers";

export default function DropMediaAttachmentCard({
  src,
  mimeType,
}: {
  readonly src: string;
  readonly mimeType: string;
}) {
  const fileInfo = getFileInfoFromUrl(src);
  const extension =
    fileInfo?.extension ?? (mimeType === "text/csv" ? "csv" : "");
  const name = fileInfo?.name ?? "attachment";
  const displayName = extension ? `${name}.${extension}` : name;
  const label = mimeType === "text/csv" ? "CSV attachment" : "Attachment";

  return (
    <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-between tw-gap-4 tw-rounded-2xl tw-border tw-border-iron-700 tw-bg-iron-900/70 tw-p-5">
      <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-4">
        <div className="tw-flex tw-h-12 tw-w-12 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-2xl tw-bg-iron-800 tw-text-iron-200">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="tw-h-6 tw-w-6"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-8.25a2.25 2.25 0 0 0-2.25-2.25H8.25L4.5 7.5v10.5a2.25 2.25 0 0 0 2.25 2.25h6.75m0-9h6m-6 3h6m-6 3h3"
            />
          </svg>
        </div>
        <div className="tw-min-w-0">
          <div className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-[0.16em] tw-text-iron-400">
            {label}
          </div>
          <div className="tw-mt-1 tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100">
            {displayName}
          </div>
        </div>
      </div>
      <Download
        href={src}
        name={name}
        extension={extension}
        variant="text"
        alwaysShowText={true}
      />
    </div>
  );
}
