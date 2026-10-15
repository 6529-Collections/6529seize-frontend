import { MEMES_CONTRACT } from "@/constants/constants";

// Sandbox policy for iframes that render NFT animation / generative-art HTML.
//
// - allow-scripts: required. The artwork is interactive or generative HTML and
//   draws itself with script.
// - Every other capability is intentionally omitted, so the frame runs with an
//   opaque origin. In particular `allow-same-origin` is withheld by default:
//   combined with `allow-scripts` it lets a frame that is served from this
//   site's own origin remove its own sandbox.
// - Also omitted: popups, top-level navigation, forms, modals, pointer lock and
//   downloads. Add one only for a specific artwork that is shown to need it, and
//   document the reason next to the exception below.
export const NFT_HTML_IFRAME_SANDBOX = "allow-scripts";

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
