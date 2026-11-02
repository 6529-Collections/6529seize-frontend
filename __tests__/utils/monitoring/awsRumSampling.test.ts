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

  it("reads a cookie whose base64 padding the cookie split drops", () => {
    const encoded = encodeSession({ sessionId: "ab", record: true });
    expect(encoded).toMatch(/=$/);
    setSessionCookie(encoded);

    expect(isAwsRumSessionSampled(0)).toBe(true);
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
