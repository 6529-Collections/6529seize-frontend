"use client";

import { publicEnv } from "@/config/env";
import { getFileInfoFromUrl } from "@/helpers/file.helpers";
import { normalizeDecentralizedMediaUrl } from "@/lib/media/decentralized-media";
import {
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";

const SAFE_URL_PROTOCOLS = new Set(["https:", "http:", "ipfs:", "ar:"]);
const CONFIRM_RESET_MS = 2500;

function getSafeUrl(rawUrl: string): string | null {
  try {
    const resolvedUrl =
      normalizeDecentralizedMediaUrl(
        rawUrl,
        publicEnv.MEDIA_RESOLVER_ENDPOINT
      ) ?? rawUrl;
    const parsed = new URL(resolvedUrl);
    if (SAFE_URL_PROTOCOLS.has(parsed.protocol)) {
      return parsed.toString();
    }
  } catch {
    return null;
  }

  return null;
}

function getLinkLabel(mediaUrl: string): string {
  const fileInfo = getFileInfoFromUrl(mediaUrl);
  if (fileInfo) {
    return `${fileInfo.name}.${fileInfo.extension}`;
  }

  return mediaUrl;
}

export default function UnsupportedMediaLink({
  media_url,
  disableMediaInteraction = false,
}: {
  readonly media_url: string;
  readonly disableMediaInteraction?: boolean;
}) {
  const safeUrl = getSafeUrl(media_url);
  const label = getLinkLabel(media_url);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const confirmResetTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (confirmResetTimeoutRef.current !== null) {
        globalThis.window.clearTimeout(confirmResetTimeoutRef.current);
      }
    };
  }, []);

  const scheduleConfirmReset = () => {
    if (confirmResetTimeoutRef.current !== null) {
      globalThis.window.clearTimeout(confirmResetTimeoutRef.current);
    }

    confirmResetTimeoutRef.current = globalThis.window.setTimeout(() => {
      setConfirmOpen(false);
      confirmResetTimeoutRef.current = null;
    }, CONFIRM_RESET_MS);
  };

  const handleOpen = () => {
    if (!safeUrl) {
      return;
    }

    if (!confirmOpen) {
      setConfirmOpen(true);
      scheduleConfirmReset();
      return;
    }

    if (confirmResetTimeoutRef.current !== null) {
      globalThis.window.clearTimeout(confirmResetTimeoutRef.current);
      confirmResetTimeoutRef.current = null;
    }

    setConfirmOpen(false);
    globalThis.window.open(safeUrl, "_blank", "noopener,noreferrer");
  };

  if (!safeUrl || disableMediaInteraction) {
    return (
      <span className="tw-inline-flex tw-w-full tw-items-center tw-gap-x-4 tw-rounded-md tw-border tw-border-solid tw-border-amber-700/60 tw-bg-amber-950/25 tw-px-4 tw-py-3 tw-text-amber-200">
        <ExclamationTriangleIcon className="tw-size-5 tw-flex-shrink-0" />
        <span className="tw-min-w-0 tw-break-all tw-text-sm">{label}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleOpen}
      className="tw-inline-flex tw-w-full tw-items-center tw-gap-x-4 tw-rounded-md tw-border tw-border-solid tw-border-amber-700/60 tw-bg-amber-950/25 tw-px-4 tw-py-3 tw-text-left tw-transition desktop-hover:hover:tw-border-amber-500/80 desktop-hover:hover:tw-bg-amber-950/40"
    >
      <ExclamationTriangleIcon className="tw-size-5 tw-flex-shrink-0 tw-text-amber-300" />
      <span className="tw-min-w-0 tw-flex-1">
        <span className="tw-block tw-text-[9px] tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-amber-400">
          {confirmOpen ? "Open anyway — may be unsafe" : "Unknown file"}
        </span>
        <span className="tw-block tw-break-all tw-text-[13px] tw-font-medium tw-text-amber-100">
          {label}
        </span>
      </span>
      <ArrowTopRightOnSquareIcon className="tw-size-5 tw-flex-shrink-0 tw-text-amber-300" />
    </button>
  );
}
