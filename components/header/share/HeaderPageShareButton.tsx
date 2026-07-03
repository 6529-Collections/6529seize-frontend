"use client";

import { publicEnv } from "@/config/env";
import useCapacitor from "@/hooks/useCapacitor";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { Share } from "@capacitor/share";
import { faShare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const HEADER_PAGE_SHARE_LOCALE = DEFAULT_LOCALE;

function getCurrentPublicUrl(): string {
  const route =
    typeof window === "undefined"
      ? "/"
      : `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const normalizedBase = publicEnv.BASE_ENDPOINT.replace(/\/$/, "");
  const normalizedRoute = route.startsWith("/") ? route : "/" + route;
  return `${normalizedBase}${normalizedRoute}`;
}

function getShareTitle(): string {
  if (typeof document !== "undefined" && document.title.trim()) {
    return document.title;
  }

  return "6529";
}

function getErrorName(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    typeof error.name === "string"
  ) {
    return error.name;
  }

  return "";
}

async function copyFallback(url: string): Promise<void> {
  const writeText = navigator?.clipboard?.writeText;
  if (typeof writeText !== "function") {
    return;
  }

  await writeText.call(navigator.clipboard, url);
}

export default function HeaderPageShareButton() {
  const { isCapacitor } = useCapacitor();

  if (!isCapacitor) {
    return null;
  }

  const shareCurrentPage = async () => {
    const url = getCurrentPublicUrl();

    try {
      await Share.share({
        title: getShareTitle(),
        url,
      });
    } catch (error: unknown) {
      if (getErrorName(error) === "AbortError") {
        return;
      }

      try {
        await copyFallback(url);
      } catch (copyError: unknown) {
        console.error("Failed to share or copy current page URL", copyError);
      }
    }
  };

  return (
    <button
      type="button"
      aria-label={t(
        HEADER_PAGE_SHARE_LOCALE,
        "headerPageShare.trigger.ariaLabel"
      )}
      title={t(HEADER_PAGE_SHARE_LOCALE, "headerPageShare.trigger.title")}
      onClick={() => {
        void shareCurrentPage();
      }}
      className="tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-black tw-text-iron-300 tw-shadow-sm tw-transition tw-duration-300 tw-ease-out hover:tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 active:tw-bg-iron-800"
    >
      <FontAwesomeIcon icon={faShare} className="tw-h-6 tw-w-6" />
    </button>
  );
}
