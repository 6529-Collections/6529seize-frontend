# Farcaster Mini App Link Previews

6529 link previews enrich generic web pages that publish Farcaster Mini App or
Frame metadata through the shared `/api/open-graph` endpoint.

## Metadata Order

The preview parser handles:

- `fc:miniapp` JSON metadata from current Mini App embeds.
- `fc:frame` JSON metadata for backward-compatible Mini App embeds.
- Legacy frame tags such as `fc:frame:image` and `fc:frame:button:1`.

Google Workspace previews keep priority over Farcaster metadata. When no
Farcaster embed metadata is present, the endpoint falls back to the regular
generic OpenGraph response.

## Safety

Fetched HTML is still bounded by the shared OpenGraph byte limit and public URL
guard. Image, splash image, and action URLs extracted from third-party metadata
are resolved against the final page URL and passed through the same public URL
guard before they can appear in the response.

The response does not emit server-built image alt text. The client card owns the
localized accessible label.

## Rendering

Typed `farcaster.miniapp` responses render as a native card with:

- A 3:2 media frame.
- A Farcaster-colored accent.
- Mini App or Frame badge.
- App title, description, source, optional splash image, and launch button.

The card is responsive in chat, tablet, mobile, and home-feed variants.
