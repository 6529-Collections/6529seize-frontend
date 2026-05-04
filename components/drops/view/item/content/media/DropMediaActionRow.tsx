"use client";

import MediaTypeBadge from "@/components/drops/media/MediaTypeBadge";
import CommonDropdownItemsDefaultWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsDefaultWrapper";
import { getMediaTypeInfo } from "@/helpers/file.helpers";
import {
  downloadMediaUrl,
  getDownloadFilenameFromUrl,
  triggerDirectDownload,
} from "@/helpers/media-download.helpers";
import useCapacitor from "@/hooks/useCapacitor";
import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useRef, useState } from "react";
import useDownloader from "react-use-downloader";

export default function DropMediaActionRow({
  mimeType,
  url,
}: {
  readonly mimeType: string;
  readonly url: string;
}) {
  const mediaInfo = getMediaTypeInfo(mimeType);
  const { isCapacitor } = useCapacitor();
  const { download } = useDownloader();
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const fileName = getDownloadFilenameFromUrl(url, mediaInfo.category);

  const itemClassName = clsx(
    "tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-gap-x-3",
    "tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-left",
    "tw-text-iron-300 tw-transition-colors tw-duration-200",
    "desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-100",
    "disabled:tw-cursor-default disabled:tw-opacity-60"
  );

  const handleOpen = () => {
    window.open(url, "_blank", "noopener,noreferrer");
    setIsOpen(false);
  };

  const handleDownload = async () => {
    if (isDownloading) {
      return;
    }

    setIsDownloading(true);
    setIsOpen(false);
    try {
      if (mimeType.includes("image") && !isCapacitor) {
        download(url, fileName);
      } else {
        await downloadMediaUrl({
          url,
          fileName,
          isCapacitor,
          dialogTitle: mimeType.includes("video") ? "Save video" : "Save file",
        });
      }
    } catch {
      triggerDirectDownload(url, fileName);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="tw-mt-0.5 tw-flex tw-min-h-12 tw-w-full tw-items-center tw-justify-between tw-gap-x-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2.5 tw-py-1.5">
      <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-x-2">
        <MediaTypeBadge
          mimeType={mimeType}
          showTooltip={false}
          size="sm"
          tone="color"
          iconClassName="tw-size-7 tw-bg-iron-800"
        />
        <div className="tw-flex tw-min-w-0 tw-flex-col">
          <span className="tw-min-w-0 tw-truncate tw-text-xs tw-font-medium tw-leading-4 tw-text-iron-100">
            {fileName}
          </span>
          <span className="tw-min-w-0 tw-truncate tw-text-[11px] tw-font-medium tw-leading-4 tw-text-iron-500">
            {mediaInfo.label}
          </span>
        </div>
      </div>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Media options"
        title="More"
        className="tw-inline-flex tw-size-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-text-iron-100 tw-transition desktop-hover:hover:tw-bg-iron-700"
      >
        <EllipsisHorizontalIcon className="tw-size-4" aria-hidden="true" />
      </button>
      <CommonDropdownItemsDefaultWrapper
        isOpen={isOpen}
        setOpen={setIsOpen}
        buttonRef={buttonRef}
      >
        <li className="tw-list-none">
          <div className="tw-flex tw-flex-col tw-gap-y-1 tw-py-1">
            <button
              type="button"
              onClick={handleOpen}
              className={itemClassName}
            >
              <ArrowTopRightOnSquareIcon
                className="tw-size-4 tw-flex-shrink-0"
                aria-hidden="true"
              />
              <span className="tw-text-sm tw-font-medium">
                {isCapacitor ? "Open in browser" : "Open in new tab"}
              </span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className={itemClassName}
            >
              <ArrowDownTrayIcon
                className="tw-size-4 tw-flex-shrink-0"
                aria-hidden="true"
              />
              <span className="tw-text-sm tw-font-medium">
                {isDownloading ? "Downloading" : "Download"}
              </span>
            </button>
          </div>
        </li>
      </CommonDropdownItemsDefaultWrapper>
    </div>
  );
}
