"use client";

import { publicEnv } from "@/config/env";
import { getFileInfoFromUrl } from "@/helpers/file.helpers";
import { openUrlInNewTab } from "@/helpers/open-url.helpers";
import {
  normalizeDecentralizedMediaUrl,
  toIsolatedHtmlUrlFromInput,
} from "@/lib/media/decentralized-media";
import {
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";

const CONFIRM_RESET_MS = 2500;

/**
 * The link to offer: `https:` only, with `ipfs://`, `ipns://` and `ar://`
 * resolved through the app's media resolver first. When the separate content
 * domain is configured, first-party IPFS media (including stored URLs on the
 * previous 6529.io hosts) opens on its per-CID host with its query and hash.
 * Decided from the URL alone, so the server and the browser render the same
 * control.
 */
function getSafeUrl(rawUrl: string): string | null {
  try {
    const resolverEndpoint = publicEnv.MEDIA_RESOLVER_ENDPOINT;
    const isolatedUrl = toIsolatedHtmlUrlFromInput(rawUrl, resolverEndpoint);
    const resolvedUrl =
      isolatedUrl === rawUrl
        ? (normalizeDecentralizedMediaUrl(rawUrl, resolverEndpoint) ?? rawUrl)
        : isolatedUrl;
    const parsed = new URL(resolvedUrl);
    if (parsed.protocol === "https:") {
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
    openUrlInNewTab(safeUrl);
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
