import { parseMobileAppUserAgent } from "@/helpers/mobileAppUserAgent";

const ANDROID_PHONE =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A.240805.005; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/127.0.6533.103 Mobile Safari/537.36";
const ANDROID_TABLET =
  "Mozilla/5.0 (Linux; Android 14; Pixel Tablet Build/AP2A.240805.005; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/127.0.6533.103 Safari/537.36";
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const IPAD_DESKTOP_CLASS =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko)";

describe("parseMobileAppUserAgent", () => {
  it.each([ANDROID_PHONE, ANDROID_TABLET, IPHONE, IPAD_DESKTOP_CLASS])(
    "reads the app version and strips the token from %s",
    (browserUserAgent) => {
      expect(
        parseMobileAppUserAgent(`${browserUserAgent} 6529Mobile/1.3`)
      ).toEqual({ appVersion: "1.3", browserUserAgent });
    }
  );

  it.each([ANDROID_PHONE, ANDROID_TABLET, IPHONE, IPAD_DESKTOP_CLASS])(
    "leaves a user agent without the token unchanged: %s",
    (browserUserAgent) => {
      expect(parseMobileAppUserAgent(browserUserAgent)).toEqual({
        appVersion: null,
        browserUserAgent,
      });
    }
  );

  it("keeps the rest of the user agent when the token is not last", () => {
    expect(
      parseMobileAppUserAgent(`${IPHONE} 6529Mobile/1.3.1 Extra/2`)
    ).toEqual({ appVersion: "1.3.1", browserUserAgent: `${IPHONE} Extra/2` });
  });

  it.each([
    "6529Mobile/",
    "6529Mobile/beta",
    "6529Mobile/1.3;",
    "6529Mobile/1..3",
  ])("strips but does not report a malformed token: %s", (token) => {
    expect(parseMobileAppUserAgent(`${ANDROID_TABLET} ${token}`)).toEqual({
      appVersion: null,
      browserUserAgent: ANDROID_TABLET,
    });
  });

  it("ignores the token inside another product name", () => {
    const userAgent = `${ANDROID_TABLET} Other6529Mobile/1.3`;
    expect(parseMobileAppUserAgent(userAgent)).toEqual({
      appVersion: null,
      browserUserAgent: userAgent,
    });
  });

  it.each([null, undefined, ""])(
    "accepts a missing user agent: %p",
    (value) => {
      expect(parseMobileAppUserAgent(value)).toEqual({
        appVersion: null,
        browserUserAgent: "",
      });
    }
  );
});
