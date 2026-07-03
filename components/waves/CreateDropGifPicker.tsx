import GifPicker, { Theme } from "gif-picker-react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import MobileWrapperDialog from "../mobile-wrapper-dialog/MobileWrapperDialog";

const TENOR_API_BASE_URL = "https://tenor.googleapis.com/v2/";
const GIF_PICKER_REACT_PACKAGE_TOKEN = "gif-picker-react";
const GIF_PICKER_TENOR_MANAGER_PATH_TOKEN = "TenorManager.ts";

// Keep these in sync with gif-picker-react@1.5.0 TenorManager defaults.
const TENOR_CLIENT_KEY = "gif-picker-react";
const TENOR_CONTENT_FILTER = "off";
const TENOR_COUNTRY = "US";
const TENOR_LOCALE = "en_US";
const TENOR_MEDIA_FILTER = "gif,tinygif";
const GIF_PICKER_TENOR_ERROR_MESSAGES = new Set([
  "undefined is not an object (evaluating 'e.tags')",
  "undefined is not an object (evaluating 'e.tags.map')",
  "undefined is not an object (evaluating 'e.results.map')",
]);

type TenorAvailability = "checking" | "available" | "unavailable";
type TenorEndpoint = "categories" | "featured" | "search";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAbortError(error: unknown): boolean {
  return isRecord(error) && error["name"] === "AbortError";
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  const message = isRecord(error) ? error["message"] : undefined;
  if (typeof message === "string") {
    return message;
  }

  return "";
}

function getErrorStack(error: unknown): string {
  const stack = isRecord(error) ? error["stack"] : undefined;
  return typeof stack === "string" ? stack : "";
}

function hasGifPickerTenorStack(error: unknown): boolean {
  const stack = getErrorStack(error);
  return (
    stack.includes(GIF_PICKER_REACT_PACKAGE_TOKEN) &&
    stack.includes(GIF_PICKER_TENOR_MANAGER_PATH_TOKEN)
  );
}

function isKnownGifPickerTenorError(error: unknown): boolean {
  return (
    GIF_PICKER_TENOR_ERROR_MESSAGES.has(getErrorMessage(error)) &&
    hasGifPickerTenorStack(error)
  );
}

function getAvailabilityStatusMessage(
  locale: SupportedLocale,
  availability: TenorAvailability
): string {
  if (availability === "available") {
    return t(locale, "waves.gifPicker.status.ready");
  }

  if (availability === "unavailable") {
    return t(locale, "waves.gifPicker.unavailable.title");
  }

  return t(locale, "waves.gifPicker.status.checking");
}

function buildTenorUrl(
  endpoint: TenorEndpoint,
  tenorApiKey: string,
  params: Record<string, string>
): string {
  const url = new URL(endpoint, TENOR_API_BASE_URL);
  url.search = new URLSearchParams({
    key: tenorApiKey,
    client_key: TENOR_CLIENT_KEY,
    contentfilter: TENOR_CONTENT_FILTER,
    media_filter: TENOR_MEDIA_FILTER,
    locale: TENOR_LOCALE,
    country: TENOR_COUNTRY,
    ...params,
  }).toString();

  return url.toString();
}

function hasExpectedTenorPayload(
  endpoint: TenorEndpoint,
  payload: unknown
): boolean {
  if (!isRecord(payload)) {
    return false;
  }

  if (endpoint === "categories") {
    return Array.isArray(payload["tags"]);
  }

  return Array.isArray(payload["results"]);
}

async function hasAvailableTenorEndpoint(
  endpoint: TenorEndpoint,
  tenorApiKey: string,
  params: Record<string, string>,
  signal: AbortSignal
): Promise<boolean> {
  const response = await fetch(buildTenorUrl(endpoint, tenorApiKey, params), {
    signal,
  });

  if (!response.ok) {
    return false;
  }

  const payload: unknown = await response.json();
  return hasExpectedTenorPayload(endpoint, payload);
}

async function isTenorAvailable(
  tenorApiKey: string,
  signal: AbortSignal
): Promise<boolean> {
  const endpoints: Array<{
    readonly endpoint: TenorEndpoint;
    readonly params: Record<string, string>;
  }> = [
    { endpoint: "categories", params: { type: "featured" } },
    { endpoint: "featured", params: { ar_range: "all", limit: "1" } },
    { endpoint: "search", params: { q: "gif", ar_range: "all", limit: "1" } },
  ];

  for (const { endpoint, params } of endpoints) {
    const available = await hasAvailableTenorEndpoint(
      endpoint,
      tenorApiKey,
      params,
      signal
    );
    if (!available) {
      return false;
    }
  }

  return true;
}

function GifPickerChecking({ label }: { readonly label: string }) {
  return (
    <div className="tw-flex tw-min-h-56 tw-flex-col tw-items-center tw-justify-center tw-gap-3 tw-px-6 tw-py-10 tw-text-center">
      <div
        aria-hidden="true"
        className="tw-size-8 tw-animate-spin tw-rounded-full tw-border-2 tw-border-iron-700 tw-border-t-primary-400"
      />
      <p className="tw-mb-0 tw-text-sm tw-font-medium tw-text-iron-200">
        {label}
      </p>
    </div>
  );
}

function GifPickerUnavailable({
  title,
  hint,
  closeLabel,
  onClose,
}: {
  readonly title: string;
  readonly hint: string;
  readonly closeLabel: string;
  readonly onClose: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  return (
    <div className="tw-flex tw-min-h-56 tw-flex-col tw-items-center tw-justify-center tw-gap-4 tw-px-6 tw-py-10 tw-text-center">
      <div className="tw-space-y-2">
        <p
          role="alert"
          className="tw-mb-0 tw-text-sm tw-font-semibold tw-text-iron-50"
        >
          {title}
        </p>
        <p className="tw-mb-0 tw-text-sm tw-text-iron-400">{hint}</p>
      </div>
      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        className="tw-inline-flex tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-white/10 tw-bg-iron-800 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 tw-transition tw-duration-200 hover:tw-bg-iron-700 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-iron-500 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950"
      >
        {closeLabel}
      </button>
    </div>
  );
}

function GifPickerDialog({
  tenorApiKey,
  onSelect,
  onClose,
}: {
  readonly tenorApiKey: string;
  readonly onSelect: (gif: string) => void;
  readonly onClose: () => void;
}) {
  const [availability, setAvailability] =
    useState<TenorAvailability>("checking");
  const locale = useBrowserLocale();
  const dialogTitle = t(locale, "waves.gifPicker.dialogTitle");
  const statusMessage = getAvailabilityStatusMessage(locale, availability);

  useEffect(() => {
    const abortController = new AbortController();
    let isActive = true;

    async function checkTenorAvailability() {
      try {
        const available = await isTenorAvailable(
          tenorApiKey,
          abortController.signal
        );
        if (!isActive) {
          return;
        }

        setAvailability(available ? "available" : "unavailable");
      } catch (error: unknown) {
        if (!isActive || isAbortError(error)) {
          return;
        }

        setAvailability("unavailable");
      }
    }

    void checkTenorAvailability();

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, [tenorApiKey]);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (!isKnownGifPickerTenorError(event.reason)) {
        return;
      }

      event.preventDefault();
      setAvailability("unavailable");
    };

    globalThis.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () =>
      globalThis.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection
      );
  }, []);

  let content: ReactNode;
  if (availability === "available") {
    content = (
      <GifPicker
        width="100%"
        tenorApiKey={tenorApiKey}
        theme={Theme.DARK}
        onGifClick={(gif) => onSelect(gif.url)}
      />
    );
  } else if (availability === "unavailable") {
    content = (
      <GifPickerUnavailable
        title={t(locale, "waves.gifPicker.unavailable.title")}
        hint={t(locale, "waves.gifPicker.unavailable.hint")}
        closeLabel={t(locale, "common.close")}
        onClose={onClose}
      />
    );
  } else {
    content = (
      <GifPickerChecking label={t(locale, "waves.gifPicker.status.checking")} />
    );
  }

  return (
    <MobileWrapperDialog
      title={dialogTitle}
      isOpen={true}
      onClose={onClose}
      noPadding={availability === "available"}
      headerClassName="tw-sr-only"
    >
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="tw-sr-only"
      >
        {statusMessage}
      </div>
      {content}
    </MobileWrapperDialog>
  );
}

export default function CreateDropGifPicker({
  tenorApiKey,
  show,
  setShow,
  onSelect,
}: {
  readonly tenorApiKey: string;
  readonly show: boolean;
  readonly setShow: (show: boolean) => void;
  readonly onSelect: (gif: string) => void;
}) {
  const handleClose = () => setShow(false);

  if (!show) {
    return null;
  }

  return (
    <GifPickerDialog
      tenorApiKey={tenorApiKey}
      onSelect={onSelect}
      onClose={handleClose}
    />
  );
}
