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
        setImageLoaded(true);
      })
      .catch(() => setImageExists(false));
  }, [token, resolution]);

  return { imageLoaded, imageExists, imageSize };
}

export function NextGenTokenDownloadDropdownItem(props: NextGenTokenProps) {
  const { imageExists, imageSize } = useImageChecker(
    props.token,
    props.resolution
  );
  const downloader = useDownloader();

  return (
    <li>
      <button
        type="button"
        disabled={!imageExists}
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
          imageExists
            ? "tw-cursor-pointer tw-text-white hover:tw-bg-iron-800"
            : "tw-cursor-not-allowed tw-text-iron-500"
        }`}
      >
        {props.resolution}
        {imageExists && imageSize > 0
          ? ` (${numberWithCommas(imageSize)} MB)`
          : " Coming Soon"}
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
      <span className="no-wrap tw-flex tw-items-center tw-gap-4">
        <FontAwesomeIcon
          data-tooltip-id={`external-link-${props.token.id}-${quality}`}
          style={{ cursor: "pointer", height: "20px", width: "20px" }}
          onClick={() => {
            const h = getUrl(props.token, quality);
            window.open(h, "_blank");
          }}
          icon={faExternalLink}
        />
        <Tooltip
          id={`external-link-${props.token.id}-${quality}`}
          place="top"
          delayShow={100}
          style={{
            backgroundColor: "#1F2937",
            color: "white",
            padding: "4px 8px",
          }}
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
    <div className="tw-mx-auto tw-w-full tw-px-3 tw-py-1 max-[1100px]:tw-max-w-[950px] min-[1101px]:tw-max-w-[960px] min-[1200px]:tw-max-w-[1050px] min-[1300px]:tw-max-w-[1150px] min-[1400px]:tw-max-w-[1250px] min-[1500px]:tw-max-w-[1280px]">
      <div className="-tw-mx-3 tw-flex tw-flex-wrap tw-items-center">
        <div
          className="tw-relative tw-w-1/3 tw-shrink-0 tw-grow-0 tw-basis-auto tw-px-3"
          style={{ maxWidth: "100%" }}
        >
          <span className="no-wrap">
            <span>{props.resolution}</span>
            {imageExists &&
              imageSize > 0 &&
              ` (${numberWithCommas(imageSize)} MB)`}
          </span>
        </div>
        <div className="tw-relative tw-w-full tw-shrink-0 tw-grow tw-basis-0 tw-px-3">
          {getDisplay()}
        </div>
      </div>
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
      <FontAwesomeIcon
        data-tooltip-id={`download-${props.token.id}-${props.quality}`}
        icon={faDownload}
        className={props.class}
        style={{ cursor: "pointer", height: "20px", width: "20px" }}
        onClick={() => {
          downloader.download(
            getUrl(props.token, props.quality),
            `${props.token.id}_${props.quality.toUpperCase()}.png`
          );
        }}
      />
      <Tooltip
        id={`download-${props.token.id}-${props.quality}`}
        place="top"
        delayShow={100}
        style={{
          backgroundColor: "#1F2937",
          color: "white",
          padding: "4px 8px",
        }}
      >
        Download
      </Tooltip>
    </>
  );
}
