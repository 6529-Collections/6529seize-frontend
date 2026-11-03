import { isAwsRumSessionSampled } from "@/utils/monitoring/awsRumSampling";

const STORAGE_KEY = "6529:aws-rum-session-sampled";

const encodeSession = (session: unknown): string =>
  btoa(JSON.stringify(session));

const setSessionCookie = (value: string): void => {
  document.cookie = `cwr_s=${value}; path=/`;
};

const clearSessionCookie = (): void => {
  document.cookie = "cwr_s=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
};

describe("isAwsRumSessionSampled", () => {
  let randomSpy: jest.SpyInstance;

  beforeEach(() => {
    window.sessionStorage.clear();
    clearSessionCookie();
    randomSpy = jest.spyOn(Math, "random");
  });

  afterEach(() => {
    randomSpy.mockRestore();
    window.sessionStorage.clear();
    clearSessionCookie();
  });

  it("draws once against the sample rate and keeps the result for the tab", () => {
    randomSpy.mockReturnValue(0.1);

    expect(isAwsRumSessionSampled(0.2)).toBe(true);
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBe("1");

    randomSpy.mockReturnValue(0.9);
    expect(isAwsRumSessionSampled(0.2)).toBe(true);
    expect(randomSpy).toHaveBeenCalledTimes(1);
  });

  it("stores an unsampled draw so reloads stay unsampled", () => {
    randomSpy.mockReturnValue(0.2);

    expect(isAwsRumSessionSampled(0.2)).toBe(false);
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBe("0");

    randomSpy.mockReturnValue(0);
    expect(isAwsRumSessionSampled(0.2)).toBe(false);
  });

  it("never samples at rate 0 and always samples at rate 1", () => {
    randomSpy.mockReturnValue(0);
    expect(isAwsRumSessionSampled(0)).toBe(false);

    window.sessionStorage.clear();
    randomSpy.mockReturnValue(0.999);
    expect(isAwsRumSessionSampled(1)).toBe(true);
  });

  it("follows a live RUM session cookie over the tab's own decision", () => {
    window.sessionStorage.setItem(STORAGE_KEY, "0");
    setSessionCookie(
      encodeSession({ sessionId: "s", record: true, eventCount: 3 })
    );

    expect(isAwsRumSessionSampled(0.2)).toBe(true);

    setSessionCookie(
      encodeSession({ sessionId: "s", record: false, eventCount: 3 })
    );
    window.sessionStorage.setItem(STORAGE_KEY, "1");

    expect(isAwsRumSessionSampled(0.2)).toBe(false);
    expect(randomSpy).not.toHaveBeenCalled();
  });

  it.each([true, false])(
    "reads the record flag (%s) from a cookie value with base64 padding",
    (record) => {
      // Session ids sized so both payloads end in base64 "=" padding.
      const encoded = encodeSession({
        sessionId: record ? "ab" : "abc",
        record,
      });
      expect(encoded).toMatch(/=$/);
      setSessionCookie(encoded);
      // The stored decision and the draw both disagree with the cookie, so
      // only a parsed record flag can produce the expected result.
      window.sessionStorage.setItem(STORAGE_KEY, record ? "0" : "1");
      randomSpy.mockReturnValue(record ? 0.99 : 0);

      expect(isAwsRumSessionSampled(record ? 0 : 1)).toBe(record);
      expect(randomSpy).not.toHaveBeenCalled();
    }
  );

  it.each([
    [-0.5, 0, false],
    [1.5, 0.999, true],
    [Number.NaN, 0, false],
    [Number.POSITIVE_INFINITY, 0, false],
  ])("clamps the sample rate %p", (sampleRate, draw, expected) => {
    randomSpy.mockReturnValue(draw);

    expect(isAwsRumSessionSampled(sampleRate)).toBe(expected);
  });

  it.each([
    ["not base64", "%%%"],
    ["not JSON", btoa("not json")],
    ["no record flag", encodeSession({ sessionId: "s" })],
  ])("ignores an unreadable session cookie (%s)", (_label, value) => {
    setSessionCookie(value);
    randomSpy.mockReturnValue(0.5);

    expect(isAwsRumSessionSampled(0.2)).toBe(false);
    expect(randomSpy).toHaveBeenCalledTimes(1);
  });

  it("still decides when sessionStorage throws", () => {
    const getItemSpy = jest
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    const setItemSpy = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    randomSpy.mockReturnValue(0.1);

    try {
      expect(isAwsRumSessionSampled(0.2)).toBe(true);
    } finally {
      getItemSpy.mockRestore();
      setItemSpy.mockRestore();
    }
  });
});
