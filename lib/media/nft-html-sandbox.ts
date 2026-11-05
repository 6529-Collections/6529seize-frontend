import { MEMES_CONTRACT } from "@/constants/constants";

// Sandbox policy for iframes that render NFT animation / generative-art HTML.
//
// The goal is to isolate the artwork from this site while keeping the artwork
// working:
// - allow-scripts: required. The artwork is interactive or generative HTML and
//   draws itself with script.
// - allow-downloads: several Memes have save/export buttons that download a
//   file from script.
// - allow-popups + allow-popups-to-escape-sandbox: several Memes link out to
//   other sites in a new tab. The escape flag lets that tab load as a normal
//   page instead of inheriting this sandbox (a sandboxed target site would not
//   run). Chromium requires a user gesture for both downloads and popups, and
//   an escaped popup is equivalent to a normal `target="_blank"` link.
// - Intentionally omitted: `allow-same-origin` (see the exception below),
//   `allow-top-navigation*` (the artwork cannot navigate this page), forms,
//   modals and pointer lock. Without `allow-same-origin` the frame runs with an
//   opaque origin and cannot read this site's storage, cookies or DOM; combined
//   with `allow-scripts` it would let a frame served from this site's own
//   origin remove its own sandbox.
export const NFT_HTML_IFRAME_SANDBOX =
  "allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox";

// NextGen generator frames. No NextGen work shown to date downloads files or
// opens links, so they keep the minimal policy: scripts only.
export const NEXTGEN_HTML_IFRAME_SANDBOX = "allow-scripts";

// Memes #507 ("1939") reads `window.localStorage` while it starts. A sandboxed
// frame with an opaque origin throws a SecurityError there and the scene never
// draws, so this one artwork also needs `allow-same-origin`. That is safe here
// because the source is pinned to immutable Arweave content and is only ever
// loaded from third-party gateway hosts (Arweave gateways, the media
// resolver), never from this site's origin.
const MEMES_507_SANDBOX = `${NFT_HTML_IFRAME_SANDBOX} allow-same-origin`;
const MEMES_507_ORIGINAL_URL =
  "https://arweave.net/ZXasOCLe2lF1iR_EcG7iZ628NLWs5vYHh-zBl6zhvVg";

export function getNftHtmlIframeSandbox(
  nft: { readonly contract?: string | undefined; readonly id: number },
  source: string | undefined
): string {
  if (
    nft.contract?.toLowerCase() === MEMES_CONTRACT.toLowerCase() &&
    nft.id === 507 &&
    source === MEMES_507_ORIGINAL_URL
  ) {
    return MEMES_507_SANDBOX;
  }
  return NFT_HTML_IFRAME_SANDBOX;
}
