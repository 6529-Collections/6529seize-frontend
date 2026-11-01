/**
 * The site's bundles use syntax that Safari before 16.4 (iOS 15.0 to 16.3)
 * and other old browsers cannot parse: class static blocks. There the page
 * never starts and stays a dead shell. Three tiny inline scripts, run in
 * order while the HTML is parsed and before any bundle, detect this and show
 * a server-rendered notice instead:
 *
 * 1. sets `window.__6529LegacyBrowser = true`;
 * 2. is written with a class static block, the syntax that fails, and sets
 *    the flag back to false; an old browser rejects the whole script as a
 *    parse error, so the flag stays true;
 * 3. marks `<html>` when the flag is still true, which shows the notice and
 *    hides everything else (LEGACY_BROWSER_STYLES).
 *
 * Nothing is evaluated from strings (the CSP has no 'unsafe-eval'). Scripts
 * 1 and 3 stay ES5 so every browser can run them. Newer browsers never set
 * the attribute, so the notice never renders or takes space there.
 */

export const LEGACY_BROWSER_NOTICE_ID = "legacy-browser-notice";
export const LEGACY_BROWSER_ATTRIBUTE = "data-legacy-browser";
export const LEGACY_BROWSER_VARIANT_ATTRIBUTE = "data-legacy-variant";
export const LEGACY_BROWSER_VARIANTS = ["ios", "other"] as const;
export type LegacyBrowserVariant = (typeof LEGACY_BROWSER_VARIANTS)[number];

const FLAG = "window.__6529LegacyBrowser";

/** Script 1: assume an old browser until script 2 proves otherwise. */
export const LEGACY_BROWSER_FLAG_SCRIPT = `${FLAG}=true;`;

/**
 * Script 2: a class expression (no global name) whose static block runs only
 * where the syntax parses.
 */
export const LEGACY_BROWSER_SYNTAX_SCRIPT = `void class{static{${FLAG}=false}};`;

/**
 * Script 3: an old browser gets the notice, iOS (including iPadOS, which
 * reports a Mac) the iOS wording and anything else the browser wording.
 */
export const LEGACY_BROWSER_NOTICE_SCRIPT = `(function(){try{if(${FLAG}!==true)return;var n=navigator;var ios=/iPad|iPhone|iPod/.test(n.userAgent)||(n.platform==="MacIntel"&&n.maxTouchPoints>1);document.documentElement.setAttribute("${LEGACY_BROWSER_ATTRIBUTE}",ios?"ios":"other")}catch(e){}})();`;

// Inline so the notice needs neither the CSS nor the JS bundles.
export const LEGACY_BROWSER_STYLES = `
#${LEGACY_BROWSER_NOTICE_ID}{display:none}
html[${LEGACY_BROWSER_ATTRIBUTE}] body>:not(#${LEGACY_BROWSER_NOTICE_ID}){display:none!important}
html[${LEGACY_BROWSER_ATTRIBUTE}] #${LEGACY_BROWSER_NOTICE_ID}{position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:#080a09;color:#f1f2f2;font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif;text-align:center;padding:24px;box-sizing:border-box}
#${LEGACY_BROWSER_NOTICE_ID} [${LEGACY_BROWSER_VARIANT_ATTRIBUTE}]{display:none;max-width:28rem}
${LEGACY_BROWSER_VARIANTS.map(
  (variant) =>
    `html[${LEGACY_BROWSER_ATTRIBUTE}="${variant}"] #${LEGACY_BROWSER_NOTICE_ID} [${LEGACY_BROWSER_VARIANT_ATTRIBUTE}="${variant}"]{display:block}`
).join("\n")}
#${LEGACY_BROWSER_NOTICE_ID} h1{margin:0 0 12px;font-size:22px;font-weight:600;line-height:1.3}
#${LEGACY_BROWSER_NOTICE_ID} p{margin:0;font-size:16px;line-height:1.5;color:#c9cdcb}
`;
