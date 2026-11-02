import {
  getDefaultQueryRetry,
  getWaveDropsInitialLimit,
  isTerminalNotificationAuthQueryError,
  shouldRetryQuery,
  WAVE_DROPS_NATIVE_INITIAL_PARAMS,
  WAVE_DROPS_PARAMS,
} from "@/components/react-query-wrapper/utils/query-utils";

describe("wave drop query params", () => {
  it("keeps desktop initial wave drops at the default page size", () => {
    expect(getWaveDropsInitialLimit(false)).toBe(WAVE_DROPS_PARAMS.limit);
  });

  it("uses the reduced initial page size on native", () => {
    expect(getWaveDropsInitialLimit(true)).toBe(
      WAVE_DROPS_NATIVE_INITIAL_PARAMS.limit
    );
    expect(WAVE_DROPS_NATIVE_INITIAL_PARAMS.limit).toBeLessThan(
      WAVE_DROPS_PARAMS.limit
    );
  });
});

describe("default query retry policy", () => {
  it("does not retry rate limit responses", () => {
    const onRetryStopped = jest.fn();
    const retryPolicy = getDefaultQueryRetry<unknown>(onRetryStopped);

    expect(retryPolicy.retry(0, { status: 429 })).toBe(false);

    expect(onRetryStopped).toHaveBeenCalledTimes(1);
  });

  it("scopes terminal 403 and session-upgrade handling to notification polling", () => {
    expect(isTerminalNotificationAuthQueryError({ status: 401 })).toBe(true);
    expect(isTerminalNotificationAuthQueryError({ status: 403 })).toBe(true);
    expect(
      isTerminalNotificationAuthQueryError({
        status: 409,
        response: { body: '{"error":"session_upgrade_required"}' },
      })
    ).toBe(true);
    expect(
      isTerminalNotificationAuthQueryError({
        status: 409,
        response: { body: "Conflict" },
      })
    ).toBe(false);
    expect(isTerminalNotificationAuthQueryError({ status: 429 })).toBe(false);
    expect(isTerminalNotificationAuthQueryError({ status: 503 })).toBe(false);
  });

  it("keeps retrying non-rate-limit failures until the default retry count", () => {
    const onRetryStopped = jest.fn();
    const retryPolicy = getDefaultQueryRetry<unknown>(onRetryStopped);

    expect(retryPolicy.retry(2, { status: 500 })).toBe(true);
    expect(retryPolicy.retry(3, { status: 500 })).toBe(false);

    expect(onRetryStopped).toHaveBeenCalledTimes(1);
  });

  it("stops on any structured client error and reports the stop", () => {
    const onRetryStopped = jest.fn();
    const retryPolicy = getDefaultQueryRetry<unknown>(onRetryStopped);

    expect(retryPolicy.retry(0, { status: 404 })).toBe(false);
    expect(retryPolicy.retry(0, { response: { status: 400 } })).toBe(false);

    expect(onRetryStopped).toHaveBeenCalledTimes(2);
  });
});

describe("shared query retry decision", () => {
  const structuredError = (status: number) =>
    Object.assign(new Error("Request failed"), { name: "ApiError", status });

  it.each([400, 401, 403, 404, 409, 422, 429])(
    "never retries a structured %i response",
    (status) => {
      expect(shouldRetryQuery(0, structuredError(status))).toBe(false);
      expect(shouldRetryQuery(1, structuredError(status))).toBe(false);
    }
  );

  it("reads the status from nested response and cause shapes", () => {
    expect(shouldRetryQuery(0, { response: { status: 429 } })).toBe(false);
    expect(shouldRetryQuery(0, { cause: { status: 429 } })).toBe(false);
    expect(shouldRetryQuery(0, { cause: { status: 404 } })).toBe(false);
  });

  it("does not retry 425 but retries a 408 request timeout", () => {
    expect(shouldRetryQuery(0, structuredError(425))).toBe(false);
    expect(shouldRetryQuery(0, structuredError(408))).toBe(true);
    expect(shouldRetryQuery(2, structuredError(408))).toBe(true);
    expect(shouldRetryQuery(3, structuredError(408))).toBe(false);
  });

  it.each([500, 502, 503, 504])(
    "retries a structured %i response up to the limit",
    (status) => {
      const error = structuredError(status);

      expect(shouldRetryQuery(0, error)).toBe(true);
      expect(shouldRetryQuery(1, error)).toBe(true);
      expect(shouldRetryQuery(2, error)).toBe(true);
      expect(shouldRetryQuery(3, error)).toBe(false);
    }
  );

  it("retries network failures up to the limit", () => {
    const error = new TypeError("Failed to fetch");

    expect(shouldRetryQuery(0, error)).toBe(true);
    expect(shouldRetryQuery(2, error)).toBe(true);
    expect(shouldRetryQuery(3, error)).toBe(false);
  });

  it("keeps the previous behaviour for legacy string rejections", () => {
    expect(shouldRetryQuery(0, "Too Many Requests")).toBe(true);
    expect(shouldRetryQuery(2, "Not Found")).toBe(true);
    expect(shouldRetryQuery(3, "Not Found")).toBe(false);
  });

  it("does not mistake other values for client errors", () => {
    expect(shouldRetryQuery(0, undefined)).toBe(true);
    expect(shouldRetryQuery(0, null)).toBe(true);
    expect(shouldRetryQuery(0, { status: "404" })).toBe(true);
  });
});
