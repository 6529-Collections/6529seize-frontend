import { canServerRenderNftPurchasing } from "@/components/common/nftPurchasingRequest";

// The iOS app (6529 Mobile) keeps WKWebView's default user agent.
const IOS_APP_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
const IOS_APP_IPAD =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko)";
const ANDROID_APP =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8 Build/AP2A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.6668.81 Mobile Safari/537.36";
const WINDOWS_CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

it.each([
  ["Windows Chrome", WINDOWS_CHROME],
  [
    "Mac Safari",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
  ],
  [
    "Mac Chrome",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  ],
  [
    "Mac Firefox",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:131.0) Gecko/20100101 Firefox/131.0",
  ],
  [
    "Android Chrome",
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  ],
  ["the Android app", ANDROID_APP],
  [
    "Googlebot smartphone",
    "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  ],
  [
    "Googlebot desktop",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/130.0.0.0 Safari/537.36",
  ],
])("server-renders purchasing content for %s", (_label, userAgent) => {
  expect(
    canServerRenderNftPurchasing({ hasNativeIosCookie: false, userAgent })
  ).toBe(true);
});

it.each([
  ["the iOS app on iPhone", IOS_APP_IPHONE],
  ["the iOS app on iPad", IOS_APP_IPAD],
  [
    "iPhone Safari",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  ],
  [
    "iPhone Chrome",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.0.0 Mobile/15E148 Safari/604.1",
  ],
  [
    "iPad Safari",
    "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  ],
  [
    "a Bing crawler with an iPhone user agent",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
  ],
  ["a request without a user agent", null],
  ["an empty user agent", ""],
  ["a blank user agent", "   "],
])(
  "keeps purchasing content out of server HTML for %s",
  (_label, userAgent) => {
    expect(
      canServerRenderNftPurchasing({ hasNativeIosCookie: false, userAgent })
    ).toBe(false);
  }
);

it.each([
  ["a desktop user agent", WINDOWS_CHROME],
  ["an Android user agent", ANDROID_APP],
  ["the iOS app user agent", IOS_APP_IPHONE],
])(
  "keeps purchasing content out of server HTML when the native iOS cookie arrives with %s",
  (_label, userAgent) => {
    expect(
      canServerRenderNftPurchasing({ hasNativeIosCookie: true, userAgent })
    ).toBe(false);
  }
);
