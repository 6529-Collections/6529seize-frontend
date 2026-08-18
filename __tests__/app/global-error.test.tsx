import { publicEnv } from "@/config/env";
import { captureNextjsGlobalError } from "@/utils/monitoring/nextjsRscError";
import * as Sentry from "@sentry/nextjs";

jest.mock("@sentry/nextjs", () => ({
  __esModule: true,
  captureException: jest.fn(),
}));

jest.mock("@/config/env", () => ({
  publicEnv: { SENTRY_DSN: "https://public@example.invalid/1" },
}));

const mockCaptureException = jest.mocked(Sentry.captureException);

const NEXTJS_RSC_RENDER_ERROR_MESSAGE =
  "An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details. A digest property is included on this error instance which may provide additional details about the nature of the error.";

function createError(message: string, digest?: unknown): Error & {
  digest?: unknown;
} {
  return Object.assign(
    new Error(message),
    digest === undefined ? {} : { digest }
  );
}

describe("GlobalError Sentry capture", () => {
  beforeEach(() => {
    mockCaptureException.mockClear();
    publicEnv.SENTRY_DSN = "https://public@example.invalid/1";
  });

  it.each(["0", "779660776", "4216289156", "4294967295"])(
    "tags and fingerprints the redacted RSC error with digest %s",
    (digest) => {
      const error = createError(NEXTJS_RSC_RENDER_ERROR_MESSAGE, digest);

      captureNextjsGlobalError(error);

      expect(mockCaptureException).toHaveBeenCalledWith(error, {
        tags: { digest },
        fingerprint: ["nextjs-rsc-render", digest],
      });
    }
  );

  it.each([
    ["missing digest", NEXTJS_RSC_RENDER_ERROR_MESSAGE, undefined],
    ["different message", "Different server error", "779660776"],
    ["non-decimal digest", NEXTJS_RSC_RENDER_ERROR_MESSAGE, "779660776a"],
    ["oversized digest", NEXTJS_RSC_RENDER_ERROR_MESSAGE, "4294967296"],
  ])(
    "preserves default grouping for a %s",
    (_caseName, message, digest) => {
      const error = createError(message, digest);

      captureNextjsGlobalError(error);

      expect(mockCaptureException).toHaveBeenCalledWith(error);
    }
  );

  it.each([
    ["numeric digest", 779660776],
    ["symbol digest", Symbol("digest")],
  ] as const)(
    "preserves default grouping without throwing for a %s",
    (_caseName, digest) => {
      const error = createError(NEXTJS_RSC_RENDER_ERROR_MESSAGE, digest);

      expect(() => captureNextjsGlobalError(error)).not.toThrow();
      expect(mockCaptureException).toHaveBeenCalledWith(error);
    }
  );

  it("does not capture when Sentry is disabled", () => {
    publicEnv.SENTRY_DSN = undefined;
    const error = createError(NEXTJS_RSC_RENDER_ERROR_MESSAGE, "779660776");

    captureNextjsGlobalError(error);

    expect(mockCaptureException).not.toHaveBeenCalled();
  });
});
