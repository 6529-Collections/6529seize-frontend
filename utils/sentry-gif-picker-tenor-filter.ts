import type {
  SentryClientEvent,
  SentryStackFrame,
} from "@/utils/sentry-client-filters";

type SentryBreadcrumbLike = {
  readonly type?: string | undefined;
  readonly category?: string | undefined;
  readonly message?: string | undefined;
  readonly data?: Record<string, unknown> | undefined;
};

const BROWSER_UNHANDLED_REJECTION_MECHANISM =
  "auto.browser.global_handlers.onunhandledrejection";
const GIF_PICKER_REACT_PACKAGE_TOKEN = "gif-picker-react";
const GIF_PICKER_TENOR_MANAGER_PATH_TOKEN = "TenorManager.ts";
const GIF_PICKER_TENOR_FAILURE_MESSAGE =
  "[gif-picker-react] Failed to fetch data from Tenor API";
const TENOR_CATEGORIES_PATH = "/v2/categories";
const TENOR_SEARCH_PATH = "/v2/search";
const WAVES_ROUTE_PATH = "/waves";

const GIF_PICKER_TENOR_DATA_MESSAGES = new Set([
  "undefined is not an object (evaluating 'e.tags')",
  "undefined is not an object (evaluating 'e.tags.map')",
  "undefined is not an object (evaluating 'e.results.map')",
]);

const APP_OWNED_FRAME_PATH_TOKENS = [
  "webpack-internal:///(app-pages-browser)/./app/",
  "webpack-internal:///(app-pages-browser)/./components/",
  "webpack-internal:///(app-pages-browser)/./contexts/",
  "webpack-internal:///(app-pages-browser)/./hooks/",
  "webpack-internal:///(app-pages-browser)/./lib/",
  "webpack-internal:///(app-pages-browser)/./services/",
  "webpack-internal:///(app-pages-browser)/./store/",
  "webpack-internal:///(app-pages-browser)/./utils/",
  "app:///app/",
  "app:///components/",
  "app:///contexts/",
  "app:///hooks/",
  "app:///lib/",
  "app:///services/",
  "app:///store/",
  "app:///utils/",
];

function getStringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getBreadcrumbValues(event: SentryClientEvent): SentryBreadcrumbLike[] {
  const breadcrumbs = event.breadcrumbs;
  if (Array.isArray(breadcrumbs)) {
    return breadcrumbs;
  }

  if (Array.isArray(breadcrumbs?.values)) {
    return breadcrumbs.values;
  }

  return [];
}

function getRequestPathname(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  try {
    return new URL(value, "https://6529.io").pathname;
  } catch {
    return undefined;
  }
}

function isWavesRoute(value: unknown): boolean {
  const pathname = getRequestPathname(getStringValue(value));
  return (
    pathname === WAVES_ROUTE_PATH || (pathname?.startsWith("/waves/") ?? false)
  );
}

function hasWavesRoute(event: SentryClientEvent): boolean {
  return [
    event.transaction,
    event.request?.url,
    event.tags?.["transaction"],
    event.tags?.["url"],
  ].some(isWavesRoute);
}

function getFrameSignature(frame: SentryStackFrame): string {
  return [frame.filename, frame.abs_path, frame.function]
    .filter((value): value is string => typeof value === "string")
    .join("\n");
}

function hasGifPickerTenorManagerFrame(
  frames: SentryStackFrame[] | undefined
): boolean {
  return (
    Array.isArray(frames) &&
    frames.some((frame) => {
      const signature = getFrameSignature(frame);
      return (
        signature.includes(GIF_PICKER_REACT_PACKAGE_TOKEN) &&
        signature.includes(GIF_PICKER_TENOR_MANAGER_PATH_TOKEN)
      );
    })
  );
}

function hasAppOwnedFrame(frames: SentryStackFrame[] | undefined): boolean {
  return (
    Array.isArray(frames) &&
    frames.some((frame) => {
      if (frame.in_app === true) {
        return true;
      }

      const signature = getFrameSignature(frame);
      return APP_OWNED_FRAME_PATH_TOKENS.some((token) =>
        signature.includes(token)
      );
    })
  );
}

function hasGifPickerTenorFailureBreadcrumb(event: SentryClientEvent): boolean {
  return getBreadcrumbValues(event).some((breadcrumb) =>
    breadcrumb.message?.includes(GIF_PICKER_TENOR_FAILURE_MESSAGE)
  );
}

function isTenorGifPickerPath(value: string | undefined): boolean {
  const pathname = getRequestPathname(value);
  if (pathname === TENOR_CATEGORIES_PATH || pathname === TENOR_SEARCH_PATH) {
    return true;
  }

  return (
    typeof value === "string" &&
    (value.includes(TENOR_CATEGORIES_PATH) || value.includes(TENOR_SEARCH_PATH))
  );
}

function getNumericValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function hasTenor403Status(breadcrumb: SentryBreadcrumbLike): boolean {
  const statusCode =
    getNumericValue(breadcrumb.data?.["status_code"]) ??
    getNumericValue(breadcrumb.data?.["http.response.status_code"]);

  return statusCode === 403 || breadcrumb.message?.includes("[403]") === true;
}

function isThirdPartyTenorHttpBreadcrumb(
  breadcrumb: SentryBreadcrumbLike
): boolean {
  if (breadcrumb.type !== "http" && breadcrumb.category !== "fetch") {
    return false;
  }

  const data = breadcrumb.data;
  if (!data) {
    return false;
  }

  if (data["url.is_first_party"] !== false) {
    return false;
  }

  if (data["url.is_first_party_api"] !== false) {
    return false;
  }

  if (!hasTenor403Status(breadcrumb)) {
    return false;
  }

  return (
    isTenorGifPickerPath(getStringValue(data["url"])) ||
    isTenorGifPickerPath(breadcrumb.message)
  );
}

function hasTenor403RequestBreadcrumb(event: SentryClientEvent): boolean {
  return getBreadcrumbValues(event).some(isThirdPartyTenorHttpBreadcrumb);
}

export function shouldFilterGifPickerTenorError(
  event: SentryClientEvent
): boolean {
  const value = event.exception?.values?.[0];
  if (
    value?.type !== "TypeError" ||
    !GIF_PICKER_TENOR_DATA_MESSAGES.has(value.value ?? "")
  ) {
    return false;
  }

  if (
    value.mechanism?.type !== BROWSER_UNHANDLED_REJECTION_MECHANISM ||
    value.mechanism.handled !== false
  ) {
    return false;
  }

  if (!hasWavesRoute(event)) {
    return false;
  }

  const frames = value.stacktrace?.frames;
  if (hasAppOwnedFrame(frames)) {
    return false;
  }

  if (!hasTenor403RequestBreadcrumb(event)) {
    return false;
  }

  return (
    hasGifPickerTenorManagerFrame(frames) ||
    hasGifPickerTenorFailureBreadcrumb(event)
  );
}
