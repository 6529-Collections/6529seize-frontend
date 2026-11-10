// The link-preview image proxy serves upstream images from the app's own
// origin. A response opened directly is an inert, sandboxed document that
// loads nothing. Next.js keeps a header from `headers()` over the same header
// set by a route handler, so this entry (listed after the site-wide policy) is
// what applies; the route sets the same value for completeness.
//
// As for the CMS asset proxy, `style-src 'unsafe-inline'` lets the browser's
// own image viewer lay out the image. The proxy serves raster images only, and
// `sandbox` without `allow-scripts` keeps the document script-free.
const OPEN_GRAPH_PROXY_IMAGE_PATH = "/api/open-graph/proxy-image";

export const OPEN_GRAPH_PROXY_IMAGE_CONTENT_SECURITY_POLICY =
  "default-src 'none'; style-src 'unsafe-inline'; sandbox";

export const openGraphProxyImageHeaders = {
  source: OPEN_GRAPH_PROXY_IMAGE_PATH,
  headers: [
    {
      key: "Content-Security-Policy",
      value: OPEN_GRAPH_PROXY_IMAGE_CONTENT_SECURITY_POLICY,
    },
  ],
};
