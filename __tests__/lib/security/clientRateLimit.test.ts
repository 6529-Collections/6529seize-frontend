/** @jest-environment node */
import { createClientRateLimiter } from "@/lib/security/clientRateLimit";

const WINDOW_MS = 60_000;

function requestFrom(forwardedFor?: string): Pick<Request, "headers"> {
  const headers = new Headers();
  if (forwardedFor !== undefined) {
    headers.set("x-forwarded-for", forwardedFor);
  }
  return { headers };
}

function createLimiter(limit = 2, maxBuckets?: number) {
  return createClientRateLimiter({
    limit,
    windowMs: WINDOW_MS,
    errorMessage: "Too many test requests",
    maxBuckets,
  });
}

function allowedCount(
  enforce: ReturnType<typeof createLimiter>,
  forwardedFor: readonly (string | undefined)[]
): number {
  return forwardedFor.filter((value) => enforce(requestFrom(value)) === null)
    .length;
}

describe("createClientRateLimiter", () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date("2026-10-12T00:00:00.000Z") });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("rejects requests over the budget with Retry-After until the window ends", async () => {
    const enforce = createLimiter();

    expect(enforce(requestFrom("8.8.8.8"))).toBeNull();
    jest.advanceTimersByTime(15_000);
    expect(enforce(requestFrom("8.8.8.8"))).toBeNull();

    const limited = enforce(requestFrom("8.8.8.8"));
    expect(limited?.status).toBe(429);
    expect(limited?.headers.get("retry-after")).toBe("45");
    expect(limited?.headers.get("cache-control")).toBe("no-store");
    expect(await limited?.json()).toEqual({ error: "Too many test requests" });

    jest.advanceTimersByTime(WINDOW_MS - 15_000);
    expect(enforce(requestFrom("8.8.8.8"))).toBeNull();
  });

  it("keeps separate budgets for separate clients", () => {
    const enforce = createLimiter(1);

    expect(allowedCount(enforce, ["8.8.8.8", "1.1.1.1", "8.8.8.8"])).toBe(2);
  });

  it("ignores client-supplied entries left of the proxy-appended address", () => {
    const enforce = createLimiter();

    expect(
      allowedCount(enforce, [
        "1.0.0.1, 8.8.8.8",
        "9.9.9.9, 8.8.8.8",
        "10.0.0.7, 8.8.8.8",
      ])
    ).toBe(2);
  });

  it("skips private proxy hops appended after the client address", () => {
    const enforce = createLimiter();

    expect(
      allowedCount(enforce, [
        "8.8.8.8, 172.31.4.20",
        "8.8.8.8, 127.0.0.1",
        "8.8.8.8",
      ])
    ).toBe(2);
  });

  it("buckets IPv4-mapped and IPv6 /64 addresses together", () => {
    const enforce = createLimiter(1);

    expect(allowedCount(enforce, ["8.8.8.8", "::ffff:8.8.8.8"])).toBe(1);
    expect(
      allowedCount(enforce, [
        "2001:4860:4860::8888",
        "2001:4860:4860:0:abcd::1",
        "2001:4860:4861::8888",
      ])
    ).toBe(2);
  });

  it("gives requests without a public client address one shared, larger budget", () => {
    const enforce = createLimiter(1);
    const unidentified = [
      undefined,
      "127.0.0.1",
      "::1",
      "10.0.0.1, 192.168.1.10",
      "8.8.8.8, not-an-address",
    ];

    expect(
      allowedCount(enforce, [...unidentified, ...unidentified, undefined])
    ).toBe(10);
    expect(enforce(requestFrom("8.8.8.8"))).toBeNull();
  });

  it("charges weighted requests only when they fit the remaining budget", () => {
    const enforce = createLimiter(10);
    const client = requestFrom("8.8.8.8");

    expect(enforce(client, 6)).toBeNull();
    expect(enforce(client, 6)?.status).toBe(429);
    expect(enforce(client, 4)).toBeNull();
    expect(enforce(client, 1)?.status).toBe(429);
  });

  it("evicts the oldest client buckets when the bucket cap is reached", () => {
    const enforce = createLimiter(1, 2);

    expect(allowedCount(enforce, ["8.8.8.8", "8.8.8.8"])).toBe(1);
    expect(allowedCount(enforce, ["1.1.1.1", "9.9.9.9"])).toBe(2);
    expect(enforce(requestFrom("8.8.8.8"))).toBeNull();
  });
});
