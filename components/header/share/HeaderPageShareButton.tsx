"use client";

import { publicEnv } from "@/config/env";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { isShareCancelError } from "@/utils/error";
import { Share } from "@capacitor/share";
import { ShareIcon as OutlineShareIcon } from "@heroicons/react/24/outline";
import { ShareIcon as SolidShareIcon } from "@heroicons/react/24/solid";
import clsx from "clsx";
import { useState } from "react";

function getCurrentPublicUrl(): string {
  const currentWindow = globalThis.window;
  const route =
    currentWindow === undefined
      ? "/"
      : `${currentWindow.location.pathname}${currentWindow.location.search}${currentWindow.location.hash}`;
  const normalizedBase = publicEnv.BASE_ENDPOINT.replace(/\/$/, "");
  const normalizedRoute = route.startsWith("/") ? route : "/" + route;
  return `${normalizedBase}${normalizedRoute}`;
}

function getShareTitle(): string {
  const title = globalThis.document?.title;
  if (title?.trim()) {
    return title;
  }

  return "6529";
}

async function copyFallback(url: string): Promise<void> {
  const writeText = globalThis.navigator?.clipboard?.writeText;
  if (typeof writeText !== "function") {
    return;
  }

  await writeText.call(globalThis.navigator.clipboard, url);
}

export default function HeaderPageShareButton({
  isCapacitor,
}: {
  readonly isCapacitor: boolean;
}) {
  const locale = useBrowserLocale();
  const [isSharing, setIsSharing] = useState(false);

  if (!isCapacitor) {
    return null;
  }

  const shareCurrentPage = async () => {
    if (isSharing) {
      return;
    }

    const url = getCurrentPublicUrl();

    setIsSharing(true);
    try {
      await Share.share({
        title: getShareTitle(),
        url,
      });
    } catch (error: unknown) {
      if (isShareCancelError(error)) {
        return;
      }

      try {
        await copyFallback(url);
      } catch (copyError: unknown) {
        console.error("Failed to share or copy current page URL", copyError);
      }
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <button
      type="button"
      aria-label={t(locale, "headerPageShare.trigger.ariaLabel")}
      title={t(locale, "headerPageShare.trigger.title")}
      onClick={() => {
        void shareCurrentPage();
      }}
      aria-busy={isSharing ? "true" : undefined}
      disabled={isSharing}
      className={clsx(
        "tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-shadow-sm tw-transition tw-duration-300 tw-ease-out focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400",
        isSharing
          ? "tw-bg-black tw-text-iron-50"
          : "tw-bg-black tw-text-iron-300 hover:tw-text-iron-50 active:tw-bg-iron-800"
      )}
    >
      {isSharing ? (
        <SolidShareIcon className="tw-h-6 tw-w-6" />
      ) : (
        <OutlineShareIcon className="tw-h-6 tw-w-6" />
      )}
    </button>
  );
}
