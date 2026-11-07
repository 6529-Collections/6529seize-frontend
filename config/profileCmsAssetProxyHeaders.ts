import { PROFILE_CMS_ASSET_PROXY_PATH } from "../lib/profile-cms/runtime/mediaProxy";

// The CMS asset proxy serves upstream files from the app's own origin. A
// response opened directly is an inert, sandboxed document that loads nothing.
// Next.js keeps a header from `headers()` over the same header set by a route
// handler, so this entry (listed after the site-wide policy) is what applies.
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
