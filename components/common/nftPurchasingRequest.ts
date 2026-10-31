// Every iPhone, iPad and iPod browser, and the iOS app's own WebView.
const APPLE_TOUCH_DEVICE = /iPhone|iPad|iPod|like Mac OS X/i;
// iPad apps, and iOS apps on Apple silicon Macs, send a desktop-class
// Macintosh user agent. Their WebView omits the Safari token that Safari and
// the Mac Chromium browsers send.
const MACINTOSH = /Macintosh/i;
const WEBKIT = /AppleWebKit/i;
const SAFARI_TOKEN = /Safari\//i;

const isMacWebView = (userAgent: string): boolean =>
  MACINTOSH.test(userAgent) &&
  WEBKIT.test(userAgent) &&
  !SAFARI_TOKEN.test(userAgent);

/**
 * Whether this response's server HTML may include NFT purchasing content.
 *
 * True only when the request is clearly not from the native iOS app: it has no
 * native iOS cookie and a user agent from a non-Apple device or a Mac browser.
 * Any other request, including one without a user agent such as a prerender,
 * keeps purchasing content out of the HTML, and the browser decides after
 * hydration with the country check.
 *
 * These signals only ever withhold content. The browser checks the native
 * runtime again before hydrating server-rendered purchasing content, so a
 * missing or altered signal cannot show it in the iOS app.
 */
export function canServerRenderNftPurchasing({
  hasNativeIosCookie,
  userAgent,
}: {
  readonly hasNativeIosCookie: boolean;
  readonly userAgent: string | null;
}): boolean {
  if (hasNativeIosCookie || !userAgent?.trim()) {
    return false;
  }
  return !APPLE_TOUCH_DEVICE.test(userAgent) && !isMacWebView(userAgent);
}
