"use client";

import { faDownload, faExternalLink } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import useDownloader from "@/hooks/useDownloader";
import type { NextGenToken } from "@/entities/INextgen";
import { numberWithCommas } from "@/helpers/Helpers";
import DotLoader, { Spinner } from "@/components/dotLoader/DotLoader";

export enum Resolution {
  "Thumbnail" = "Thumbnail",
  "0.5K" = "0.5K",
  "1K" = "1K",
  "2K" = "2K",
  "4K" = "4K",
  "8K" = "8K",
  "16K" = "16K",
}

function getUrl(token: NextGenToken, resolution: Resolution) {
  let u = token.image_url;
  if (
    (resolution == Resolution["1K"] && token.collection_id !== 1) ||
    (resolution == Resolution["2K"] && token.collection_id == 1)
  ) {
    return u;
  }
  if (resolution === Resolution["Thumbnail"]) {
    u = u.replace("/png/", `/thumbnail/`);
  } else {
    u = u.replace("/png/", `/png${resolution.toLowerCase()}/`);
  }
  return u;
}

type NextGenTokenProps = Readonly<{
  token: NextGenToken;
  resolution: Resolution;
  onSelect?: (() => void) | undefined;
}>;

function useImageChecker(token: NextGenToken, resolution: Resolution) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageExists, setImageExists] = useState(false);
  const [imageSize, setImageSize] = useState(0);

  useEffect(() => {
    setImageLoaded(false);
    setImageExists(false);
    setImageSize(0);
    const url = getUrl(token, resolution);
    fetch(url, { method: "HEAD" })
      .then((response) => {
        if (response.ok) {
          setImageExists(true);
          const contentLength = response.headers.get("content-length");
          if (contentLength) {
            const sizeBytes = parseInt(contentLength, 10);
            setImageSize(Math.round((sizeBytes / (1000 * 1000)) * 100) / 100);
          }
        } else {
          setImageExists(false);
        }
      })
      .catch(() => setImageExists(false))
      .finally(() => setImageLoaded(true));
  }, [token, resolution]);

  return { imageLoaded, imageExists, imageSize };
}

export function NextGenTokenDownloadDropdownItem(props: NextGenTokenProps) {
  const { imageLoaded, imageExists, imageSize } = useImageChecker(
    props.token,
    props.resolution
  );
  const downloader = useDownloader();

  return (
    <li>
      <button
        type="button"
        disabled={!imageLoaded || !imageExists}
        onClick={() => {
          if (imageExists) {
            downloader.download(
              getUrl(props.token, props.resolution),
              `${props.token.id}_${props.resolution.toUpperCase()}.png`
            );
            props.onSelect?.();
          }
        }}
        className={`tw-w-full tw-rounded-md tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-transition tw-duration-200 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-400 ${
          !imageLoaded
            ? "tw-cursor-wait tw-text-iron-300"
            : imageExists
              ? "tw-cursor-pointer tw-text-white hover:tw-bg-iron-800"
              : "tw-cursor-not-allowed tw-text-iron-500"
        }`}
      >
        {props.resolution}
        {!imageLoaded && " Loading…"}
        {imageLoaded &&
          imageExists &&
          imageSize > 0 &&
          ` (${numberWithCommas(imageSize)} MB)`}
        {imageLoaded && !imageExists && " Coming Soon"}
      </button>
    </li>
  );
}

export default function NextGenTokenDownload(
  props: Readonly<{
    token: NextGenToken;
    resolution: Resolution;
  }>
) {
  const { imageLoaded, imageExists, imageSize } = useImageChecker(
    props.token,
    props.resolution
  );

  function printResolution(quality: Resolution) {
    return (
      <span className="tw-flex tw-min-w-fit tw-items-center tw-gap-1">
        <button
          type="button"
          aria-label={`Open ${quality} image in a new tab`}
          data-tooltip-id={`external-link-${props.token.id}-${quality}`}
          onClick={() => {
            const h = getUrl(props.token, quality);
            window.open(h, "_blank");
          }}
          className="tw-inline-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-text-iron-300 hover:tw-bg-white/10 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          <FontAwesomeIcon
            icon={faExternalLink}
            className="tw-h-4 tw-w-4"
            aria-hidden="true"
          />
        </button>
        <Tooltip
          id={`external-link-${props.token.id}-${quality}`}
          place="top"
          delayShow={100}
          className="!tw-bg-iron-900 !tw-px-2 !tw-py-1 !tw-text-white"
        >
          Open in new tab
        </Tooltip>
        <NextGenTokenDownloadButton token={props.token} quality={quality} />
      </span>
    );
  }

  function getDisplay() {
    if (!imageLoaded) {
      return <DotLoader />;
    }
    if (!imageExists) {
      return "Coming Soon";
    }
    return printResolution(props.resolution);
  }

  return (
    <div className="tw-flex tw-min-h-12 tw-w-full tw-items-center tw-justify-between tw-gap-3 tw-rounded-lg tw-border tw-border-solid tw-border-white/5 tw-bg-black/20 tw-px-3 tw-py-2">
      <span className="tw-min-w-0 tw-text-sm tw-text-white">
        {props.resolution}
        {imageExists && imageSize > 0 && ` (${numberWithCommas(imageSize)} MB)`}
      </span>
      <span className="tw-flex tw-flex-none tw-items-center tw-text-sm tw-text-iron-400">
        {getDisplay()}
      </span>
    </div>
  );
}

function NextGenTokenDownloadButton(
  props: Readonly<{
    token: NextGenToken;
    quality: Resolution;
    class?: string | undefined;
  }>
) {
  const downloader = useDownloader();

  if (downloader.isInProgress) {
    return <Spinner />;
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Download ${props.quality} image`}
        data-tooltip-id={`download-${props.token.id}-${props.quality}`}
        onClick={() => {
          downloader.download(
            getUrl(props.token, props.quality),
            `${props.token.id}_${props.quality.toUpperCase()}.png`
          );
        }}
        className={`tw-inline-flex tw-h-9 tw-w-9 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-text-iron-300 hover:tw-bg-white/10 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 ${
          props.class ?? ""
        }`}
      >
        <FontAwesomeIcon
          icon={faDownload}
          className="tw-h-4 tw-w-4"
          aria-hidden="true"
        />
      </button>
      <Tooltip
        id={`download-${props.token.id}-${props.quality}`}
        place="top"
        delayShow={100}
        className="!tw-bg-iron-900 !tw-px-2 !tw-py-1 !tw-text-white"
      >
        Download
      </Tooltip>
    </>
  );
}
