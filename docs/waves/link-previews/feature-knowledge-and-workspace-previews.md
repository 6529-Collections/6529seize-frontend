# Wave Drop Knowledge and Workspace Previews

Parent: [Wave Link Previews Index](README.md)

## Overview

Wave markdown renders supported Google Workspace and Wikimedia links as
provider cards instead of generic external previews.

This page covers:

- Google Docs, Sheets, and Slides on `docs.google.com`
- Wikimedia links on Wikipedia, Wikimedia Commons, Wikidata, and `w.wiki`

## Location in the Site

- Public or group waves: `/waves/{waveId}`
- Direct messages: `/messages?wave={waveId}`
- Home-style drop cards that reuse wave markdown preview rendering

## Entry Points

- Open or publish a drop with Google Workspace URLs on `docs.google.com`:
  - `/document/d/{fileId}`
  - `/spreadsheets/d/{fileId}`
  - `/presentation/d/{fileId}`
- Open or publish a drop with Wikimedia URLs:
  - `*.wikipedia.org`
  - `*.wikimedia.org` (including `commons.wikimedia.org` and
    `upload.wikimedia.org`)
  - `wikidata.org` / `www.wikidata.org`
  - `w.wiki` short links
- If previews are hidden, use `Show link previews` on the drop.

## User Journey

1. Open a wave or message thread with a supported URL.
2. The renderer matches Google Workspace or Wikimedia and shows a loading card.
3. The card resolves to a provider layout.
4. Use card actions to open the source destination or related targets.

## Common Scenarios

- Google cards show a product badge (`Docs`, `Sheets`, `Slides`), title, and
  thumbnail with badge fallback when image loading fails.
- Docs and Slides cards show `Open in ...`, `View live preview`, and
  `Download PDF`.
- Sheets cards show `Open in Google Sheets` and `View live preview`. Published
  sheets can use embedded publish previews.
- Restricted Google files show a permission warning while keeping direct-open
  actions.
- Wikimedia cards resolve article, disambiguation, Commons file, and Wikidata
  layouts.
- Wikipedia cards can show language and section chips plus coordinates.
- Commons file cards can show media, credit/author/license details, and
  `View original`.
- Wikidata cards can show selected facts and sitelinks.

## Edge Cases

- Google links outside `.../d/{fileId}` patterns do not use Workspace cards.
- Wikipedia links in unsupported namespaces do not resolve to rich cards.
- Wikimedia cards can render partial details when upstream metadata is sparse.
- If previews are hidden for a drop, links stay plain until previews are shown.

## Failure and Recovery

- Google Workspace card failures fall back to generic external preview; if that
  fails, the drop keeps a plain clickable link.
- Wikimedia fetch failures show an explicit preview error state.
- Missing or unavailable Wikimedia targets show `This page is unavailable` with
  provider open actions when available.
- Reopening the thread retries preview fetches.

## Limitations / Notes

- Provider cards activate only for supported hosts and path patterns.
- Google preview quality depends on sharing permissions and provider responses.
- Wikimedia preview quality depends on available summary/media/entity metadata.

## Related Pages

- [Wave Link Previews Index](README.md)
- [Wave Drop External Link Previews](feature-external-link-previews.md)
- [Wave Drop Link Preview Toggle](feature-link-preview-toggle.md)
- [Wave Drop Social Platform Previews](feature-social-platform-previews.md)
- [Wave Drop Web3 Preview Cards](feature-web3-preview-cards.md)
- [Wave Drop Content Display](../drop-actions/feature-content-display.md)
