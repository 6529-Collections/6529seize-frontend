import type {
  SentryClientEvent,
  SentryStackFrame,
} from "@/utils/sentry-client-filters";
import { shouldFilterGifPickerTenorError } from "@/utils/sentry-gif-picker-tenor-filter";

const UNHANDLED_REJECTION_MECHANISM =
  "auto.browser.global_handlers.onunhandledrejection";
const TENOR_FAILURE_MESSAGE =
  "[gif-picker-react] Failed to fetch data from Tenor API";
const UNDEFINED_TAGS_MAP_MESSAGE =
  "undefined is not an object (evaluating 'e.tags.map')";
const UNDEFINED_RESULTS_MAP_MESSAGE =
  "undefined is not an object (evaluating 'e.results.map')";
const FIRST_PARTY_KEY = "url.is_first_party";
const FIRST_PARTY_API_KEY = "url.is_first_party_api";

describe("sentry-gif-picker-tenor-filter", () => {
  const tenorManagerFrame: SentryStackFrame = {
    filename:
      "node_modules/.pnpm/gif-picker-react@1.5.0/node_modules/gif-picker-react/src/managers/TenorManager.ts",
    function: "<anonymous>",
  };

  const createEvent = (
    overrides: Partial<SentryClientEvent> = {}
  ): SentryClientEvent => ({
    transaction: "/waves/:wave",
    request: {
      url: "https://6529.io/waves/b38288e6-ca9d-45ce-8323-3dc5e094f04e",
    },
    tags: {
      transaction: "/waves/:wave",
      url: "/waves/b38288e6-ca9d-45ce-8323-3dc5e094f04e",
    },
    exception: {
      values: [
        {
          type: "TypeError",
          value: UNDEFINED_TAGS_MAP_MESSAGE,
          mechanism: {
            type: UNHANDLED_REJECTION_MECHANISM,
            handled: false,
          },
          stacktrace: {
            frames: [tenorManagerFrame],
          },
        },
      ],
    },
    breadcrumbs: [
      {
        category: "console",
        level: "error",
        message: TENOR_FAILURE_MESSAGE,
      },
      {
        type: "http",
        category: "fetch",
        level: "error",
        message: "GET: /v2/categories [403]",
        data: {
          url: "/v2/categories",
          status_code: 403,
          [FIRST_PARTY_KEY]: false,
          [FIRST_PARTY_API_KEY]: false,
        },
      },
    ],
    ...overrides,
  });

  it("filters gif-picker Tenor category 403 errors on waves routes with no app-owned frames", () => {
    expect(shouldFilterGifPickerTenorError(createEvent())).toBe(true);
  });

  it("filters gif-picker Tenor search 403 errors on waves routes with no app-owned frames", () => {
    const event = createEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value: UNDEFINED_RESULTS_MAP_MESSAGE,
            mechanism: {
              type: UNHANDLED_REJECTION_MECHANISM,
              handled: false,
            },
            stacktrace: {
              frames: [tenorManagerFrame],
            },
          },
        ],
      },
      breadcrumbs: [
        {
          category: "console",
          level: "error",
          message: TENOR_FAILURE_MESSAGE,
        },
        {
          type: "http",
          category: "fetch",
          level: "warning",
          message: "GET: /v2/search [403]",
          data: {
            url: "/v2/search",
            [FIRST_PARTY_KEY]: false,
            [FIRST_PARTY_API_KEY]: false,
          },
        },
      ],
    });

    expect(shouldFilterGifPickerTenorError(event)).toBe(true);
  });

  it("filters using the gif-picker breadcrumb when source frames are unavailable", () => {
    const event = createEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value: UNDEFINED_TAGS_MAP_MESSAGE,
            mechanism: {
              type: UNHANDLED_REJECTION_MECHANISM,
              handled: false,
            },
            stacktrace: {
              frames: [],
            },
          },
        ],
      },
    });

    expect(shouldFilterGifPickerTenorError(event)).toBe(true);
  });

  it("keeps gif-picker Tenor errors without a Tenor 403 breadcrumb", () => {
    const event = createEvent({
      breadcrumbs: [
        {
          category: "console",
          level: "error",
          message: TENOR_FAILURE_MESSAGE,
        },
        {
          type: "http",
          category: "fetch",
          level: "warning",
          message: "GET: /v2/categories [500]",
          data: {
            url: "/v2/categories",
            status_code: 500,
            [FIRST_PARTY_KEY]: false,
            [FIRST_PARTY_API_KEY]: false,
          },
        },
      ],
    });

    expect(shouldFilterGifPickerTenorError(event)).toBe(false);
  });

  it("keeps gif-picker Tenor errors when an app-owned frame is present", () => {
    const event = createEvent({
      exception: {
        values: [
          {
            type: "TypeError",
            value: UNDEFINED_TAGS_MAP_MESSAGE,
            mechanism: {
              type: UNHANDLED_REJECTION_MECHANISM,
              handled: false,
            },
            stacktrace: {
              frames: [
                tenorManagerFrame,
                {
                  filename:
                    "webpack-internal:///(app-pages-browser)/./components/waves/CreateDropGifPicker.tsx",
                },
              ],
            },
          },
        ],
      },
    });

    expect(shouldFilterGifPickerTenorError(event)).toBe(false);
  });

  it("keeps gif-picker Tenor errors outside waves routes", () => {
    const event = createEvent({
      transaction: "/about",
      request: {
        url: "https://6529.io/about",
      },
      tags: {
        transaction: "/about",
        url: "/about",
      },
    });

    expect(shouldFilterGifPickerTenorError(event)).toBe(false);
  });
});
