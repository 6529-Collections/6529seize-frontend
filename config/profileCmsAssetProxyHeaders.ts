import { PROFILE_CMS_ASSET_PROXY_PATH } from "../lib/profile-cms/runtime/mediaProxy";

// The CMS asset proxy serves upstream files from the app's own origin. A
// response opened directly is an inert, sandboxed document that loads nothing.
// Next.js keeps a header from `headers()` over the same header set by a route
// handler, so this entry (listed after the site-wide policy) is what applies.
//
// `style-src 'unsafe-inline'` is for the browser's own image viewer, not for
// the asset: Chromium and WebKit lay out an image opened as a page with inline
// styles, which `default-src 'none'` alone blocks (the image then loses its
// centering and the console logs a CSP violation). Firefox styles its viewer
// without inline styles. The proxy serves only raster images and JSON, and
// `sandbox` with no `allow-scripts` keeps the document script-free, so inline
// styles there cannot run anything.
export const PROFILE_CMS_ASSET_CONTENT_SECURITY_POLICY =
  "default-src 'none'; style-src 'unsafe-inline'; sandbox";

export const profileCmsAssetProxyHeaders = {
  source: PROFILE_CMS_ASSET_PROXY_PATH,
  headers: [
    {
      key: "Content-Security-Policy",
      value: PROFILE_CMS_ASSET_CONTENT_SECURITY_POLICY,
    },
  ],
};
