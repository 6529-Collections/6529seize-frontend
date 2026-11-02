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

  it("buckets IPv4-mapped IPv6 spellings with their IPv4 address", () => {
    const enforce = createLimiter(1);

    expect(
      allowedCount(enforce, [
        "8.8.8.8",
        "::ffff:8.8.8.8",
        "::ffff:808:808",
        "0:0:0:0:0:ffff:0808:0808",
      ])
    ).toBe(1);
  });

  it("buckets every spelling of an IPv4-mapped address with its IPv4 address", () => {
    const enforce = createLimiter(1);

    expect(
      allowedCount(enforce, [
        "8.8.8.8",
        "::ffff:8.8.8.8",
        "0:0:0:0:0:ffff:8.8.8.8",
        "0000:0000:0000:0000:0000:ffff:8.8.8.8",
        "::FFFF:8.8.8.8",
        "0:0:0:0:0:FfFf:8.8.8.8",
        "0000:0000:0000:0000:0000:FFFF:0808:0808",
        "0:0::ffff:8.8.8.8",
      ])
    ).toBe(1);
  });

  it("does not merge distinct IPv4 addresses behind mapped spellings", () => {
    const enforce = createLimiter(1);

    expect(
      allowedCount(enforce, [
        "::ffff:8.8.8.8",
        "0:0:0:0:0:ffff:8.8.4.4",
        "0000:0000:0000:0000:0000:ffff:0101:0101",
      ])
    ).toBe(3);
  });

  it("skips mapped private and loopback IPv4 hops in every spelling", () => {
    const enforce = createLimiter(1);

    expect(
      allowedCount(enforce, [
        "8.8.8.8, ::ffff:10.0.0.1",
        "8.8.8.8, 0:0:0:0:0:ffff:127.0.0.1",
        "8.8.8.8, 0000:0000:0000:0000:0000:ffff:c0a8:0101",
        "8.8.8.8, ::FFFF:169.254.169.254",
      ])
    ).toBe(1);
  });

  it("buckets IPv6 addresses with a dotted tail by their /64", () => {
    const enforce = createLimiter(1);

    expect(
      allowedCount(enforce, [
        "2a00:1450:0:0:0:0:8.8.8.8",
        "2A00:1450::808:808",
        "2a00:1450:0000:0000:ffff:ffff:1.2.3.4",
      ])
    ).toBe(1);
  });

  it("treats a dotted quad anywhere but the final group as unidentified", () => {
    const enforce = createLimiter(1);
    const malformed = [
      "1.2.3.4::1",
      "::1.2.3.4:5",
      "1:2:3:4:1.2.3.4:6:7",
      "::ffff:1.2.3",
      "::ffff:01.2.3.4",
    ];

    // Malformed spellings share the larger unidentified budget (10x) rather
    // than getting a bucket of their own, and they never reach a public one.
    expect(allowedCount(enforce, [...malformed, ...malformed])).toBe(10);
    expect(enforce(requestFrom(malformed[0]))?.status).toBe(429);
    expect(enforce(requestFrom("8.8.8.8"))).toBeNull();
  });

  it("buckets IPv6 clients by /64 across compressed spellings", () => {
    const enforce = createLimiter(1);

    expect(
      allowedCount(enforce, [
        "2a00:1450::abcd:1",
        "2a00:1450:0:0:1::",
        "2A00:1450:0000:0000:ffff:ffff:ffff:ffff",
      ])
    ).toBe(1);
    expect(
      allowedCount(enforce, ["2a00:1450:0:1::1", "2a00:1450:1::1", "2a00:1451::"])
    ).toBe(3);
  });

  it("expands embedded IPv4 tails before taking the /64", () => {
    const enforce = createLimiter(1);

    expect(
      allowedCount(enforce, [
        "64:ff9b::8.8.8.8",
        "64:ff9b::1.1.1.1",
        "64:ff9b:1::8.8.8.8",
      ])
    ).toBe(2);
  });

  it("skips private and loopback IPv6 hops in any spelling", () => {
    const enforce = createLimiter(1);

    expect(
      allowedCount(enforce, [
        "2a00:1450:5::1, ::1",
        "2a00:1450:5::2, 0000:0000:0000:0000:0000:0000:0000:0001",
        "2a00:1450:5::3, fe80::1",
        "2a00:1450:5::4, fd00::1",
      ])
    ).toBe(1);
  });

  it("gives requests without a public client address one shared, larger budget", () => {
    const enforce = createLimiter(1);
    const unidentified = [
      undefined,
      "127.0.0.1",
      "::1",
      "10.0.0.1, 192.168.1.10",
      "8.8.8.8, not-an-address",
      "2a00:1450::1%eth0",
    ];

    expect(
      allowedCount(enforce, [...unidentified, ...unidentified.slice(0, 5)])
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
