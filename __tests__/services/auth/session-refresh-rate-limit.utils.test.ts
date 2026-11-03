import {
  getRateLimitCooldownMs,
  SessionRefreshRateLimitError,
} from "@/services/auth/session-refresh-rate-limit.utils";

afterEach(() => jest.useRealTimers());

it.each([
  ["1", 1000],
  ["0", 0],
  ["999999999", 60000],
  ["not-a-date", 60000],
])(
  "handles Retry-After %s without an unbounded recovery wait",
  (value, expected) => {
    expect(
      getRateLimitCooldownMs({ headers: new Headers({ "Retry-After": value }) })
    ).toBe(expected);
  }
);

it("uses HTTP dates and bounds excessively distant retry dates", () => {
  jest.useFakeTimers().setSystemTime(new Date("2026-10-03T00:00:00Z"));
  expect(
    getRateLimitCooldownMs({
      headers: new Headers({ "Retry-After": "Sat, 03 Oct 2026 00:00:10 GMT" }),
    })
  ).toBe(10000);
  expect(
    getRateLimitCooldownMs({
      headers: new Headers({ "Retry-After": "Sun, 03 Oct 2027 00:00:00 GMT" }),
    })
  ).toBe(60000);
});

it("uses the response body when retry headers are not exposed", () => {
  expect(
    getRateLimitCooldownMs({ response: { body: '{"retryAfter":2}' } })
  ).toBe(2000);
  expect(
    getRateLimitCooldownMs({
      response: { body: { retryAfter: Number.MAX_VALUE } },
    })
  ).toBe(60000);
  expect(
    getRateLimitCooldownMs(
      new SessionRefreshRateLimitError(Date.now() + 1000000000)
    )
  ).toBe(60000);
});
