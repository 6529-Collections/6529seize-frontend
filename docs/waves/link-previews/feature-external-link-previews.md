# Wave Drop External Link Previews

Parent: [Link Previews Index](README.md)

## Overview

Wave markdown renders generic external-link cards for eligible `http://` and
`https://` URLs when no provider-specific handler matches first.

Generic cards can show domain, title, description, and image.
In chat and direct-message layouts, cards render in a fixed-height frame to
reduce layout shift while loading.

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Home-style drop cards that reuse wave link-preview rendering (for example
  boosted cards on `/` and wave leaderboard content cards)

## Entry Points

- Open a published drop with at least one eligible external URL.
- Publish a new drop that includes an eligible external URL.
- Use `Show link previews` on a hidden-preview drop to restore cards.

## User Journey

1. Open a drop containing an eligible URL.
2. A loading skeleton appears while preview metadata is fetched.
3. If metadata resolves, the drop shows a card with title, description, domain,
   and optional image.
4. In chat/message cards, side actions show copy/open controls; eligible authors
   can also see `Hide link previews`.
5. In home-style cards, side action buttons are not shown.

## Common Scenarios

- News, blog, and docs URLs render as generic external cards.
- Repeated views of the same URL can resolve faster because preview responses
  are cached.
- Long unbroken metadata text wraps inside the card to avoid horizontal overflow.
- Multiple eligible links in one drop render as separate cards.
- If previews are hidden for a drop, links stay plain until previews are shown
  again.
- Provider-specific URLs (for example YouTube, Twitter/X, TikTok/Farcaster/Tenor,
  Google/Wikimedia, and web3 handlers) are documented on sibling pages in this
  folder.

## Edge Cases

- Only absolute `http://` and `https://` URLs are eligible.
- Non-HTTP(S) links remain regular links.
- Localhost, private, or internal-only targets are blocked from metadata fetch
  and fall back to regular clickable links.
- Some URLs route to dedicated handlers first; this page only covers the generic
  external-card path.

## Failure and Recovery

- While loading, users see a skeleton state.
- If preview fetch fails, the UI falls back to a clickable link presentation.
- If fetch succeeds but returns no usable metadata, the UI uses the same
  clickable fallback link presentation.
- If preview visibility toggle fails, preview state rolls back and the user sees
  an error toast.

## Limitations / Notes

- Generic preview fetch supports public HTTP(S) destinations only.
- Card quality depends on metadata published by the destination.
- Slow or redirect-heavy destinations can degrade preview quality or fall back to
  non-rich link states.
- This page does not cover provider-specific cards.

## Related Pages

- [Wave Link Previews Index](README.md)
- [Waves Index](../README.md)
- [Wave Drop Link Preview Toggle](feature-link-preview-toggle.md)
- [Wave Drop Twitter/X Link Previews](feature-twitter-link-previews.md)
- [Wave Drop YouTube Link Previews](feature-youtube-link-previews.md)
- [Wave Drop Social Platform Previews](feature-social-platform-previews.md)
- [Wave Drop Knowledge and Workspace Previews](feature-knowledge-and-workspace-previews.md)
- [Wave Drop Web3 Preview Cards](feature-web3-preview-cards.md)
- [Wave Drop Open and Copy Links](../drop-actions/feature-open-and-copy-links.md)
- [Docs Home](../../README.md)
