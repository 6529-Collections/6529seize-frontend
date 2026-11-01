/**
 * The notice shown instead of the site on browsers that cannot run it
 * (components/legacy-browser). Source copy (en-US); other locales fall back
 * to these strings until translated.
 */
export const LEGACY_BROWSER_MESSAGES = {
  "legacyBrowser.ios.title": "6529 needs iOS 16.4 or later",
  "legacyBrowser.ios.body":
    "Update in Settings > General > Software Update, then open 6529 again.",
  "legacyBrowser.other.title": "6529 needs a newer browser",
  "legacyBrowser.other.body":
    "Update your browser to its latest version, then open 6529 again.",
} as const;
