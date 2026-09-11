import {
  getDefaultQueryRetry,
  getWaveDropsInitialLimit,
  isRateLimitQueryError,
  isTerminalNotificationAuthQueryError,
  shouldStopPollingRetry,
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

  it("detects rate limits on nested response statuses", () => {
    expect(isRateLimitQueryError({ response: { status: 429 } })).toBe(true);
    expect(isRateLimitQueryError({ cause: { status: 429 } })).toBe(true);
    expect(isRateLimitQueryError({ status: 500 })).toBe(false);
  });

  it("stops polling retries for auth and rate-limit responses", () => {
    expect(shouldStopPollingRetry({ status: 401 })).toBe(true);
    expect(shouldStopPollingRetry({ status: 429 })).toBe(true);
    expect(shouldStopPollingRetry({ status: 500 })).toBe(false);
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

    expect(shouldStopPollingRetry({ status: 403 })).toBe(false);
  });

  it("keeps retrying non-rate-limit failures until the default retry count", () => {
    const onRetryStopped = jest.fn();
    const retryPolicy = getDefaultQueryRetry<unknown>(onRetryStopped);

    expect(retryPolicy.retry(2, { status: 500 })).toBe(true);
    expect(retryPolicy.retry(3, { status: 500 })).toBe(false);

    expect(onRetryStopped).toHaveBeenCalledTimes(1);
  });
});
