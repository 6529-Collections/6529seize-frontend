import {
  shouldFilterZerionUserRejectedRequest,
  type SentryClientEvent,
} from "@/utils/sentry-client-filters";
import type { SentryExceptionValue } from "@/utils/sentry-client-filters/types";

const zerionObjectRejectionMessage =
  "Object captured as promise rejection with keys: code, message, name";
const zerionWalletClickSelector =
  ' > wui-flex > w3m-list-wallet[name="Zerion"]';
const browserUnhandledRejectionMechanism =
  "auto.browser.global_handlers.onunhandledrejection";

const createZerionException = (
  overrides: Partial<SentryExceptionValue> = {}
): SentryExceptionValue => ({
  type: "UnhandledRejection",
  value: zerionObjectRejectionMessage,
  mechanism: {
    type: browserUnhandledRejectionMechanism,
    handled: false,
  },
  ...overrides,
});

const createZerionBreadcrumb = () => ({
  type: "default",
  category: "ui.click",
  level: "info",
  message: zerionWalletClickSelector,
});

const createZerionEvent = (
  overrides: Partial<SentryClientEvent> = {}
): SentryClientEvent => ({
  exception: {
    values: [createZerionException()],
  },
  extra: {
    __serialized__: {
      code: 4001,
      message: "User Rejected the Request",
      name: "Error",
    },
  },
  breadcrumbs: [createZerionBreadcrumb()],
  ...overrides,
});

describe("shouldFilterZerionUserRejectedRequest", () => {
  it("filters the production-shaped Zerion rejection with array breadcrumbs", () => {
    expect(shouldFilterZerionUserRejectedRequest(createZerionEvent())).toBe(
      true
    );
  });

  it("filters the production-shaped Zerion rejection with wrapped breadcrumbs", () => {
    const event = createZerionEvent({
      exception: {
        values: [
          createZerionException({
            stacktrace: { frames: [] },
          }),
        ],
      },
      breadcrumbs: {
        values: [createZerionBreadcrumb()],
      },
    });

    expect(shouldFilterZerionUserRejectedRequest(event)).toBe(true);
  });

  it.each([
    {
      caseName: "a different code",
      serialized: {
        code: 4002,
        message: "User Rejected the Request",
        name: "Error",
      },
    },
    {
      caseName: "a different message",
      serialized: {
        code: 4001,
        message: "User rejected the request",
        name: "Error",
      },
    },
    {
      caseName: "a different name",
      serialized: {
        code: 4001,
        message: "User Rejected the Request",
        name: "ProviderRpcError",
      },
    },
    {
      caseName: "an additional field",
      serialized: {
        code: 4001,
        message: "User Rejected the Request",
        name: "Error",
        stack: "Error: User Rejected the Request",
      },
    },
  ])("keeps the rejection with $caseName", ({ serialized }) => {
    const event = createZerionEvent({
      extra: { __serialized__: serialized },
    });

    expect(shouldFilterZerionUserRejectedRequest(event)).toBe(false);
  });

  it.each([
    {
      caseName: "a different exception type",
      values: [createZerionException({ type: "Error" })],
    },
    {
      caseName: "a different wrapper",
      values: [
        createZerionException({
          value:
            "Object captured as promise rejection with keys: code, message",
        }),
      ],
    },
    {
      caseName: "a different mechanism",
      values: [
        createZerionException({
          mechanism: {
            type: "auto.browser.global_handlers.onerror",
            handled: false,
          },
        }),
      ],
    },
    {
      caseName: "a handled mechanism",
      values: [
        createZerionException({
          mechanism: {
            type: browserUnhandledRejectionMechanism,
            handled: true,
          },
        }),
      ],
    },
    {
      caseName: "an app-owned frame",
      values: [
        createZerionException({
          stacktrace: {
            frames: [
              {
                filename: "hooks/drops/useDropSignature.ts",
                in_app: true,
              },
            ],
          },
        }),
      ],
    },
    {
      caseName: "an additional exception",
      values: [
        createZerionException(),
        { type: "Error", value: "Application failure" },
      ],
    },
  ])("keeps the rejection with $caseName", ({ values }) => {
    const event = createZerionEvent({ exception: { values } });

    expect(shouldFilterZerionUserRejectedRequest(event)).toBe(false);
  });

  it("keeps the rejection when the hint contains a stack", () => {
    const hintError = new Error("User Rejected the Request");
    hintError.stack =
      "Error: User Rejected the Request\n    at connectWallet (app:///components/wallet/Connect.tsx:1:1)";

    expect(
      shouldFilterZerionUserRejectedRequest(createZerionEvent(), {
        originalException: hintError,
      })
    ).toBe(false);
  });

  it("keeps the rejection with an undefined first exception value", () => {
    const values = new Array<SentryExceptionValue>(1);
    const event = createZerionEvent({ exception: { values } });

    expect(shouldFilterZerionUserRejectedRequest(event)).toBe(false);
  });

  it.each([
    {
      caseName: "undefined breadcrumbs",
      breadcrumbs: undefined,
    },
    {
      caseName: "a non-array breadcrumb wrapper",
      breadcrumbs: { values: undefined },
    },
  ])("keeps the rejection with $caseName", ({ breadcrumbs }) => {
    const event = createZerionEvent({ breadcrumbs });

    expect(shouldFilterZerionUserRejectedRequest(event)).toBe(false);
  });

  it.each([
    {
      caseName: "no wallet-selection click",
      breadcrumbs: [],
    },
    {
      caseName: "a selector lookalike",
      breadcrumbs: [
        {
          ...createZerionBreadcrumb(),
          message: ' > wui-flex > w3m-list-wallet[name="ZerionX"]',
        },
      ],
    },
    {
      caseName: "another wallet",
      breadcrumbs: [
        {
          ...createZerionBreadcrumb(),
          message: ' > wui-flex > w3m-list-wallet[name="MetaMask"]',
        },
      ],
    },
    {
      caseName: "a later non-Zerion UI click",
      breadcrumbs: [
        createZerionBreadcrumb(),
        {
          type: "default",
          category: "ui.click",
          level: "info",
          message: "button.connect-wallet",
        },
      ],
    },
    {
      caseName: "a non-default Zerion breadcrumb",
      breadcrumbs: [
        {
          ...createZerionBreadcrumb(),
          type: "navigation",
        },
      ],
    },
  ])("keeps the rejection with $caseName", ({ breadcrumbs }) => {
    const event = createZerionEvent({ breadcrumbs });

    expect(shouldFilterZerionUserRejectedRequest(event)).toBe(false);
  });
});
